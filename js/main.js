// js/main.js
// A Walk in the Park Update

// --- Game Data Import ---
import {
    TILE_SIZE, MAP_WIDTH_TILES, MAP_HEIGHT_TILES, RESPAWN_TIME, MAX_CHARACTERS, CHARACTER_COLORS,
    TILES, ITEM_SPRITES, ITEM_DROP_DATA, ENEMIES_DATA, RESOURCE_DATA, worldData, ALTAR_UPGRADES
} from './gamedata.js';


// --- Firebase Integration ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Global Variables ---
let app, db, auth, userId, appId;

async function initFirebase() {
    try {
        let firebaseConfig;
        const isPreview = typeof __firebase_config !== 'undefined';

        if (isPreview) {
            console.log("Running in Preview Environment");
            firebaseConfig = JSON.parse(__firebase_config);
            appId = typeof __app_id !== 'undefined' ? __app_id : 'default-preview-app';
        } else {
            console.log("Running in Live Environment");
            appId = 'Markedsoulgame';
            firebaseConfig = {
                apiKey: "AIzaSyBmWMKKos89f8gbzi9K6PodKZkJ5s7-Xw8",
                authDomain: "gridfall-2661e.firebaseapp.com",
                projectId: "gridfall-2661e",
                storageBucket: "gridfall-2661e.firebasestorage.app",
                messagingSenderId: "623611849102",
                appId: "1:623611849102:web:6ffb21d284b72574abdcdf",
            };
        }

        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        if (isPreview && typeof __initial_auth_token !== 'undefined') {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
        
        userId = auth.currentUser.uid;
        await initGame();

    } catch (error) {
        console.error("Firebase Initialization Error:", error);
        document.getElementById('action-status').textContent = "Connection failed!";
    }
}

// --- Game State Variables ---
let gameState = {};
let enemies = {};
let deadEnemies = {};
let statPopupTimeout = null;
let currentMapData = [];
let notificationTimeout = null;

//-- New camera object to track viewport
let camera = { x: 30, y: 30, target: null, lerp: 0.1 };

let lastFrameTime = 0;
let accumulator = 0;
const LOGIC_TICK_RATE = 50;
let currentGameTime = 0;

function getActiveCharacter() {
    if (!gameState.characters || gameState.activeCharacterIndex === undefined) return null;
    return gameState.characters[gameState.activeCharacterIndex];
}

const ui = {
    canvas: document.getElementById('game-canvas'),
    canvasContainer: document.getElementById('canvas-container'),
    ctx: document.getElementById('game-canvas').getContext('2d'),
    actionStatus: document.getElementById('action-status'),
    contextMenu: document.getElementById('context-menu'),
    activeCharacterName: document.getElementById('active-character-name'),
    playerHpBar: document.getElementById('player-hp-bar'),
    playerSouls: document.getElementById('player-souls'),
    enemyCombatInfo: document.getElementById('enemy-combat-info'),
    enemyName: document.getElementById('enemy-name'),
    enemyStats: document.getElementById('enemy-stats'),
    enemyHpBar: document.getElementById('enemy-hp-bar'),
    playerLevel: document.getElementById('player-level'),
    xpProgress: document.getElementById('xp-progress'),
    playerDamageStat: document.getElementById('player-damage-stat'),
    playerSpeedStat: document.getElementById('player-speed-stat'),
    playerDefenseStat: document.getElementById('player-defense-stat'),
    markCount: document.getElementById('mark-count'),
    characterSwitcher: document.getElementById('character-switcher'),
    notificationBanner: document.getElementById('notification-banner'),
    openAltarButton: document.getElementById('openAltarButton'),
    openLevelsButton: document.getElementById('openLevelsButton'),
    openInventoryButton: document.getElementById('openInventoryButton'),
    openMapButton: document.getElementById('openMapButton'),
    soulAltarModal: document.getElementById('soulAltarModal'),
    levelsModal: document.getElementById('levelsModal'),
    inventoryModal: document.getElementById('inventoryModal'),
    mapModal: document.getElementById('mapModal'),
    altarListContainer: document.getElementById('altarListContainer'),
    levelsListContainer: document.getElementById('levelsListContainer'),
    inventoryListContainer: document.getElementById('inventoryListContainer'),
    mapGridContainer: document.getElementById('mapGridContainer'),
    closeAltarButton: document.getElementById('closeAltarButton'),
    closeLevelsButton: document.getElementById('closeLevelsButton'),
    closeInventoryButton: document.getElementById('closeInventoryButton'),
    closeMapButton: document.getElementById('closeMapButton'),
    altarSoulsDisplay: document.getElementById('altar-souls-display'),
};

function isObject(item) { return (item && typeof item === 'object' && !Array.isArray(item)); }
function mergeDeep(target, ...sources) { 
    if (!sources.length) return target; 
    const source = sources.shift(); 
    if (isObject(target) && isObject(source)) { 
        for (const key in source) { 
            if (isObject(source[key])) { 
                if (!target[key]) Object.assign(target, { [key]: {} }); 
                mergeDeep(target[key], source[key]); 
            } else { Object.assign(target, { [key]: source[key] }); } 
        } 
    } 
    return mergeDeep(target, ...sources); 
}

//-- New map building logic using the mapLayout string
function buildMapData(zoneX, zoneY) {
    const zoneKey = `${zoneX},${zoneY}`;
    const zone = worldData[zoneKey];
    if (!zone || !zone.mapLayout) return []; // Return empty if no layout
    
    // Legend for interpreting map characters
    const legend = {
        ' ': TILES.GRASS, 'W': TILES.WALL, 'F': TILES.DEEP_FOREST, 'D': TILES.DEEP_WATER,
        'T': TILES.GRASS, 'R': TILES.GRASS, 'P': TILES.GRASS, 'G': TILES.GRASS, 'H': TILES.GRASS,
        'S': TILES.GRASS, 'Y': TILES.GRASS, 'B': TILES.GRASS
    };

    const newMapData = Array.from({ length: MAP_HEIGHT_TILES }, () => Array(MAP_WIDTH_TILES).fill(TILES.GRASS));

    for(let y=0; y<MAP_HEIGHT_TILES; y++) {
        for(let x=0; x<MAP_WIDTH_TILES; x++) {
            const char = zone.mapLayout[y]?.[x] || ' ';
            newMapData[y][x] = legend[char] ?? TILES.GRASS;
        }
    }
    
    //-- Place interactable objects on top of the base layout
    if (zone.gateways) zone.gateways.forEach(gw => { newMapData[gw.y][gw.x] = TILES.GATEWAY; });
    if (zone.pedestals) zone.pedestals.forEach(p => { newMapData[p.y][p.x] = TILES.PEDESTAL; });
    if (zone.resources) zone.resources.forEach(r => {
         const size = r.size || {w: 1, h: 1};
         for(let i=0; i<size.w; i++) {
            for(let j=0; j<size.h; j++) {
                newMapData[r.y+j][r.x+i] = TILES[r.type]; 
            }
         }
    });

    return newMapData;
}

function getDefaultCharacterState(id, name, color) {
    return { 
        id, name, zoneX: 1, zoneY: 1, 
        player: { x: 30, y: 30 }, //-- Updated starting position
        hp: { current: 5, max: 5 },
        isMoving: false, currentMoveId: null, lastRegenTime: 0, isDead: false,
        automation: { active: false, task: null, state: 'IDLE', targetId: null, markedTiles: [], color, gatheringState: { lastHitTime: 0 } }, 
        combat: { active: false, targetId: null, isPlayerTurn: true, lastUpdateTime: 0 } 
    };
}

function getDefaultGameState() {
    return { 
        characters: [], activeCharacterIndex: 0,
        inventory: { soulFragment: 1000, ragingSoul: 0, wood: 0, copper_ore: 0, fish: 0 },
        level: { current: 1, xp: 0 }, 
        skills: { woodcutting: { level: 1, xp: 0 }, mining: { level: 1, xp: 0 }, fishing: { level: 1, xp: 0} },
        upgrades: { addCharacter: 0, plusOneDamage: 0, plusOneMaxMarks: 0, plusTwoMaxHp: 0, plusOneSpeed: 0, plusOneDefense: 0 },
        collectedItemDrops: [],
        firstKills: [], 
    };
}

async function initGame() {
    //-- Canvas now takes full container size and is responsive
    ui.canvas.width = ui.canvasContainer.offsetWidth;
    ui.canvas.height = ui.canvasContainer.offsetHeight;

    window.addEventListener('resize', () => {
        ui.canvas.width = ui.canvasContainer.offsetWidth;
        ui.canvas.height = ui.canvasContainer.offsetHeight;
    });

    ui.canvas.addEventListener('contextmenu', handleRightClick);
    ui.canvas.addEventListener('click', handleLeftClick);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('click', (e) => {
        if (ui.contextMenu.style.display === 'block' && !ui.contextMenu.contains(e.target)) {
            ui.contextMenu.style.display = 'none';
        }
    });
    ui.openAltarButton.addEventListener('click', openSoulAltar);
    ui.closeAltarButton.addEventListener('click', closeSoulAltar);
    ui.openLevelsButton.addEventListener('click', openLevels);
    ui.closeLevelsButton.addEventListener('click', closeLevels);
    ui.openInventoryButton.addEventListener('click', openInventory);
    ui.closeInventoryButton.addEventListener('click', closeInventory);
    ui.openMapButton.addEventListener('click', openMap);
    ui.closeMapButton.addEventListener('click', closeMap);
    
    ui.soulAltarModal.addEventListener('click', (e) => { if (e.target === ui.soulAltarModal) closeSoulAltar(); });
    ui.levelsModal.addEventListener('click', (e) => { if (e.target === ui.levelsModal) closeLevels(); });
    ui.inventoryModal.addEventListener('click', (e) => { if (e.target === ui.inventoryModal) closeInventory(); });
    ui.mapModal.addEventListener('click', (e) => { if (e.target === ui.mapModal) closeMap(); });
    
    currentGameTime = performance.now(); 
    await loadGameState();
    const activeChar = getActiveCharacter();
    camera.x = activeChar.player.x;
    camera.y = activeChar.player.y;
    currentMapData = buildMapData(activeChar.zoneX, activeChar.zoneY);
    Object.keys(worldData).forEach(zoneKey => {
        const [zoneX, zoneY] = zoneKey.split(',').map(Number);
        spawnEnemiesForZone(zoneX, zoneY);
    });
    updateAllUI();
    ui.actionStatus.textContent = "Right-click for options";
    lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!gameState.characters) { requestAnimationFrame(gameLoop); return; }

    const activeChar = getActiveCharacter();
    //-- Update camera target and smoothly move towards it
    if (activeChar) {
        camera.target = activeChar.player;
        camera.x += (camera.target.x - camera.x) * camera.lerp;
        camera.y += (camera.target.y - camera.y) * camera.lerp;
    }

    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    accumulator += deltaTime;
    
    if (accumulator > 1000) accumulator = 1000;

    while (accumulator >= LOGIC_TICK_RATE) {
        currentGameTime += LOGIC_TICK_RATE;
        checkAllRespawns(currentGameTime);
        updateAllPlayerRegen(currentGameTime);
        gameState.characters.forEach(char => {
            if (char) {
                updateAutomation(char, currentGameTime);
                updateCombat(char, currentGameTime);
            }
        });
        accumulator -= LOGIC_TICK_RATE;
    }
    
    updateCombatPanelUI();
    draw(); 
    
    requestAnimationFrame(gameLoop);
}

