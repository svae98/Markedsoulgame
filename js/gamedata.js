// js/gameData.js
// The Island Update - Static Map

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
    PATH: 9, // A new tile for paths
};

export const ITEM_SPRITES = {
    soulFragment: '✧',
    ragingSoul: '✧',
    wood: '🌲',
    copper_ore: '⛏️',
    fish: '🐟'
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
export const ENEMIES_DATA = {
    BLUE_SLIME: { name: 'Blue Slime', color: '#60a5fa', hp: 5, attack: 1, loot: { soulFragment: 1 }, itemDrop: ['green_goo'] },
    YELLOW_SLIME: { name: 'Yellow Slime', color: '#facc15', hp: 12, attack: 3, loot: { soulFragment: 1 }, itemDrop: ['viscous_ichor'] },
    RED_SLIME: { name: 'Red Slime', color: '#ef4444', hp: 20, attack: 5, loot: { soulFragment: 1 }, itemDrop: ['pulsating_core'] },
    GOLEM: { name: 'Stone Golem', isBoss: true, color: '#78716c', hp: 100, attack: 10, loot: { ragingSoul: 1, soulFragment: 25 }, size: { w: 2, h: 2 }, itemDrop: ['golem_heart'], eyePattern: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
    GOLEM_KING: { name: 'Golem King', isBoss: true, color: '#fca5a5', hp: 2000, attack: 25, loot: { ragingSoul: 1, soulFragment: 100 }, size: { w: 3, h: 3 }, itemDrop: ['kings_fragment', 'perfect_golem_heart'], eyePattern: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }] },
    HUMAN: { name: 'Human', color: '#fca5a5', hp: 30, attack: 7, loot: { soulFragment: 2 }, itemDrop: ['tattered_cloth'] },
    BOAR: { name: 'Boar', color: '#a16207', hp: 40, attack: 9, loot: { soulFragment: 2 }, itemDrop: ['boar_tusk'] },
    WOLF: { name: 'Wolf', color: '#6b7280', hp: 50, attack: 12, loot: { soulFragment: 2 }, itemDrop: ['wolf_pelt'] },
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
            { x: 75, y: 0, destZone: { x: 1, y: 0 }, entry: { x: 30, y: 57 } }, 
            { x: 0, y: 75, destZone: { x: 0, y: 1 }, entry: { x: 57, y: 30 } },
        ],
        resources: [
            { x: 80, y: 80, type: 'TREE', id: 'tree_1' }, { x: 90, y: 110, type: 'TREE', id: 'tree_2' },
            { x: 50, y: 50, type: 'ROCK', id: 'rock_1' }, { x: 48, y: 92, type: 'ROCK', id: 'rock_2' },
            { x: 105, y: 66, type: 'POND', id: 'pond_1' }, { x: 106, y: 66, type: 'POND', id: 'pond_2' },
        ],
        spawns: [
            { x: 70, y: 95, type: 'BLUE_SLIME' }, { x: 72, y: 96, type: 'BLUE_SLIME' },
            { x: 62, y: 90, type: 'YELLOW_SLIME' },
            { x: 102, y: 82, type: 'RED_SLIME' },
            { x: 48, y: 48, type: 'GOLEM' },
            { x: 95, y: 45, type: 'HUMAN' }, { x: 96, y: 46, type: 'BOAR' }, { x: 97, y: 45, type: 'WOLF' },
        ],
        // D = Deep Water, ' ' = Grass, . = Path, F = Forest
        mapLayout: [
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD                                                      DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD                                                              DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD                                                                    DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD                                                                          DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD                                                                              DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD                                                                                    DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD                                                                                        DDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD                                                                                            DDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDD                                                                                                DDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDD                                                                                                    DDDDDDDDDDDDDDDDDDDDDDDD",
            "D                                                                                                                               DDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDD                                                                                                           DDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDD                                                                                                               DDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDD                                                                                                                   DDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDD                                                                                                                             DDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDD                                                                                                                           DDDDDDDDDDD",
            "DDDDDDDDDDDDDDDD                                                                                                                               DDDDDDDDD",
            "DDDDDDDDDDDDDDD                                                                                                                                   DDDDDDDD",
            "DDDDDDDDDDDDDD                                                                                                                                     DDDDDDD",
            "DDDDDDDDDDD                                                                                                                                         DDDDDD",
            "DDDDDDDDDDDD                                                                                                                                         DDDDD",
            "DDDDDDDDDDD                                                                                                                                           DDDD",
            "DDDDDDDDDD                                                                                                                                             DDD",
            "DDDDDDDDD                                                                                                                                               DD",
            "DDDDDDDD          FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF           DDDDDDDD",
            "DDDDDDD          FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF           DDDDDDDD",
            "DDDDDD          FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF           DDDDDDD",
            "DDDDDD          FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF           DDDDDDD",
            "DDDDD          FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF           DDDDDD",
            "DDDDD          FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF           DDDDDD",
            "DDDD          FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF           DDDDD",
            "DDDD          FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF           DDDDD",
            "DDD          FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF           DDDD",
            "DD          FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF           DDD",
            "D          FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF           DD",
            "           FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF            D",
            "           FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF             ",
            "            FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF              ",
            "            FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF              ",
            "             FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF               ",
            "             FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF               ",
            "              FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                ",
            "              FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                ",
            "               FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                 ",
            "               FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                 ",
            "                FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                  ",
            "                FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                  ",
            "                 FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                   ",
            "                 FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                   ",
            "                  FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                    ",
            "                  FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                    ",
            "                   FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                     ",
            "                   FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                     ",
            "                    FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                      ",
            "                    FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                      ",
            "                     FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                       ",
            "                     ....................................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                       ",
            "                      ...................................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                        ",
            "                      ...................................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                        ",
            "                       ..................................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                         ",
            "                       ..................................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                         ",
            "                        .................................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                          ",
            "                        .................................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                          ",
            "                         ................................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                           ",
            "                         ................................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                           ",
            "                          ...............................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                            ",
            "                          ...............................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                            ",
            "                           ..............................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                             ",
            "                           ..............................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                             ",
            "                            .............................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                              ",
            "                            .............................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF                              ",
            "                             ............................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFF                               ",
            "                             ............................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFFF                               ",
            "                              ...........................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFF                                ",
            "                              ...........................................................FFFFFFFFFFFFFFFFFFFFFFFFFFFF                                ",
            "                               ..........................................................FFFFFFFFFFFFFFFFFFFFFFFFFFF                                  ",
            "                               ..........................................................FFFFFFFFFFFFFFFFFFFFFFFFFFF                                  ",
            "                                .........................................................FFFFFFFFFFFFFFFFFFFFFFFFFF                                    ",
            "                                .........................................................FFFFFFFFFFFFFFFFFFFFFFFFFF                                    ",
            "                                 ........................................................FFFFFFFFFFFFFFFFFFFFFFFFF                                     ",
            "                                 ........................................................FFFFFFFFFFFFFFFFFFFFFFFFF                                     ",
            "                                  .......................................................FFFFFFFFFFFFFFFFFFFFFFFF                                      ",
            "                                  .......................................................FFFFFFFFFFFFFFFFFFFFFFFF                                      ",
            "                                   ......................................................FFFFFFFFFFFFFFFFFFFFFFF                                       ",
            "                                   ......................................................FFFFFFFFFFFFFFFFFFFFFFF                                       ",
            "                                    .....................................................FFFFFFFFFFFFFFFFFFFFFF                                        ",
            "                                    .....................................................FFFFFFFFFFFFFFFFFFFFFF                                        ",
            "                                     ....................................................FFFFFFFFFFFFFFFFFFFFF                                         ",
            "                                     ....................................................FFFFFFFFFFFFFFFFFFFFF                                         ",
            "                                      ...................................................FFFFFFFFFFFFFFFFFFFF                                          ",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
            "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD"
        ],
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
