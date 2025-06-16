// To AI, do not delete comments please.
// js/gameData.js
// The Island Update - Static Map
// this is a general rule for map making, intended as direction for you(AI), to follow. only edit the map if you are explicitly told. the edges of the map(empty space),-
// need to not ever be visible to the player, the player sees 14 tiles out, this means the map needs 14 tiles of unwalkable space around the edge of it, this can be in th-
// -e form of trees, ocean, scenery in general. try to make the maps feel hand crafted, not massive open spaces, not one tile narrow mazes(unless it's an actual maze zone or something)
//  and make the zone/map fit the theme of the biome or type of area it is. and where you place monsters you also need to make sure that they don't -
// block the path of the player to go past them (unless it's on purpose). those are all my rules for now, if you wanna get creative with it and try something that might be cool, go for it.
// and have landmarks for example, spaces for a town and a outpost in every zone, structures that would house monsters plus open forests that house wild animals.
// --- Core Game Mechanics ---
// js/gameData.js
// The Island Update - Spritesheet Integration

// --- Core Game Mechanics ---
export const TILE_SIZE = 32;
// Note: MAP_WIDTH/HEIGHT are now fallback values.
// The game will prioritize per-zone dimensions.
export const MAP_WIDTH_TILES = 150; 
export const MAP_HEIGHT_TILES = 150;
export const RESPAWN_TIME = 10000; 
export const MAX_CHARACTERS = 4;
export const CHARACTER_COLORS = ['#FFFFFF', '#06b6d4', '#d946ef', '#f59e0b'];

// --- Tile & Item Definitions ---
export const TILES = {
    GRASS: 0,
    WALL: 1,
    GATEWAY: 2,
    PEDESTAL: 3,
    TREE: 4,
    ROCK: 5,
    POND: 6,
    DEEP_FOREST: 7, 
    DEEP_WATER: 8,
    PATH: 9, 
};

export const ITEM_SPRITES = {
    soulFragment: '✧',
    ragingSoul: '✧',
    wood: '�',
    copper_ore: '⛏️',
    fish: '🐟'
};

