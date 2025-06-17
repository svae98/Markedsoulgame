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

    // Part 1: Handle starting a path if idle and a pending path exists.
    // This ensures an idle character with a pending path starts moving in the same tick cooldown allows.
    if (character.movementCooldown <= 0 && (!character.path || character.path.length === 0) && character.pendingPath && character.pendingPath.length > 0) {
        console.log(`[${character.name}] Idle, starting pending path. Length: ${character.pendingPath.length}`);
        character.path = character.pendingPath;
        character.pendingPath = null;
        // Visual target for the first step of this new path.
        // The actual move will happen in the block below if path.length > 0.
        if (character.path.length > 0) {
            character.target.x = character.path[0].x;
            character.target.y = character.path[0].y;
        } else { // Pending path was empty
            character.target.x = character.player.x;
            character.target.y = character.player.y;
            checkForGateway(character); // Check if landed on gateway
        }
    }

    // Part 2: Handle taking a step if ready and a path exists.
    if (character.movementCooldown <= 0 && character.path && character.path.length > 0) {
        const nextStep = character.path.shift();
        character.player.x = nextStep.x;
        character.player.y = nextStep.y;
        character.target.x = nextStep.x; // Visual target is this current step's destination
        character.target.y = nextStep.y;

        const speeds = getEffectiveMoveSpeeds();
        character.movementCooldown = speeds.stepInterval; // Set cooldown for THIS step

        // Part 3: AFTER taking the step, check if a pending path needs to be activated.
        if (character.pendingPath && character.pendingPath.length > 0) {
            console.log(`[${character.name}] Step completed to (${character.player.x},${character.player.y}). Switching to pending path. Length: ${character.pendingPath.length}`);
            character.path = character.pendingPath;
            character.pendingPath = null;

            if (character.path.length > 0) {
                // The character has just arrived at nextStep (now character.player).
                // The new visual target is the first step of the newly activated path.
                character.target.x = character.path[0].x;
                character.target.y = character.path[0].y;

                // CRITICAL FIX for the pause:
                // Reset movementCooldown to allow the new path's first step to be processed
                // in the next logic tick (or very soon), rather than waiting for the full
                // cooldown of the step just taken.
                character.movementCooldown = 0; 
            } else {
                // New (pending) path was empty. Target remains current player position.
                // (character.target was already set to character.player by the step logic above)
                checkForGateway(character); // Check if landed on gateway
            }
        } else if (character.path.length === 0) { // Current path just became empty (and no pending path took over)
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
        handleMonsterClick(enemy); // Show tooltip regardless of click type
        if (e.shiftKey) {
            // AI-NOTE: Shift-Left-clicking an enemy uses the marking system.
            handleMarking(enemy);
        } else {
            initiateMoveToEntity(activeChar, enemy); // Normal left-click moves to attack
        }
        return; // Click handled
    } else if (resource) {
        handleResourceClick(resource); // Show tooltip
        // AI-NOTE: Queued Path Interruption: initiateMoveToEntity will handle setting pendingPath if already moving.
        if (e.shiftKey) {
            // AI-NOTE: Shift-Left-clicking a resource now uses the marking system.
            handleMarking(resource);
        } else {
            initiateMoveToEntity(activeChar, resource); // Normal left-click moves to gather
        }
        return; // Click handled
    } else if (tileType === TILES.PEDESTAL) {
        handlePedestalClick(x, y, activeChar.zoneX, activeChar.zoneY);
        return; // Click handled
    }
    
    // If we reach here, it means an empty/non-interactive tile was clicked.
    // Handle stopping automation if active.
    if (activeChar.automation.active) {
        // Stop any type of automation if clicking on empty ground
        if (!enemy && !resource) {
            stopAutomation(activeChar);
            // After stopping, allow movement to the clicked empty tile.
            // The handleMovementClick below will now correctly queue if the stopAutomation itself
            // didn't immediately clear the path (e.g., if it was mid-step).
        }
        // If hunting, it's already handled by the block at the top of the function.
    }
    // AI-NOTE: Queued Path Interruption: handleMovementClick will handle setting pendingPath if already moving.
    handleMovementClick(x, y, activeChar);
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
    // AI-NOTE: Path is cleared/set to pendingPath only if a new valid path is found, to support queued movement and prevent interruption on invalid clicks.

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
            // AI-NOTE: Path Interruption Logic - Queued Movement
            // If already moving along a path, set this as the pending path. Otherwise, start immediately.
            if (activeChar.path && activeChar.path.length > 0) {
                activeChar.pendingPath = path;
                console.log(`[${activeChar.name}] Queued new path to (${destination.x},${destination.y}). Length: ${path.length}`);
            } else {
                activeChar.path = path; // Start this new path immediately
                console.log(`[${activeChar.name}] Starting new path to (${destination.x},${destination.y}). Length: ${path.length}`);
            }
        }
    } else {
        // AI-NOTE: No valid destination for click, current path is NOT interrupted, pendingPath is not set.
    }
}

