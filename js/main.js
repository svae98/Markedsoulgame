// js/main.js
// The Island Update - Spritesheet Integration

// --- Game Data Import ---
import {
    TILE_SIZE, MAP_WIDTH_TILES, MAP_HEIGHT_TILES, RESPAWN_TIME, MAX_CHARACTERS, CHARACTER_COLORS,
    TILES, ITEM_SPRITES, ITEM_DROP_DATA, ENEMIES_DATA, RESOURCE_DATA, worldData, ALTAR_UPGRADES, SPRITES
} from './gamedata.js';


// --- Firebase Integration ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Global Variables ---
let app, db, auth, userId, appId;
let spriteSheet = null; // This will hold the loaded spritesheet image

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
            // This is a placeholder config. In a real environment, use secure methods to load credentials.
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
let currentMapData = []; // This will store the tile-type grid, not the character-based layout
let notificationTimeout = null;
let camera = { x: 30, y: 30, target: null, lerp: 0.1 };

let lastFrameTime = 0;
let accumulator = 0;
let currentGameTime = 0;

// --- Movement and Logic Constants ---
const LOGIC_TICK_RATE = 20; // Run logic updates 50 times per second
const BASE_MOVEMENT_SPEED = 2.5; // Base tiles per second
const VIEW_SCALE_FACTOR = 1.0; // Reverted to no zoom

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

/**
 * Loads the spritesheet image from the assets folder.
 * Returns a promise that resolves when the image is loaded.
 * @returns {Promise<void>}
 */
function loadSpriteSheet() {
    return new Promise((resolve, reject) => {
        spriteSheet = new Image();
        // IMPORTANT: Make sure you have an 'images' folder with your spritesheet inside it.
        spriteSheet.src = 'images/spritesheet.png'; 
        spriteSheet.onload = () => {
            console.log("Spritesheet loaded successfully.");
            resolve();
        };
        spriteSheet.onerror = () => {
            console.error("Failed to load spritesheet. Make sure 'images/spritesheet.png' exists.");
            reject();
        };
    });
}

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

function buildMapData(zoneX, zoneY) {
    const zoneKey = `${zoneX},${zoneY}`;
    const zone = worldData[zoneKey];
    if (!zone || !zone.mapLayout) return []; 
    
    const width = zone.width || MAP_WIDTH_TILES;
    const height = zone.height || MAP_HEIGHT_TILES;
    
    const legend = {
        ' ': TILES.GRASS, 'W': TILES.WALL, 'F': TILES.DEEP_FOREST, 'D': TILES.DEEP_WATER,
        '.': TILES.PATH,
        // Ensure any characters previously representing objects now map to a base tile
        'T': TILES.GRASS, // Tree was on Grass
        'R': TILES.GRASS, // Rock was on Grass
        'P': TILES.GRASS, // Pond resource was on Grass (or will be drawn over water)
        // Gateways and Pedestals are objects, their base tile is defined by mapLayout char at their pos.
    };

    const newMapData = Array.from({ length: height }, () => Array(width).fill(TILES.GRASS));

    for(let y=0; y<height; y++) {
        for(let x=0; x<width; x++) {
            const char = zone.mapLayout[y]?.[x] || ' ';
            newMapData[y][x] = legend[char] ?? TILES.GRASS;
         }
    };

    return newMapData;
}


function getDefaultCharacterState(id, name, color) {
    // HOW TO CHANGE THE SPAWN POINT FOR A NEW CHARACTER:
    // Change the x and y values in the startPos object below.
    const startPos = { x: 31, y: 31 }; // Centered for 63x63 map (playable 35x35)
    return {
        id, name, zoneX: 1, zoneY: 1, 
        player: { ...startPos },        
        visual: { ...startPos },       
        target: { ...startPos },       
        path: [],                                        
        movementCooldown: 0,                             
        hp: { current: 5, max: 5 },
        lastRegenTime: 0, isDead: false,
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
    function resizeCanvasAndCenterCamera() {
        ui.canvas.width = ui.canvasContainer.offsetWidth;
        ui.canvas.height = ui.canvasContainer.offsetHeight;
        // Center camera on the middle of the current zone
        const activeChar = getActiveCharacter();
        if (activeChar) {
            const zoneKey = `${activeChar.zoneX},${activeChar.zoneY}`;
            const zone = worldData[zoneKey];
            if (zone) {
                camera.x = zone.width / 2;
                camera.y = zone.height / 2;
            }
        } else { // Fallback if no active char or zone somehow
            camera.x = (worldData['1,1']?.width || MAP_WIDTH_TILES) / 2;
            camera.y = (worldData['1,1']?.height || MAP_HEIGHT_TILES) / 2;
        }
        // No need to redraw here, gameLoop will handle it
    }
    resizeCanvasAndCenterCamera();
    window.addEventListener('resize', resizeCanvasAndCenterCamera);
    
    try {
        await loadSpriteSheet(); // Wait for spritesheet to load
    } catch {
        ui.actionStatus.textContent = "Error: Could not load assets!";
        return; // Stop game initialization if assets fail
    }


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
    if (activeChar) {
        // Set initial camera to center of character's zone
        const zoneKey = `${activeChar.zoneX},${activeChar.zoneY}`;
        const zone = worldData[zoneKey];
        if (zone) {
            camera.x = zone.width / 2;
            camera.y = zone.height / 2;
        }
        currentMapData = buildMapData(activeChar.zoneX, activeChar.zoneY);
    }
    Object.keys(worldData).forEach(zoneKey => { // Spawn enemies for all zones
        const [zoneX, zoneY] = zoneKey.split(',').map(Number); // Ensure correct parsing
        spawnEnemiesForZone(zoneX, zoneY);
    });
    updateAllUI();
    ui.actionStatus.textContent = "Right-click for options";
    lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!gameState.characters) { requestAnimationFrame(gameLoop); return; }

    // Camera is now static, no longer follows player.
    // const activeChar = getActiveCharacter();
    // if (activeChar) {
    //     camera.target = activeChar.visual;
    //     camera.x += (camera.target.x - camera.x) * camera.lerp;
    //     camera.y += (camera.target.y - camera.y) * camera.lerp;
    // }
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
                updateCharacterLogic(char, LOGIC_TICK_RATE);
                updateAutomation(char, currentGameTime);
                updateCombat(char, currentGameTime);
            }
        });
        accumulator -= LOGIC_TICK_RATE;
    }

    gameState.characters.forEach(char => {
        updateCharacterVisuals(char, deltaTime);
    });

    updateCombatPanelUI();
    draw(); 
    
    requestAnimationFrame(gameLoop);
}