//-- Complete rewrite of the rendering pipeline to support the camera
function draw() {
    const ctx = ui.ctx;
    ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
    const activeChar = getActiveCharacter();
    if(!activeChar) return;
    
    const zoneKey = `${activeChar.zoneX},${activeChar.zoneY}`;
    
    //-- Calculate visible tile range based on camera position and canvas size
    const halfWidth = ui.canvas.width / 2 / TILE_SIZE;
    const halfHeight = ui.canvas.height / 2 / TILE_SIZE;
    const startCol = Math.floor(camera.x - halfWidth);
    const endCol = Math.ceil(camera.x + halfWidth);
    const startRow = Math.floor(camera.y - halfHeight);
    const endRow = Math.ceil(camera.y + halfHeight);

    //-- Loop through only the visible tiles
    for (let y = startRow; y <= endRow; y++) {
        for (let x = startCol; x <= endCol; x++) {
            // Check bounds before drawing
            if (x >= 0 && x < MAP_WIDTH_TILES && y >= 0 && y < MAP_HEIGHT_TILES) {
                drawTile(x, y, activeChar.zoneX, activeChar.zoneY);
            }
        }
    }
    
    //-- Draw game objects within the viewport
    if(enemies[zoneKey]) {
        for(const enemyId in enemies[zoneKey]) {
            drawEnemy(enemies[zoneKey][enemyId]);
        }
    }
    gameState.characters.forEach((char) => {
        if (char.zoneX === activeChar.zoneX && char.zoneY === activeChar.zoneY) {
            drawPlayer(char, char.id === activeChar.id);
        }
    });
    drawMarks(zoneKey);
}

//-- Helper to convert world coordinates to screen (canvas) coordinates
function worldToScreen(worldX, worldY) {
    const screenX = (worldX - camera.x) * TILE_SIZE + ui.canvas.width / 2;
    const screenY = (worldY - camera.y) * TILE_SIZE + ui.canvas.height / 2;
    return { x: screenX, y: screenY };
}