/**
 * Adds a mark to the character's automation list.
 * Manages task switching if the new mark is of a different type.
 * @param {object} activeChar - The character to add the mark to.
 * @param {object} entity - The monster or resource object to mark.
 * @param {object} approachSpot - The {x, y} coordinates to approach the entity.
 * @param {string} taskForMark - The task associated with this mark (e.g., 'hunting', 'woodcutting').
 */
function addMark(activeChar, entity, approachSpot, taskForMark) {
    const stats = getTeamStats();

    // If the new mark's task is different from the current active task, clear old marks and switch task.
    if (activeChar.automation.task !== taskForMark) {
        if (activeChar.automation.active) { // If actively doing something else
            stopAutomation(activeChar); // Stop current task first
        }
        activeChar.automation.markedTiles = []; // Clear all previous marks
        activeChar.automation.task = taskForMark;
        console.log(`[${activeChar.name}] Switched task to ${taskForMark}. Cleared previous marks.`);
    }

    if (activeChar.automation.markedTiles.length >= stats.maxMarks) {
        const removedMark = activeChar.automation.markedTiles.shift();
        // If the removed mark was the one being actively pursued for combat, end combat.
        if(activeChar.combat.active && activeChar.combat.targetId === removedMark.entityId && removedMark.task === 'hunting') {
             forceEndCombat(activeChar);
        }
        console.log(`[${activeChar.name}] Mark limit reached. Removed oldest mark for entity ${removedMark.entityId}.`);
    }

    const entityZoneX = entity.zoneX !== undefined ? entity.zoneX : activeChar.zoneX; // Resources don't have zoneX/Y on their object
    const entityZoneY = entity.zoneY !== undefined ? entity.zoneY : activeChar.zoneY;

    activeChar.automation.markedTiles.push({ 
        ...approachSpot, 
        entityId: entity.id, 
        task: taskForMark, // Store the task type with the mark
        zoneX: entityZoneX, 
        zoneY: entityZoneY 
    });

    startAutomation(activeChar, taskForMark); // This will set active=true and state=IDLE
    const entityName = ENEMIES_DATA[entity.type]?.name || RESOURCE_DATA[entity.type]?.name || "Unknown Entity";
    showNotification(`Marked ${entityName} for ${activeChar.name}. (${taskForMark})`);
}

/**
 * Handles marking an entity (monster or resource).
 * Toggles the mark, manages task switching, and updates UI.
 * @param {object} entity - The monster or resource object that was shift-clicked.
 */
function handleMarking(entity) {
    const activeChar = getActiveCharacter();
    if (!entity || !activeChar) return;
    activeChar.path = []; // Stop current movement

    let taskForMark;
    let entityName = "Unknown Entity";
    if (ENEMIES_DATA[entity.type]) {
        taskForMark = 'hunting';
        entityName = ENEMIES_DATA[entity.type].name;
    } else if (RESOURCE_DATA[entity.type]) {
        taskForMark = RESOURCE_DATA[entity.type].skill; // e.g., 'woodcutting', 'mining'
        entityName = RESOURCE_DATA[entity.type].name;
    } else {
        showNotification("Cannot mark this type of entity.");
        return;
    }

    const existingMarkForChar = activeChar.automation.markedTiles.find(m => m.entityId === entity.id && m.task === taskForMark);

    if (existingMarkForChar) {
         // Unmark: Remove the specific mark
         const markIndex = activeChar.automation.markedTiles.findIndex(m => m.entityId === entity.id && m.task === taskForMark);
         if(markIndex !== -1) activeChar.automation.markedTiles.splice(markIndex, 1);
         if (taskForMark === 'hunting' && activeChar.combat.active && activeChar.combat.targetId === entity.id) forceEndCombat(activeChar);
         if (activeChar.automation.markedTiles.length === 0 || activeChar.automation.markedTiles.every(m => m.task !== taskForMark)) {
            // If all marks are gone, or all remaining marks are for a different task type
            stopAutomation(activeChar); // This will also clear the task if no marks of that type remain.
         }
         showNotification(`Unmarked ${entityName} for ${activeChar.name}.`);
    } else {
        // Mark: Add new mark
        // For resources, pass activeChar's zone as they don't have their own zoneX/Y
        const entityZoneX = entity.zoneX !== undefined ? entity.zoneX : activeChar.zoneX;
        const entityZoneY = entity.zoneY !== undefined ? entity.zoneY : activeChar.zoneY;
        const closestSpot = findWalkableNeighborForEntity(entity, activeChar.player, [], entityZoneX, entityZoneY);

        if(closestSpot) {
            addMark(activeChar, entity, closestSpot, taskForMark);
        } else {
            showNotification(`No valid approach for ${entityName}.`);
        }
    }
    saveGameState();
    updateAllUI();
}