function getEffectiveMoveSpeeds() {
    const stats = getTeamStats();
    const speedBonus = 1 + (stats.speed * 0.01); // Each point of speed now grants 1% bonus
    const effectiveTileSpeed = BASE_MOVEMENT_SPEED * speedBonus;
    return {
        stepInterval: 1000 / effectiveTileSpeed,
        visualSpeed: effectiveTileSpeed 
    };
}

function updateCharacterLogic(character, logicDelta) {
    if (character.movementCooldown > 0) {
        character.movementCooldown -= logicDelta;
    }

    if (character.movementCooldown <= 0 && character.path && character.path.length > 0) {
        const nextStep = character.path.shift();
        character.player.x = nextStep.x;
        character.player.y = nextStep.y;
        character.target.x = nextStep.x;
        character.target.y = nextStep.y;
        
        const speeds = getEffectiveMoveSpeeds();
        character.movementCooldown = speeds.stepInterval;

        if (character.path.length === 0) {
             checkForGateway(character);
        }
    }
}

function updateCharacterVisuals(character, frameDelta) {
    const visualX = character.visual.x;
    const visualY = character.visual.y;
    const targetX = character.target.x;
    const targetY = character.target.y;

    if (visualX === targetX && visualY === targetY) return;

    const dx = targetX - visualX;
    const dy = targetY - visualY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const speeds = getEffectiveMoveSpeeds();
    const moveAmount = (speeds.visualSpeed / 1000) * frameDelta; 

    if (distance <= moveAmount) {
        character.visual.x = targetX;
        character.visual.y = targetY;
    } else {
        character.visual.x += (dx / distance) * moveAmount;
        character.visual.y += (dy / distance) * moveAmount;
    }
}

function checkForGateway(character) {
    const zone = worldData[`${character.zoneX},${character.zoneY}`];
    if (zone && zone.gateways) {
        const gateway = zone.gateways.find(g => g.x === character.player.x && g.y === character.player.y);
        if (gateway) {
            character.zoneX = gateway.destZone.x;
            character.zoneY = gateway.destZone.y;
            const entryPos = { x: gateway.entry.x, y: gateway.entry.y };
            character.player = { ...entryPos };
            character.target = { ...entryPos };
            character.visual = { ...entryPos };
            // Set camera to center of new zone
            const newZoneKey = `${character.zoneX},${character.zoneY}`;
            const newZone = worldData[newZoneKey];
            if (newZone) {
                camera.x = newZone.width / 2;
                camera.y = newZone.height / 2;
            }
            currentMapData = buildMapData(character.zoneX, character.zoneY);
            saveGameState();
            updateAllUI();
        }
    }
}