//-- Updated with more detailed tile drawing using the camera
function drawTile(x, y, zoneX, zoneY) {
    const { x: drawX, y: drawY } = worldToScreen(x + 0.5, y + 0.5);
    const ctx = ui.ctx;

    const tileType = currentMapData[y]?.[x];
    if (tileType === undefined) return;
    
    const zone = worldData[`${zoneX},${zoneY}`];
    const theme = zone?.theme || 'plains';
    let baseColor = '#166534'; // Forest green
    if (theme === 'dark_forest') baseColor = '#14532d';
    else if (theme === 'library') baseColor = '#27272a';
    
    ctx.fillStyle = baseColor;
    ctx.fillRect(drawX - TILE_SIZE/2, drawY - TILE_SIZE/2, TILE_SIZE, TILE_SIZE);
    
    //-- Add subtle texture to grass
    if(tileType === TILES.GRASS) {
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        for(let i = 0; i < 3; i++) {
            ctx.fillRect(drawX - TILE_SIZE/2 + Math.random() * TILE_SIZE, drawY - TILE_SIZE/2 + Math.random() * TILE_SIZE, 2, 2);
        }
    }

    switch(tileType) {
        case TILES.WALL:
            ctx.fillStyle = '#6b7280'; // Lighter top
            ctx.fillRect(drawX - TILE_SIZE/2, drawY - TILE_SIZE/2, TILE_SIZE, 2);
            ctx.fillStyle = '#71717a'; // Lighter left
            ctx.fillRect(drawX - TILE_SIZE/2, drawY - TILE_SIZE/2, 2, TILE_SIZE);
            ctx.fillStyle = '#4b5563'; // Darker bottom
            ctx.fillRect(drawX - TILE_SIZE/2, drawY + TILE_SIZE/2 - 2, TILE_SIZE, 2);
            ctx.fillStyle = '#4b5563'; // Darker right
            ctx.fillRect(drawX + TILE_SIZE/2 - 2, drawY - TILE_SIZE/2, 2, TILE_SIZE);
            break;
        case TILES.DEEP_FOREST:
            ctx.fillStyle = '#052e16'; // Darker green
            ctx.fillRect(drawX - TILE_SIZE/2, drawY - TILE_SIZE/2, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = "rgba(0,0,0,0.1)";
            for(let i=0; i<5; i++) {
                ctx.beginPath();
                ctx.arc(drawX - TILE_SIZE/2 + Math.random()*TILE_SIZE, drawY - TILE_SIZE/2 + Math.random()*TILE_SIZE, TILE_SIZE*0.2, 0, Math.PI*2);
                ctx.fill();
            }
            break;
        case TILES.DEEP_WATER:
            ctx.fillStyle = '#1e3a8a'; // Darker blue
            ctx.fillRect(drawX - TILE_SIZE/2, drawY - TILE_SIZE/2, TILE_SIZE, TILE_SIZE);
            break;
        case TILES.POND:
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(drawX - TILE_SIZE/2, drawY - TILE_SIZE/2, TILE_SIZE, TILE_SIZE);
            break;
        case TILES.ROCK:
            ctx.fillStyle = '#a1a1aa';
            ctx.fillRect(drawX - TILE_SIZE/2 + 3, drawY - TILE_SIZE/2 + 3, TILE_SIZE - 6, TILE_SIZE - 6);
            break;
        case TILES.TREE:
             ctx.fillStyle = '#78350f'; // Trunk
             ctx.fillRect(drawX - 4, drawY, 8, TILE_SIZE/2);
             ctx.fillStyle = '#22c55e'; // Leaves
             ctx.beginPath();
             ctx.arc(drawX, drawY - 4, TILE_SIZE/2 * 0.8, 0, Math.PI*2);
             ctx.fill();
            break;
        case TILES.GATEWAY:
            const gradient = ctx.createRadialGradient(drawX, drawY, TILE_SIZE / 5, drawX, drawY, TILE_SIZE / 2);
            gradient.addColorStop(0, '#a21caf');
            gradient.addColorStop(1, '#581c87');
            ctx.fillStyle = gradient;
            ctx.fillRect(drawX - TILE_SIZE/2, drawY - TILE_SIZE/2, TILE_SIZE, TILE_SIZE);
            break;
        case TILES.PEDESTAL:
            ctx.fillStyle = '#4b5563';
            ctx.fillRect(drawX - TILE_SIZE/2 + 2, drawY - TILE_SIZE/2 + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            // Drawing pedestal items is omitted for brevity but would need worldToScreen conversion
            break;
    }
}

//-- All draw functions now use worldToScreen
function drawEnemy(enemy) {
    const enemyData = ENEMIES_DATA[enemy.type];
    if (!enemyData) return;
    const size = enemyData.size || {w: 1, h: 1};
    
    // Use the top-left corner for positioning, converted to screen space
    const {x: screenX, y: screenY} = worldToScreen(enemy.x, enemy.y);
    
    const width = size.w * TILE_SIZE;
    const height = size.h * TILE_SIZE;
    ui.ctx.fillStyle = enemyData.color;
    ui.ctx.fillRect(screenX, screenY, width, height);

    if (enemy.type.includes('GOLEM')) {
        ui.ctx.fillStyle = '#57534e';
        const eyeSize = TILE_SIZE * 0.6;
        const eyeOffset = (TILE_SIZE - eyeSize) / 2;
        if(enemyData.eyePattern) {
            enemyData.eyePattern.forEach(pos => {
                ui.ctx.fillRect(screenX + (pos.x * TILE_SIZE) + eyeOffset, screenY + (pos.y * TILE_SIZE) + eyeOffset, eyeSize, eyeSize);
            });
        }
    }
}

function drawMarks(currentZoneKey) {
    ui.ctx.lineWidth = 2;
    const allMarks = gameState.characters.flatMap(c => c.automation.markedTiles);

    allMarks.forEach(mark => {
        if (`${mark.zoneX},${mark.zoneY}` === currentZoneKey) {
            const char = gameState.characters.find(c => c.automation.markedTiles.includes(mark));
            ui.ctx.strokeStyle = char ? char.automation.color : '#FFFFFF';
            const {x: screenX, y: screenY} = worldToScreen(mark.x, mark.y);
            ui.ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
    });
}

function drawPlayer(character, isActive) {
    const {x: screenX, y: screenY} = worldToScreen(character.player.x + 0.5, character.player.y + 0.5);
    const w = TILE_SIZE;
    const h = TILE_SIZE;

    if (character.isDead) {
        ui.ctx.fillStyle = '#7f1d1d';
        ui.ctx.fillRect(screenX - w/2 + 4, screenY - h/2 + 4, w - 8, h - 8);
        return;
    }
    
    ui.ctx.fillStyle = character.automation.color;
    ui.ctx.fillRect(screenX - w/2 + 4, screenY - h/2 + 4, w - 8, h - 8);
    
    if (isActive) {
        ui.ctx.strokeStyle = '#facc15';
        ui.ctx.lineWidth = 2;
        ui.ctx.strokeRect(screenX - w/2 + 3, screenY - h/2 + 3, w - 6, h - 6);
    }
}

function showDamagePopup(x, y, amount, isPlayerDamage) {
    const {x: screenX, y: screenY} = worldToScreen(x, y);
    const popup = document.createElement('div');
    popup.textContent = amount.toFixed(2).replace(/\.00$/, '');
    popup.className = `damage-popup ${isPlayerDamage ? 'player' : 'enemy'}`;
    ui.canvasContainer.appendChild(popup);
    popup.style.left = `${screenX + (TILE_SIZE / 2) - popup.offsetWidth / 2}px`;
    popup.style.top = `${screenY - popup.offsetHeight}px`;
    setTimeout(() => {
        popup.style.transform = 'translateY(-30px)';
        popup.style.opacity = '0';
        setTimeout(() => popup.remove(), 1000);
    }, 10);
}

function showStatPopup(x, y, title, text) {
    if (statPopupTimeout) clearTimeout(statPopupTimeout);
    const existingPopup = document.querySelector('.stat-popup');
    if(existingPopup) existingPopup.remove();
    
    const {x: screenX, y: screenY} = worldToScreen(x, y);
    const popup = document.createElement('div');
    popup.className = 'stat-popup';
    popup.innerHTML = `<strong class="text-fuchsia-400">${title}</strong><br>${text}`;

    ui.canvasContainer.appendChild(popup);
    popup.style.left = `${screenX + (TILE_SIZE / 2) - (popup.offsetWidth / 2)}px`;
    popup.style.top = `${screenY - popup.offsetHeight - 5}px`;
    
    statPopupTimeout = setTimeout(() => {
        popup.style.opacity = '0';
        setTimeout(() => popup.remove(), 3000);
    }, 3000);
}

//-- Click handler now converts screen coords to world coords
function getTileFromClick(e) { 
    const rect = ui.canvas.getBoundingClientRect(); 
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Convert screen coordinates to world tile coordinates based on camera
    const worldX = Math.floor(camera.x - (ui.canvas.width / 2 / TILE_SIZE) + (screenX / TILE_SIZE));
    const worldY = Math.floor(camera.y - (ui.canvas.height / 2 / TILE_SIZE) + (screenY / TILE_SIZE));
    
    return {x: worldX, y: worldY};
}

function getEnemyAt(x, y, zoneKey) { 
    if (!enemies[zoneKey]) return null; 
    for (const id in enemies[zoneKey]) { 
        const enemy = enemies[zoneKey][id]; 
        const eData = ENEMIES_DATA[enemy.type]; 
        const size = eData.size || { w: 1, h: 1 }; 
        if (x >= enemy.x && x < enemy.x + size.w && y >= enemy.y && y < enemy.y + size.h) return enemy;
    } 
    return null; 
}

function getResourceNodeAt(x, y, zoneX, zoneY) {
    const zone = worldData[`${zoneX},${zoneY}`];
    if (!zone || !zone.resources) return null;
    return zone.resources.find(r => {
        const size = r.size || {w: 1, h: 1};
        return x >= r.x && x < r.x + size.w && y >= r.y && y < r.y + size.h;
    });
}

function handleKeydown(e) { 
    const key = parseInt(e.key); 
    if (!isNaN(key) && key > 0 && key <= MAX_CHARACTERS) { 
        const charIndex = key - 1; 
        if (gameState.characters[charIndex]) { 
            gameState.activeCharacterIndex = charIndex; 
            saveGameState(); 
            updateAllUI(); 
        } 
    } 
}

function handleLeftClick(e) {
    const activeChar = getActiveCharacter();
    if (!activeChar || activeChar.isDead) return;

    const { x, y } = getTileFromClick(e);
    const zoneKey = `${activeChar.zoneX},${activeChar.zoneY}`;
    const enemy = getEnemyAt(x, y, zoneKey);
    const resource = getResourceNodeAt(x, y, activeChar.zoneX, activeChar.zoneY);
    const tileType = currentMapData[y]?.[x];

    if (activeChar.automation.active && activeChar.automation.task === 'hunting' && !enemy && isWalkable(x, y, activeChar.zoneX, activeChar.zoneY)) {
        stopAutomation(activeChar);
        activeChar.automation.markedTiles = [];
        handleMovementClick(x, y, activeChar);
        saveGameState();
        updateAllUI();
        return;
    }
    
    if (e.shiftKey) { 
        handleMarking(enemy);
        return;
    }
    
    if (enemy) {
        handleMonsterClick(enemy);
    } else if (resource) {
        handleResourceClick(resource);
    } else if (tileType === TILES.PEDESTAL) {
        handlePedestalClick(x, y, activeChar.zoneX, activeChar.zoneY);
    }
    
    if (activeChar.automation.active) {
        if (['woodcutting', 'mining', 'fishing'].includes(activeChar.automation.task) && !enemy && !resource) {
            stopAutomation(activeChar);
            handleMovementClick(x, y, activeChar);
        }
        return;
    }
    
    if (!enemy && !resource && tileType !== TILES.PEDESTAL) {
        handleMovementClick(x, y, activeChar);
    }
}

function handleMonsterClick(enemy) {
    const enemyData = ENEMIES_DATA[enemy.type];
    let content = `❤️ ${Math.ceil(enemy.currentHp)}/${enemyData.hp}<br>👊 ${enemyData.attack}<br>💰 ${enemyData.loot.soulFragment}`;
    if (enemyData.itemDrop && Array.isArray(enemyData.itemDrop)) {
        enemyData.itemDrop.forEach(itemDropId => {
            const itemData = ITEM_DROP_DATA[itemDropId];
            if (itemData) {
                content += `<br><span style="color:#67e8f9;">${itemData.dropChance * 100}% ${itemData.name}</span>`;
            }
        });
    }
    showStatPopup(enemy.x, enemy.y, enemyData.name, content);
}

function handleResourceClick(resource) {
     const resourceData = RESOURCE_DATA[resource.type];
     showStatPopup(resource.x, resource.y, resourceData.name, `Level ${resourceData.levelReq} ${resourceData.skill}`);
}

function handlePedestalClick(x, y, zoneX, zoneY) {
    const zone = worldData[`${zoneX},${zoneY}`];
    if (!zone || !zone.pedestals) return;

    const pedestalData = zone.pedestals.find(p => p.x === x && p.y === y);
    if (!pedestalData) return;
    
    const itemDropId = Object.keys(ITEM_DROP_DATA).find(id => ITEM_DROP_DATA[id].pedestalId === pedestalData.id);
    if (itemDropId && gameState.collectedItemDrops.includes(itemDropId)) {
        const itemData = ITEM_DROP_DATA[itemDropId];
        showStatPopup(x, y, itemData.name, itemData.description);
    }
}

function handleMovementClick(x, y, activeChar) {
    const moveId = Date.now();
    activeChar.currentMoveId = moveId;

    let targetPos = null;
    if (isWalkable(x, y, activeChar.zoneX, activeChar.zoneY)) {
        targetPos = {x, y};
    }
    if (targetPos) {
        const path = findPath(activeChar.player, targetPos, activeChar.zoneX, activeChar.zoneY);
        if (path && path.length > 0) {
            moveAlongPath(activeChar, path, moveId);
        }
    }
}

function addMark(activeChar, enemy, approachSpot) {
    const stats = getTeamStats();
    if (activeChar.automation.markedTiles.length >= stats.maxMarks) {
        const removedMark = activeChar.automation.markedTiles.shift();
        if(activeChar.combat.active && activeChar.combat.targetId === removedMark.enemyId) {
             forceEndCombat(activeChar);
        }
    }
    activeChar.automation.markedTiles.push({ ...approachSpot, enemyId: enemy.id });
    startAutomation(activeChar, 'hunting');
    showNotification(`Marked ${enemy.name} for ${activeChar.name}.`);
}

function handleMarking(enemy) {
    const activeChar = getActiveCharacter();
    if (!enemy || !activeChar) return;
    activeChar.currentMoveId = null;
    activeChar.isMoving = false;

    const existingMarkForChar = activeChar.automation.markedTiles.find(m => m.enemyId === enemy.id);
    
    if (existingMarkForChar) {
         const markIndex = activeChar.automation.markedTiles.findIndex(m => m.enemyId === enemy.id);
         if(markIndex !== -1) activeChar.automation.markedTiles.splice(markIndex, 1);
         if (activeChar.combat.active && activeChar.combat.targetId === enemy.id) forceEndCombat(activeChar);
         if (activeChar.automation.markedTiles.length === 0) stopAutomation(activeChar);
    } else {
        const closestSpot = findWalkableNeighborForEntity(enemy, activeChar.player);
        if(closestSpot) {
            addMark(activeChar, enemy, closestSpot);
        } else {
            showNotification("No valid approach for that tile.");
        }
    }
    
    saveGameState();
    updateAllUI();
}

function handleMapMarking(enemy, activeChar) {
    const availableSpots = getWalkableNeighborsForEntity(enemy, true);

    if (availableSpots.length > 0) {
        const closestSpot = findWalkableNeighborForEntity(enemy, activeChar.player);
        if (closestSpot) {
            addMark(activeChar, enemy, closestSpot);
            saveGameState();
            updateAllUI();
        } else {
            showNotification(`${enemy.name} has no open attack spots!`);
        }
    } else {
        showNotification(`${enemy.name} has no open attack spots!`);
    }
}

async function moveAlongPath(character, path, moveId) {
    if (!path || path.length === 0 || character.isDead) {
         character.isMoving = false;
         return;
    }
    
    const stats = getTeamStats();
    const moveDelay = 200 / (1 + (stats.speed * 0.01));

    character.isMoving = true;
    if (character.id === getActiveCharacter().id && !character.automation.active) ui.actionStatus.textContent = 'Moving...';

    for (const step of path) {
        if (character.currentMoveId !== moveId || character.isDead) break;
        character.player.x = step.x;
        character.player.y = step.y;
        await new Promise(r => setTimeout(r, moveDelay));
    }

    if (character.currentMoveId === moveId) {
        const endTile = character.player;
        const zone = worldData[`${character.zoneX},${character.zoneY}`];
        if (zone && zone.gateways) {
            const gateway = zone.gateways.find(g => g.x === endTile.x && g.y === endTile.y);
            if (gateway) {
                character.zoneX = gateway.destZone.x;
                character.zoneY = gateway.destZone.y;
                character.player.x = gateway.entry.x;
                character.player.y = gateway.entry.y;
                currentMapData = buildMapData(character.zoneX, character.zoneY);
                saveGameState();
                updateAllUI();
            }
        }
         if (character.id === getActiveCharacter().id && !character.automation.active) ui.actionStatus.textContent = 'Idle';
         character.currentMoveId = null; 
         character.isMoving = false;
    }
}

function handleRightClick(e) {
    e.preventDefault();
    const activeChar = getActiveCharacter();
    if (!activeChar || activeChar.isDead) return;
    ui.contextMenu.innerHTML = '';
    
    const anyCharHasSkillingTask = gameState.characters.some(c => ['woodcutting', 'mining', 'fishing'].includes(c.automation.task));

    if (activeChar.automation.active && activeChar.automation.task !== 'hunting') {
        addContextMenuButton(`Stop: ${activeChar.automation.task}`, () => stopAutomation(activeChar));
    }

    if (activeChar.automation.markedTiles.length > 0) {
        addContextMenuButton('Clear My Marks', () => {
            stopAutomation(activeChar); 
            activeChar.automation.markedTiles = [];
            saveGameState();
        });
    }

    const anyCharHasMarks = gameState.characters.some(c => c.automation.markedTiles.length > 0);
    if (anyCharHasMarks) {
        addContextMenuButton('Clear All Marks', () => {
            gameState.characters.forEach(char => {
                stopAutomation(char); 
                char.automation.markedTiles = [];
            });
            saveGameState();
        });
    }
    
    if (anyCharHasSkillingTask) {
        addContextMenuButton('Stop All Skilling', () => {
            gameState.characters.forEach(char => {
                if (['woodcutting', 'mining', 'fishing'].includes(char.automation.task)) {
                    stopAutomation(char);
                }
            });
            saveGameState();
        });
    }

    if (ui.contextMenu.children.length > 0) {
        const rect = ui.canvas.getBoundingClientRect();
        ui.contextMenu.style.left = `${e.clientX - rect.left}px`;
        ui.contextMenu.style.top = `${e.clientY - rect.top}px`;
        ui.contextMenu.style.display = 'block';
    }
}

function addContextMenuButton(text, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.onclick = () => { onClick(); ui.contextMenu.style.display = 'none'; };
    ui.contextMenu.appendChild(btn);
}

// ===================================================================
// START OF MISSING UI FUNCTIONS
// This entire block was missing, causing the error.
// ===================================================================

function showNotification(message) {
    if (notificationTimeout) clearTimeout(notificationTimeout);
    ui.notificationBanner.textContent = message;
    ui.notificationBanner.classList.add('show');
    notificationTimeout = setTimeout(() => {
        ui.notificationBanner.classList.remove('show');
    }, 3000);
}

function renderAltarList() {
    const listContainer = ui.altarListContainer;
    listContainer.innerHTML = '';
    const soulsText = `${gameState.inventory.soulFragment || 0} ${ITEM_SPRITES.soulFragment}`;
    const ragingSoulsText = `${gameState.inventory.ragingSoul || 0} <span class="text-red-500">${ITEM_SPRITES.ragingSoul}</span>`;
    ui.altarSoulsDisplay.innerHTML = `${soulsText} &nbsp;&nbsp; ${ragingSoulsText}`;

    Object.keys(ALTAR_UPGRADES).forEach(id => {
        const upgrade = ALTAR_UPGRADES[id];
        const itemEl = document.createElement('div');
        itemEl.className = 'modal-item clickable';
        const nameEl = document.createElement('span');
        const costEl = document.createElement('span');
        costEl.className = 'cost';

        let currentLevel = (id === 'addCharacter') ? gameState.characters.length - 1 : (gameState.upgrades[id] || 0);
        const maxLevel = upgrade.maxLevel;

        nameEl.textContent = `${upgrade.name} (${currentLevel}/${maxLevel})`;
        
        if (currentLevel >= maxLevel) {
            itemEl.classList.add('disabled');
            costEl.textContent = "MAX";
        } else {
            const cost = upgrade.cost(currentLevel);
            let costString = '';
            let canAfford = true;
            for(const currency in cost) {
                if (currency === 'ragingSoul') {
                     costString += `${cost[currency]} <span class="text-red-500">${ITEM_SPRITES[currency]}</span> `;
                } else {
                     costString += `${cost[currency]} ${ITEM_SPRITES[currency]} `;
                }
                if((gameState.inventory[currency] || 0) < cost[currency]) {
                    canAfford = false;
                }
            }
            costEl.innerHTML = costString.trim();
            if (!canAfford) itemEl.classList.add('cannot-afford');
            itemEl.addEventListener('click', () => purchaseUpgrade(id));
        }
        
        itemEl.append(nameEl, costEl);
        listContainer.appendChild(itemEl);
    });
}

function purchaseUpgrade(id) {
    const upgrade = ALTAR_UPGRADES[id];
    let currentLevel = (id === 'addCharacter') ? gameState.characters.length - 1 : (gameState.upgrades[id] || 0);

    if (currentLevel >= upgrade.maxLevel) return;

    const cost = upgrade.cost(currentLevel);
    
    for(const currency in cost) {
        if((gameState.inventory[currency] || 0) < cost[currency]) return;
    }
    
    for(const currency in cost) {
        gameState.inventory[currency] -= cost[currency];
    }

    if (id === 'addCharacter') {
        const newId = gameState.characters.length;
        gameState.characters.push(getDefaultCharacterState(newId, `Character ${newId + 1}`, CHARACTER_COLORS[newId % CHARACTER_COLORS.length]));
    } else {
        gameState.upgrades[id]++;
    }
    recalculateTeamStats();
    saveGameState();
    renderAltarList();
    updateAllUI();
}

function openModal(modal) { modal.classList.remove('hidden'); }
function closeModal(modal) { modal.classList.add('hidden'); }
function openSoulAltar() { openModal(ui.soulAltarModal); renderAltarList(); }
function closeSoulAltar() { closeModal(ui.soulAltarModal); }
function openLevels() { openModal(ui.levelsModal); renderLevels(); }
function closeLevels() { closeModal(ui.levelsModal); }
function openInventory() { openModal(ui.inventoryModal); renderInventory(); }
function closeInventory() { closeModal(ui.inventoryModal); }
function openMap() { openModal(ui.mapModal); renderMap(); }
function closeMap() { closeModal(ui.mapModal); }

function renderMap() {
    const grid = ui.mapGridContainer;
    grid.innerHTML = '';
    const activeChar = getActiveCharacter();
    const minX = 0, maxX = 1, minY = 0, maxY = 1;

    for(let y = minY; y <= maxY; y++) {
        for(let x = minX; x <= maxX; x++) {
            const zoneKey = `${x},${y}`;
            const zoneData = worldData[zoneKey];
            const zoneEl = document.createElement('div');
            zoneEl.className = 'map-zone';
            
            if (zoneData) {
                zoneEl.textContent = zoneData.name;
                if (activeChar.zoneX === x && activeChar.zoneY === y) {
                     zoneEl.classList.add('active-zone');
                }
                
                if(enemies[zoneKey]) {
                    for(const enemyId in enemies[zoneKey]) {
                        const enemy = enemies[zoneKey][enemyId];
                        const enemyData = ENEMIES_DATA[enemy.type];
                        if(enemyData.isBoss) {
                            const bossIcon = document.createElement('div');
                            bossIcon.textContent = '💀';
                            bossIcon.className = 'boss-icon';
                            bossIcon.title = enemy.name;
                            bossIcon.addEventListener('click', (e) => {
                                handleMapMarking(enemy, activeChar);
                                e.stopPropagation();
                            });
                            zoneEl.appendChild(bossIcon);
                        }
                    }
                }
            } else {
                zoneEl.style.backgroundColor = '#111';
            }
            grid.appendChild(zoneEl);
        }
    }
}

function renderLevels() {
    ui.levelsListContainer.innerHTML = '';
    const activeChar = getActiveCharacter();
    const createLevelBar = (name, skillKey, level, xp, neededXp, color) => {
        const xpPercent = (neededXp > 0) ? (xp / neededXp) * 100 : 100;
        const isAssigned = activeChar.automation.active && activeChar.automation.task === skillKey;
        const container = document.createElement('div');
        container.className = `w-full p-2 border rounded-lg modal-item clickable ${isAssigned ? 'assigned' : ''}`;
        container.innerHTML = `
            <div>
                <div class="flex justify-between items-center mb-1 text-sm">
                    <span class="font-medium text-${color}-300">${name}</span>
                    <span>Lv ${level}</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar bg-${color}-500" style="width: ${xpPercent}%;">${Math.floor(xp)}/${neededXp}</div>
                </div>
            </div>
        `;
        container.addEventListener('click', () => assignSkillTask(skillKey));
        return container;
    };
    
    ui.levelsListContainer.appendChild(createLevelBar('Woodcutting', 'woodcutting', gameState.skills.woodcutting.level, Math.floor(gameState.skills.woodcutting.xp), xpForSkillLevel(gameState.skills.woodcutting.level), 'lime'));
    ui.levelsListContainer.appendChild(createLevelBar('Mining', 'mining', gameState.skills.mining.level, Math.floor(gameState.skills.mining.xp), xpForSkillLevel(gameState.skills.mining.level), 'yellow'));
    ui.levelsListContainer.appendChild(createLevelBar('Fishing', 'fishing', gameState.skills.fishing.level, Math.floor(gameState.skills.fishing.xp), xpForSkillLevel(gameState.skills.fishing.level), 'sky'));
}

function renderInventory() {
    ui.inventoryListContainer.innerHTML = '';
    for (const item in gameState.inventory) {
        if(gameState.inventory[item] > 0) {
            const itemEl = document.createElement('div');
            itemEl.className = 'flex flex-col items-center justify-center p-2 border border-zinc-600 rounded-lg bg-zinc-800';
            
            let itemSprite = ITEM_SPRITES[item];
            if(item === 'ragingSoul') {
                itemSprite = `<span class="text-red-500">${itemSprite}</span>`;
            }

            itemEl.innerHTML = `
                <span class="text-3xl">${itemSprite}</span>
                <span class="text-sm font-bold">${gameState.inventory[item]}</span>
            `;
            ui.inventoryListContainer.appendChild(itemEl);
        }
    }
}

// ===================================================================
// END OF MISSING UI FUNCTIONS
// ===================================================================

function getTeamStats() { 
    const baseDamage = 1 + Math.floor(gameState.level.current / 2); 
    let totalDamage = baseDamage + (gameState.upgrades.plusOneDamage || 0);
    let totalMarks = 1 + (gameState.upgrades.plusOneMaxMarks || 0);
    let totalSpeed = (gameState.upgrades.plusOneSpeed || 0);
    let totalHpRegenBonus = 0;
    let totalDefense = (gameState.level.current - 1) + (gameState.upgrades.plusOneDefense || 0);

    if (gameState.collectedItemDrops) {
        gameState.collectedItemDrops.forEach(itemDropId => {
            const itemDrop = ITEM_DROP_DATA[itemDropId];
            if (!itemDrop) return;
            switch(itemDrop.effect.type) {
                case 'ADD_DAMAGE': totalDamage += itemDrop.effect.value; break;
                case 'ADD_SPEED': totalSpeed += itemDrop.effect.value; break;
                case 'ADD_HP_REGEN': totalHpRegenBonus += itemDrop.effect.value; break;
                case 'ADD_DEFENSE': totalDefense += itemDrop.effect.value; break;
            }
        });
    }
    return { damage: totalDamage, maxMarks: totalMarks, speed: totalSpeed, hpRegenBonus: totalHpRegenBonus, defense: totalDefense }; 
}

function updateCombat(character, gameTime) { 
    const { combat } = character; 
    if (!combat.active || character.isDead) return;
    const combatDelta = gameTime - combat.lastUpdateTime; 
    if (combatDelta < 1500) return; 
    combat.lastUpdateTime = gameTime; 
    
    const enemy = findEnemyById(combat.targetId);
    if (!enemy) { endCombat(character, true); return; } 
    
    const playerStats = getTeamStats(); 
    let damage; 
    if (combat.isPlayerTurn) { 
        damage = Math.max(1, playerStats.damage); 
        enemy.currentHp -= damage; 
        showDamagePopup(enemy.x, enemy.y, damage, false); 
        gainXp(damage); 
    } else { 
        const enemyData = ENEMIES_DATA[enemy.type]; 
        const damageReduction = playerStats.defense * 0.25;
        damage = Math.max(0, enemyData.attack - damageReduction); 
        character.hp.current -= damage; 
        showDamagePopup(character.player.x, character.player.y, damage, true); 
    } 
    combat.isPlayerTurn = !combat.isPlayerTurn; 
    if (character.id === getActiveCharacter().id) updateCombatPanelUI(); 
    if (enemy.currentHp <= 0) endCombat(character, true); 
    else if (character.hp.current <= 0) endCombat(character, false); 
}

async function startCombat(character, enemyId, isAutomated = false) { 
    if (character.combat.active || character.isMoving || character.isDead) return; 
    
    stopAutomation(character);
    if (isAutomated) {
        character.automation.task = 'hunting';
        character.automation.active = true;
    }

    const enemy = findEnemyById(enemyId);
    if (!enemy) return;
    
    const moveId = Date.now();
    character.currentMoveId = moveId;

    if (!isAdjacent(character.player, enemy)) { 
        if (character.id === getActiveCharacter().id) ui.actionStatus.textContent = "Walking to monster..."; 
        
        const allMarks = gameState.characters.flatMap(c => c.automation.markedTiles);
        const reservedSpots = allMarks.filter(m => m.enemyId === enemyId).map(m => ({x: m.x, y: m.y}));
        const charMark = character.automation.markedTiles.find(m => m.enemyId === enemyId);
        const targetPos = charMark || findWalkableNeighborForEntity(enemy, character.player, reservedSpots); 
        
        if (!targetPos) { 
            if (character.id === getActiveCharacter().id) ui.actionStatus.textContent = "Can't reach target."; 
            return; 
        } 
        const path = findPath(character.player, targetPos, character.zoneX, character.zoneY); 
        if (path) { await moveAlongPath(character, path, moveId); } 
        else { 
            if (character.id === getActiveCharacter().id) ui.actionStatus.textContent = "Can't find a path."; 
            return; 
        } 
    } 
    
    if (character.currentMoveId !== moveId) return;
    
    const finalEnemyCheck = findEnemyById(enemyId);
    if (finalEnemyCheck && isAdjacent(character.player, finalEnemyCheck)) { 
        character.combat.active = true; 
        character.combat.targetId = enemyId; 
        character.combat.isPlayerTurn = true; 
        character.combat.lastUpdateTime = currentGameTime; 
        if (character.id === getActiveCharacter().id) updateCombatPanelUI(); 
    }
}

function forceEndCombat(character) {
     if (!character.combat.active) return;
     character.combat.active = false;
     character.combat.targetId = null;
     if (character.automation.active && character.automation.task === 'hunting') {
        character.automation.state = "IDLE";
     }
     updateCombatPanelUI();
     ui.actionStatus.textContent = 'Disengaged.';
}

function endCombat(character, playerWon) { 
    const { combat } = character; 
    if (!combat.targetId) return; 
    const killedEnemyId = combat.targetId;
    const targetEnemy = findEnemyById(killedEnemyId);
    
    if (playerWon && targetEnemy) {
        const enemyData = ENEMIES_DATA[targetEnemy.type];
        const zoneKey = `${targetEnemy.zoneX},${targetEnemy.zoneY}`;
        if (character.id === getActiveCharacter().id) ui.actionStatus.textContent = `Monster neutralized.`;

        // Boss Loot Logic
        if (enemyData.isBoss) {
            if (!gameState.firstKills.includes(targetEnemy.type)) {
                gameState.inventory.ragingSoul += enemyData.loot.ragingSoul;
                showNotification(`+${enemyData.loot.ragingSoul} Raging Soul!`);
                gameState.firstKills.push(targetEnemy.type);
            } else {
                gameState.inventory.soulFragment += enemyData.loot.soulFragment;
            }
        } else {
            gameState.inventory.soulFragment += enemyData.loot.soulFragment;
        }

        // Handle multiple item drops
        if (enemyData.itemDrop && Array.isArray(enemyData.itemDrop)) {
            enemyData.itemDrop.forEach(itemDropId => {
                const itemData = ITEM_DROP_DATA[itemDropId];
                if (itemData && Math.random() < itemData.dropChance) {
                    gameState.collectedItemDrops.push(itemDropId);
                    showNotification(`Item Dropped: ${itemData.name}!`);
                    recalculateTeamStats();
                }
            });
        }

        if (!deadEnemies[zoneKey]) deadEnemies[zoneKey] = [];
        deadEnemies[zoneKey].push({ id: targetEnemy.id, respawnTime: currentGameTime + RESPAWN_TIME, data: { ...targetEnemy, currentHp: enemyData.hp } });
        delete enemies[zoneKey][combat.targetId];

    } else if (!playerWon) {
        if (character.id === getActiveCharacter().id) ui.actionStatus.textContent = `${character.name} has been defeated!`;
        
        // Monster heals when player dies
        if (targetEnemy) {
            const healAmount = targetEnemy.hp * 0.10;
            targetEnemy.currentHp = Math.min(targetEnemy.hp, targetEnemy.currentHp + healAmount);
            showNotification(`${targetEnemy.name} healed!`);
        }

        character.automation.markedTiles = []; 
        stopAutomation(character);
        character.isDead = true;
        
        setTimeout(() => {
            character.player = { x: 30, y: 30 };
            character.zoneX = 1;
            character.zoneY = 1;
            character.hp.current = character.hp.max;
            character.isDead = false;
            if (character.id === getActiveCharacter().id) ui.actionStatus.textContent = `${character.name} respawned.`;
            updateAllUI();
        }, 3000);
    }
    combat.active = false;
    combat.targetId = null;
    updateAllUI();
    saveGameState();
}

function recalculateTeamStats() {
    let allBonuses = { ADD_MAX_HP: 0 };
    
    if(gameState.collectedItemDrops) {
        gameState.collectedItemDrops.forEach(itemDropId => {
            const itemDrop = ITEM_DROP_DATA[itemDropId];
            if (itemDrop && itemDrop.effect.type === 'ADD_MAX_HP') {
                allBonuses.ADD_MAX_HP += itemDrop.effect.value;
            }
        });
    }
    allBonuses.ADD_MAX_HP += (gameState.upgrades.plusTwoMaxHp || 0) * 2;
    allBonuses.ADD_MAX_HP += (gameState.skills.fishing.level - 1) * 3;

    gameState.characters.forEach(char => {
        const levelHp = 4 + gameState.level.current;
        const oldMaxHp = char.hp.max;
        char.hp.max = levelHp + allBonuses.ADD_MAX_HP;
        const diff = char.hp.max - oldMaxHp;
        char.hp.current = Math.min(char.hp.max, char.hp.current + diff);
    });
    updateAllUI();
}

function xpForLevel(level) { return Math.floor(50 * Math.pow(1.23, level - 1)); }
function gainXp(amount) { 
    const { level } = gameState; 
    level.xp += amount; 
    let needed = xpForLevel(level.current); 
    while (level.xp >= needed) { 
        level.xp -= needed; 
        level.current++;
        recalculateTeamStats();
        needed = xpForLevel(level.current); 
    } 
    updateAllUI(); 
}

function xpForSkillLevel(level) { return Math.floor(100 * Math.pow(1.15, level - 1)); }
function gainSkillXp(skill, amount) {
    if (!gameState.skills[skill]) return;
    gameState.skills[skill].xp += amount;
    let needed = xpForSkillLevel(gameState.skills[skill].level);
    while (gameState.skills[skill].xp >= needed) {
        gameState.skills[skill].xp -= needed;
        gameState.skills[skill].level++;
        showNotification(`${skill.charAt(0).toUpperCase() + skill.slice(1)} level up: ${gameState.skills[skill].level}!`);
        recalculateTeamStats();
        needed = xpForSkillLevel(gameState.skills[skill].level);
    }
    if (ui.levelsModal.classList.contains('hidden') === false) renderLevels();
    saveGameState();
}

function updateAutomation(character, gameTime) { 
    const { combat } = character; 
    if (!character.automation.active || combat.active || character.isDead) return;

    const setStatus = (msg) => { if (character.id === getActiveCharacter().id) ui.actionStatus.textContent = msg; }; 
    switch(character.automation.task) {
        case 'hunting': updateHuntingTask(character, setStatus); break;
        case 'woodcutting': case 'mining': case 'fishing':
            if (character.isMoving) return; 
            updateSkillingTask(character, gameTime, setStatus);
            break;
    }
}

function updateHuntingTask(character, setStatus) {
    if (character.isMoving || character.combat.active) return;

    const { automation } = character;
    if (automation.markedTiles.length === 0) {
        stopAutomation(character);
        return;
    }

    const mark = automation.markedTiles[0];
    const desiredTarget = findEnemyById(mark.enemyId);

    if (desiredTarget) {
        if (character.zoneX !== desiredTarget.zoneX || character.zoneY !== desiredTarget.zoneY) {
            setStatus(`Traveling to ${desiredTarget.name}'s zone...`);
            const path = findPathToZone(character, desiredTarget.zoneX, desiredTarget.zoneY);
            if(path && path.length > 0) {
                const moveId = Date.now();
                character.currentMoveId = moveId;
                moveAlongPath(character, path, moveId);
            } else {
                setStatus(`Can't find path to zone!`);
                automation.markedTiles.shift();
            }
            return;
        }
        
        if (isAdjacent(character.player, desiredTarget)) {
            setStatus("Initiating combat...");
            startCombat(character, desiredTarget.id, true);
        } else {
            setStatus(`Walking to ${desiredTarget.name}...`);
            const path = findPath(character.player, mark, character.zoneX, character.zoneY);
            if (path && path.length > 0) { 
                const moveId = Date.now();
                character.currentMoveId = moveId;
                moveAlongPath(character, path, moveId);
            } 
            else { 
                setStatus("Cannot find path to attack spot!");
                automation.markedTiles.shift();
            }
        }
    } else {
        if (isEnemyDead(mark.enemyId)) {
            setStatus("Waiting for respawn...");
        } else {
            setStatus(`Invalid mark, removing.`);
            automation.markedTiles.shift();
            if (automation.markedTiles.length === 0) {
                stopAutomation(character);
            }
        }
    }
}

function updateSkillingTask(character, gameTime, setStatus) {
    const { automation, player, zoneX, zoneY } = character;
    const resourceType = automation.task === 'woodcutting' ? 'TREE' : automation.task === 'mining' ? 'ROCK' : 'POND';
    const currentState = automation.state || 'IDLE';

    switch(currentState) {
        case 'IDLE': automation.state = 'FINDING_RESOURCE'; break;
        case 'FINDING_RESOURCE':
             setStatus(`Finding ${resourceType.toLowerCase()}...`);
             const node = findNearestResource(character, resourceType);
             if (node) {
                 automation.targetId = node.id;
                 automation.state = 'WALKING_TO_RESOURCE';
             } else {
                 setStatus(`No ${resourceType.toLowerCase()}s available...`);
                 automation.state = 'WAITING_FOR_RESPAWN';
             }
            break;
        case 'WALKING_TO_RESOURCE':
            const targetNode = findResourceById(automation.targetId);
            if (!targetNode) { automation.state = 'FINDING_RESOURCE'; break; }
            if (isAdjacent(player, targetNode)) {
                automation.state = 'GATHERING';
            } else {
                setStatus(`Walking to ${resourceType.toLowerCase()}...`);
                const targetPos = getWalkableNeighborsForEntity(targetNode, false)[0];
                if (!targetPos) { setStatus("Can't reach resource!"); automation.state = 'FINDING_RESOURCE'; break; }
                const path = findPath(player, targetPos, zoneX, zoneY);
                if (path && path.length > 0) {
                    const moveId = Date.now();
                    character.currentMoveId = moveId;
                    moveAlongPath(character, path, moveId);
                } else {
                    setStatus("Can't find a path!");
                    automation.state = 'FINDING_RESOURCE';
                }
            }
            break;
        case 'GATHERING':
            gatherResource(character, gameTime, setStatus);
            break;
        case 'WAITING_FOR_RESPAWN':
            const hasRespawned = worldData[`${zoneX},${zoneY}`]?.resources?.some(r => r.type === resourceType);
            if (hasRespawned) automation.state = 'FINDING_RESOURCE';
            break;
    }
}

function gatherResource(character, gameTime, setStatus) {
    const { automation } = character;
    const node = findResourceById(automation.targetId);
    if (!node) { automation.state = 'FINDING_RESOURCE'; return; }
    const resourceData = RESOURCE_DATA[node.type];
    if (gameTime - automation.gatheringState.lastHitTime < resourceData.time) return;
    automation.gatheringState.lastHitTime = gameTime;
    setStatus(`Gathering...`);
    gainSkillXp(resourceData.skill, resourceData.xp);
    if(resourceData.item) {
        gameState.inventory[resourceData.item]++;
        showNotification(`+1 ${resourceData.item.replace('_', ' ')}`);
        if(ui.inventoryModal.classList.contains('hidden') === false) renderInventory();
    }
    // The resource depletion check has been removed.
    saveGameState();
}

function assignSkillTask(skillKey) {
    const activeChar = getActiveCharacter();
    if (!activeChar || activeChar.isDead) return;
    if (activeChar.automation.task === skillKey && activeChar.automation.active) {
        stopAutomation(activeChar);
    } else {
        startAutomation(activeChar, skillKey);
    }
}

function findEnemyById(id) {
    for (const zoneKey in enemies) {
        if (enemies[zoneKey][id]) return enemies[zoneKey][id];
    }
    return null;
}

function findDeadEnemyById(id) {
    for (const zoneKey in deadEnemies) {
        const deadEnemy = deadEnemies[zoneKey].find(dead => dead.id === id);
        if (deadEnemy) return deadEnemy;
    }
    return null;
}

function isEnemyDead(enemyId) {
    for (const zoneKey in deadEnemies) {
        if (deadEnemies[zoneKey].some(dead => dead.id === enemyId)) {
            return true;
        }
    }
    return false;
}

function findResourceById(id) {
    for (const zoneKey in worldData) {
        const zone = worldData[zoneKey];
        if (zone.resources) {
            const resource = zone.resources.find(r => r.id === id);
            if (resource) return resource;
        }
    }
    return null;
}

function findNearestResource(character, type) {
    const { player, zoneX, zoneY } = character;
    const zone = worldData[`${zoneX},${zoneY}`];
    if (!zone || !zone.resources) return null;
    const availableNodes = zone.resources.filter(r => r.type === type);
    if (availableNodes.length === 0) return null;
    let nearest = null;
    let minDistance = Infinity;
    for (const node of availableNodes) {
        const distance = Math.abs(node.x - player.x) + Math.abs(node.y - player.y);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = node;
        }
    }
    return nearest;
}

function updateAllPlayerRegen(gameTime) {
    const teamStats = getTeamStats();
    gameState.characters.forEach(char => {
        if (char.isDead || char.hp.current >= char.hp.max) return;
        if (gameTime - (char.lastRegenTime || 0) > 1000) {
            const baseRegen = char.hp.max * 0.01;
            const bonusRegen = char.hp.max * teamStats.hpRegenBonus;
            const totalRegen = baseRegen + bonusRegen;
            char.hp.current = Math.min(char.hp.max, char.hp.current + totalRegen);
            char.lastRegenTime = gameTime;
            if (char.id === getActiveCharacter().id) updateAllUI();
        }
    });
}

function findPath(start, end, zoneX, zoneY) { 
    if (!end) return null; 
    const queue = [[start]]; 
    const visited = new Set([`${start.x},${start.y}`]); 
    while (queue.length > 0) { 
        const path = queue.shift(); 
        const { x, y } = path[path.length - 1]; 
        if (x === end.x && y === end.y) return path.slice(1); 
        const neighbors = [{x:x,y:y-1},{x:x,y:y+1},{x:x-1,y:y},{x:x+1,y:y}]; 
        for (const n of neighbors) { 
            if (isWalkable(n.x, n.y, zoneX, zoneY)) { 
                const vKey = `${n.x},${n.y}`; 
                if(!visited.has(vKey)) { 
                    visited.add(vKey); 
                    const newPath = [...path, n]; 
                    queue.push(newPath); 
                } 
            } 
        } 
    } 
    return null; 
}

function findPathToZone(character, targetZoneX, targetZoneY) {
    const currentZoneKey = `${character.zoneX},${character.zoneY}`;
    const currentZoneData = worldData[currentZoneKey];
    if (!currentZoneData || !currentZoneData.gateways) return null;

    for (const gateway of currentZoneData.gateways) {
        if (gateway.destZone.x === targetZoneX && gateway.destZone.y === targetZoneY) {
            return findPath(character.player, gateway, character.zoneX, character.zoneY);
        }
    }
    return null;
}

function isWalkable(x, y, zoneX, zoneY, ignoreChars = false) {
    const zoneKey = `${zoneX},${zoneY}`;
    if (x < 0 || x >= MAP_WIDTH_TILES || y < 0 || y >= MAP_HEIGHT_TILES) return false;
    if (!currentMapData[y] || currentMapData[y][x] === undefined) return false;
    const tileType = currentMapData[y][x];
    if ([TILES.WALL, TILES.PEDESTAL, TILES.TREE, TILES.ROCK, TILES.POND, TILES.DEEP_FOREST, TILES.DEEP_WATER].includes(tileType)) return false;
    if (getEnemyAt(x, y, zoneKey)) return false;
    if (!ignoreChars && gameState.characters.some(c => c.zoneX === zoneX && c.zoneY === zoneY && c.player.x === x && c.player.y === y)) return false;
    return true;
}

function getWalkableNeighborsForEntity(entity, isCombat) {
    const entityData = ENEMIES_DATA[entity.type] || RESOURCE_DATA[entity.type];
    if (!entityData) return [];
    
    const size = entityData.size || { w: 1, h: 1 };
    const perimeter = new Set();
    const entityPos = entity.data ? entity.data : entity;

    for(let i=0; i<size.w; i++){
        perimeter.add(`${entityPos.x+i},${entityPos.y - 1}`);
        perimeter.add(`${entityPos.x+i},${entityPos.y + size.h}`);
    }
    for(let j=0; j<size.h; j++){
        perimeter.add(`${entityPos.x - 1},${entityPos.y+j}`);
        perimeter.add(`${entityPos.x + size.w},${entityPos.y+j}`);
    }
    
    return [...perimeter]
        .map(s => ({ x: parseInt(s.split(',')[0]), y: parseInt(s.split(',')[1]), zoneX: entityPos.zoneX, zoneY: entityPos.zoneY }))
        .filter(p => isWalkable(p.x, p.y, p.zoneX, p.zoneY, isCombat));
}

function findWalkableNeighborForEntity(entity, charPos, reservedSpots = []) {
    const walkableNeighbors = getWalkableNeighborsForEntity(entity, true);
    const reservedSet = new Set(reservedSpots.map(s => `${s.x},${s.y}`));
    const availableNeighbors = walkableNeighbors.filter(p => !reservedSet.has(`${p.x},${p.y}`));
    if (availableNeighbors.length === 0) return null; 
    
    availableNeighbors.sort((a, b) => {
        const distA = Math.abs(a.x - charPos.x) + Math.abs(a.y - charPos.y);
        const distB = Math.abs(b.x - charPos.x) + Math.abs(b.y - charPos.y);
        return distA - distB;
    });

    return availableNeighbors[0];
}

function startAutomation(character, task) {
    if (character.isDead) return;
    if (character.automation.active && character.automation.task === task) return;
    if (character.combat.active) forceEndCombat(character);
    stopAutomation(character);
    if (task !== 'hunting') character.automation.markedTiles = [];
    character.automation.task = task;
    if (task === 'hunting' && character.automation.markedTiles.length === 0) {
        if (character.id === getActiveCharacter().id) showNotification('Mark a monster to start hunting.');
        return;
    }
    character.automation.active = true;
    character.automation.state = 'IDLE';
    saveGameState();
    if (ui.levelsModal.classList.contains('hidden') === false) renderLevels();
    updateAllUI();
}

function stopAutomation(character) {
     if(!character.automation.active) return; 
     if (character.combat.active) forceEndCombat(character);
     character.automation.active = false;
     character.automation.task = null; 
     character.automation.targetId = null; 
     character.automation.state = 'IDLE'; 
     character.currentMoveId = null;
     character.isMoving = false;
     if (character.id === getActiveCharacter().id) ui.actionStatus.textContent = 'Idle'; 
     if(ui.levelsModal.classList.contains('hidden') === false) renderLevels(); 
     updateAllUI(); 
}

function spawnEnemiesForZone(zoneX, zoneY) { 
    const zoneKey = `${zoneX},${zoneY}`; 
    if (enemies[zoneKey] || !worldData[zoneKey]?.spawns) return; 
    enemies[zoneKey] = {}; 
    let idCounter = 0; 
    worldData[zoneKey].spawns.forEach(point => { 
        const id = `${point.type}_${zoneKey}_${idCounter++}`; 
        const enemyData = ENEMIES_DATA[point.type]; 
        enemies[zoneKey][id] = { 
            id, type: point.type, x: point.x, y: point.y, 
            spawnX: point.x, spawnY: point.y, zoneX, zoneY, 
            ...JSON.parse(JSON.stringify(enemyData)), 
            currentHp: enemyData.hp,
            lastRegenTime: currentGameTime
        }; 
    }); 
}

function checkAllRespawns(gameTime) { 
    for(const zoneKey in deadEnemies) { 
        for(let i = deadEnemies[zoneKey].length - 1; i >= 0; i--) { 
            const dead = deadEnemies[zoneKey][i]; 
            if(gameTime >= dead.respawnTime) { 
                if (!enemies[zoneKey]) enemies[zoneKey] = {}; 
                enemies[zoneKey][dead.id] = dead.data;
                enemies[zoneKey][dead.id].lastRegenTime = gameTime;
                deadEnemies[zoneKey].splice(i, 1); 
            } 
        } 
    }
}

function isAdjacent(charPos, entity) { 
    if(!entity) return false;
    const neighbors = getWalkableNeighborsForEntity(entity, true);
    return neighbors.some(n => n.x === charPos.x && n.y === charPos.y);
}

function findNearestMarked(character) {
    if (character.automation.markedTiles.length === 0) return null;
    const firstMark = character.automation.markedTiles[0];
    return findEnemyById(firstMark.enemyId);
}

function renderCharacterSwitcher() { 
    ui.characterSwitcher.innerHTML = ''; 
    gameState.characters.forEach((char, index) => { 
        const btn = document.createElement('button');
        let taskEmoji = '';
        if(char.isDead) {
            taskEmoji = '💀';
        } else if (char.automation.active) {
            if (char.automation.task === 'hunting') taskEmoji = '⚔️';
            else if (char.automation.task === 'woodcutting') taskEmoji = '🌲';
            else if (char.automation.task === 'mining') taskEmoji = '⛏️';
            else if (char.automation.task === 'fishing') taskEmoji = '🎣';
        }
        btn.innerHTML = `${index + 1}: ${char.name} <span class="text-xs">${taskEmoji}</span>`; 
        btn.className = 'char-button'; 
        if (index === gameState.activeCharacterIndex) btn.classList.add('active'); 
        btn.addEventListener('click', () => { gameState.activeCharacterIndex = index; saveGameState(); updateAllUI(); }); 
        ui.characterSwitcher.appendChild(btn); 
    }); 
}

function updateCombatPanelUI() { 
    const activeChar = getActiveCharacter(); 
    if (!activeChar) return; 
    
    const enemy = findEnemyById(activeChar.combat.targetId); 
    if (enemy && activeChar.combat.active) { 
        const enemyData = ENEMIES_DATA[enemy.type]; 
        ui.enemyCombatInfo.classList.remove('hidden'); 
        ui.enemyName.textContent = enemyData.name; 
        ui.enemyHpBar.style.width = `${(enemy.currentHp / enemyData.hp) * 100}%`; 
        ui.enemyHpBar.textContent = `${Math.ceil(enemy.currentHp)}/${enemyData.hp}`; 
        ui.enemyStats.innerHTML = `❤️ ${enemyData.hp} &nbsp;&nbsp; 👊 ${enemyData.attack}`; 
    } else { ui.enemyCombatInfo.classList.add('hidden'); } 
}

function updateAllUI() { 
    const activeChar = getActiveCharacter(); 
    if (!activeChar || !gameState.level) return; 
    const teamStats = getTeamStats(); 
    if(!currentMapData || currentMapData.length === 0 || activeChar.zoneX !== (currentMapData.zoneX || -1) || activeChar.zoneY !== (currentMapData.zoneY || -1)) {
         currentMapData = buildMapData(activeChar.zoneX, activeChar.zoneY); 
         currentMapData.zoneX = activeChar.zoneX;
         currentMapData.zoneY = activeChar.zoneY;
    }
    renderCharacterSwitcher(); 
    ui.activeCharacterName.textContent = activeChar.name; 
    ui.playerDamageStat.textContent = teamStats.damage; 
    ui.playerSpeedStat.textContent = teamStats.speed;
    const damageReduction = (teamStats.defense * 0.25).toFixed(2).replace(/\.00$/, '');
    ui.playerDefenseStat.textContent = `${teamStats.defense} (${damageReduction})`;
    
    const allMarksCount = gameState.characters.reduce((sum, char) => sum + char.automation.markedTiles.length, 0);
    ui.markCount.textContent = `${allMarksCount}/${teamStats.maxMarks * gameState.characters.length}`; 

    ui.playerSouls.textContent = `${gameState.inventory.soulFragment || 0} ${ITEM_SPRITES.soulFragment}`; 
    const { hp } = activeChar; 
    ui.playerHpBar.style.width = `${(hp.current / hp.max) * 100}%`; 
    ui.playerHpBar.textContent = `${Math.ceil(hp.current)}/${hp.max}`;
    
    const {level} = gameState;
    const neededXp = xpForLevel(level.current);
    ui.playerLevel.textContent = `Lv ${level.current}`; 
    ui.xpProgress.style.width = `${(level.xp / neededXp) * 100}%`;
    ui.xpProgress.textContent = `${Math.floor(level.xp)}/${neededXp}`;
}

async function saveGameState() { 
    if (!userId || !appId) return; 
    try { 
        const docRef = doc(db, `artifacts/${appId}/users/${userId}/gamestate/main`); 
        const stateToSave = JSON.parse(JSON.stringify(gameState));
        await setDoc(docRef, { ...stateToSave, lastSaved: serverTimestamp() }); 
    } catch(e) { console.error("Failed to save game state:", e); } 
}

async function loadGameState() { 
    if (!userId || !appId) { 
        gameState = getDefaultGameState();
        if (gameState.characters.length === 0) {
             gameState.characters.push(getDefaultCharacterState(0, "Character 1", CHARACTER_COLORS[0]));
        }
        return; 
    } 
    const docRef = doc(db, `artifacts/${appId}/users/${userId}/gamestate/main`); 
    const docSnap = await getDoc(docRef); 
    let defaultState = getDefaultGameState(); 
    if (docSnap.exists()) { 
        let loadedData = docSnap.data();
        if (!loadedData.characters || loadedData.characters.length === 0) {
            loadedData.characters = [getDefaultCharacterState(0, "Character 1", CHARACTER_COLORS[0])];
        }
        gameState = mergeDeep({}, defaultState, loadedData);
    } else { 
        gameState = defaultState; 
        if (gameState.characters.length === 0) {
             gameState.characters.push(getDefaultCharacterState(0, "Character 1", CHARACTER_COLORS[0]));
        }
    }

    let needsSave = false;
    gameState.characters.forEach(char => {
        if (char.isDead) {
            console.log(`Character ${char.name} was dead on load. Respawning.`);
            char.isDead = false;
            char.hp.current = char.hp.max;
            char.player = { x: 30, y: 30 };
            char.zoneX = 1;
            char.zoneY = 1;
            char.combat = { active: false, targetId: null, isPlayerTurn: true, lastUpdateTime: 0 };
            needsSave = true;
        }
    });

    recalculateTeamStats();

    if (needsSave) {
        await saveGameState();
    }
}

// Start the game initialization process
initFirebase();
