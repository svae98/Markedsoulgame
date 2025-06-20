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
// UPDATE ABOUT THE MARKING, IT FIRST PRIORITES BOSSES AND THEN CLOSEST ENEMY, NOT BASED ON THE ORDER OF MARKING
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
export const BASE_CRAFTING_TIME = 1000;
export const BASE_GATHERING_SPEED = 5000; // New universal base speed for gathering skills
// Note: MAP_WIDTH/HEIGHT are now fallback values.
// The game will prioritize per-zone dimensions.
export const MAP_WIDTH_TILES = 150;
export const MAP_HEIGHT_TILES = 150;
export const RESPAWN_TIME = 10000;
export const MAX_CHARACTERS = 10;
export const CHARACTER_COLORS = ['#FFFFFF', '#06b6d4', '#d946ef', '#f59e0b'];
function getSpriteCoords(colIndex, rowIndex) {
    return {
        sx: colIndex * TILE_SIZE,
        sy: rowIndex * TILE_SIZE
    };
}
// --- Tile & Item Definitions ---
export const TILES = {
    GRASS: 0,
    WALL: 1,
    DEEP_FOREST: 2,
    DEEP_WATER: 3,
    PATH: 4,
    SAND: 5,
    DIRT: 6,
    SHALLOW_WATER: 7,
    // --- NEW UNWALKABLE TILES (Corrected IDs) ---
    HOUSE_WALL: 8,
    DOOR_1: 9,
    DOOR_2: 10,
    STONE_WALL: 11 // Corrected unique ID
};

export const ITEM_SPRITES = {
    // ... existing item sprites ...
    soulFragment: '✧',
    ragingSoul: '✧',
    wood: '🪵',
    copper_ore: '⛏️',
    fish: '🐟',
    cooked_fish: '🍣',
    wood_carving: '🦉',
    copper_sword: '🗡️',
    wooden_shield: '🛡️',
    // --- NEW TIERED RESOURCE ITEMS ---
    oak_wood: '🌳',
    tin_ore: '🔩',
    salmon: '🐟',
    willow_wood: '🌿',
    iron_ore: '🪨',
    trout: '🐠',
    maple_wood: '🍁',
    silver_ore: '⚪',
    tuna: '🐡',
    elder_wood: '🌲',
    gold_ore: '🟡',
    shark: '🦈',
};

