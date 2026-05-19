// Cards available in the dungeon mini-game.
//
// Each card belongs to a `weaponClass`. The player's starter deck is built
// from cards matching their equipped weapon's class (plus universal cards).
// 'any' cards are usable by everyone.
//
// Card fields:
//   energyCost  — energy required to play (most cards = 1; expensive = 2-3)
//   power       — direct damage dealt to monster (0 for pure utility)
//   block       — block granted to player (absorbs next hit before HP)
//   cardType    — 'attack' (deals dmg) | 'skill' (utility, block, heal, etc.)
//   pool        — 'starter' (in starter deck), 'common' / 'uncommon' / 'rare' (reward only)
//   tag         — special effect: 'heal' | 'burn' | 'poison' | 'stun' | 'lifesteal'
//   heal        — HP restored (for tag='heal')
//   cooldown    — kept for backwards-compat; no longer used in card combat
//   element     — used for animation tint
//   animation   — frontend animation key
//   emoji       — display icon
//
// Heads-up: existing item.weaponClass is derived from the equipped weapon
// item's id prefix in items.js (sword_*, staff_*, etc.) so changing card
// ids here would break the link.

const CARDS = [
  // ── UNIVERSAL STARTERS ─────────────────────────────────────────────────
  { id: 'strike',        name: 'Strike',         weaponClass: 'any',    energyCost: 1, power: 6,  block: 0, cardType: 'attack', pool: 'starter', animation: 'dash',  emoji: '👊', desc: 'Deal 6 damage.' },
  { id: 'defend',        name: 'Defend',         weaponClass: 'any',    energyCost: 1, power: 0,  block: 5, cardType: 'skill',  pool: 'starter', animation: 'guard', emoji: '🛡️', desc: 'Gain 5 block.' },

  // ── UNIVERSAL (any weapon) — reward pool ───────────────────────────────
  { id: 'punch',         name: 'Bash',           weaponClass: 'any',    energyCost: 1, power: 8,  block: 0, cardType: 'attack', pool: 'common',   cooldown: 0, element: 'physical', animation: 'dash',    emoji: '💢', desc: 'Deal 8 damage.' },
  { id: 'kick',          name: 'Roundhouse',     weaponClass: 'any',    energyCost: 2, power: 14, block: 0, cardType: 'attack', pool: 'common',   cooldown: 0, element: 'physical', animation: 'spin',    emoji: '🦵', desc: 'Deal 14 damage.' },
  { id: 'guard',         name: 'Iron Wave',      weaponClass: 'any',    energyCost: 1, power: 4,  block: 4, cardType: 'attack', pool: 'common',   cooldown: 0, element: 'physical', animation: 'guard',   emoji: '🌊', desc: 'Deal 4 damage. Gain 4 block.' },
  { id: 'rally',         name: 'Rally',          weaponClass: 'any',    energyCost: 2, power: 0,  block: 0, cardType: 'skill',  pool: 'uncommon', cooldown: 0, element: 'holy',     animation: 'heal',    emoji: '💖', desc: 'Restore 25 HP.', tag: 'heal', heal: 25 },
  { id: 'pommel_strike', name: 'Pommel Strike',  weaponClass: 'any',    energyCost: 1, power: 9,  block: 0, cardType: 'attack', pool: 'uncommon', cooldown: 0, element: 'physical', animation: 'dash',    emoji: '🔨', desc: 'Deal 9 damage. Draw 1 card.', tag: 'draw' },
  { id: 'survivor',      name: 'Survivor',       weaponClass: 'any',    energyCost: 1, power: 0,  block: 8, cardType: 'skill',  pool: 'uncommon', element: 'physical', animation: 'guard',  emoji: '🦴', desc: 'Gain 8 block.' },
  { id: 'second_wind',   name: 'Second Wind',    weaponClass: 'any',    energyCost: 1, power: 0,  block: 0, cardType: 'skill',  pool: 'rare',     element: 'holy',     animation: 'heal',    emoji: '🍃', desc: 'Restore 50 HP.', tag: 'heal', heal: 50 },

  // ── SWORD ──────────────────────────────────────────────────────────────
  { id: 'slash',         name: 'Slash',          weaponClass: 'sword',  energyCost: 1, power: 12, block: 0, cardType: 'attack', pool: 'starter',  cooldown: 0, element: 'physical', animation: 'slash',   emoji: '⚔️', desc: 'Deal 12 damage.' },
  { id: 'heavy_slash',   name: 'Heavy Slash',    weaponClass: 'sword',  energyCost: 2, power: 22, block: 0, cardType: 'attack', pool: 'common',   cooldown: 0, element: 'physical', animation: 'heavy',   emoji: '🗡️', desc: 'Deal 22 damage.' },
  { id: 'riposte',       name: 'Riposte',        weaponClass: 'sword',  energyCost: 1, power: 12, block: 4, cardType: 'attack', pool: 'uncommon', cooldown: 0, element: 'physical', animation: 'parry',   emoji: '✨', desc: 'Deal 12 dmg. Gain 4 block.' },
  { id: 'whirlwind',     name: 'Whirlwind',      weaponClass: 'sword',  energyCost: 2, power: 18, block: 0, cardType: 'attack', pool: 'rare',     cooldown: 0, element: 'physical', animation: 'spin',    emoji: '🌪️', desc: 'Deal 18 damage.' },

  // ── STAFF ──────────────────────────────────────────────────────────────
  { id: 'magic_missile', name: 'Magic Missile',  weaponClass: 'staff',  energyCost: 1, power: 9,  block: 0, cardType: 'attack', pool: 'starter',  cooldown: 0, element: 'arcane',   animation: 'missile', emoji: '✨', desc: 'Deal 9 damage.' },
  { id: 'fireball',      name: 'Fireball',       weaponClass: 'staff',  energyCost: 2, power: 16, block: 0, cardType: 'attack', pool: 'uncommon', cooldown: 0, element: 'fire',     animation: 'fire',    emoji: '🔥', desc: 'Deal 16 dmg. Apply BURN.', tag: 'burn' },
  { id: 'frost_nova',    name: 'Frost Nova',     weaponClass: 'staff',  energyCost: 2, power: 14, block: 0, cardType: 'skill',  pool: 'uncommon', cooldown: 0, element: 'ice',      animation: 'frost',   emoji: '❄️', desc: 'Deal 14 damage.' },
  { id: 'mend',          name: 'Mend',           weaponClass: 'staff',  energyCost: 1, power: 0,  block: 0, cardType: 'skill',  pool: 'common',   cooldown: 0, element: 'holy',     animation: 'heal',    emoji: '💚', desc: 'Restore 30 HP.', tag: 'heal', heal: 30 },

  // ── BOW ────────────────────────────────────────────────────────────────
  { id: 'quick_shot',    name: 'Quick Shot',     weaponClass: 'bow',    energyCost: 1, power: 10, block: 0, cardType: 'attack', pool: 'starter',  cooldown: 0, element: 'physical', animation: 'arrow',   emoji: '🏹', desc: 'Deal 10 damage.' },
  { id: 'aimed_shot',    name: 'Aimed Shot',     weaponClass: 'bow',    energyCost: 2, power: 22, block: 0, cardType: 'attack', pool: 'uncommon', cooldown: 0, element: 'physical', animation: 'arrow',   emoji: '🎯', desc: 'Deal 22 damage.' },
  { id: 'volley',        name: 'Volley',         weaponClass: 'bow',    energyCost: 2, power: 16, block: 0, cardType: 'attack', pool: 'common',   cooldown: 0, element: 'physical', animation: 'volley',  emoji: '🌧️', desc: 'Deal 16 damage.' },
  { id: 'storm_shot',    name: 'Storm Shot',     weaponClass: 'bow',    energyCost: 2, power: 18, block: 0, cardType: 'attack', pool: 'rare',     cooldown: 0, element: 'lightning',animation: 'lightning',emoji: '⚡', desc: 'Deal 18 dmg. STUN.', tag: 'stun' },

  // ── AXE ────────────────────────────────────────────────────────────────
  { id: 'cleave',        name: 'Cleave',         weaponClass: 'axe',    energyCost: 1, power: 14, block: 0, cardType: 'attack', pool: 'starter',  cooldown: 0, element: 'physical', animation: 'slash',   emoji: '🪓', desc: 'Deal 14 damage.' },
  { id: 'rend',          name: 'Rend',           weaponClass: 'axe',    energyCost: 2, power: 20, block: 0, cardType: 'attack', pool: 'uncommon', cooldown: 0, element: 'physical', animation: 'heavy',   emoji: '🩸', desc: 'Deal 20 damage.' },
  { id: 'execute',       name: 'Execute',        weaponClass: 'axe',    energyCost: 3, power: 32, block: 0, cardType: 'attack', pool: 'rare',     cooldown: 0, element: 'physical', animation: 'heavy',   emoji: '💀', desc: 'Deal 32 damage.' },

  // ── DAGGER ─────────────────────────────────────────────────────────────
  { id: 'stab',          name: 'Stab',           weaponClass: 'dagger', energyCost: 1, power: 10, block: 0, cardType: 'attack', pool: 'starter',  cooldown: 0, element: 'physical', animation: 'dash',    emoji: '🗡️', desc: 'Deal 10 damage.' },
  { id: 'backstab',      name: 'Backstab',       weaponClass: 'dagger', energyCost: 2, power: 24, block: 0, cardType: 'attack', pool: 'rare',     cooldown: 0, element: 'physical', animation: 'dash',    emoji: '🌑', desc: 'Deal 24 damage.' },
  { id: 'poison_dart',   name: 'Poison Dart',    weaponClass: 'dagger', energyCost: 1, power: 8,  block: 0, cardType: 'attack', pool: 'common',   cooldown: 0, element: 'poison',   animation: 'poison',  emoji: '☠️', desc: 'Deal 8 dmg. Apply POISON.', tag: 'poison' },

  // ── HAMMER ─────────────────────────────────────────────────────────────
  { id: 'smash',         name: 'Smash',          weaponClass: 'hammer', energyCost: 1, power: 12, block: 0, cardType: 'attack', pool: 'starter',  cooldown: 0, element: 'physical', animation: 'heavy',   emoji: '🔨', desc: 'Deal 12 damage.' },
  { id: 'shockwave',     name: 'Shockwave',      weaponClass: 'hammer', energyCost: 2, power: 20, block: 0, cardType: 'attack', pool: 'uncommon', cooldown: 0, element: 'lightning',animation: 'shockwave',emoji: '💥', desc: 'Deal 20 damage.' },
  { id: 'thunderclap',   name: 'Thunderclap',    weaponClass: 'hammer', energyCost: 3, power: 24, block: 0, cardType: 'attack', pool: 'rare',     cooldown: 0, element: 'lightning',animation: 'lightning',emoji: '⚡', desc: 'Deal 24 dmg. STUN.', tag: 'stun' },

  // ── WAND ───────────────────────────────────────────────────────────────
  { id: 'bolt',          name: 'Arcane Bolt',    weaponClass: 'wand',   energyCost: 1, power: 11, block: 0, cardType: 'attack', pool: 'starter',  cooldown: 0, element: 'arcane',   animation: 'missile', emoji: '✨', desc: 'Deal 11 damage.' },
  { id: 'hex',           name: 'Hex',            weaponClass: 'wand',   energyCost: 1, power: 14, block: 0, cardType: 'attack', pool: 'uncommon', cooldown: 0, element: 'shadow',   animation: 'shadow',  emoji: '🌀', desc: 'Deal 14 damage.' },
  { id: 'chaos_blast',   name: 'Chaos Blast',    weaponClass: 'wand',   energyCost: 2, power: 22, block: 0, cardType: 'attack', pool: 'rare',     cooldown: 0, element: 'arcane',   animation: 'fire',    emoji: '💫', desc: 'Deal 22 damage.' },

  // ── LANCE ──────────────────────────────────────────────────────────────
  { id: 'pierce',        name: 'Pierce',         weaponClass: 'lance',  energyCost: 1, power: 14, block: 0, cardType: 'attack', pool: 'starter',  cooldown: 0, element: 'physical', animation: 'dash',    emoji: '🔱', desc: 'Deal 14 damage.' },
  { id: 'charge',        name: 'Charge',         weaponClass: 'lance',  energyCost: 2, power: 24, block: 0, cardType: 'attack', pool: 'rare',     cooldown: 0, element: 'physical', animation: 'dash',    emoji: '🐎', desc: 'Deal 24 damage.' },
  { id: 'celestial',     name: 'Celestial Bolt', weaponClass: 'lance',  energyCost: 2, power: 20, block: 0, cardType: 'attack', pool: 'uncommon', cooldown: 0, element: 'holy',     animation: 'lightning',emoji: '☄️', desc: 'Deal 20 damage.' },

  // ── SCYTHE ─────────────────────────────────────────────────────────────
  { id: 'reap',          name: 'Reap',           weaponClass: 'scythe', energyCost: 1, power: 16, block: 0, cardType: 'attack', pool: 'starter',  cooldown: 0, element: 'shadow',   animation: 'slash',   emoji: '💀', desc: 'Deal 16 damage.' },
  { id: 'soul_drain',    name: 'Soul Drain',     weaponClass: 'scythe', energyCost: 2, power: 14, block: 0, cardType: 'attack', pool: 'uncommon', cooldown: 0, element: 'shadow',   animation: 'shadow',  emoji: '👻', desc: 'Deal 14 dmg. Heal half.', tag: 'lifesteal' },
  { id: 'death_blossom', name: "Death's Blossom",weaponClass: 'scythe', energyCost: 3, power: 28, block: 0, cardType: 'attack', pool: 'rare',     cooldown: 0, element: 'shadow',   animation: 'shadow',  emoji: '🌑', desc: 'Deal 28 damage.' },
];

