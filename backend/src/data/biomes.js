// Dungeon biomes — each one is a themed location with its own monster pool,
// color palette, and unlock requirement. Picked at the dungeon entrance.
//
// `unlockAtAscension` = the user's dungeon_ascension level required to play
// this biome. Catacombs is always free.

const BIOMES = [
  {
    id: 'catacombs',
    name: 'The Catacombs',
    desc: 'A cavernous tomb. Slimes, bats, and the slow, grasping dead.',
    sprite: '🏰',
    palette: { primary: '#7f1d1d', secondary: '#1a1a2e' },
    monsterPool: ['slime', 'bat', 'rat', 'goblin', 'skeleton', 'spider', 'wolf', 'orc', 'wraith', 'mimic', 'minotaur', 'lich', 'phoenix'],
    bossPool: ['dragon', 'demon_lord', 'void_knight'],
    unlockAtAscension: 0,
  },
  {
    id: 'forge',
    name: 'The Sunken Forge',
    desc: 'A drowned smithy beneath molten rock. The hammers still ring.',
    sprite: '🔥',
    palette: { primary: '#ea580c', secondary: '#7c2d12' },
    monsterPool: ['magma_beast', 'iron_sentinel', 'pyroclast', 'cinder_imp', 'flame_wraith', 'slag_golem'],
    bossPool: ['forge_master'],
    unlockAtAscension: 1, // unlock after clearing Catacombs once
  },
  {
    id: 'void',
    name: 'The Void Spire',
    desc: 'A tower outside time. The geometry hurts to look at.',
    sprite: '🌌',
    palette: { primary: '#7c3aed', secondary: '#1e1b4b' },
    monsterPool: ['star_eater', 'null_wraith', 'reality_tear', 'void_spawn', 'thought_eater', 'paradox'],
    bossPool: ['architect'],
    unlockAtAscension: 3, // unlock after clearing the Forge twice
  },
];

const biomeById = (id) => BIOMES.find(b => b.id === id);

module.exports = { BIOMES, biomeById };
