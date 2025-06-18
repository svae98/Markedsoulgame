// To AI, do not delete comments please.
// this is a test, do you see this very new comment, only for you? are you sure that you can only see the initial content i uploaded, if so, i'm very sad.
// js/gameData.js
// The Island Update - Static Map
// this is a general rule for map making, intended as direction for you(AI), to follow. only edit the map if you are explicitly told. the edges of the map(empty space),-
// need to not ever be visible to the player, the player sees 14 tiles out, this means the map needs 14 tiles of unwalkable space around the edge of it, this can be in th-
// -e form of trees, ocean, scenery in general. try to make the maps feel hand crafted, not massive open spaces, not one tile narrow mazes(unless it's an actual maze zone or something)
//  and make the zone/map fit the theme of the biome or type of area it is. and where you place monsters you also need to make sure that they don't -
// block the path of the player to go past them (unless it's on purpose). those are all my rules for now, if you wanna get creative with it and try something that might be cool, go for it.
// and have landmarks for example, spaces for a town and a outpost in every zone, structures that would house monsters plus open forests that house wild animals.
// the world is the same for every player that opens the game, it's not randomly generated when it's launched.
// also to AI, if you make changes or adjustments to the game, please tick up the version indicator by 1
// also also to AI, if you make the code in the chat log too long, i am unable to apply changes to it, so if the change is long, make it in
// two or more diff review tabs please.
// marking is supposed to work like this:(i might change it later, for now it's this) when you mark first, you go to the target and start combat
// (i might make skills part of the marking system as well) when you kill that target, it will stay marked (both visually and functionally)
// if you only have one mark, when the monster dies, the character will wait for respawn and reengage.
// later you gain more marks and at that point, the marks should enter a invisible list, this is important for things like bosses later.
// when you have several monsters on the list, it will work like this, check which and engage with monsters that were added to that list in order
// if for example, you kill monster 1, then 2, then, 3, then 4, but monster 3 is a boss for example(right now all monsters are the same spawnrate in the code, but
// there will be variety later, for example if it's a boss monster) it will then skip monster 3 and go to 4, but, from that point on and until monster 3
// has been defeated once, monster 3 will gain priority over all monsters on the list, REASON FOR THIS: like i said, there are boss monsters
// and what would be preferable when several characters are marking the same boss and maybe the player is automating boss killing, is that, the characters
// are all attacking the boss at the same time, then when it dies, all the character go back to their set marked route, the boss takes 10 minutes to spawn, 
// so the characters are busy with other things for a while, then when it spawns again, example from before, if monster 3 isn't prioritized, one character might
// just happen to be on monster 2 right then, he defeats it and goes immediately to the boss, but another character might be on monster 4, if monster 3 wasn't
//  prioritised, he will have to kill monster 4, 1 and 2 before he goes to the boss. that is all to say, it's for the purpose of grouping characters if needed.
// the mark should show up on the target itself, not adjacent to it.
// when you mark a object of another type that you have marked already (for example, you have marks on monsters and then you mark a tree), 
// the first object type gets removed in favor of this new object, meaning you can only do one individual skill or activity at a time on each character.
// explanation about what "adjacent" means below:
// 010
// 1O1
// 010
// 0 = diagonal, 1 = adjacent!, O = object
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
    GRASS: 0,       // Walkable
    WALL: 1,        // Not Walkable
    DEEP_FOREST: 2, // Not Walkable (dense foliage tile)
    DEEP_WATER: 3,  // Not Walkable
    PATH: 4,        // Walkable
    // TREE, ROCK, POND, PEDESTAL, GATEWAY are now objects, not base tiles.
};

export const ITEM_SPRITES = {
    soulFragment: '✧',
    ragingSoul: '✧',
    wood: '🪵',
    copper_ore: '⛏️',
    fish: '🐟'
};

// --- Spritesheet Mapping ---
// This object maps game elements to their location on the spritesheet.
// Each key corresponds to a tile or entity.
// sx/sy are the source x/y coordinates on the spritesheet image.
// All sprites are assumed to be 32x32 unless sw/sh are specified.
// do NOT adjust sprites without user permission
export const SPRITES = {

    PLAYER: { sx: 32, sy: 0 },
    BLUE_SLIME: { sx: 0, sy: 32 },
    YELLOW_SLIME: { sx: 96, sy: 192 },
    RED_SLIME: { sx: 96, sy: 224 },
    BOAR: { sx: 256, sy: 320 },
    WOLF: { sx: 128, sy: 32 },
    GOLEM: { sx: 0, sy: 192, sw: 64, sh: 64 }, // Using WALL sprite, scaled up for Stone Golem appearance
    HUMAN: { sx: 64, sy: 192 }, 
    FORGE: { sx: 192, sy:0 },

    // Tiles
    // GRASS is now an array for visual variety
    GRASS: [
        { sx: 0, sy: 0 } // Standard top-left grass
    ],
    PATH: { sx: 128, sy: 0 },
    WALL: { sx: 224, sy: 0 },
    DEEP_WATER: { sx: 256, sy: 224 }, // Reverted to actual DEEP_WATER sprite
    TREE: { sx: 64, sy: 0 }, // Using a common tree top sprite
    CHOPPED_TREE: { sx: 96, sy: 32 }, // Placeholder: Using a rock sprite as a stump for now
    ROCK: { sx: 96, sy: 0 }, // Using a common rock sprite    
    FISHING_SPOT: { sx: 256, sy: 0 }, // Using water for now, was POND
    DEEP_FOREST: { sx: 0, sy: 160 }, // Using a common bush sprite
    GATEWAY: { sx: 224, sy: 32 }, // Using a wall archway piece
    PEDESTAL: { sx: 288, sy: 64 }  // Using a column base sprite
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
    SKELETON: { name: 'Skeleton', sprite: { sx: 224, sy: 32 }, hp: 25, attack: 6, loot: { soulFragment: 1 } },
    GIANT_SPIDER: { name: 'Giant Spider', sprite: { sx: 288, sy: 0 }, hp: 35, attack: 8, loot: { soulFragment: 1 } }
};