// Lookup by id
const cardById = (id) => CARDS.find(c => c.id === id);
// Backwards-compat alias (existing imports use attackById)
const attackById = cardById;

// All cards usable as starter / reward for a given weapon class.
const cardsForClass = (weaponClass) => {
  if (!weaponClass) return CARDS.filter(c => c.weaponClass === 'any');
  return CARDS.filter(c => c.weaponClass === 'any' || c.weaponClass === weaponClass);
};
const attacksForClass = cardsForClass; // alias

// Build the starter deck for a given weapon class: 5 Strike + 4 Defend + 1
// signature card from the class (or another Strike if classless).
const starterDeck = (weaponClass) => {
  const deck = [];
  for (let i = 0; i < 5; i++) deck.push('strike');
  for (let i = 0; i < 4; i++) deck.push('defend');
  if (weaponClass) {
    const classStarter = CARDS.find(c => c.weaponClass === weaponClass && c.pool === 'starter');
    deck.push(classStarter ? classStarter.id : 'strike');
  } else {
    deck.push('strike');
  }
  return deck;
};

// Reward-card pool: cards eligible to drop after combat, weighted by depth.
// Higher tier monsters drop better cards.
const rewardPool = (weaponClass, monsterTier) => {
  const all = cardsForClass(weaponClass).filter(c => c.pool !== 'starter');
  if (!monsterTier) return all;
  // Tier 1-2: commons. Tier 3: uncommons. Tier 4+: rare.
  if (monsterTier <= 2) return all.filter(c => c.pool === 'common');
  if (monsterTier <= 3) return all.filter(c => c.pool === 'common' || c.pool === 'uncommon');
  return all.filter(c => c.pool !== 'starter');
};

// Pick N distinct random cards from a pool.
const pickRewardCards = (pool, count = 3) => {
  if (!pool.length) return [];
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// Kept exports for legacy callers
const ATTACKS = CARDS;
const DEFAULT_LOADOUT = ['strike', 'strike', 'defend', 'defend'];
const defaultLoadoutFor = (weaponClass) => starterDeck(weaponClass).slice(0, 4);

module.exports = {
  CARDS, ATTACKS,
  cardById, attackById,
  cardsForClass, attacksForClass,
  starterDeck, rewardPool, pickRewardCards,
  DEFAULT_LOADOUT, defaultLoadoutFor,
};