// --- Spritesheet Mapping ---
// This object maps game elements to their location on the spritesheet.
// Each key corresponds to a tile or entity.
// sx/sy are the source x/y coordinates on the spritesheet image.
// All sprites are assumed to be 32x32 unless sw/sh are specified.
// do NOT adjust sprites without user permission
export const SPRITES = {
    PLAYER_CHARS: {
        PLAYER: { ...getSpriteCoords(1, 0) } // (Column 1, Row 0) -> (32, 0)
    },

    MONSTERS: {
        BLUE_SLIME: { ...getSpriteCoords(0, 1) }, // (Column 0, Row 1) -> (0, 32)
        YELLOW_SLIME: { ...getSpriteCoords(1, 1) }, // (Column 1, Row 1) -> (32, 32)
        RED_SLIME: { ...getSpriteCoords(2, 1) }, // (Column 2, Row 1) -> (64, 32)
        BOAR: { ...getSpriteCoords(3, 1) }, // (Column 3, Row 1) -> (96, 32)
        WOLF: { ...getSpriteCoords(4, 1) }, // (Column 4, Row 1) -> (128, 32)
        GOLEM: { ...getSpriteCoords(0, 6), sw: TILE_SIZE * 2, sh: TILE_SIZE * 2 }, // (Column 0, Row 6) -> (0, 192), 64x64px
        HUMAN: { ...getSpriteCoords(5, 1) }, // (Column 5, Row 1) -> (160, 32)
        SKELETON: { ...getSpriteCoords(7, 1) }, // (Column 7, Row 1) -> (224, 32)
        GIANT_SPIDER: { ...getSpriteCoords(9, 0) }, // (Column 9, Row 0) -> (288, 0)
        FOREST_IMP: { ...getSpriteCoords(5, 2) }, // (Column 5, Row 2) -> (160, 64)
        GIANT_BEETLE: { ...getSpriteCoords(6, 2) }, // (Column 6, Row 2) -> (192, 64)
        GOBLIN: { ...getSpriteCoords(0, 7) }, // (Column 0, Row 7) -> (0, 224)
        OGRE: { ...getSpriteCoords(1, 7), sw: TILE_SIZE * 2, sh: TILE_SIZE * 2 }, // (Column 1, Row 7) -> (32, 224), 64x64px
        HARPY: { ...getSpriteCoords(3, 7) }, // (Column 3, Row 7) -> (96, 224)
        SWAMP_BEAST: { ...getSpriteCoords(4, 7) }, // (Column 4, Row 7) -> (128, 224)
        WISP: { ...getSpriteCoords(5, 7) } // (Column 5, Row 7) -> (160, 224)
    },

    CRAFTING_STATIONS: {
        FORGE: { ...getSpriteCoords(1, 2), sw: TILE_SIZE * 2, sh: TILE_SIZE }, // (Column 1, Row 2) -> (32, 64), 64x32px
        CARPENTRY_TABLE: { ...getSpriteCoords(2, 3), sw: TILE_SIZE * 2, sh: TILE_SIZE }, // (Column 2, Row 3) -> (64, 96), 64x32px
        COOKING_RANGE: { ...getSpriteCoords(0, 4), sw: TILE_SIZE, sh: TILE_SIZE * 2 } // (Column 0, Row 4) -> (0, 128), 32x64px
    },

    GROUND_TILES: {
        GRASS: [
            { ...getSpriteCoords(0, 0) }, // (Column 0, Row 0) -> (0, 0)
        ],
        PATH: { ...getSpriteCoords(4, 0) }, // (Column 4, Row 0) -> (128, 0)
        SAND: { ...getSpriteCoords(0, 5) }, // (Column 0, Row 5) -> (0, 160)
        DIRT: { ...getSpriteCoords(1, 5) }, // (Column 1, Row 5) -> (32, 160)
        SHALLOW_WATER: { ...getSpriteCoords(2, 5) } // (Column 2, Row 5) -> (64, 160)
    },

    UNWALKABLE_TILES: {
        WALL: { ...getSpriteCoords(7, 0) }, // (Column 7, Row 0) -> (224, 0)
        DEEP_WATER: { ...getSpriteCoords(8, 7) }, // (Column 8, Row 7) -> (256, 224)
        DEEP_FOREST: { ...getSpriteCoords(6, 0) }, // (Column 6, Row 0) -> (192, 0)
        HOUSE_WALL: { ...getSpriteCoords(0, 8) }, // (Column 0, Row 8) -> (0, 256)
        HOUSE_ROOF: { ...getSpriteCoords(1, 8) }, // (Column 1, Row 8) -> (32, 256)
        WINDOW: { ...getSpriteCoords(2, 8) }, // (Column 2, Row 8) -> (64, 256)
        STONE_WALL: { ...getSpriteCoords(4, 8) }, // (Column 4, Row 8) -> (128, 256)
        RUINED_WALL: { ...getSpriteCoords(7, 8) } // (Column 7, Row 8) -> (224, 256)
    },

    RESOURCE_NODES: {
        TREE: { ...getSpriteCoords(2, 0) }, // (Column 2, Row 0) -> (64, 0)
        CHOPPED_TREE: { ...getSpriteCoords(3, 2) }, // (Column 3, Row 2) -> (96, 32)
        ROCK: { ...getSpriteCoords(3, 0) }, // (Column 3, Row 0) -> (96, 0)
        FISHING_SPOT: { ...getSpriteCoords(8, 0) }, // (Column 8, Row 0) -> (256, 0)
        OAK_TREE: { ...getSpriteCoords(0, 6) }, // (Column 0, Row 6) -> (0, 192) - Note: This overlaps with Golem if it was (0,6) (sy:192). Golem changed to (0,6).
        TIN_ROCK: { ...getSpriteCoords(1, 6) }, // (Column 1, Row 6) -> (32, 192)
        RIVER_FISHING_SPOT: { ...getSpriteCoords(2, 6) }, // (Column 2, Row 6) -> (64, 192)
        WILLOW_TREE: { ...getSpriteCoords(3, 6) }, // (Column 3, Row 6) -> (96, 192)
        IRON_ROCK: { ...getSpriteCoords(4, 6) }, // (Column 4, Row 6) -> (128, 192)
        LAKE_FISHING_SPOT: { ...getSpriteCoords(5, 6) }, // (Column 5, Row 6) -> (160, 192)
        MAPLE_TREE: { ...getSpriteCoords(6, 6) }, // (Column 6, Row 6) -> (192, 192)
        SILVER_ROCK: { ...getSpriteCoords(7, 6) }, // (Column 7, Row 6) -> (224, 192)
        OCEAN_FISHING_SPOT: { ...getSpriteCoords(8, 6) }, // (Column 8, Row 6) -> (256, 192)
        ELDER_TREE: { ...getSpriteCoords(9, 6) }, // (Column 9, Row 6) -> (288, 192)
        GOLD_ROCK: { ...getSpriteCoords(10, 6) }, // (Column 10, Row 6) -> (320, 192)
        DEEP_SEA_FISHING_SPOT: { ...getSpriteCoords(11, 6) } // (Column 11, Row 6) -> (352, 192)
    },

    SCENERY: {
        BUSH: { ...getSpriteCoords(3, 5) }, // (Column 3, Row 5) -> (96, 160)
        FLOWERS: { ...getSpriteCoords(4, 5) }, // (Column 4, Row 5) -> (128, 160)
        FALLEN_LOG: { ...getSpriteCoords(5, 5) }, // (Column 5, Row 5) -> (160, 160)
        SMALL_ROCK: { ...getSpriteCoords(6, 5) } // (Column 6, Row 5) -> (192, 160)
    },

    GATEWAYS: {
        GATEWAY: { ...getSpriteCoords(7, 1) }, // (Column 7, Row 1) -> (224, 32)
        DOOR: { ...getSpriteCoords(3, 8) }, // (Column 3, Row 8) -> (96, 256)
        STONE_ARCHWAY: { ...getSpriteCoords(5, 8), sw: TILE_SIZE * 2, sh: TILE_SIZE * 2 } // (Column 5, Row 8) -> (160, 256), 64x64px
    },
    MISC: {
        PEDESTAL: { ...getSpriteCoords(9, 2) } // (Column 9, Row 2) -> (288, 64)
    }
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
    BLUE_SLIME: { name: 'Blue Slime', sprite: SPRITES.MONSTERS.BLUE_SLIME, hp: 5, attack: 1, loot: { soulFragment: 1 }, itemDrop: ['green_goo'] },
    YELLOW_SLIME: { name: 'Yellow Slime', sprite: SPRITES.MONSTERS.YELLOW_SLIME, hp: 12, attack: 3, loot: { soulFragment: 1 }, itemDrop: ['viscous_ichor'] },
    RED_SLIME: { name: 'Red Slime', sprite: SPRITES.MONSTERS.RED_SLIME, hp: 20, attack: 5, loot: { soulFragment: 1 }, itemDrop: ['pulsating_core'] },
    GOLEM: { name: 'Stone Golem', sprite: SPRITES.MONSTERS.GOLEM, isBoss: true, hp: 100, attack: 10, loot: { ragingSoul: 1, soulFragment: 25 }, size: { w: 2, h: 2 }, itemDrop: ['golem_heart'] },
    GOLEM_KING: { name: 'Golem King', sprite: SPRITES.MONSTERS.GOLEM, isBoss: true, hp: 2000, attack: 25, loot: { ragingSoul: 1, soulFragment: 100 }, size: { w: 3, h: 3 }, itemDrop: ['kings_fragment', 'perfect_golem_heart'] },
    HUMAN: { name: 'Human', sprite: SPRITES.MONSTERS.HUMAN, hp: 30, attack: 7, loot: { soulFragment: 2 }, itemDrop: ['tattered_cloth'] },
    BOAR: { name: 'Boar', sprite: SPRITES.MONSTERS.BOAR, hp: 40, attack: 9, loot: { soulFragment: 2 }, itemDrop: ['boar_tusk'] },
    WOLF: { name: 'Wolf', sprite: SPRITES.MONSTERS.WOLF, hp: 50, attack: 12, loot: { soulFragment: 2 }, itemDrop: ['wolf_pelt'] },
    SKELETON: { name: 'Skeleton', sprite: SPRITES.MONSTERS.SKELETON, hp: 25, attack: 6, loot: { soulFragment: 1 } },
    GIANT_SPIDER: { name: 'Giant Spider', sprite: SPRITES.MONSTERS.GIANT_SPIDER, hp: 35, attack: 8, loot: { soulFragment: 1 } },
    FOREST_IMP: { name: 'Forest Imp', sprite: SPRITES.MONSTERS.FOREST_IMP, hp: 30, attack: 8, loot: { soulFragment: 1 } },
    GIANT_BEETLE: { name: 'Giant Beetle', sprite: SPRITES.MONSTERS.GIANT_BEETLE, hp: 60, attack: 6, loot: { soulFragment: 2 } },
    GOBLIN: { name: 'Goblin', sprite: SPRITES.MONSTERS.GOBLIN, hp: 45, attack: 10, loot: { soulFragment: 3 } },
    OGRE: { name: 'Ogre', sprite: SPRITES.MONSTERS.OGRE, hp: 150, attack: 18, loot: { soulFragment: 10 }, size: { w: 2, h: 2 } },
    HARPY: { name: 'Harpy', sprite: SPRITES.MONSTERS.HARPY, hp: 70, attack: 14, loot: { soulFragment: 5 } },
    SWAMP_BEAST: { name: 'Swamp Beast', sprite: SPRITES.MONSTERS.SWAMP_BEAST, hp: 90, attack: 16, loot: { soulFragment: 7 } },
    WISP: { name: 'Wisp', sprite: SPRITES.MONSTERS.WISP, hp: 25, attack: 10, loot: { soulFragment: 4 } }
};

