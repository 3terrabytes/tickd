// Relics — passive items collected during a dungeon run. Effects are
// declarative (the frontend reads the `effect` field and applies it at the
// matching hook). Each run starts with no relics; they're picked up from
// treasure rooms, events, and the shop.
//
// `hook` values used by the frontend:
//   'combat_start'  — triggers at the start of each combat
//   'turn_start'    — at the start of every player turn
//   'on_kill'       — after defeating any monster
//   'on_card_play'  — every time the player plays a card
//   'passive'       — applied as a stat modifier (max hp, etc.)
//
// `effect`:
//   { type: 'heal',        value: N }
//   { type: 'block',       value: N }
//   { type: 'gold',        value: N }
//   { type: 'max_hp',      value: N }
//   { type: 'energy',      value: N }
//   { type: 'damage_bonus',value: N }   // extra dmg on all attacks
//   { type: 'first_hit_bonus', value: N } // extra dmg first card of combat

const RELICS = [
  // ── Common ────────────────────────────────────────────────────────────
  { id: 'burning_blood',  name: 'Burning Blood', rarity: 'common', emoji: '🩸', desc: 'Heal 6 HP at the start of each combat.', hook: 'combat_start', effect: { type: 'heal', value: 6 } },
  { id: 'ring_of_pain',   name: 'Ring of Pain',  rarity: 'common', emoji: '💍', desc: 'Start each combat with 5 block.',          hook: 'combat_start', effect: { type: 'block', value: 5 } },
  { id: 'lucky_coin',     name: 'Lucky Coin',    rarity: 'common', emoji: '🪙', desc: 'Gain 1 gold after every combat.',          hook: 'on_kill',       effect: { type: 'gold', value: 1 } },
  { id: 'mark_of_pain',   name: 'Mark of Pain',  rarity: 'common', emoji: '⚔️', desc: '+1 damage on the first card each combat.', hook: 'first_hit_bonus', effect: { type: 'first_hit_bonus', value: 4 } },

  // ── Uncommon ──────────────────────────────────────────────────────────
  { id: 'toy_hammer',     name: 'Toy Hammer',    rarity: 'uncommon', emoji: '🔨', desc: '+1 damage on every card.', hook: 'passive', effect: { type: 'damage_bonus', value: 1 } },
  { id: 'lucky_foot',     name: 'Lucky Foot',    rarity: 'uncommon', emoji: '🐾', desc: 'Once per combat, ignore a hit (5+ dmg).', hook: 'passive', effect: { type: 'dodge_once', value: 1 } },
  { id: 'iron_constitution', name: 'Iron Constitution', rarity: 'uncommon', emoji: '🦴', desc: '+25 max HP.', hook: 'passive', effect: { type: 'max_hp', value: 25 } },

  // ── Rare ──────────────────────────────────────────────────────────────
  { id: 'sundial',        name: 'Sundial',       rarity: 'rare', emoji: '🌞', desc: 'Every 3rd turn: +1 energy that turn.', hook: 'passive', effect: { type: 'sundial', value: 1 } },
  { id: 'phoenix_egg',    name: 'Phoenix Egg',   rarity: 'rare', emoji: '🥚', desc: 'When you would die, heal to 30% HP once.', hook: 'passive', effect: { type: 'revive', value: 0.3 } },
  { id: 'time_eater',     name: 'Time Eater',    rarity: 'rare', emoji: '⏱', desc: 'Draw 1 extra card each turn.', hook: 'passive', effect: { type: 'extra_draw', value: 1 } },

  // ── Mythic (Legends shop equivalent) ──────────────────────────────────
  { id: 'sundered_heart', name: 'Sundered Heart',rarity: 'mythic', emoji: '💖', desc: 'Heal 12 HP at the start of each combat.', hook: 'combat_start', effect: { type: 'heal', value: 12 } },
  { id: 'omega_seal',     name: 'Omega Seal',    rarity: 'mythic', emoji: 'Ω',  desc: '+1 energy every turn.', hook: 'passive', effect: { type: 'energy', value: 1 } },
];

const relicById = (id) => RELICS.find(r => r.id === id);

// Pick a random relic of the given rarity, or any if not specified.
const pickRelic = (rarity) => {
  const pool = rarity ? RELICS.filter(r => r.rarity === rarity) : RELICS;
  return pool[Math.floor(Math.random() * pool.length)];
};

module.exports = { RELICS, relicById, pickRelic };
