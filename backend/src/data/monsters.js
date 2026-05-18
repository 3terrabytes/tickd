// Monsters spawned in the dungeon. Difficulty roughly increases with `tier`:
//   1-2 = early rooms, 3-4 = mid, 5 = boss
//
// hp     = the monster's HP pool
// power  = base damage per attack
// xp     = reward XP on victory
// gold   = reward gold on victory
// sprite = big emoji used as the "model"
// taunt  = flavor text shown at battle start

const MONSTERS = [
  // ── tier 1: warmup ───────────────────────────────────────────────────
  { id: 'slime',       name: 'Green Slime',     tier: 1, hp: 30,  power: 6,  xp: 20,  gold: 12, sprite: '🟢', element: 'poison',   taunt: 'It jiggles menacingly.' },
  { id: 'bat',         name: 'Cave Bat',        tier: 1, hp: 26,  power: 8,  xp: 22,  gold: 14, sprite: '🦇', element: 'shadow',   taunt: 'Screeches in the dark.' },
  { id: 'rat',         name: 'Plague Rat',      tier: 1, hp: 22,  power: 7,  xp: 18,  gold: 10, sprite: '🐀', element: 'poison',   taunt: 'You smell it before you see it.' },

  // ── tier 2: standard ─────────────────────────────────────────────────
  { id: 'goblin',      name: 'Goblin Scout',    tier: 2, hp: 45,  power: 10, xp: 35,  gold: 22, sprite: '👺', element: 'physical', taunt: 'It grins, showing too many teeth.' },
  { id: 'skeleton',    name: 'Skeleton',        tier: 2, hp: 50,  power: 11, xp: 40,  gold: 24, sprite: '💀', element: 'shadow',   taunt: 'The bones rattle into formation.' },
  { id: 'spider',      name: 'Giant Spider',    tier: 2, hp: 48,  power: 12, xp: 42,  gold: 26, sprite: '🕷️', element: 'poison',   taunt: 'Eight eyes lock onto you.' },
  { id: 'wolf',        name: 'Dire Wolf',       tier: 2, hp: 55,  power: 13, xp: 45,  gold: 28, sprite: '🐺', element: 'physical', taunt: 'A guttural growl fills the chamber.' },

  // ── tier 3: tough ────────────────────────────────────────────────────
  { id: 'orc',         name: 'Orc Brute',       tier: 3, hp: 80,  power: 15, xp: 65,  gold: 45, sprite: '👹', element: 'physical', taunt: '"PUNY MORTAL."' },
  { id: 'wraith',      name: 'Vengeful Wraith', tier: 3, hp: 70,  power: 17, xp: 70,  gold: 48, sprite: '👻', element: 'shadow',   taunt: 'The temperature drops twenty degrees.' },
  { id: 'mimic',       name: 'Mimic Chest',     tier: 3, hp: 90,  power: 14, xp: 72,  gold: 60, sprite: '🎁', element: 'physical', taunt: 'You should have known better.' },

  // ── tier 4: elite ────────────────────────────────────────────────────
  { id: 'minotaur',    name: 'Minotaur',        tier: 4, hp: 120, power: 20, xp: 110, gold: 80,  sprite: '🐂', element: 'physical', taunt: 'It paws the ground, then charges.' },
  { id: 'lich',        name: 'Frost Lich',      tier: 4, hp: 110, power: 22, xp: 120, gold: 85,  sprite: '🧙', element: 'ice',      taunt: '"Your soul will warm my tomb."' },
  { id: 'phoenix',     name: 'Ember Phoenix',   tier: 4, hp: 115, power: 21, xp: 115, gold: 82,  sprite: '🦅', element: 'fire',      taunt: 'It bursts into flame.' },

  // ── tier 5: bosses ───────────────────────────────────────────────────
  { id: 'dragon',      name: 'Ancient Dragon',  tier: 5, hp: 220, power: 28, xp: 260, gold: 200, sprite: '🐉', element: 'fire',      taunt: 'The dungeon shakes as it roars.' },
  { id: 'demon_lord',  name: 'Demon Lord',      tier: 5, hp: 240, power: 30, xp: 280, gold: 220, sprite: '😈', element: 'shadow',    taunt: '"At last. A challenger."' },
  { id: 'void_knight', name: 'Void Knight',     tier: 5, hp: 250, power: 26, xp: 300, gold: 240, sprite: '🌌', element: 'arcane',    taunt: 'A figure of impossible darkness draws its blade.' },
];

const monsterById = (id) => MONSTERS.find(m => m.id === id);

// Build a 6-room linear dungeon run: 5 escalating fights + a boss.
// Returns an array of monster ids.
const generateRun = () => {
  const pick = (tier) => {
    const pool = MONSTERS.filter(m => m.tier === tier);
    return pool[Math.floor(Math.random() * pool.length)].id;
  };
  return [
    pick(1),
    pick(1),
    pick(2),
    pick(3),
    pick(4),
    pick(5), // boss
  ];
};

module.exports = { MONSTERS, monsterById, generateRun };