// --- Resource Definitions ---
export const RESOURCE_DATA = {
    FORGE: { name: 'Forge', time: 5000, levelReq: 1, xp: 0, item: null, skill: 'crafting', maxDurability: 1 },
    TREE: { name: 'Tree', time: 4000, levelReq: 1, xp: 10, item: 'wood', skill: 'woodcutting', maxDurability: 4 },
    ROCK: { name: 'Copper Rock', time: 4000, levelReq: 1, xp: 15, item: 'copper_ore', skill: 'mining', maxDurability: 4 },
    FISHING_SPOT: { name: 'Fishing Spot', time: 4000, levelReq: 1, xp: 25, item: 'fish', skill: 'fishing', maxDurability: 4 }
};

// --- World Layout ---
export const worldData = {
    '0,1': {
        name: "The Collector's Library", theme: 'library',
        width: 63, height: 63, // New fixed size
        gateways: [{ x: 48, y: 31, destZone: { x: 1, y: 1 }, entry: { x: 14, y: 31 } }], // Right-edge of playable to left-edge of Island playable
        pedestals: [
            // Repositioned for 35x35 playable area (world coords 14-48)
            { x: 16, y: 16, id: 'gg_pedestal' }, { x: 18, y: 16, id: 'vi_pedestal' }, { x: 20, y: 16, id: 'pc_pedestal' },
            { x: 16, y: 18, id: 'tc_pedestal' }, { x: 18, y: 18, id: 'bt_pedestal' }, { x: 20, y: 18, id: 'wp_pedestal' },
            { x: 18, y: 20, id: 'gh_pedestal' },
        ],
        mapLayout: Array(63).fill("W".repeat(63)) // Base map, will be carved
    },
    '1,0': {
        name: "The Quiet Grove", theme: 'dark_forest',
        width: 63, height: 63, // New fixed size
        gateways: [{ x: 31, y: 48, destZone: { x: 1, y: 1 }, entry: { x: 31, y: 14 } }], // Bottom-edge of playable to top-edge of Island playable
        spawns: [ 
            { x: 31, y: 31, type: 'GOLEM_KING' }, // Centered in 35x35 playable
        ],
        mapLayout: Array(63).fill("F".repeat(63)) // Base map, will be carved
    },
    '1,1': {
    name: "Newly Edited Zone",
    theme: "forest",
    width: 31,
    height: 31,
    gateways: [
        { x: 15, y: 0, destZone: { x: 1, y: 0 }, entry: { x: 15, y: 29 } },
        { x: 0, y: 15, destZone: { x: 0, y: 1 }, entry: { x: 29, y: 15 } },
    ],
    resources: [
        { x: 25, y: 20, type: "TREE", id: "tree_1", currentDurability: 4 },
        { x: 26, y: 22, type: "TREE", id: "tree_2", currentDurability: 4 },
        { x: 28, y: 10, type: "ROCK", id: "rock_1", currentDurability: 4 },
        { x: 28, y: 12, type: "ROCK", id: "rock_2", currentDurability: 4 },
        { x: 3, y: 3, type: "FISHING_SPOT", id: "fishing_spot_1", currentDurability: 4 },
        { x: 4, y: 3, type: "FISHING_SPOT", id: "fishing_spot_2", currentDurability: 4 }
    ],
    spawns: [
        // Your custom spawns are here
        { "type": "BLUE_SLIME", "x": 7, "y": 29 },
        // ...etc
    ],
    mapLayout: [ // This should have exactly 31 rows
        "FFFFFFFFFFF      .   FFFFFFFFFF",
        "FF       F      ..         FFFF",
        "FF              .             F",
        "FF              .             F",
        "F              ..             F",
        "F              .              F",
        "               .              F",
        "               .             FF",
        "               ..             F",
        "                .             F",
        "                ..            F",
        "                 .            F",
        "                 .            F",
        "                 .            F",
        "   ...           .            F",
        "  .. .......   ...            F",
        "...        .....              F",
        "                              F",
        "                             FF",
        "                             FF",
        "                              F",
        "                             FF",
        "                             FF",
        "                             FF",
        "F                             F",
        "F                             F",
        "F                            FF",
        "F                            FF",
        "FF                           FF",
        "FFFFFFFFF  FFF           FF   F",
        "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
    ]
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


