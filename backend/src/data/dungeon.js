// Branching dungeon map generator (Slay-the-Spire inspired).
//
// A run = 7 floors:
//   floor 0     : start node
//   floors 1-5  : 2-4 nodes each, mix of battle/elite/shop/rest/treasure
//   floor 6     : final boss
//
// Nodes connect forward only — each node on floor F connects to 1-2 nodes
// on floor F+1 whose column is within ±2 of its own. The generator ensures
// every node on floor F+1 has at least one incoming edge so no node is
// orphaned and unreachable.

const { MONSTERS } = require('./monsters');
const { BIOMES, biomeById } = require('./biomes');
const { pickEvent } = require('./events');

const COLS = 4;
const FLOORS_COUNT = 7;

// What types of room can appear on each floor. `count` controls how many
// nodes the floor has. The boss floor and start floor are pinned to a
// single centre node.
const FLOOR_PLAN = [
  { count: 1, types: ['start'] },
  { count: 3, types: ['battle', 'battle', 'event'] },
  { count: 3, types: ['battle', 'event', 'treasure'] },
  { count: 4, types: ['battle', 'shop', 'battle', 'rest'] },
  { count: 3, types: ['elite', 'event', 'treasure'] },
  { count: 3, types: ['rest', 'elite', 'shop'] },
  { count: 1, types: ['boss'] },
];

// Potions sold by in-dungeon shops. The frontend stores the consumed-state;
// effects are applied client-side because the dungeon is client-driven.
const POTIONS = [
  { id: 'potion_small',   name: 'Small Potion',  desc: 'Heals 40 HP instantly.',         cost: 30,  emoji: '🧪', heal: 40  },
  { id: 'potion_big',     name: 'Large Potion',  desc: 'Heals 100 HP instantly.',        cost: 70,  emoji: '🍶', heal: 100 },
  { id: 'tonic_strength', name: 'Battle Tonic',  desc: 'Next attack deals +50% damage.', cost: 60,  emoji: '🧉', strength: 1.5 },
  { id: 'shield_scroll',  name: 'Iron Skin',     desc: 'Reduce next hit by 75%.',        cost: 50,  emoji: '📜', defense: 0.25 },
  { id: 'lucky_charm',    name: 'Lucky Charm',   desc: '+50% gold from next treasure.',  cost: 40,  emoji: '🍀', goldBoost: 1.5 },
];

const potionById = (id) => POTIONS.find(p => p.id === id);

function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Pick a monster id matching the requested tier — scoped to the biome's pool
// if one is provided. Falls back to global pool if biome has no match.
function pickMonster(tier, biome) {
  let pool;
  if (biome) {
    const allowed = new Set(biome.monsterPool);
    pool = MONSTERS.filter(m => m.tier === tier && allowed.has(m.id));
    if (!pool.length) pool = MONSTERS.filter(m => m.tier === tier);
  } else {
    pool = MONSTERS.filter(m => m.tier === tier);
  }
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

function pickBoss(biome) {
  if (biome && biome.bossPool && biome.bossPool.length) {
    return biome.bossPool[Math.floor(Math.random() * biome.bossPool.length)];
  }
  return pickMonster(5);
}

// Build the full map for one dungeon run.
function generateMap(biomeId) {
  const biome = biomeId ? biomeById(biomeId) : null;
  let nextId = 0;
  const nodes = [];
  const nodesByFloor = [];

  for (let f = 0; f < FLOORS_COUNT; f++) {
    const { count, types } = FLOOR_PLAN[f];
    const shuffledTypes = shuffle(types);

    // Choose `count` distinct cols, spread across the available columns.
    const allCols = [...Array(COLS).keys()];
    const cols = shuffle(allCols).slice(0, count).sort((a, b) => a - b);
    // Single-node floors (start, boss) sit in the middle.
    if (count === 1) cols[0] = Math.floor(COLS / 2);

    const floorNodes = [];
    for (let i = 0; i < count; i++) {
      const type = shuffledTypes[i];
      const node = { id: nextId++, floor: f, col: cols[i], type };
      // Combat nodes need a monster picked at generation time so the player
      // sees the right enemy icon on the map preview.
      if (type === 'battle' || type === 'elite') {
        const tier = type === 'elite' ? 4
                   : f <= 1           ? 1
                   : f <= 3           ? 2
                   :                    3;
        node.monsterId = pickMonster(tier, biome);
      } else if (type === 'boss') {
        node.monsterId = pickBoss(biome);
      } else if (type === 'event') {
        const ev = pickEvent();
        node.event = ev;
      }
      floorNodes.push(node);
      nodes.push(node);
    }
    nodesByFloor.push(floorNodes);
  }

  // Connect forward. Each node links to 1-2 nearest-col nodes on the next
  // floor. Then we sweep again to make sure no next-floor node is unreachable.
  const edges = [];
  for (let f = 0; f < FLOORS_COUNT - 1; f++) {
    const here = nodesByFloor[f];
    const next = nodesByFloor[f + 1];
    for (const node of here) {
      const sorted = [...next].sort((a, b) =>
        Math.abs(a.col - node.col) - Math.abs(b.col - node.col)
      );
      const linkCount = (sorted.length >= 2 && Math.random() < 0.45) ? 2 : 1;
      for (let i = 0; i < Math.min(linkCount, sorted.length); i++) {
        edges.push([node.id, sorted[i].id]);
      }
    }
    // Patch any orphaned next-floor nodes.
    for (const n of next) {
      const hasIncoming = edges.some(e => e[1] === n.id);
      if (!hasIncoming) {
        const closest = here.reduce((best, h) =>
          (!best || Math.abs(h.col - n.col) < Math.abs(best.col - n.col)) ? h : best,
          null
        );
        if (closest) edges.push([closest.id, n.id]);
      }
    }
  }

  return { nodes, edges };
}

module.exports = { generateMap, POTIONS, potionById, FLOORS_COUNT, COLS };
