// js/gameData.js

// This file contains all the static data for the game.
// By keeping it separate, the main game logic file is cleaner and easier to manage.
// The 'export' keyword makes these constants available to other JavaScript files.

// --- Core Game Mechanics ---
export const TILE_SIZE = 24;
export const MAP_WIDTH_TILES = 31;
export const MAP_HEIGHT_TILES = 31;
export const RESPAWN_TIME = 10000; // Time in milliseconds for enemies to respawn
export const MAX_CHARACTERS = 4;
export const CHARACTER_COLORS = ['#FFFFFF', '#06b6d4', '#d946ef', '#f59e0b']; // White, Cyan, Fuchsia, Amber

// --- Tile & Item Definitions ---
export const TILES = {
    GRASS: 0,
    WALL: 1,
    GATEWAY: 2,
    PEDESTAL: 3,
    TREE: 4,
    ROCK: 5,
    POND: 6
};

export const ITEM_SPRITES = {
    soulFragment: '✧',
    ragingSoul: '✧', // Using same sprite but will be colored differently
    wood: '🌲',
    copper_ore: '⛏️',
    fish: '🐟'
};

// --- Item Drop Data ---
// Defines special items dropped by monsters and their effects.
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
// Contains stats and information for all enemies in the game.
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
// Data for gatherable resources like trees and rocks.
export const RESOURCE_DATA = {
    TREE: { name: 'Tree', time: 4000, levelReq: 1, xp: 10, item: 'wood', skill: 'woodcutting' },
    ROCK: { name: 'Copper Rock', time: 4000, levelReq: 1, xp: 15, item: 'copper_ore', skill: 'mining' },
    POND: { name: 'Fishing Spot', time: 4000, levelReq: 1, xp: 25, item: 'fish', skill: 'fishing' }
};

// --- World Layout ---
// Defines all the zones, gateways, resources, and enemy spawns in the game world.
export const worldData = {
    '0,1': {
        name: "The Collector's Library", theme: 'library', gateways: [{ x: 30, y: 15, destZone: { x: 1, y: 1 }, entry: { x: 1, y: 15 } }],
        pedestals: [
            { x: 5, y: 5, id: 'gg_pedestal' }, { x: 7, y: 5, id: 'vi_pedestal' }, { x: 9, y: 5, id: 'pc_pedestal' },
            { x: 5, y: 7, id: 'tc_pedestal' }, { x: 7, y: 7, id: 'bt_pedestal' }, { x: 9, y: 7, id: 'wp_pedestal' },
            { x: 7, y: 9, id: 'gh_pedestal' },
        ]
    },
    '1,0': {
        name: "The Quiet Grove", theme: 'dark_forest', gateways: [{ x: 15, y: 30, destZone: { x: 1, y: 1 }, entry: { x: 15, y: 1 } }],
        spawns: [
            { x: 15, y: 15, type: 'GOLEM_KING' },
        ],
    },
    '1,1': {
        name: "Verdant Starting Area", theme: 'forest',
        gateways: [
            { x: 15, y: 0, destZone: { x: 1, y: 0 }, entry: { x: 15, y: 29 } }, { x: 0, y: 15, destZone: { x: 0, y: 1 }, entry: { x: 29, y: 15 } },
        ],
        resources: [
            { x: 10, y: 10, type: 'TREE', id: 'tree_1_1_1' }, { x: 12, y: 20, type: 'TREE', id: 'tree_1_1_2' }, { x: 25, y: 15, type: 'TREE', id: 'tree_1_1_3' },
            { x: 20, y: 10, type: 'ROCK', id: 'rock_1_1_1' }, { x: 18, y: 20, type: 'ROCK', id: 'rock_1_1_2' }, { x: 25, y: 18, type: 'ROCK', id: 'rock_1_1_3' },
            { x: 4, y: 20, type: 'POND', id: 'pond_1_1_1' }, { x: 5, y: 20, type: 'POND', id: 'pond_1_1_2' },
            { x: 4, y: 21, type: 'POND', id: 'pond_1_1_3' }, { x: 5, y: 21, type: 'POND', id: 'pond_1_1_4' }
        ],
        spawns: [
            { x: 7, y: 7, type: 'BLUE_SLIME' }, { x: 8, y: 9, type: 'BLUE_SLIME' }, { x: 6, y: 11, type: 'BLUE_SLIME' },
            { x: 9, y: 13, type: 'BLUE_SLIME' }, { x: 5, y: 9, type: 'BLUE_SLIME' }, { x: 8, y: 11, type: 'BLUE_SLIME' },
            { x: 22, y: 22, type: 'BLUE_SLIME' }, { x: 24, y: 24, type: 'BLUE_SLIME' }, { x: 26, y: 22, type: 'BLUE_SLIME' },
            { x: 23, y: 26, type: 'BLUE_SLIME' }, { x: 21, y: 24, type: 'BLUE_SLIME' }, { x: 24, y: 22, type: 'BLUE_SLIME' },
            { x: 25, y: 5, type: 'YELLOW_SLIME' }, { x: 26, y: 7, type: 'YELLOW_SLIME' }, { x: 27, y: 9, type: 'YELLOW_SLIME' },
            { x: 23, y: 8, type: 'YELLOW_SLIME' }, { x: 25, y: 11, type: 'YELLOW_SLIME' }, { x: 28, y: 7, type: 'YELLOW_SLIME' },
            { x: 2, y: 2, type: 'GOLEM' },
            { x: 5, y: 2, type: 'RED_SLIME' }, { x: 2, y: 5, type: 'RED_SLIME' },
            { x: 2, y: 25, type: 'RED_SLIME' }, { x: 3, y: 27, type: 'RED_SLIME' }, { x: 4, y: 25, type: 'RED_SLIME' },
            { x: 5, y: 28, type: 'RED_SLIME' }, { x: 6, y: 26, type: 'RED_SLIME' }, { x: 2, y: 28, type: 'RED_SLIME' },
        ],
    },
};

// --- Altar Upgrades ---
// Defines the available upgrades at the Soul Altar and their costs.
export const ALTAR_UPGRADES = {
    plusOneDamage: { name: "+1 Damage", maxLevel: 10, cost: (level) => ({ soulFragment: Math.floor(2 * Math.pow(3, level)) }) },
    plusTwoMaxHp: { name: "+2 Max HP", maxLevel: 10, cost: (level) => ({ soulFragment: Math.floor(2 * Math.pow(3, level)) }) },
    plusOneSpeed: { name: "+1 Speed", maxLevel: 10, cost: (level) => ({ soulFragment: Math.floor(5 * Math.pow(3, level)) }) },
    plusOneDefense: { name: "+1 Defense", maxLevel: 10, cost: (level) => ({ soulFragment: Math.floor(5 * Math.pow(3, level)) }) },
    plusOneMaxMarks: { name: "+1 Max Marks", maxLevel: 4, cost: (level) => ({ soulFragment: Math.floor(30 * Math.pow(3, level)) }) },
    addCharacter: { name: "Add Character", maxLevel: 3, cost: (level) => ({ ragingSoul: 1 }) }
};
