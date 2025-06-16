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
    PLAYER: { sx: 64, sy: 192 },
    BLUE_SLIME: { sx: 96, sy: 160 },
    YELLOW_SLIME: { sx: 96, sy: 192 },
    RED_SLIME: { sx: 96, sy: 224 },
    BOAR: { sx: 256, sy: 320 },
    WOLF: { sx: 320, sy: 288 },
    // AI-NOTE: A dedicated Golem sprite is not on the sheet. Using a placeholder.
    GOLEM: { sx: 64, sy: 192, sw: 64, sh: 64 }, // Using player sprite, scaled up
    HUMAN: { sx: 64, sy: 192 }, 

    // Tiles
    GRASS: { sx: 32, sy: 32 },
    PATH: { sx: 96, sy: 32 },
    WALL: { sx: 224, sy: 64 },
    DEEP_WATER: { sx: 256, sy: 224 },
    TREE: { sx: 0, sy: 0, sw: 64, sh: 64 }, // Larger sprite
    ROCK: { sx: 320, sy: 0 },
    POND: { sx: 256, sy: 224 }, // Using water for now
    DEEP_FOREST: { sx: 0, sy: 128 }, // Using bush for now
    GATEWAY: { sx: 2, sy: 2, sw: 2, sh: 2 }, // No sprite yet, tiny placeholder
    PEDESTAL: { sx: 2, sy: 2, sw: 2, sh: 2 }, // No sprite yet
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
        gateways: [{ x: 58, y: 30, destZone: { x: 1, y: 1 }, entry: { x: 1, y: 75 } }],
        pedestals: [
            { x: 5, y: 5, id: 'gg_pedestal' }, { x: 7, y: 5, id: 'vi_pedestal' }, { x: 9, y: 5, id: 'pc_pedestal' },
            { x: 5, y: 7, id: 'tc_pedestal' }, { x: 7, y: 7, id: 'bt_pedestal' }, { x: 9, y: 7, id: 'wp_pedestal' },
            { x: 7, y: 9, id: 'gh_pedestal' },
        ],
        mapLayout: Array(60).fill("W".repeat(60)) // Placeholder map
    },
    '1,0': {
        name: "The Quiet Grove", theme: 'dark_forest',
        width: 60, height: 60,
        gateways: [{ x: 30, y: 58, destZone: { x: 1, y: 1 }, entry: { x: 75, y: 1 } }],
        spawns: [ 
            { x: 30, y: 30, type: 'GOLEM_KING' }, 
        ],
        mapLayout: Array(60).fill("F".repeat(60)) // Placeholder map
    },
    '1,1': {
        name: "Verdant Starting Island", theme: 'forest',
        width: 150, height: 150, // Much larger zone!
        gateways: [
            // AI-NOTE: These gateways are intentionally placed at the top-center and left-center of the map boundaries.
            { x: 75, y: 14, destZone: { x: 1, y: 0 }, entry: { x: 30, y: 57 } }, 
            { x: 14, y: 75, destZone: { x: 0, y: 1 }, entry: { x: 57, y: 30 } },
        ],
        resources: [
            // AI-NOTE: Resources are placed logically within the new handcrafted map.
            { x: 80, y: 80, type: 'TREE', id: 'tree_1' }, { x: 90, y: 110, type: 'TREE', id: 'tree_2' },
            { x: 50, y: 50, type: 'ROCK', id: 'rock_1' }, { x: 48, y: 92, type: 'ROCK', id: 'rock_2' },
            { x: 105, y: 66, type: 'POND', id: 'pond_1' }, { x: 106, y: 66, type: 'POND', id: 'pond_2' },
        ],
        spawns: [
            // AI-NOTE: Monsters are now placed in specific clearings and paths on the new map.
            { x: 70, y: 95, type: 'BLUE_SLIME' }, { x: 72, y: 96, type: 'BLUE_SLIME' },
            { x: 62, y: 90, type: 'YELLOW_SLIME' },
            { x: 102, y: 82, type: 'RED_SLIME' },
            { x: 48, y: 48, type: 'GOLEM' },
            { x: 95, y: 45, type: 'HUMAN' }, { x: 96, y: 46, type: 'BOAR' }, { x: 97, y: 45, type: 'WOLF' },
        ],
        // D = Deep Water, ' ' = Grass, . = Path, F = Forest
        mapLayout: Array(150).fill("D".repeat(150)) // Start with a full water map
    },
};