// --- Spritesheet Mapping ---
// This object maps game elements to their location on the spritesheet.
// Each key corresponds to a tile or entity.
// sx/sy are the source x/y coordinates on the spritesheet image.
// All sprites are assumed to be 32x32 unless sw/sh are specified.
export const SPRITES = {
    PLAYER: { sx: 33, sy: 1 },
    BLUE_SLIME: { sx: 96, sy: 160 },
    YELLOW_SLIME: { sx: 96, sy: 192 },
    RED_SLIME: { sx: 96, sy: 224 },
    BOAR: { sx: 256, sy: 320 },
    WOLF: { sx: 320, sy: 288 },
    GOLEM: { sx: 224, sy: 64 }, // Using WALL sprite, scaled up for Stone Golem appearance
    HUMAN: { sx: 64, sy: 192 }, 

    // Tiles
    // GRASS is now an array for visual variety
    GRASS: [
        { sx: 1, sy: 1, }
    ],
    PATH: { sx: 32, sy: 32 },
    WALL: { sx: 224, sy: 64 },
    DEEP_WATER: { sx: 256, sy: 224 },
    TREE: { sx: 50, sy: 50 }, // Placeholder, actual tree sprite needed. Assumed 32x32 for now.
    ROCK: { sx: 320, sy: 50 },
    POND: { sx: 256, sy: 224 }, // Using water for now
    DEEP_FOREST: { sx: 50, sy: 128 }, // Using bush for now
    GATEWAY: { sx: 1, sy: 1 }, // Placeholder, using GRASS sprite. Actual sprite needed.
    PEDESTAL: { sx: 1, sy: 1 }  // Placeholder, using GRASS sprite. Actual sprite needed.
};
// --- Item Drop Data ---
export const ITEM_DROP_DATA = {
    'green_goo': { name: 'Green Goo', monster: 'BLUE_SLIME', dropChance: 0.10, effect: { type: 'ADD_MAX_HP', value: 4 }, pedestalId: 'gg_pedestal', visual: { color: '#86efac', char: 'G' }, description: "+4 Max HP" },
    'viscous_ichor': { name: 'Viscous Ichor', monster: 'YELLOW_SLIME', dropChance: 0.05, effect: { type: 'ADD_DAMAGE', value: 1 }, pedestalId: 'vi_pedestal', visual: { color: '#fde047', char: 'I' }, description: "+1 Damage" },
    'pulsating_core': { name: 'Pulsating Core', monster: 'RED_SLIME', dropChance: 0.02, effect: { type: 'ADD_SPEED', value: 1 }, pedestalId: 'pc_pedestal', visual: { color: '#f87171', char: 'C' }, description: "+1 Speed" },
    'tattered_cloth': { name: 'Tattered Cloth', monster: 'HUMAN', dropChance: 0.15, effect: { type: 'ADD_HP_REGEN', value: 0.001 }, pedestalId: 'tc_pedestal', visual: { color: '#d1d5db', char: 'T' }, description: "+0.1% HP Regen" },
    'boar_tusk': { name: 'Boar Tusk', monster: 'BOAR', dropChance: 0.05, effect: { type: 'ADD_DAMAGE', value: 2 }, pedestalId: 'bt_pedestal', visual: { color: '#e5e7eb', char: 'B' }, description: "+2 Damage" },
    'wolf_pelt': { name: 'Wolf Pelt', monster: 'WOLF', dropChance: 0.04, effect: { type: 'ADD_SPEED', value: 2 }, pedestalId: 'wp_pedestal', visual: { color: '#9ca3af', char: 'W' }, description: "+2 Speed" },
    'golem_heart': { name: 'Golem Heart', monster: 'GOLEM', dropChance: 0.01, effect: { type: 'ADD_MAX_HP', value: 50 }, pedestalId: 'gh_pedestal', visual: { color: '#a8a29e', char: 'H' }, description: "+50 Max HP" },
    'kings_fragment': { name: "King's Fragment", monster: 'GOLEM_KING', dropChance: 0.10, effect: { type: 'ADD_DEFENSE', value: 5 }, pedestalId: null, visual: { color: '#fca5a5', char: 'F' }, description: "+5 Defense" },
    'perfect_golem_heart': { name: "Perfect Golem Heart", monster: 'GOLEM_KING', dropChance: 0.01, effect: { type: 'ADD_MAX_HP', value: 100 }, pedestalId: null, visual: { color: '#fca5a5', char: '♥' }, description: "+100 Max HP" },
};

// --- Enemy Definitions ---
// AI-NOTE: The 'sprite' property has been added to link each enemy to its definition in the SPRITES object.
export const ENEMIES_DATA = {
    BLUE_SLIME: { name: 'Blue Slime', sprite: SPRITES.BLUE_SLIME, hp: 5, attack: 1, loot: { soulFragment: 1 }, itemDrop: ['green_goo'] },
    YELLOW_SLIME: { name: 'Yellow Slime', sprite: SPRITES.YELLOW_SLIME, hp: 12, attack: 3, loot: { soulFragment: 1 }, itemDrop: ['viscous_ichor'] },
    RED_SLIME: { name: 'Red Slime', sprite: SPRITES.RED_SLIME, hp: 20, attack: 5, loot: { soulFragment: 1 }, itemDrop: ['pulsating_core'] },
    GOLEM: { name: 'Stone Golem', sprite: SPRITES.GOLEM, isBoss: true, hp: 100, attack: 10, loot: { ragingSoul: 1, soulFragment: 25 }, size: { w: 2, h: 2 }, itemDrop: ['golem_heart'] },
    GOLEM_KING: { name: 'Golem King', sprite: SPRITES.GOLEM, isBoss: true, hp: 2000, attack: 25, loot: { ragingSoul: 1, soulFragment: 100 }, size: { w: 3, h: 3 }, itemDrop: ['kings_fragment', 'perfect_golem_heart'] },
    HUMAN: { name: 'Human', sprite: SPRITES.HUMAN, hp: 30, attack: 7, loot: { soulFragment: 2 }, itemDrop: ['tattered_cloth'] },
    BOAR: { name: 'Boar', sprite: SPRITES.BOAR, hp: 40, attack: 9, loot: { soulFragment: 2 }, itemDrop: ['boar_tusk'] },
    WOLF: { name: 'Wolf', sprite: SPRITES.WOLF, hp: 50, attack: 12, loot: { soulFragment: 2 }, itemDrop: ['wolf_pelt'] },
    SKELETON: { name: 'Skeleton', sprite: { sx: 0, sy: 64 }, hp: 25, attack: 6, loot: { soulFragment: 1 } },
    GIANT_SPIDER: { name: 'Giant Spider', sprite: { sx: 32, sy: 64 }, hp: 35, attack: 8, loot: { soulFragment: 1 } }
};