function draw() {
    const ctx = ui.ctx;
    ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
    const activeChar = getActiveCharacter();
    if(!activeChar || !spriteSheet) return;
    
    const zoneKey = `${activeChar.zoneX},${activeChar.zoneY}`;
    const zone = worldData[zoneKey];
    if (!zone) return;

    const zoneWidth = zone.width || MAP_WIDTH_TILES;
    const zoneHeight = zone.height || MAP_HEIGHT_TILES;
    
    const halfWidth = (ui.canvas.width / 2 / TILE_SIZE); // Removed VIEW_SCALE_FACTOR
    const halfHeight = (ui.canvas.height / 2 / TILE_SIZE); // Removed VIEW_SCALE_FACTOR
    const startCol = Math.floor(camera.x - halfWidth);
    const endCol = Math.ceil(camera.x + halfWidth);
    const startRow = Math.floor(camera.y - halfHeight);
    const endRow = Math.ceil(camera.y + halfHeight);

    for (let y = startRow; y <= endRow; y++) {
        for (let x = startCol; x <= endCol; x++) {
            if (x >= 0 && x < zoneWidth && y >= 0 && y < zoneHeight) {
                drawTile(x, y, activeChar.zoneX, activeChar.zoneY);
            }
        }
    }

    // Draw objects on top of base tiles
    if (zone.resources) {
        zone.resources.forEach(resource => {
            // Only draw if within the current viewable area for minor optimization
            if (resource.x >= startCol && resource.x <= endCol && resource.y >= startRow && resource.y <= endRow) {
                drawResourceObject(resource);
            }
        });
    }
    if (zone.pedestals) {
        zone.pedestals.forEach(pedestal => {
            if (pedestal.x >= startCol && pedestal.x <= endCol && pedestal.y >= startRow && pedestal.y <= endRow) {
                drawStaticObject(pedestal, SPRITES.PEDESTAL);
            }
        });
    }
    // Gateways are typically interactive points on walkable tiles; they might not need a separate sprite
    // unless you want a visual marker. If so, draw them similarly to pedestals.
    
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

function worldToScreen(worldX, worldY) {
    // Ensure integer pixel positions to avoid seams
    const screenX = Math.round((worldX - camera.x) * TILE_SIZE + ui.canvas.width / 2); // Use TILE_SIZE directly
    const screenY = Math.round((worldY - camera.y) * TILE_SIZE + ui.canvas.height / 2); // Use TILE_SIZE directly
    return { x: screenX, y: screenY };
}

function drawSprite(sprite, destX, destY, destW = TILE_SIZE, destH = TILE_SIZE) {
    if (!spriteSheet || !sprite) return;

    const sx = sprite.sx;
    const sy = sprite.sy;
    const sw = sprite.sw || TILE_SIZE;
    const sh = sprite.sh || TILE_SIZE;
    // Draw at integer positions to prevent seams
    ui.ctx.drawImage(spriteSheet, sx, sy, sw, sh, Math.round(destX), Math.round(destY), Math.round(destW), Math.round(destH)); // Use destW, destH directly
}

function drawTile(x, y, zoneX, zoneY) {
    const { x: drawX, y: drawY } = worldToScreen(x, y);
    const ctx = ui.ctx;

    const tileType = currentMapData[y]?.[x];
    if (tileType === undefined) return;
    
    let sprite;
    switch(tileType) {
        case TILES.GRASS:
            // Use a pseudo-random but consistent index based on tile coordinates
            // This makes the grass varied without flickering every frame
            const grassVariationCount = SPRITES.GRASS.length;
            const tileHash = (x * 19 + y * 71); // Simple hash for variety
            sprite = SPRITES.GRASS[tileHash % grassVariationCount];
            break;
        case TILES.WALL: sprite = SPRITES.WALL; break;
        case TILES.DEEP_WATER: sprite = SPRITES.DEEP_WATER; break;
        case TILES.DEEP_FOREST: sprite = SPRITES.DEEP_FOREST; break;
        case TILES.PATH: sprite = SPRITES.PATH; break;
        default: sprite = SPRITES.GRASS[0]; // Default to grass if unknown
    }
    
    // For larger tiles like trees, we need to adjust the drawing position
    const baseDrawWidth = sprite.sw || TILE_SIZE; // Use sprite's own width if defined
    const baseDrawHeight = sprite.sh || TILE_SIZE; // Use sprite's own height if defined
    const xOffset = (baseDrawWidth - TILE_SIZE) / 2; // Centering offset based on TILE_SIZE
    const yOffset = (baseDrawHeight - TILE_SIZE);   // Anchor to bottom based on TILE_SIZE

    drawSprite(sprite, drawX - xOffset, drawY - yOffset, baseDrawWidth, baseDrawHeight); // Removed VIEW_SCALE_FACTOR from offset application
}

function drawResourceObject(resource) {
    const resourceDef = RESOURCE_DATA[resource.type];
    if (!resourceDef) return;

    let spriteToDraw = SPRITES[resource.type.toUpperCase()]; // e.g., SPRITES.TREE, SPRITES.ROCK
    if (resource.type === 'FISHING_SPOT') spriteToDraw = SPRITES.FISHING_SPOT; 

    if (!spriteToDraw) return;

    const { x: drawX, y: drawY } = worldToScreen(resource.x, resource.y);
    const baseDrawWidth = spriteToDraw.sw || TILE_SIZE;
    const baseDrawHeight = spriteToDraw.sh || TILE_SIZE;
    const xOffset = (baseDrawWidth - TILE_SIZE) / 2;
    const yOffset = (baseDrawHeight - TILE_SIZE); // Anchor to bottom

    drawSprite(spriteToDraw, drawX - xOffset, drawY - yOffset, baseDrawWidth, baseDrawHeight); // Removed VIEW_SCALE_FACTOR
}

function drawStaticObject(object, spriteToDraw) {
    if (!spriteToDraw) return;
    const { x: drawX, y: drawY } = worldToScreen(object.x, object.y);
    const baseDrawWidth = spriteToDraw.sw || TILE_SIZE;
    const baseDrawHeight = spriteToDraw.sh || TILE_SIZE;
    const xOffset = (baseDrawWidth - TILE_SIZE) / 2;
    const yOffset = (baseDrawHeight - TILE_SIZE);
    drawSprite(spriteToDraw, drawX - xOffset, drawY - yOffset, baseDrawWidth, baseDrawHeight); // Removed VIEW_SCALE_FACTOR
}

function drawEnemy(enemy) {
    const enemyData = ENEMIES_DATA[enemy.type];
    if (!enemyData || !enemyData.sprite) return;

    const size = enemyData.size || { w: 1, h: 1 };
    const {x: screenX, y: screenY} = worldToScreen(enemy.x, enemy.y);
    const width = size.w * TILE_SIZE;
    const height = size.h * TILE_SIZE;
    
    drawSprite(enemyData.sprite, screenX, screenY, width, height);
}


function drawMarks(currentZoneKey) {
    ui.ctx.lineWidth = 2;
    const allMarks = gameState.characters.flatMap(c => c.automation.markedTiles);

    allMarks.forEach(mark => {
        // IMPORTANT: The 'mark' object contains the coordinates for the character to walk to (the approach tile).
        // However, for visual clarity, we want to draw the mark directly on the ENEMY's tile, not the approach tile.
        // We need to find the enemy associated with this mark to get its coordinates.
        const enemy = findEnemyById(mark.enemyId);
        if (!enemy) return; 

        if (`${enemy.zoneX},${enemy.zoneY}` === currentZoneKey) {
            const char = gameState.characters.find(c => c.automation.markedTiles.includes(mark));
            ui.ctx.strokeStyle = char ? char.automation.color : '#FFFFFF';
            
            const {x: screenX, y: screenY} = worldToScreen(enemy.x, enemy.y); 
            
            const enemyData = ENEMIES_DATA[enemy.type];
            const size = enemyData.size || { w: 1, h: 1 };
            const width = size.w * TILE_SIZE;
            const height = size.h * TILE_SIZE;

            ui.ctx.strokeRect(screenX, screenY, width, height);
        }
    });
}

function drawPlayer(character, isActive) {
    const {x: screenX, y: screenY} = worldToScreen(character.visual.x, character.visual.y);
    const w = TILE_SIZE;
    const h = TILE_SIZE;

    if (character.isDead) {
        ui.ctx.fillStyle = '#7f1d1d'; // Keep dead characters as a red square
        ui.ctx.fillRect(screenX, screenY, w, h);
        return;
    }
    
    drawSprite(SPRITES.PLAYER, screenX, screenY);
    
    if (isActive) {
        ui.ctx.strokeStyle = '#facc15';
        ui.ctx.lineWidth = 2;
        ui.ctx.strokeRect(screenX, screenY, w, h);
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

function getTileFromClick(e) { 
    const rect = ui.canvas.getBoundingClientRect(); 
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    // With VIEW_SCALE_FACTOR = 1.0, this calculation is direct.
    // camera.x and camera.y represent the center of the view in world coordinates.
    // (ui.canvas.width / 2) is the screen center in pixels.
    const worldX = Math.floor(camera.x - (ui.canvas.width / 2 / TILE_SIZE) + (screenX / TILE_SIZE) );
    const worldY = Math.floor(camera.y - (ui.canvas.height / 2 / TILE_SIZE) + (screenY / TILE_SIZE) );
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

function initiateMoveToEntity(character, entity) {
    console.log(`[${character.name}] initiateMoveToEntity for ${entity.type} ID: ${entity.id} at (${entity.x},${entity.y}) in zone (${character.zoneX},${character.zoneY})`);
    character.path = []; // Clear existing path
    const entityData = ENEMIES_DATA[entity.type] || RESOURCE_DATA[entity.type];
    if (!entityData) {
        console.log(`[${character.name}] Unknown entity type for ID: ${entity.id}`);
        if (character.id === getActiveCharacter().id) ui.actionStatus.textContent = "Unknown entity type.";
        return;
    }

    let targetPos;
    // For monsters, findWalkableNeighborForEntity considers reserved spots if any.
    // For resources, we just need any adjacent walkable tile.
    if (ENEMIES_DATA[entity.type]) { // It's a monster
        console.log(`[${character.name}] Finding walkable neighbor for MONSTER ${entity.id}`);
        targetPos = findWalkableNeighborForEntity(entity, character.player);
    } else { // It's a resource
        // Pass character's current zone as context for the resource
        const neighbors = getWalkableNeighborsForEntity(entity, false, character.zoneX, character.zoneY);
        if (neighbors.length > 0) {
            // Sort by distance to character to pick the closest one
            neighbors.sort((a, b) => {
                // console.log(`[${character.name}] Sorting neighbors for RESOURCE ${entity.id}. Neighbor A: (${a.x},${a.y}), Neighbor B: (${b.x},${b.y})`); // Can be verbose
                // Ensure player object is valid for heuristic calculation
                if (!character || !character.player) return 0;
                const distA = heuristic(character.player, a);
                const distB = heuristic(character.player, b);
                return distA - distB;
            });

            targetPos = neighbors[0];
        }
    }

    if (targetPos) {
        const path = findPath(character.player, targetPos, character.zoneX, character.zoneY);
        if (path && path.length > 0) {
            character.path = path;
            if (character.id === getActiveCharacter().id) ui.actionStatus.textContent = `Walking to ${entityData.name}...`;
        } else {
            if (character.id === getActiveCharacter().id) ui.actionStatus.textContent = `Can't find path to ${entityData.name}.`;
        }
    } else {
        if (character.id === getActiveCharacter().id) ui.actionStatus.textContent = `No approach spot for ${entityData.name}.`;
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
    
    if (enemy) {
        handleMonsterClick(enemy); // Show tooltip
        if (activeChar.path.length === 0) { // Only initiate new movement if not already pathing
            initiateMoveToEntity(activeChar, enemy);
        }
        return; // Click handled
    } else if (resource) {
        handleResourceClick(resource); // Show tooltip
        if (activeChar.path.length === 0) { // Only initiate new movement if not already pathing
            initiateMoveToEntity(activeChar, resource);
        }
        return; // Click handled
    } else if (tileType === TILES.PEDESTAL) {
        handlePedestalClick(x, y, activeChar.zoneX, activeChar.zoneY);
        return; // Click handled
    }
    
    // If we reach here, it means an empty/non-interactive tile was clicked.
    // Handle stopping automation if active.
    if (activeChar.automation.active) {
        if (['woodcutting', 'mining', 'fishing'].includes(activeChar.automation.task) && !enemy && !resource) {
            stopAutomation(activeChar);
            // After stopping, allow movement to the clicked empty tile.
        }
        // If hunting, it's already handled by the block at the top of the function.
    }
    
    // General movement to the clicked tile if no entity was interacted with and not already pathing.
    if (activeChar.path.length === 0) {
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

/**
 * Handles a movement click, interpreting the user's intent and finding the
 * best possible destination even if the clicked tile is unwalkable.
 * @param {number} clickedX - The raw X coordinate of the click.
 * @param {number} clickedY - The raw Y coordinate of the click.
 * @param {object} activeChar - The currently active character object.
 */
function handleMovementClick(clickedX, clickedY, activeChar) {
    activeChar.path = []; // Clear any existing path

    const startPos = activeChar.player;
    const rawTarget = { x: clickedX, y: clickedY };

    let finalTarget = { ...rawTarget };

    // AI-GUIDE: The following "Click Intent" logic is intentional. It prevents
    // frustrating jittery movement when clicking long distances. The goal is to
    // snap the character's movement to a straight line (horizontal or vertical)
    // if the click is much further in one axis than the other. Do not remove this snapping.
    const deltaX = rawTarget.x - startPos.x;
    const deltaY = rawTarget.y - startPos.y;

    if (Math.abs(deltaX) > Math.abs(deltaY) * 2) {
        finalTarget.y = startPos.y; 
    } else if (Math.abs(deltaY) > Math.abs(deltaX) * 2) {
        finalTarget.x = startPos.x; 
    }
    
    let destination = null;

    // First, check if the intended (snapped) target is walkable.
    if (isWalkable(finalTarget.x, finalTarget.y, activeChar.zoneX, activeChar.zoneY, true)) {
        destination = finalTarget;
    } 
    // If not, fall back to the raw clicked position.
    else if (isWalkable(rawTarget.x, rawTarget.y, activeChar.zoneX, activeChar.zoneY, true)) {
        destination = rawTarget;
    }
    // If both are unwalkable, find the closest walkable neighbor to the intended target.
    else {
        const neighbors = getNeighbors(finalTarget, activeChar.zoneX, activeChar.zoneY);

        if (neighbors.length > 0) {
            // Find the neighbor closest to the character's start position to path to.
            neighbors.sort((a, b) => {
                const distA = heuristic(startPos, a);
                const distB = heuristic(startPos, b);
                return distA - distB;
            });
            destination = neighbors[0];
        }
    }

    // If we found a valid destination, find and set the path.
    if (destination) {
        const path = findPath(startPos, destination, activeChar.zoneX, activeChar.zoneY);
        if (path && path.length > 0) {
            activeChar.path = path;
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
    activeChar.automation.markedTiles.push({ ...approachSpot, enemyId: enemy.id, zoneX: enemy.zoneX, zoneY: enemy.zoneY });
    startAutomation(activeChar, 'hunting');
    showNotification(`Marked ${enemy.name} for ${activeChar.name}.`);
}

function handleMarking(enemy) {
    const activeChar = getActiveCharacter();
    if (!enemy || !activeChar) return;
    activeChar.path = [];

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

    Object.keys(worldData).forEach(zoneKey => {
        const [x, y] = zoneKey.split(',').map(Number);
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
    });
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
            if(item === 'ragingSoul') itemSprite = `<span class="text-red-500">${itemSprite}</span>`;
            itemEl.innerHTML = `<span class="text-3xl">${itemSprite}</span><span class="text-sm font-bold">${gameState.inventory[item]}</span>`;
            ui.inventoryListContainer.appendChild(itemEl);
        }
    }
}

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
    if (character.combat.active || character.path.length > 0 || character.isDead) return;
    stopAutomation(character);
    if (isAutomated) {
        character.automation.task = 'hunting';
        character.automation.active = true;
    }

    const enemy = findEnemyById(enemyId);
    if (!enemy) return;
    
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
        if (path) { 
            character.path = path;
        } else { 
            if (character.id === getActiveCharacter().id) ui.actionStatus.textContent = "Can't find a path."; 
        } 
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

        if (enemyData.itemDrop && Array.isArray(enemyData.itemDrop)) {
            enemyData.itemDrop.forEach(itemDropId => {
                const itemData = ITEM_DROP_DATA[itemDropId];
                if (itemData && Math.random() < itemData.dropChance) {
                    if(!gameState.collectedItemDrops.includes(itemDropId)) {
                        gameState.collectedItemDrops.push(itemDropId);
                        showNotification(`Item Dropped: ${itemData.name}!`);
                        recalculateTeamStats();
                    }
                }
            });
        }

        if (!deadEnemies[zoneKey]) deadEnemies[zoneKey] = [];
        deadEnemies[zoneKey].push({ id: targetEnemy.id, respawnTime: currentGameTime + RESPAWN_TIME, data: { ...targetEnemy, currentHp: enemyData.hp } });
        delete enemies[zoneKey][combat.targetId];

    } else if (!playerWon) {
        if (character.id === getActiveCharacter().id) ui.actionStatus.textContent = `${character.name} has been defeated!`;
        if (targetEnemy) {
            const healAmount = targetEnemy.hp * 0.10;
            targetEnemy.currentHp = Math.min(targetEnemy.hp, targetEnemy.currentHp + healAmount);
            showNotification(`${targetEnemy.name} healed!`);
        }

        character.automation.markedTiles = []; 
        stopAutomation(character);
        character.isDead = true;
        
        setTimeout(() => {
            // CRITICAL-LOGIC: This is the player's safe respawn point after death.
            // It ensures the player always returns to a known, walkable tile.
            // HOW TO CHANGE THE RESPAWN POINT AFTER DEATH:
            // Change the x and y values in the respawnPos object below.
            const respawnPos = { x: 20, y: 20 };
            character.player = { ...respawnPos };
            character.visual = { ...respawnPos };
            character.target = { ...respawnPos };
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
    const { level, upgrades } = gameState;
    let finalAmount = amount;
    if (upgrades.learningBoost && upgrades.learningBoost > 0) {
        const boostPercentage = upgrades.learningBoost * 0.02; // 2% per level
        finalAmount += amount * boostPercentage;
    }
    level.xp += finalAmount;
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
    if (!gameState.skills[skill] || !gameState.upgrades) return;
    let finalAmount = amount;
    if (gameState.upgrades.learningBoost && gameState.upgrades.learningBoost > 0) {
        const boostPercentage = gameState.upgrades.learningBoost * 0.02; // 2% per level
        finalAmount += amount * boostPercentage;
    }
    gameState.skills[skill].xp += finalAmount;
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
    if (!character.automation.active || character.combat.active || character.isDead || character.path.length > 0) return;
    const setStatus = (msg) => { if (character.id === getActiveCharacter().id) ui.actionStatus.textContent = msg; }; 
    switch(character.automation.task) {
        case 'hunting': updateHuntingTask(character, setStatus); break;
        case 'woodcutting': case 'mining': case 'fishing':
            updateSkillingTask(character, gameTime, setStatus);
            break;
    }
}
// AI-GUIDE: This function is a state machine for hunting. The character must
// first pathfind to the marked tile. Only when they are adjacent to the
// enemy should combat actually begin. Do not initiate combat before the path is complete.
function updateHuntingTask(character, setStatus) {
    if (character.path.length > 0 || character.combat.active) return;
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
            character.path = findPathToZone(character, desiredTarget.zoneX, desiredTarget.zoneY) || [];
            return;
        }
        
        if (isAdjacent(character.player, desiredTarget)) {
            setStatus("Initiating combat...");
            character.combat.active = true;
            character.combat.targetId = desiredTarget.id;
            character.combat.isPlayerTurn = true;
            character.combat.lastUpdateTime = currentGameTime;
        } else {
            setStatus(`Walking to ${desiredTarget.name}...`);
            character.path = findPath(character.player, mark, character.zoneX, character.zoneY) || [];
        }
    } else {
        if (isEnemyDead(mark.enemyId)) {
            setStatus("Waiting for respawn...");
        } else {
            setStatus(`Invalid mark, removing.`);
            automation.markedTiles.shift();
            if (automation.markedTiles.length === 0) stopAutomation(character);
        }
    }
}

function updateSkillingTask(character, gameTime, setStatus) {
    const { automation, player, zoneX, zoneY } = character;
    const currentState = automation.state || 'IDLE';

    let resourceTypeToFind;
    let resourceDisplayName;

    // === NEW LOGGING START ===
    // console.log(`updateSkillingTask START: Char: ${character.name}, Task: ${automation.task}, Current State: ${currentState}`); // Reduced verbosity
    // === NEW LOGGING END ===

    switch (automation.task) {
        case 'woodcutting':
            resourceTypeToFind = 'TREE';
            resourceDisplayName = 'tree';
            break;
        case 'mining':
            resourceTypeToFind = 'ROCK';
            resourceDisplayName = 'rock';
            break;
        case 'fishing':
            resourceTypeToFind = 'FISHING_SPOT';
            resourceDisplayName = 'fishing spot';
            break;
        default:
            // console.error(`updateSkillingTask: Unknown skilling task: "${automation.task}" for character ${character.name}. Derived resourceTypeToFind would be undefined.`); // Reduced verbosity
            stopAutomation(character);
            return;
    }
    // === NEW LOGGING START ===
    // console.log(`updateSkillingTask DERIVED: Char: ${character.name}, resourceTypeToFind: "${resourceTypeToFind}", resourceDisplayName: "${resourceDisplayName}"`); // Reduced verbosity
    // === NEW LOGGING END ===

    switch(currentState) {
        case 'IDLE':
            // === NEW LOGGING START ===
            console.log(`%c[${character.name}] Task: ${automation.task} | State: IDLE -> FINDING_RESOURCE`, "color: yellow");
            // === NEW LOGGING END ===
            automation.state = 'FINDING_RESOURCE';
            break; 
        case 'FINDING_RESOURCE':
             // === NEW LOGGING START ===
             // console.log(`updateSkillingTask FINDING_RESOURCE: Char: ${character.name}, About to call findNearestResource with type: "${resourceTypeToFind}"`); // Reduced verbosity
             // === NEW LOGGING END ===
             setStatus(`Finding ${resourceDisplayName}...`);
             const node = findNearestResource(character, resourceTypeToFind);
             // === NEW LOGGING START ===
             // console.log(`updateSkillingTask FINDING_RESOURCE: Char: ${character.name}, findNearestResource returned: ${node ? `Node ID: ${node.id}, Type: ${node.type}` : 'null'}`); // Reduced verbosity
             // === NEW LOGGING END ===
             if (node) {
                console.log(`%c[${character.name}] Task: ${automation.task} | State: FINDING_RESOURCE -> WALKING_TO_RESOURCE (Target: ${node.id})`, "color: green");
                automation.targetId = node.id;
                automation.state = 'WALKING_TO_RESOURCE';
             } else {
                console.log(`%c[${character.name}] Task: ${automation.task} | State: FINDING_RESOURCE -> WAITING_FOR_RESPAWN (No ${resourceDisplayName}s found)`, "color: orange");
                setStatus(`No ${resourceDisplayName}s available...`);
                automation.state = 'WAITING_FOR_RESPAWN';
             }
            break;
        case 'WALKING_TO_RESOURCE':
            const targetNode = findResourceById(automation.targetId);
            if (!targetNode) {
                console.log(`%c[${character.name}] Task: ${automation.task} | State: WALKING_TO_RESOURCE -> FINDING_RESOURCE (Target node ID: ${automation.targetId} no longer found)`, "color: red");
                automation.state = 'FINDING_RESOURCE';
                break;
            }
            // === NEW LOGGING START ===
            console.log(`%c[${character.name}] Task: ${automation.task} | State: WALKING_TO_RESOURCE (Target: ${targetNode.id} at ${targetNode.x},${targetNode.y})`, "color: blue");
            // === NEW LOGGING END ===
            
            // --- ADD THIS LOG ---
            console.log(`%c[${character.name}] updateSkillingTask: About to call isAdjacent. Character's current zoneX: ${zoneX}, zoneY: ${zoneY}. Target node: ${targetNode.type} id: ${targetNode.id}`, "color: magenta");
            // --- END ADD THIS LOG ---

            // Pass the character's current zone (zoneX, zoneY) as the zone context for the targetNode (resource)
            if (isAdjacent(player, targetNode, zoneX, zoneY)) {
                console.log(`%c[${character.name}] Task: ${automation.task} | State: WALKING_TO_RESOURCE -> GATHERING (Adjacent to ${targetNode.id})`, "color: green");
                automation.state = 'GATHERING';
            } else {
                setStatus(`Walking to ${resourceDisplayName}...`);
                // Pass character's current zone (zoneX, zoneY) as context for the resource targetNode
                const targetPos = getWalkableNeighborsForEntity(targetNode, false, zoneX, zoneY)[0];
                // === NEW LOGGING START ===
                console.log(`%c[${character.name}] Task: ${automation.task} | WALKING_TO_RESOURCE: targetPos (adjacent walkable): ${targetPos ? `(${targetPos.x},${targetPos.y})` : 'null'}`, "color: blue");
                // === NEW LOGGING END ===
                if (!targetPos) {
                    console.log(`%c[${character.name}] Task: ${automation.task} | State: WALKING_TO_RESOURCE -> FINDING_RESOURCE (No walkable adjacent tile for ${targetNode.id})`, "color: red");
                    setStatus(`Can't reach ${resourceDisplayName}!`); automation.state = 'FINDING_RESOURCE'; break;
                }
                character.path = findPath(player, targetPos, zoneX, zoneY) || [];
                // === NEW LOGGING START ===
                console.log(`%c[${character.name}] Task: ${automation.task} | WALKING_TO_RESOURCE: Path found? ${character.path.length > 0 ? 'Yes' : 'No (or empty)'}. Path: ${JSON.stringify(character.path)}`, "color: blue");
                // === NEW LOGGING END ===
            }
            break;
        case 'GATHERING':
            gatherResource(character, gameTime, setStatus);
            // No explicit state change here, gatherResource handles its own timing.
            // If the node disappears (e.g., gathered by another char), gatherResource will push it back to FINDING_RESOURCE.
            break;
        case 'WAITING_FOR_RESPAWN':
            const hasRespawned = worldData[`${zoneX},${zoneY}`]?.resources?.some(r => r.type === resourceTypeToFind);
            if (hasRespawned) {
                console.log(`%c[${character.name}] Task: ${automation.task} | State: WAITING_FOR_RESPAWN -> FINDING_RESOURCE (Resource respawned)`, "color: cyan");
                automation.state = 'FINDING_RESOURCE';
            }
            // else, stay in WAITING_FOR_RESPAWN
            break;
    }
}

function gatherResource(character, gameTime, setStatus) {
    const { automation } = character;
    const node = findResourceById(automation.targetId);
    if (!node) { automation.state = 'FINDING_RESOURCE'; return; }
    const resourceData = RESOURCE_DATA[node.type];
    if (gameTime - (automation.gatheringState.lastHitTime || 0) < resourceData.time) return;
    automation.gatheringState.lastHitTime = gameTime;
    setStatus(`Gathering...`);
    gainSkillXp(resourceData.skill, resourceData.xp);
    if(resourceData.item) {
        gameState.inventory[resourceData.item]++;
        showNotification(`+1 ${resourceData.item.replace(/_/g, ' ')}`);
        if(ui.inventoryModal.classList.contains('hidden') === false) renderInventory();
    }
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

function isEnemyDead(enemyId) {
    for (const zoneKey in deadEnemies) {
        if (deadEnemies[zoneKey].some(dead => dead.id === enemyId)) return true;
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
    const zoneKey = `${zoneX},${zoneY}`;
    const zone = worldData[zoneKey];

    // --- DEBUG LOGGING ---
    console.log(`findNearestResource: Char: ${character.name}, Zone: ${zoneKey}, Looking for type: "${type}"`);
    if (!zone) {
        console.log(`findNearestResource: Zone ${zoneKey} not found in worldData.`);
        return null;
    }
    if (!zone.resources) {
        console.log(`findNearestResource: Zone ${zoneKey} has no resources array.`);
        return null;
    }
    console.log(`findNearestResource: Resources in zone ${zoneKey}:`, JSON.stringify(zone.resources.map(r => ({type: r.type, id: r.id}))));
    // --- END DEBUG LOGGING ---

    const availableNodes = zone.resources.filter(r => {
        // --- DETAILED FILTER LOGGING ---
        const isMatch = r.type === type;
        console.log(`findNearestResource Filter: Comparing r.type="${r.type}" (len ${r.type?.length}) with type="${type}" (len ${type?.length}). Match: ${isMatch}`);
        return isMatch;
        // --- END DETAILED FILTER LOGGING ---
    });
    
    // --- DEBUG LOGGING ---
    console.log(`findNearestResource: Found ${availableNodes.length} nodes of type "${type}".`);
    if (availableNodes.length > 0) {
        console.log(`findNearestResource: Filtered nodes:`, JSON.stringify(availableNodes.map(r => ({type: r.type, id: r.id}))));
    } // This closing brace was part of the original debug block, keeping it aligned.

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
    // --- DEBUG LOGGING ---
    if (nearest) {
        console.log(`findNearestResource: Nearest node found: id=${nearest.id}, type=${nearest.type} at (${nearest.x},${nearest.y})`);
    } else {
        // This case should ideally not be reached if availableNodes.length > 0
        console.log(`findNearestResource: No nearest node found despite availableNodes.length > 0. This is unexpected.`);
    }
    // --- END DEBUG LOGGING ---
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

// --- A* Pathfinding Implementation ---

/**
 * Finds the shortest path between two points on the grid using the A* algorithm.
 * @param {{x: number, y: number}} start - The starting position.
 * @param {{x: number, y: number}} end - The target position.
 * @param {number} zoneX - The current zone's X coordinate.
 * @param {number} zoneY - The current zone's Y coordinate.
 * @returns {Array<{x: number, y: number}>|null} The path as an array of coordinates, or null if no path is found.
 */
function findPath(start, end, zoneX, zoneY) {
    const openSet = [];
    const closedSet = new Set();
    const grid = new Map();

    const startNode = {
        x: start.x,
        y: start.y,
        g: 0,
        h: heuristic(start, end),
        f: heuristic(start, end),
        parent: null,
    };
    const startKey = `${start.x},${start.y}`;
    grid.set(startKey, startNode);
    openSet.push(startNode);

    while (openSet.length > 0) {
        // Find the node with the lowest 'f' score in the open set
        let lowestIndex = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].f < openSet[lowestIndex].f) {
                lowestIndex = i;
            }
        }
        const currentNode = openSet.splice(lowestIndex, 1)[0];
        const currentKey = `${currentNode.x},${currentNode.y}`;

        // If we reached the end, reconstruct the path
        if (currentNode.x === end.x && currentNode.y === end.y) {
            return reconstructPath(currentNode);
        }

        closedSet.add(currentKey);

        const neighbors = getNeighbors(currentNode, zoneX, zoneY);

        for (const neighborPos of neighbors) {
            const neighborKey = `${neighborPos.x},${neighborPos.y}`;

            if (closedSet.has(neighborKey)) {
                continue;
            }

            const gScore = currentNode.g + 1; // Cost is always 1 for cardinal movement

            let neighborNode = grid.get(neighborKey);
            let isNewPath = false;

            if (!neighborNode) {
                neighborNode = {
                    x: neighborPos.x,
                    y: neighborPos.y,
                    g: gScore,
                    h: heuristic(neighborPos, end),
                    f: gScore + heuristic(neighborPos, end),
                    parent: currentNode,
                };
                grid.set(neighborKey, neighborNode);
                openSet.push(neighborNode);
            } else if (gScore < neighborNode.g) {
                // Found a better path to this neighbor
                neighborNode.g = gScore;
                neighborNode.f = gScore + neighborNode.h;
                neighborNode.parent = currentNode;
            }
        }
    }

    // No path found
    return null;
}

/**
 * Calculates the heuristic (estimated distance) between two points.
 * Uses Manhattan distance, which is performant and suitable for grid movement.
 * @param {{x: number, y: number}} a - The first point.
 * @param {{x: number, y: number}} b - The second point.
 * @returns {number} The estimated distance.
 */
function heuristic(a, b) {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return dx + dy;
}


/**
 * Gets the walkable neighbors of a given node.
 * @param {{x: number, y: number}} node - The node to get neighbors for.
 * @param {number} zoneX - The zone X coordinate.
 * @param {number} zoneY - The zone Y coordinate.
 * @returns {Array<{x: number, y: number}>} An array of walkable neighbor coordinates.
 */
function getNeighbors(node, zoneX, zoneY) {
    const neighbors = [];
    const { x, y } = node;
    // Cardinal directions only
    const directions = [
        { x: 0, y: -1 }, // North
        { x: 1, y: 0 },  // East
        { x: 0, y: 1 },  // South
        { x: -1, y: 0 }, // West
    ];

    for (const dir of directions) {
        const newX = x + dir.x;
        const newY = y + dir.y;
        if (isWalkable(newX, newY, zoneX, zoneY, true)) {
            neighbors.push({ x: newX, y: newY });
        }
    }

    return neighbors;
}

/**
 * Reconstructs the path from the end node back to the start.
 * @param {object} endNode - The final node in the path.
 * @returns {Array<{x: number, y: number}>} The complete path.
 */
function reconstructPath(endNode) {
    const path = [];
    let currentNode = endNode;
    while (currentNode !== null) {
        path.push({ x: currentNode.x, y: currentNode.y });
        currentNode = currentNode.parent;
    }
    // The path is from end to start, so we reverse it and remove the starting tile (character's current position)
    return path.reverse().slice(1);
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
    const zone = worldData[`${zoneX},${zoneY}`];
    if (!zone) return false;
    const { width, height } = zone;

    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    if (!currentMapData[y] || currentMapData[y][x] === undefined) return false;
    
    const tileType = currentMapData[y][x];
    // Check base terrain walkability
    if (tileType === TILES.WALL || tileType === TILES.DEEP_WATER || tileType === TILES.DEEP_FOREST) {
        return false;
    }
    
    // Check for non-walkable resource objects
    if (zone.resources) {
        for (const resource of zone.resources) {
            if (resource.x === x && resource.y === y && 
                (resource.type === 'TREE' || resource.type === 'ROCK' || resource.type === 'FISHING_SPOT')) {
                return false;
            }
        }
    }
    // Pedestals and Gateways are on walkable tiles; interaction is separate.

    if (getEnemyAt(x, y, `${zoneX},${zoneY}`)) return false;
    if (!ignoreChars && gameState.characters.some(c => c.zoneX === zoneX && c.zoneY === zoneY && c.player.x === x && c.player.y === y)) return false;
    
    return true;
}

function getWalkableNeighborsForEntity(entity, isCombat, explicitZoneX, explicitZoneY) {
    const entityData = ENEMIES_DATA[entity.type] || RESOURCE_DATA[entity.type];
    if (!entityData) return [];
    
    const size = entityData.size || { w: 1, h: 1 };
    const perimeter = new Set();
    
    // entity.x and entity.y should be directly available for both monsters and resources
    const entityPosX = entity.x;
    const entityPosY = entity.y;

    // Determine the correct zone coordinates
    // Prioritize explicit, then entity's own (for monsters), then error.
    // Resources don't have zoneX/Y on their object, so explicitZoneX/Y is critical for them.
    const currentEntityZoneX = explicitZoneX !== undefined ? explicitZoneX : entity.zoneX;
    const currentEntityZoneY = explicitZoneY !== undefined ? explicitZoneY : entity.zoneY;

    if (currentEntityZoneX === undefined || currentEntityZoneY === undefined) {
        console.error(`getWalkableNeighborsForEntity: Zone coordinates are undefined for entity type ${entity.type}, id ${entity.id}. Explicit: (${explicitZoneX},${explicitZoneY}), Entity Own: (${entity.zoneX},${entity.zoneY})`);
        return []; // Cannot determine neighbors without zone context
    }

    for(let i=0; i<size.w; i++){
        perimeter.add(`${entityPosX+i},${entityPosY - 1}`);
        perimeter.add(`${entityPosX+i},${entityPosY + size.h}`);
    }
    for(let j=0; j<size.h; j++){
        perimeter.add(`${entityPosX - 1},${entityPosY+j}`);
        perimeter.add(`${entityPosX + size.w},${entityPosY+j}`);
    }
    
    return [...perimeter]
        .map(s => ({ x: parseInt(s.split(',')[0]), y: parseInt(s.split(',')[1]), zoneX: currentEntityZoneX, zoneY: currentEntityZoneY }))
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
     character.path = [];
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

function isAdjacent(charPos, entity, entityActualZoneX, entityActualZoneY) {
    if(!entity) return false;
    // Pass the entity's actual zone coordinates (which might be the character's zone if it's a resource)
    const neighbors = getWalkableNeighborsForEntity(entity, true, entityActualZoneX, entityActualZoneY);
    return neighbors.some(n => n.x === charPos.x && n.y === charPos.y);
}

function renderCharacterSwitcher() { 
    ui.characterSwitcher.innerHTML = ''; 
    gameState.characters.forEach((char, index) => { 
        const btn = document.createElement('button');
        let taskEmoji = '';
        if(char.isDead) { taskEmoji = '💀'; } 
        else if (char.automation.active) {
            if (char.automation.task === 'hunting') taskEmoji = '⚔️';
            else if (char.automation.task === 'woodcutting') taskEmoji = '🌲';
            else if (char.automation.task === 'mining') taskEmoji = '⛏️';
            else if (char.automation.task === 'fishing') taskEmoji = '?';
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
    
    const speeds = getEffectiveMoveSpeeds();
    ui.playerSpeedStat.textContent = `${teamStats.speed} (${speeds.visualSpeed.toFixed(1)} t/s)`;

    const damageReduction = (teamStats.defense * 0.25).toFixed(2).replace(/\.00$/, '');
    ui.playerDefenseStat.textContent = `${teamStats.defense} (${damageReduction})`;
    
    const allMarksCount = gameState.characters.reduce((sum, char) => sum + char.automation.markedTiles.length, 0);
    ui.markCount.textContent = `${allMarksCount}/${teamStats.maxMarks * gameState.characters.length}`; 

    ui.playerSouls.textContent = `${gameState.inventory.soulFragment || 0} ${ITEM_SPRITES.soulFragment}`; 
    const { hp } = activeChar; 
    const currentHpDisplay = Number.isInteger(hp.current) ? hp.current : hp.current.toFixed(1);
    ui.playerHpBar.style.width = `${(hp.current / hp.max) * 100}%`;
    ui.playerHpBar.textContent = `${currentHpDisplay}/${hp.max}`;
    
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

    // This loop ensures that all characters, upon loading, are in a valid state and position.
    for (const char of gameState.characters) {
        // Ensure essential properties exist on loaded characters
        if(!char.visual) { char.visual = { x: char.player.x, y: char.player.y }; needsSave = true; }
        if(!char.target) { char.target = { x: char.player.x, y: char.player.y }; needsSave = true; }
        if(!char.path) { char.path = []; needsSave = true; }
        if(char.movementCooldown === undefined) { char.movementCooldown = 0; needsSave = true; }
        
        // Temporarily build the map for the character being checked to ensure isWalkable works correctly.
        currentMapData = buildMapData(char.zoneX, char.zoneY);

        // CRITICAL-LOGIC: This block is a safety check to prevent a player
        // from loading into an unwalkable tile (e.g., if the map changes).
        // It resets them to the default spawn point if they are stuck. Do not remove.
        if (!isWalkable(char.player.x, char.player.y, char.zoneX, char.zoneY, true)) {
                console.warn(`Character ${char.name} at (${char.player.x}, ${char.player.y}) in zone ${char.zoneX},${char.zoneY} is in an invalid tile. Resetting position.`);
                const respawnPos = { x: 31, y: 31 }; // Centered for 63x63 map
            char.player = { ...respawnPos };
            char.visual = { ...respawnPos };
            char.target = { ...respawnPos };
            char.zoneX = 1; 
            char.zoneY = 1;
            char.path = [];
            needsSave = true;
        }

        if (char.isDead) {
            console.warn(`Character ${char.name} was dead on load. Respawning.`);
            char.isDead = false;
            char.hp.current = char.hp.max;
            const respawnPos = { x: 31, y: 31 }; // Centered for 63x63 map
            char.player = { ...respawnPos };
            char.visual = { ...respawnPos };
            char.target = { ...respawnPos };
            char.zoneX = 1;
            char.zoneY = 1;
            char.combat = { active: false, targetId: null, isPlayerTurn: true, lastUpdateTime: 0 };
            needsSave = true;
        }
    };
    
    // Apply speed cheat
    if (gameState.upgrades) {
        gameState.upgrades.plusOneSpeed = 100;
        console.log("CHEAT APPLIED: Speed stat (plusOneSpeed upgrade) set to 100.");
    }

    recalculateTeamStats();

    if (needsSave) {
        await saveGameState();
    }
}

// Start the game initialization process
initFirebase();