// --- Resource Definitions ---
export const RESOURCE_DATA = {
    TREE: { name: 'Tree', time: BASE_GATHERING_SPEED, levelReq: 1, xp: 10, item: 'wood', skill: 'woodcutting', maxDurability: 4, sprite: SPRITES.RESOURCE_NODES.TREE },
    ROCK: { name: 'Copper Rock', time: BASE_GATHERING_SPEED, levelReq: 1, xp: 15, item: 'copper_ore', skill: 'mining', maxDurability: 4, sprite: SPRITES.RESOURCE_NODES.ROCK },
    FISHING_SPOT: { name: 'Fishing Spot', time: BASE_GATHERING_SPEED, levelReq: 1, xp: 25, item: 'fish', skill: 'fishing', maxDurability: 4, sprite: SPRITES.RESOURCE_NODES.FISHING_SPOT },
    CARPENTRY_TABLE: { name: 'Carpentry Table', skill: 'woodworking', size: {w: 2, h: 1}, sprite: SPRITES.CRAFTING_STATIONS.CARPENTRY_TABLE },
    FORGE: { name: 'Forge', skill: 'blacksmithing', size: {w: 2, h: 1}, sprite: SPRITES.CRAFTING_STATIONS.FORGE },
    COOKING_RANGE: { name: 'Cooking Range', skill: 'cooking', size: {w: 1, h: 2}, sprite: SPRITES.CRAFTING_STATIONS.COOKING_RANGE },
    // --- NEW TIERED RESOURCES (Tier 2-5) ---
    OAK_TREE: { name: 'Oak Tree', time: BASE_GATHERING_SPEED + 1000, levelReq: 5, xp: 20, item: 'oak_wood', skill: 'woodcutting', maxDurability: 5, sprite: SPRITES.RESOURCE_NODES.OAK_TREE },
    TIN_ROCK: { name: 'Tin Rock', time: BASE_GATHERING_SPEED + 1000, levelReq: 5, xp: 30, item: 'tin_ore', skill: 'mining', maxDurability: 5, sprite: SPRITES.RESOURCE_NODES.TIN_ROCK },
    RIVER_FISHING_SPOT: { name: 'River Fishing Spot', time: BASE_GATHERING_SPEED + 1000, levelReq: 5, xp: 50, item: 'salmon', skill: 'fishing', maxDurability: 5, sprite: SPRITES.RESOURCE_NODES.RIVER_FISHING_SPOT },

    WILLOW_TREE: { name: 'Willow Tree', time: BASE_GATHERING_SPEED + 2000, levelReq: 10, xp: 40, item: 'willow_wood', skill: 'woodcutting', maxDurability: 6, sprite: SPRITES.RESOURCE_NODES.WILLOW_TREE },
    IRON_ROCK: { name: 'Iron Rock', time: BASE_GATHERING_SPEED + 2000, levelReq: 10, xp: 60, item: 'iron_ore', skill: 'mining', maxDurability: 6, sprite: SPRITES.RESOURCE_NODES.IRON_ROCK },
    LAKE_FISHING_SPOT: { name: 'Lake Fishing Spot', time: BASE_GATHERING_SPEED + 2000, levelReq: 10, xp: 100, item: 'trout', skill: 'fishing', maxDurability: 6, sprite: SPRITES.RESOURCE_NODES.LAKE_FISHING_SPOT },

    MAPLE_TREE: { name: 'Maple Tree', time: BASE_GATHERING_SPEED + 3000, levelReq: 20, xp: 80, item: 'maple_wood', skill: 'woodcutting', maxDurability: 7, sprite: SPRITES.RESOURCE_NODES.MAPLE_TREE },
    SILVER_ROCK: { name: 'Silver Rock', time: BASE_GATHERING_SPEED + 3000, levelReq: 20, xp: 120, item: 'silver_ore', skill: 'mining', maxDurability: 7, sprite: SPRITES.RESOURCE_NODES.SILVER_ROCK },
    OCEAN_FISHING_SPOT: { name: 'Ocean Fishing Spot', time: BASE_GATHERING_SPEED + 3000, levelReq: 20, xp: 200, item: 'tuna', skill: 'fishing', maxDurability: 7, sprite: SPRITES.RESOURCE_NODES.OCEAN_FISHING_SPOT },

    ELDER_TREE: { name: 'Elder Tree', time: BASE_GATHERING_SPEED + 4000, levelReq: 40, xp: 160, item: 'elder_wood', skill: 'woodcutting', maxDurability: 8, sprite: SPRITES.RESOURCE_NODES.ELDER_TREE },
    GOLD_ROCK: { name: 'Gold Rock', time: BASE_GATHERING_SPEED + 4000, levelReq: 40, xp: 240, item: 'gold_ore', skill: 'mining', maxDurability: 8, sprite: SPRITES.RESOURCE_NODES.GOLD_ROCK },
    DEEP_SEA_FISHING_SPOT: { name: 'Deep Sea Fishing Spot', time: BASE_GATHERING_SPEED + 4000, levelReq: 40, xp: 400, item: 'shark', skill: 'fishing', maxDurability: 8, sprite: SPRITES.RESOURCE_NODES.DEEP_SEA_FISHING_SPOT }
};
// --- World Layout ---
export const worldData = {
    '0,1': {
        name: "Player House",
        theme: 'house',
        width: 12,
        height: 12,
        gateways: [{ x: 5, y: 11, destZone: { x: 1, y: 1 }, entry: { x: 1, y: 15 } }],
        resources: [
            { x: 1, y: 1, type: 'CARPENTRY_TABLE', id: 'house_carpentry', size: {w: 2, h: 1} },
            { x: 8, y: 1, type: 'FORGE', id: 'house_forge', size: {w: 2, h: 1} },
            { x: 1, y: 8, type: 'COOKING_RANGE', id: 'house_cooking', size: {w: 1, h: 2} },
        ],
        mapLayout: [
            "WWWWWWWWWWWW",
            "WCC.FF.....W",
            "WCC.FF.....W",
            "W..........W",
            "W..........W",
            "W..........W",
            "W..........W",
            "W..........W",
            "WOO........W",
            "WOO........W",
            "W..........W",
            "WWWWW.WWWWWW",
        ]
    },
    '1,1': {
        name: "Verdant Starting Zone",
        width: 31, height: 31,
        gateways: [
            // This gateway now leads to the house
            { x: 0, y: 15, destZone: { x: 0, y: 1 }, entry: { x: 10, y: 10 } },
        ],
        spawns: [
            { "x": 12, "y": 21, "type": "BLUE_SLIME" },
            { "x": 8, "y": 17, "type": "BLUE_SLIME" },
            { "x": 5, "y": 24, "type": "BLUE_SLIME" },
            { "x": 8, "y": 22, "type": "BLUE_SLIME" },
            { "x": 11, "y": 20, "type": "BLUE_SLIME" },
            { "x": 6, "y": 19, "type": "BLUE_SLIME" },
            { "x": 10, "y": 18, "type": "BLUE_SLIME" },
            { "x": 25, "y": 1, "type": "YELLOW_SLIME" },
            { "x": 23, "y": 5, "type": "YELLOW_SLIME" },
            { "x": 28, "y": 3, "type": "YELLOW_SLIME" },
            { "x": 25, "y": 8, "type": "YELLOW_SLIME" },
            { "x": 26, "y": 4, "type": "YELLOW_SLIME" },
            { "x": 27, "y": 6, "type": "YELLOW_SLIME" },
            { "x": 2, "y": 6, "type": "GOLEM" },
            { "x": 5, "y": 7, "type": "RED_SLIME" },
            { "x": 3, "y": 9, "type": "RED_SLIME" },
            { "x": 22, "y": 22, "type": "RED_SLIME" },
            { "x": 21, "y": 26, "type": "RED_SLIME" },
            { "x": 18, "y": 25, "type": "RED_SLIME" },
            { "x": 17, "y": 28, "type": "RED_SLIME" },
            { "x": 13, "y": 3, "type": "BOAR" },
            { "x": 15, "y": 2, "type": "HUMAN" },
            { "x": 15, "y": 4, "type": "HUMAN" }
        ],
        "resources": [
            { "x": 25, "y": 20, "type": "TREE", "id": "tree_1", "currentDurability": 4 },
            { "x": 26, "y": 22, "type": "TREE", "id": "tree_2", "currentDurability": 4 },
            { "x": 23, "y": 20, "type": "TREE", "id": "tree_3", "currentDurability": 4 },
            { "x": 24, "y": 24, "type": "TREE", "id": "tree_4", "currentDurability": 4 },
            { "x": 28, "y": 10, "type": "ROCK", "id": "rock_1", "currentDurability": 4 },
            { "x": 28, "y": 12, "type": "ROCK", "id": "rock_2", "currentDurability": 4 },
            { "x": 26, "y": 11, "type": "ROCK", "id": "rock_3", "currentDurability": 4 },
            { "x": 26, "y": 13, "type": "ROCK", "id": "rock_4", "currentDurability": 4 },
            { "x": 27, "y": 15, "type": "ROCK", "id": "rock_5", "currentDurability": 4 },
            { "x": 3, "y": 3, "type": "FISHING_SPOT", "id": "fishing_spot_1", "currentDurability": 4 },
            { "x": 4, "y": 3, "type": "FISHING_SPOT", "id": "fishing_spot_2", "currentDurability": 4 },
            { "x": 4, "y": 2, "type": "FISHING_SPOT", "id": "fishing_spot_3", "currentDurability": 4 },
            { "x": 4, "y": 1, "type": "FISHING_SPOT", "id": "fishing_spot_4", "currentDurability": 4 },
            { "x": 5, "y": 1, "type": "FISHING_SPOT", "id": "fishing_spot_5", "currentDurability": 4 },
            { "x": 5, "y": 2, "type": "FISHING_SPOT", "id": "fishing_spot_6", "currentDurability": 4 }
        ],
        "mapLayout": [
            "FFFFFFFFFFF      .   FFFFFFFFFF",
            "FF       F      ..         FFFF",
            "FF              .             F",
            "FF              .             F",
            "F              ..             F",
            "F              .              F",
            ".              .              F",
            ".              .             FF",
            ".              ..             F",
            ".               .             F",
            ".               ..            F",
            ".                .            F",
            ".                .            F",
            ".                .            F",
            ".  ...           .            F",
            ". .. .......   ...            F",
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
    }
};
// --- Altar Upgrades ---
export const ALTAR_UPGRADES = {
    plusOneDamage: { name: "+1 Damage", maxLevel: 10, cost: (level) => ({ soulFragment: Math.floor(2 * Math.pow(3, level)) }) },
    plusTwoMaxHp: { name: "+2 Max HP", maxLevel: 10, cost: (level) => ({ soulFragment: Math.floor(2 * Math.pow(3, level)) }) },
    plusOneSpeed: { name: "+1 Speed", maxLevel: 10, cost: (level) => ({ soulFragment: Math.floor(5 * Math.pow(3, level)) }) },
    plusOneDefense: { name: "+1 Defense", maxLevel: 10, cost: (level) => ({ soulFragment: Math.floor(5 * Math.pow(3, level)) }) },
    plusOneMaxMarks: { name: "+1 Max Marks", maxLevel: 4, cost: (level) => ({ soulFragment: Math.floor(30 * Math.pow(3, level)) }) },
    // --- THIS LINE IS CHANGED ---
    addCharacter: { name: "Add Character", maxLevel: 3, cost: (level) => ({ soulFragment: 100 }) },
    learningBoost: { name: "Learning Boost", maxLevel: 5, cost: (level) => ({ soulFragment: Math.floor(50 * Math.pow(2.5, level)) }) } // +2% XP per level
};
// --- Universal Skill Equipment ---
export const CRAFTING_DATA = {
    cooking: {
        name: 'Cooking',
        skill: 'cooking',
        recipes: {
            cooked_fish: {
                name: 'Cooked Fish', unlockLevel: 1, cost: { fish: 1 }, // Per-craft cost: 1 fish
                unlockCost: { fish: 50 }, // Initial unlock cost: 50 fish (resource of the skill)
                time: BASE_CRAFTING_TIME,
                masteryPerCraft: 5, masteryCurve: (level) => 10 + (level * 5),
                bonus: (level) => ({ type: 'ADD_MAX_HP', value: level * 2 })
            },
            cooked_meat: {
                name: 'Cooked Meat', unlockLevel: 2, cost: { raw_meat: 1 }, // Per-craft cost: 1 raw_meat
                unlockCost: { raw_meat: 75 }, // Initial unlock cost: 75 raw_meat (resource of the skill)
                time: BASE_CRAFTING_TIME,
                masteryPerCraft: 7, masteryCurve: (level) => 15 + (level * 7),
                bonus: (level) => ({ type: 'ADD_DEFENSE', value: level * 0.1 })
            }
        }
    },
    woodworking: { // Changed from carpentry to woodworking
        name: 'Woodworking',
        skill: 'woodworking', // Changed from Woodworking to woodworking (lowercase for consistency)
        recipes: {
            wood_carving: {
                name: 'Wood Carving', unlockLevel: 1, cost: { wood: 1 }, // Per-craft cost: 1 wood
                unlockCost: { wood: 60 }, // Initial unlock cost: 60 wood (resource of the skill)
                time: BASE_CRAFTING_TIME,
                masteryPerCraft: 10, masteryCurve: (level) => 50 + (level * 10),
                bonus: (level) => ({ type: 'ADD_SPEED', value: level * 1 })
            },
            wooden_axe: {
                name: 'Wooden Axe', unlockLevel: 2, cost: { wood: 1 }, // Per-craft cost: 1 wood
                unlockCost: { wood: 80 }, // Initial unlock cost: 80 wood (resource of the skill)
                time: BASE_CRAFTING_TIME,
                masteryPerCraft: 12, masteryCurve: (level) => 60 + (level * 12),
                bonus: (level) => ({ type: 'ADD_DAMAGE', value: level * 0.1 })
            }
        }
    },
    blacksmithing: {
        name: 'Blacksmithing',
        skill: 'blacksmithing',
        recipes: {
            copper_sword: {
                name: 'Copper Sword', unlockLevel: 1, cost: { copper_ore: 1 }, // Per-craft cost: 1 copper_ore (as you specified)
                unlockCost: { copper_ore: 100 }, // Initial unlock cost: 100 copper_ore (resource of the skill)
                time: BASE_CRAFTING_TIME,
                masteryPerCraft: 5, masteryCurve: (level) => 20 + (level * 5),
                bonus: (level) => ({ type: 'ADD_DAMAGE', value: level * 0.5 })
            },
            wooden_shield: {
                name: 'Wooden Shield', unlockLevel: 5, cost: { wood: 1, copper_ore: 1 }, // Per-craft cost: 1 wood, 1 copper_ore
                unlockCost: { wood: 50, copper_ore: 25 }, // Initial unlock cost: 50 wood, 25 copper_ore
                time: BASE_CRAFTING_TIME,
                masteryPerCraft: 15, masteryCurve: (level) => 100 + (level * 15),
                bonus: (level) => ({ type: 'ADD_DEFENSE', value: level * 0.5 })
            }
        }
    }
};