// --- Resource Definitions ---
export const RESOURCE_DATA = {
    TREE: { name: 'Tree', time: 4000, levelReq: 1, xp: 10, item: 'wood', skill: 'woodcutting' },
    ROCK: { name: 'Copper Rock', time: 4000, levelReq: 1, xp: 15, item: 'copper_ore', skill: 'mining' },
    POND: { name: 'Fishing Spot', time: 4000, levelReq: 1, xp: 25, item: 'fish', skill: 'fishing' }
};

// --- World Layout ---
export const worldData = {
    '0,1': {
        name: "The Collector's Library", theme: 'library',
        width: 60, height: 60, // Smaller zone
        gateways: [{ x: 45, y: 30, destZone: { x: 1, y: 1 }, entry: { x: 1, y: 75 } }], // Adjusted gateway
        pedestals: [
            { x: 15, y: 15, id: 'gg_pedestal' }, { x: 17, y: 15, id: 'vi_pedestal' }, { x: 19, y: 15, id: 'pc_pedestal' },
            { x: 15, y: 17, id: 'tc_pedestal' }, { x: 17, y: 17, id: 'bt_pedestal' }, { x: 19, y: 17, id: 'wp_pedestal' },
            { x: 17, y: 19, id: 'gh_pedestal' }, // Adjusted pedestals
        ],
        mapLayout: Array(60).fill("W".repeat(60)) // Base map, will be carved
    },
    '1,0': {
        name: "The Quiet Grove", theme: 'dark_forest',
        width: 60, height: 60,
        gateways: [{ x: 30, y: 45, destZone: { x: 1, y: 1 }, entry: { x: 75, y: 1 } }], // Adjusted gateway
        spawns: [ 
            { x: 30, y: 30, type: 'GOLEM_KING' }, 
        ],
        mapLayout: Array(60).fill("F".repeat(60)) // Base map, will be carved
    },
    '1,1': {
        name: "Verdant Starting Island", theme: 'forest',
        width: 60, height: 60, // Resized to 60x60
        gateways: [
            // Gateways adjusted for 60x60 map with 32x32 playable area (14-tile border)
            { x: 30, y: 14, destZone: { x: 1, y: 0 }, entry: { x: 30, y: 45 } }, // To Quiet Grove (top edge of playable)
            { x: 14, y: 30, destZone: { x: 0, y: 1 }, entry: { x: 45, y: 30 } }, // To Collector's Library (left edge of playable)
        ],
        resources: [
            // Resources relocated to the new 32x32 playable area (world coords 14-45)
            { x: 20, y: 20, type: 'TREE', id: 'tree_1' }, { x: 40, y: 40, type: 'TREE', id: 'tree_2' },
            { x: 20, y: 40, type: 'ROCK', id: 'rock_1' }, { x: 40, y: 20, type: 'ROCK', id: 'rock_2' },
            { x: 30, y: 25, type: 'POND', id: 'pond_1' }, { x: 31, y: 25, type: 'POND', id: 'pond_2' },
        ],
        spawns: [
            // Spawns relocated to the new 32x32 playable area
            { x: 25, y: 25, type: 'BLUE_SLIME' }, { x: 26, y: 26, type: 'BLUE_SLIME' }, // Near center
            { x: 35, y: 35, type: 'YELLOW_SLIME' }, // SE quadrant
            { x: 25, y: 35, type: 'RED_SLIME' },    // SW quadrant
            { x: 35, y: 25, type: 'GOLEM' },        // NE quadrant (miniboss)
            { x: 20, y: 30, type: 'HUMAN' }, { x: 21, y: 31, type: 'BOAR' }, { x: 22, y: 30, type: 'WOLF' }, // West side
            { x: 30, y: 20, type: 'SKELETON' }, { x: 31, y: 21, type: 'SKELETON' }, // North side
            { x: 30, y: 40, type: 'GIANT_SPIDER' }, { x: 31, y: 39, type: 'GIANT_SPIDER' }, // South side
        ],
        // D = Deep Water, ' ' = Grass, . = Path, F = Forest
        mapLayout: Array(60).fill("D".repeat(60)) // Start with a 60x60 water map
    },
};