// --- Altar Upgrades ---
export const ALTAR_UPGRADES = {
    plusOneDamage: { name: "+1 Damage", maxLevel: 10, cost: (level) => ({ soulFragment: Math.floor(2 * Math.pow(3, level)) }) },
    plusTwoMaxHp: { name: "+2 Max HP", maxLevel: 10, cost: (level) => ({ soulFragment: Math.floor(2 * Math.pow(3, level)) }) },
    plusOneSpeed: { name: "+1 Speed", maxLevel: 10, cost: (level) => ({ soulFragment: Math.floor(5 * Math.pow(3, level)) }) },
    plusOneDefense: { name: "+1 Defense", maxLevel: 10, cost: (level) => ({ soulFragment: Math.floor(5 * Math.pow(3, level)) }) },
    plusOneMaxMarks: { name: "+1 Max Marks", maxLevel: 4, cost: (level) => ({ soulFragment: Math.floor(30 * Math.pow(3, level)) }) },
    addCharacter: { name: "Add Character", maxLevel: 3, cost: (level) => ({ ragingSoul: 1 }) }
};


// --- Helper function to carve out the new map layout ---
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

// --- Hand-crafted map carving for the starting island ---
const islandCarving = [
"                                 FFFFFFFFFFFFFFFFFFF                                  ",
"                             FFFFFFFFFFFFFFFFFFFFFFFFFF                               ",
"                          FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                           ",
"                        FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                       ",
"                     FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                    ",
"                  FFFFFFFFFFFF     FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                 ",
"                FFFFFFFFF              FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF               ",
"              FFFFFFFFFF .....           FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF             ",
"            FFFFFFFFFFFF.     .           FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF            ",
"           FFFFFFFFFFFF.       .           FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF             ",
"          FFFFFFFFFFFF          .           FFFFFFFFFFFFFFFFFFFFFFFFFFFFF             ",
"         FFFFFFFFFF             .            FFFFFFFFFFFFFFFFFFFFFFFFFFFF             ",
"        FFFFFFFFF                .            FFFFFFFFFFFFFFFFFFFFFFFFFFFFF           ",
"       FFFFFFFF                  ..            FFFFFFFFFFFFFFFFFFFFFFFFFFFF           ",
"      FFFFFFF                     .             FFFFFFFFFFFFFFFFFFFFFFFFFF            ",
"     FFFFFFF                      .              FFFFFFFFFFFFFFFFFFFFFFFFF            ",
"    FFFFFFF                       .               FFFFFFFFFFFFFFFFFFFFFFFF            ",
"   FFFFFFFF                       .                FFFFFFFFFFFFFFFFFFFFFFF            ",
"  FFFFFFFFF                       ..                FFFFFFFFFFFFFFFFFFFFFF            ",
" FFFFFFFFFF                        .                 FFFFFFFFFFFFFFFFFFFFFF           ",
" FFFFFFFFFF                        .                  FFFFFFFFFFFFFFFFFFFFF           ",
" FFFFFFFFFF                        .                   FFFFFFFFFFFFFFFFFFFF           ",
"FFFFFFFFFF                         .                    FFFFFFFFFFFFFFFFFF            ",
"FFFFFFFFFF                         .                     FFFFFFFFFFFFFFFFF            ",
"FFFFFFFFFF                         .                      FFFFFFFFFFFFFFFF            ",
"FFFFFFFFFF                         .                      FFFFFFFFFFFFFFFF            ",
"FFFFFFFFFF                         .                     FFFFFFFFFFFFFFFFF            ",
"FFFFFFFFFF                         .                    FFFFFFFFFFFFFFFFFF            ",
" FFFFFFFFFF                        .                   FFFFFFFFFFFFFFFFFFFF           ",
" FFFFFFFFFF                        .                  FFFFFFFFFFFFFFFFFFFFF           ",
" FFFFFFFFFF                        .                 FFFFFFFFFFFFFFFFFFFFFF           ",
"  FFFFFFFFF                       ..                FFFFFFFFFFFFFFFFFFFFFF            ",
"   FFFFFFFF                       .                FFFFFFFFFFFFFFFFFFFFFFF            ",
"    FFFFFFF                       .               FFFFFFFFFFFFFFFFFFFFFFFF            ",
"     FFFFFFF                      .              FFFFFFFFFFFFFFFFFFFFFFFFF            ",
"      FFFFFFF                     .             FFFFFFFFFFFFFFFFFFFFFFFFFF            ",
"       FFFFFFFF                  ..            FFFFFFFFFFFFFFFFFFFFFFFFFFFF           ",
"        FFFFFFFFF                .            FFFFFFFFFFFFFFFFFFFFFFFFFFFFF           ",
"         FFFFFFFFFF             .            FFFFFFFFFFFFFFFFFFFFFFFFFFFF             ",
"          FFFFFFFFFFFF          .           FFFFFFFFFFFFFFFFFFFFFFFFFFFFF             ",
"           FFFFFFFFFFFF.       .           FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF             ",
"            FFFFFFFFFFFF.     .           FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF            ",
"              FFFFFFFFFF .....           FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF             ",
"                FFFFFFFFF              FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF               ",
"                  FFFFFFFFFFFF     FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                 ",
"                     FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                    ",
"                        FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                       ",
"                          FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                           ",
"                             FFFFFFFFFFFFFFFFFFFFFFFFFF                               ",
"                                 FFFFFFFFFFFFFFFFFFF                                  ",
"                                                                                      ",
"                                                                                      ",
"                             .......................                                  ",
"                             .                     .                                  ",
"                             .      FFFFFFF      .                                  ",
"                             .      F     F      .                                  ",
"                             .      F     F      .                                  ",
"                             .      FFFFFFF      .                                  ",
"                             .                     .                                  ",
"                             .     ...........   .                                  ",
"                             .     .         .   .                                  ",
"                             .     .         .   .                                  ",
"                             .     .         .   .                                  ",
"                             .     .         .   .                                  ",
"                             .     .         .   .                                  ",
"                             .     .         .   .                                  ",
"                             .     .         .   .                                  ",
"                             .     .         ....                                   ",
"                             .     .                                                ",
"             .......................                                                ",
"             .                                                                      ",
"             .                                                                      ",
"             .                                                                      ",
"             .                                                                      ",
"             .                                                                      ",
"             .                                                                      ",
"             .                                                                      ",
"             .                                                                      ",
"             .                                                                      ",
"             .                                                                      ",
"             .                                                                      ",
"             .                                                                      ",
"             ..................................................                     ",
"                                                              .                     ",
"                                                              .                     ",
"                                                              .                     ",
"                                                           ...                      ",
"                                                           .                        ",
"                                                           .                        ",
"                                                           .                        ",
"                                                           .                        ",
"                                                           .                        ",
"                                                           .                        ",
"                                                           .                        ",
"                                                           .                        ",
"                                                           .                        ",
"                                                           .                        ",
"                                                           .                        ",
"                                                           .                        ",
"                                                           .......................... ",
"                                                                                      ",
"                                                                                      ",
"                                                                                      "
];

// Apply the carving to the specific zone's mapLayout
applyMapCarving(worldData['1,1'].mapLayout, islandCarving, 20, 20);