function handleMapMarking(enemy, activeChar) {
    // Map marking is typically for bosses/enemies. Resources are usually marked in-world.
    const availableSpots = getWalkableNeighborsForEntity(enemy, true, enemy.zoneX, enemy.zoneY);
    if (availableSpots.length > 0) {
        const closestSpot = findWalkableNeighborForEntity(enemy, activeChar.player, [], enemy.zoneX, enemy.zoneY);
        if (closestSpot) {
            addMark(activeChar, enemy, closestSpot, 'hunting'); // Explicitly 'hunting' for map marks
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
    const anyCharHasHuntingTask = gameState.characters.some(c => c.automation.task === 'hunting');

    if (activeChar.automation.active) { // Generic stop button if any task is active
        addContextMenuButton(`Stop: ${activeChar.automation.task}`, () => stopAutomation(activeChar));
    }
    if (activeChar.automation.markedTiles.length > 0) { // Clear this character's marks, regardless of type
        addContextMenuButton('Clear My Marks', () => {
            stopAutomation(activeChar); 
            activeChar.automation.markedTiles = [];
            saveGameState();
        });
    }
    const anyCharHasAnyMarks = gameState.characters.some(c => c.automation.markedTiles.length > 0);
    if (anyCharHasAnyMarks) {
        addContextMenuButton('Clear All Marks', () => {
            gameState.characters.forEach(char => {
                stopAutomation(char); 
                char.automation.markedTiles = [];
            });
            saveGameState();
        });
    }
    // Specific "Stop All X" buttons can be added if desired, e.g.:
    // if (anyCharHasHuntingTask) {
    //     addContextMenuButton('Stop All Hunting', () => {
    //         gameState.characters.forEach(char => {
    //             if (char.automation.task === 'hunting') {
    //                 stopAutomation(char); // stopAutomation also clears marks if task becomes null
    //             }
    //         });
    //     });
    // }
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
        const xpPercent = (neededXp > 0 && xp > 0) ? (xp / neededXp) * 100 : (xp >= neededXp ? 100 : 0); // Adjusted for xp=0 case
        const container = document.createElement('div');
        container.className = `w-full p-2 border rounded-lg modal-item`; // Removed 'clickable' and 'assigned' classes
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
        // AI-NOTE: Removed event listener for assignSkillTask from skill UI elements
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

/**
 * Main automation logic controller.
 * Determines which specific update function to call based on the character's current task.
 */
function updateAutomation(character, gameTime) { 
    if (!character.automation.active || character.combat.active || character.isDead || character.path.length > 0) return;
    const setStatus = (msg) => { if (character.id === getActiveCharacter().id) ui.actionStatus.textContent = msg; }; 
    
    // Unified automation logic based on marks
    updateMarkedEntityAutomation(character, gameTime, setStatus);
}

/**
 * Unified state machine for handling marked entities (monsters or resources).
 * Manages pathfinding, interaction (combat/gathering), and mark cycling.
 */
function updateMarkedEntityAutomation(character, gameTime, setStatus) {
    const { automation, player, zoneX, zoneY } = character;

    if (automation.markedTiles.length === 0) {
        stopAutomation(character); // This will clear task if no marks left for it
        setStatus("No targets marked.");
        return;
    }

    const currentMark = automation.markedTiles[0]; // Always process the first mark
    let targetEntity;
    let entityData;
    let entityDisplayName;

    // Resolve the target entity based on the mark's task
    if (currentMark.task === 'hunting') {
        targetEntity = findEnemyById(currentMark.entityId);
        if (targetEntity) {
            entityData = ENEMIES_DATA[targetEntity.type];
            entityDisplayName = entityData.name;
        }
    } else { // Skilling tasks ('woodcutting', 'mining', 'fishing')
        targetEntity = findResourceById(currentMark.entityId);
        if (targetEntity) {
            entityData = RESOURCE_DATA[targetEntity.type];
            entityDisplayName = entityData.name;
        }
    }

    // Handle if the target entity doesn't exist (e.g., dead monster, depleted resource)
    if (!targetEntity) {
        if (currentMark.task === 'hunting' && isEnemyDead(currentMark.entityId)) {
            setStatus(`Waiting for ${currentMark.entityId.split('_')[0]} to respawn...`);
            // AI-NOTE: For hunting, we keep the mark and wait for respawn if it's the only/current one.
        } else {
            setStatus(`Target ${currentMark.entityId} (task: ${currentMark.task}) not found. Removing mark.`);
            automation.markedTiles.shift(); // Remove invalid/completed mark
            if (automation.markedTiles.length === 0) stopAutomation(character);
            else if (automation.markedTiles.every(m => m.task !== currentMark.task)) stopAutomation(character, false); // Stop old task, new one will pick up
            else automation.state = 'IDLE';
        }
        return;
    }

    // Handle zone transitions if necessary
    if (character.zoneX !== currentMark.zoneX || character.zoneY !== currentMark.zoneY) {
        setStatus(`Traveling to ${entityDisplayName}'s zone...`);
        character.path = findPathToZone(character, currentMark.zoneX, currentMark.zoneY) || [];
        return; // Movement will be handled by game loop
    }

    // Character is in the correct zone. Now check adjacency to the approach spot.
    // currentMark.x, currentMark.y is the approach spot.
    if (player.x === currentMark.x && player.y === currentMark.y) {
        // Character is at the approach spot, time to interact
        setStatus(`Interacting with ${entityDisplayName}...`);
        if (currentMark.task === 'hunting') {
            if (!character.combat.active) {
                character.combat.active = true;
                character.combat.targetId = targetEntity.id;
                character.combat.isPlayerTurn = true;
                character.combat.lastUpdateTime = gameTime;
            }
        } else { // Skilling task
            // AI-NOTE: Resource Gathering Logic
            const resourceDef = RESOURCE_DATA[targetEntity.type];
            if (resourceDef) { // Ensure resourceDef is found
                if (gameTime - (automation.gatheringState.lastHitTime || 0) >= resourceDef.time) {
                    automation.gatheringState.lastHitTime = gameTime;
                    gainSkillXp(resourceDef.skill, resourceDef.xp);
                    if (resourceDef.item) {
                        gameState.inventory[resourceDef.item] = (gameState.inventory[resourceDef.item] || 0) + 1;
                        showNotification(`+1 ${resourceDef.item.replace(/_/g, ' ')}`);
                        if (!ui.inventoryModal.classList.contains('hidden')) renderInventory();
                    }
                    saveGameState();
                    showNotification(`${character.name} gathered from ${entityDisplayName}.`);
                    automation.markedTiles.shift(); // Resource mark is consumed upon successful gather
                    if (automation.markedTiles.length === 0) stopAutomation(character);
                    else automation.state = 'IDLE'; // Process next mark
                } else {
                    setStatus(`Gathering ${entityDisplayName}...`);
                }
            } else {
                setStatus(`Error: Could not find data for resource ${targetEntity.type}. Removing mark.`);
                automation.markedTiles.shift();
                if (automation.markedTiles.length === 0) stopAutomation(character); else automation.state = 'IDLE';
            }
        }
    } else {
        // Not at the approach spot, need to move
        setStatus(`Walking to ${entityDisplayName}...`);
        character.path = findPath(player, { x: currentMark.x, y: currentMark.y }, zoneX, zoneY) || [];
        if (!character.path || character.path.length === 0) { // Pathfinding failed
            setStatus(`Cannot find path to ${entityDisplayName}. Removing mark.`);
            automation.markedTiles.shift();
            if (automation.markedTiles.length === 0) stopAutomation(character);
            else automation.state = 'IDLE';
        }
    }
}

/* AI-REMOVED: updateHuntingTask - Replaced by updateMarkedEntityAutomation
function updateHuntingTask(character, setStatus) { // ... original function ... }
*/

/* AI-REMOVED: updateSkillingTask - Replaced by updateMarkedEntityAutomation
function updateSkillingTask(character, gameTime, setStatus) { // ... original function ... }
*/

/* AI-REMOVED: gatherResource - Logic integrated into updateMarkedEntityAutomation
function gatherResource(character, gameTime, setStatus) { // ... original function ... }
*/

function assignSkillTask(skillKey) { // This function's role changes slightly
    const activeChar = getActiveCharacter();
    if (!activeChar || activeChar.isDead) return;
    if (activeChar.automation.task === skillKey && activeChar.automation.active) {
        stopAutomation(activeChar);
    } else {
        startAutomation(activeChar, skillKey);
    }
    // New behavior: If a skill task is assigned this way, try to find and mark the nearest resource of that type.
    if (activeChar.automation.task === skillKey && activeChar.automation.active) {
        const resourceType = Object.keys(RESOURCE_DATA).find(rt => RESOURCE_DATA[rt].skill === skillKey);
        if (resourceType) {
            const nearestNode = findNearestResource(activeChar, resourceType);
            if (nearestNode) {
                const approachSpot = findWalkableNeighborForEntity(nearestNode, activeChar.player, [], activeChar.zoneX, activeChar.zoneY);
                if (approachSpot) {
                    addMark(activeChar, nearestNode, approachSpot, skillKey);
                } else { showNotification(`No approach spot for nearest ${resourceType}.`); }
            } else { showNotification(`No ${resourceType}s found to mark.`); }
        }
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
    // Determine zone for the entity (critical for resources)
    const entityZoneX = entity.zoneX !== undefined ? entity.zoneX : getActiveCharacter().zoneX; // Fallback to active char's zone if entity doesn't have one
    const entityZoneY = entity.zoneY !== undefined ? entity.zoneY : getActiveCharacter().zoneY;

    const walkableNeighbors = getWalkableNeighborsForEntity(entity, true, entityZoneX, entityZoneY);
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
    
    // If the new task is different, existing marks are cleared by addMark or if no marks for new task exist.
    // If task is the same, we just ensure automation is active.
    if (character.automation.task !== task) {
        // This implies a task switch. Marks will be handled by addMark or if no marks exist for this task.
        // If we are starting a task like 'woodcutting' without a specific mark yet,
        // we might not want to clear 'hunting' marks immediately unless a woodcutting mark is added.
        // The `addMark` function now handles clearing marks if the task type of the *new mark* differs.
        // If `startAutomation` is called directly (e.g. from `assignSkillTask` before a mark is made),
        // we might need to ensure old marks of a *different* type are cleared.
        // For now, let `handleMarking` and `addMark` drive the clearing of differently-typed marks.
    }

    character.automation.task = task;
    character.automation.active = true; // Always activate
    character.automation.state = 'IDLE'; // Reset state machine for the task

    // If starting a task but no marks of that type exist, show a message.
    if (character.automation.markedTiles.filter(m => m.task === task).length === 0) {
        if (character.id === getActiveCharacter().id) showNotification(`Mark a ${task === 'hunting' ? 'monster' : 'resource'} to start ${task}.`);
        // We might even stop automation if no initial marks for this task type.
        // For now, let it be active, waiting for a mark.
        return;
    }

    saveGameState();
    if (ui.levelsModal.classList.contains('hidden') === false) renderLevels();
    updateAllUI();
}

function stopAutomation(character, clearAllMarksOfChar = true) {
     if(!character.automation.active) return; 
     if (character.combat.active) forceEndCombat(character);
    const oldTask = character.automation.task;
    character.automation.active = false;
    character.automation.task = null; 
    character.automation.targetId = null; 
    character.automation.state = 'IDLE'; 
    character.path = [];
    if (clearAllMarksOfChar) {
        character.automation.markedTiles = [];
    }
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
            else if (char.automation.task === 'woodcutting') taskEmoji = '🌳'; // Changed emoji for woodcutting
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