// --- Altar Upgrades ---
export const ALTAR_UPGRADES = {
    plusOneDamage: { name: "+1 Damage", maxLevel: 10, cost: (level) => ({ soulFragment: Math.floor(2 * Math.pow(3, level)) }) },
    plusTwoMaxHp: { name: "+2 Max HP", maxLevel: 10, cost: (level) => ({ soulFragment: Math.floor(2 * Math.pow(3, level)) }) },
    plusOneSpeed: { name: "+1 Speed", maxLevel: 10, cost: (level) => ({ soulFragment: Math.floor(5 * Math.pow(3, level)) }) },
    plusOneDefense: { name: "+1 Defense", maxLevel: 10, cost: (level) => ({ soulFragment: Math.floor(5 * Math.pow(3, level)) }) },
    plusOneMaxMarks: { name: "+1 Max Marks", maxLevel: 4, cost: (level) => ({ soulFragment: Math.floor(30 * Math.pow(3, level)) }) },
    addCharacter: { name: "Add Character", maxLevel: 3, cost: (level) => ({ ragingSoul: 1 }) },
    learningBoost: { name: "Learning Boost", maxLevel: 5, cost: (level) => ({ soulFragment: Math.floor(50 * Math.pow(2.5, level)) }) } // +2% XP per level
};


// --- Helper function to carve out map layouts ---
function applyMapCarving(mapLayout, carving, startX, startY) {
    for (let y = 0; y < carving.length; y++) {
        for (let x = 0; x < carving[y].length; x++) {
            const layoutY = startY + y;
            const layoutX = startX + x;
            if (mapLayout[layoutY] && mapLayout[layoutY][layoutX] !== undefined) {
                let row = mapLayout[layoutY].split('');
                row[layoutX] = carving[y][x];
                mapLayout[layoutY] = row.join('');
            }
        }
    }
}

// --- Hand-crafted map carving for the Verdant Starting Island ('1,1') - Playable Area ---
const playableIslandCarving = [ // 32x32 playable area
    "                                ", // y=0 of playable (world y=14)
    "          ..........            ", // Path leading inwards
    "        ..          ..          ",
    "      ..    ####      ..        ",
    "     .      ####        .       ",
    "    .        ##          .      ", // y=5
    "   .                      .     ",
    "  .     Pond Area          .    ", // Placeholder for pond
    " .                          .   ",
    ".                            .  ",
    ".       Main Clearing        .  ", // y=10
    ".                            .  ",
    ".     (Player Spawn Here)    .  ", // Player spawns around (30,30) world -> (16,16) of this
    ".                            .  ",
    ".                            .  ",
    " .                          .   ", // y=15 (world y=29)
    "  .                        .    ", // Gateway to Grove (1,0) at world (30,14) -> (16,0) of this
    "   .                      .     ", // Gateway to Library (0,1) at world (14,30) -> (0,16) of this
    "    .                    .      ",
    "     .                  .       ",
    "      ..   Rocky Area ..        ", // y=20
    "        ..          ..          ",
    "          ..........            ",
    "                                ",
    "                                ",
    "                                ", // y=25
    "                                ",
    "                                ",
    "                                ",
    "                                ",
    "                                ", // y=30
    "                                "  // y=31 of playable (world y=45)
];


// Replace placeholders in carving with actual grass/path characters
for (let i = 0; i < playableIslandCarving.length; i++) {
    playableIslandCarving[i] = playableIslandCarving[i].replace(/#/g, ' '); // '#' becomes grass
    playableIslandCarving[i] = playableIslandCarving[i].replace(/Pond Area|Main Clearing|\(Player Spawn Here\)|Rocky Area/g, (match) => ' '.repeat(match.length)); // Text becomes grass
}

// Apply the new carving for Verdant Starting Island's playable area
applyMapCarving(worldData['1,1'].mapLayout, playableIslandCarving, 14, 14);

// --- Hand-crafted map carving for The Collector's Library ('0,1') ---
const libraryPlayableCarving = [ // 32x32 playable area
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW", // Row 0 of playable (world y=14)
    "W   W   W   W                W", // Pedestals will be on these ' '
    "W W W W W W                  W",
    "W   W   W   W                W", // Pedestals
    "W W W W W W                  W",
    "W   W   W                    W", // Pedestal
    "W WWWWWWWWWWWWWWWWWWWWWWWWWW W",
    "W W                        W W",
    "W W    Study Alcoves       W W",
    "W W                        W W",
    "W WWWWWWWWWWWWWWWWWWWWWWWWWW W", // Row 10
    "W                            W",
    "W  WWWWWWWWWWWWWWWWWWWWWWWW  W",
    "W  W                      W  W",
    "W  W   Main Reading Hall  W  W",
    "W  W                      W  W",
    "W  WWWWWW.WWWWWWWWWWWWWWWW.W", // Row 16 (world y=30). Gateway is the 'W' at col 31. Path '.' at col 30.
    "W      .                   W", // Path from central door
    "W  WWWWWWWWWWWWWWWWWWWWWWWW  W",
    "W  W                      W  W",
    "W  W      Archives        W  W", // Row 20
    "W  W                      W  W",
    "W  WWWWWWWWWWWWWWWWWWWWWWWW  W",
    "W                            W",
    "W                            W",
    "W                            W", // Row 25
    "W                            W",
    "W                            W",
    "W                            W",
    "W                            W",
    "W                            W", // Row 30
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"  // Row 31 of playable (world y=45)
];
applyMapCarving(worldData['0,1'].mapLayout, libraryPlayableCarving, 14, 14);

// --- Hand-crafted map carving for The Quiet Grove ('1,0') ---
const grovePlayableCarving = [ // 32x32 playable area
    "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", // Row 0 of playable (world y=14)
    "F...FFFFFFFFFFFFFFFFFFFFFFF...F",
    "F.   .FFFFFFFFFFFFFFFFFFF.   .F",
    "F. FFF.FFFFFFFFFFFFFFF.FFF .F",
    "F. FFF  ....FFFFF....  FFF .F",
    "F. FFF  .           .  FFF .F", // Row 5
    "F. FFF  .           .  FFF .F", // Golem King clearing area
    "F. FFF  .           .  FFF .F", // Golem King at (30,30) world -> (16,16) of this carving
    "F. FFF  .           .  FFF .F", // Centered in this 5x5 clearing
    "F. FFF  ....FFFFF....  FFF .F",
    "F. FFF.FFFFFFFFFFFFFFF.FFF .F", // Row 10
    "F.   .FFFFFFFFFFFFFFFFFFF.   .F",
    "F...FFFFFFFFFFFFFFFFFFFFFFF...F", // Row 12
    "FFFFFFFFFF.....FFFFFFFFFFFFFFFFF", // Row 13 - Clearing for Golem King
    "FFFFFFFFFF     FFFFFFFFFFFFFFFFF", // Row 14 - Clearing for Golem King
    "FFFFFFFFFF     FFFFFFFFFFFFFFFFF", // Row 15 - Clearing for Golem King
    "FFFFFFFFFF     FFFFFFFFFFFFFFFFF", // Row 16 - Golem King spawn (30,30) is here
    "FFFFFFFFFF     FFFFFFFFFFFFFFFFF", // Row 17 - Clearing for Golem King
    "FFFFFFFFFF.....FFFFFFFFFFFFFFFFF", // Row 18 - Clearing for Golem King
    "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", // Row 19
    "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", // Row 20
    "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", // Row 28
    "FFFFFFFFFFFFF...FFFFFFFFFFFFFFFF", // Row 29 - Path to gateway
    "FFFFFFFFFFFFF.F.FFFFFFFFFFFFFFFF", // Row 30 - Path to gateway. Gateway at (30,45) world -> (16,31) of this carving
    "FFFFFFFFFFFFF.FFFFFFFFFFFFFFFFFF"  // Row 31 of playable (world y=45). Gateway tile is 'F' at col 16. Path '.' at [30][16].
];
applyMapCarving(worldData['1,0'].mapLayout, grovePlayableCarving, 14, 14);

// --- Map Character to Tile Type Helper ---
function charToTileType(char) {
    switch (char) {
        case ' ': return TILES.GRASS;
        case '.': return TILES.PATH;
        case 'F': return TILES.DEEP_FOREST;
        case 'D': return TILES.DEEP_WATER;
        case 'W': return TILES.WALL;
        // Add more mappings as needed
        default: return TILES.GRASS;
    }
}

// --- Tile Drawing Helper ---
// Place this in your rendering/UI code, not in gamedata.js if you have a separate file for rendering.
function drawTile(x, y, zoneX, zoneY) {
    const { x: drawX, y: drawY } = worldToScreen(x, y);
    const ctx = ui.ctx;

    // Map layout is stored as strings of characters, so get the character first
    const mapRow = currentMapData[y];
    if (!mapRow) return;
    const mapChar = mapRow[x];
    if (mapChar === undefined) return;

    // Convert character to tile type
    const tileType = charToTileType(mapChar);

    let sprite;
    switch(tileType) {
        case TILES.GRASS:
            // Use a pseudo-random but consistent index based on tile coordinates
            // This makes the grass varied without flickering every frame
            const grassVariationCount = SPRITES.GRASS.length;
            const tileHash = (x * 19 + y * 71); // Simple hash for variety
            sprite = SPRITES.GRASS[tileHash % grassVariationCount];
            break;
        case TILES.PATH: sprite = SPRITES.PATH; break;
        case TILES.WALL: sprite = SPRITES.WALL; break;
        case TILES.DEEP_WATER: sprite = SPRITES.DEEP_WATER; break;
        case TILES.POND: sprite = SPRITES.POND; break;
        case TILES.ROCK: sprite = SPRITES.ROCK; break;
        case TILES.TREE: sprite = SPRITES.TREE; break;
        case TILES.DEEP_FOREST: sprite = SPRITES.DEEP_FOREST; break;
        case TILES.GATEWAY: sprite = SPRITES.GATEWAY; break;
        case TILES.PEDESTAL: sprite = SPRITES.PEDESTAL; break;
        default: sprite = SPRITES.GRASS[0]; // Default to the first grass sprite
    }
    
    // For larger tiles like trees, we need to adjust the drawing position
    const drawWidth = sprite.sw || TILE_SIZE;
    const drawHeight = sprite.sh || TILE_SIZE;
    const xOffset = (drawWidth - TILE_SIZE) / 2;
    const yOffset = (drawHeight - TILE_SIZE); // Anchor to bottom

    drawSprite(sprite, drawX - xOffset, drawY - yOffset, drawWidth, drawHeight);
}