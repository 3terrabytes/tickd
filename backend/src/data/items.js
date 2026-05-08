const RARITIES = {
  common:    { label: 'Common',    color: '#9ca3af', glow: '#9ca3af33', magic: [0, 5] },
  rare:      { label: 'Rare',      color: '#3b82f6', glow: '#3b82f633', magic: [6, 15] },
  epic:      { label: 'Epic',      color: '#8b5cf6', glow: '#8b5cf633', magic: [16, 30] },
  legendary: { label: 'Legendary', color: '#f59e0b', glow: '#f59e0b33', magic: [31, 50] },
};

const ITEMS = [
  // WEAPONS
  { id: 'sword_iron',     type: 'weapon', name: 'Iron Sword',       rarity: 'common',    cost: 80,   magic: 2,  emoji: '🗡️',  desc: 'A trusty blade for any adventurer.' },
  { id: 'sword_silver',   type: 'weapon', name: 'Silver Sword',     rarity: 'rare',      cost: 220,  magic: 10, emoji: '⚔️',  desc: 'Gleams with focused power.' },
  { id: 'staff_oak',      type: 'weapon', name: 'Oak Staff',        rarity: 'common',    cost: 70,   magic: 4,  emoji: '🪄',  desc: 'Channels minor arcane energy.' },
  { id: 'staff_arcane',   type: 'weapon', name: 'Arcane Staff',     rarity: 'epic',      cost: 500,  magic: 24, emoji: '✨',  desc: 'Hums with unstable magic.' },
  { id: 'bow_hunters',    type: 'weapon', name: "Hunter's Bow",     rarity: 'common',    cost: 90,   magic: 3,  emoji: '🏹',  desc: 'Swift and accurate.' },
  { id: 'bow_elven',      type: 'weapon', name: 'Elven Bow',        rarity: 'rare',      cost: 280,  magic: 12, emoji: '🎯',  desc: 'Carved from ancient wood.' },
  { id: 'axe_battle',     type: 'weapon', name: 'Battle Axe',       rarity: 'rare',      cost: 240,  magic: 8,  emoji: '🪓',  desc: 'Heavy and devastating.' },
  { id: 'blade_soul',     type: 'weapon', name: 'Soul Blade',       rarity: 'legendary', cost: 1200, magic: 45, emoji: '🌟',  desc: 'Forged from the tears of fallen heroes.' },
  { id: 'wand_chaos',     type: 'weapon', name: 'Chaos Wand',       rarity: 'legendary', cost: 1500, magic: 50, emoji: '💫',  desc: 'Reality bends around its tip.' },

  // ARMOR
  { id: 'armor_leather',  type: 'armor',  name: 'Leather Armor',    rarity: 'common',    cost: 60,   magic: 1,  emoji: '🥋',  desc: 'Light and flexible.' },
  { id: 'armor_chain',    type: 'armor',  name: 'Chainmail',        rarity: 'common',    cost: 100,  magic: 3,  emoji: '🛡️',  desc: 'Solid protection.' },
  { id: 'armor_plate',    type: 'armor',  name: 'Plate Armor',      rarity: 'rare',      cost: 300,  magic: 9,  emoji: '⚙️',  desc: 'Heavy but near-impenetrable.' },
  { id: 'robe_mage',      type: 'armor',  name: 'Mage Robes',       rarity: 'rare',      cost: 260,  magic: 14, emoji: '👘',  desc: 'Woven with arcane thread.' },
  { id: 'cloak_shadow',   type: 'armor',  name: 'Shadow Cloak',     rarity: 'epic',      cost: 550,  magic: 22, emoji: '🌑',  desc: 'Shifts between shadows.' },
  { id: 'armor_dragon',   type: 'armor',  name: 'Dragonscale Mail', rarity: 'epic',      cost: 620,  magic: 28, emoji: '🐉',  desc: 'Scales of an ancient dragon.' },
  { id: 'armor_celestial',type: 'armor',  name: 'Celestial Plate',  rarity: 'legendary', cost: 1400, magic: 46, emoji: '☀️',  desc: 'Blessed by the gods themselves.' },

  // BANNERS
  { id: 'banner_red',     type: 'banner', name: 'Crimson Banner',   rarity: 'common',    cost: 50,   magic: 0,  color: 'linear-gradient(90deg,#7f1d1d,#dc2626)', desc: 'Bold and fierce.' },
  { id: 'banner_blue',    type: 'banner', name: 'Ocean Banner',     rarity: 'common',    cost: 50,   magic: 0,  color: 'linear-gradient(90deg,#1e3a5f,#3b82f6)', desc: 'Cool and steady.' },
  { id: 'banner_purple',  type: 'banner', name: 'Arcane Banner',    rarity: 'rare',      cost: 180,  magic: 0,  color: 'linear-gradient(90deg,#3b0764,#8b5cf6)', desc: 'Shimmers with magic.' },
  { id: 'banner_gold',    type: 'banner', name: 'Golden Banner',    rarity: 'rare',      cost: 200,  magic: 0,  color: 'linear-gradient(90deg,#78350f,#f59e0b)', desc: 'For champions only.' },
  { id: 'banner_galaxy',  type: 'banner', name: 'Galaxy Banner',    rarity: 'epic',      cost: 480,  magic: 0,  color: 'linear-gradient(90deg,#0f172a,#6366f1,#ec4899)', desc: 'The cosmos itself.' },
  { id: 'banner_aurora',  type: 'banner', name: 'Aurora Banner',    rarity: 'legendary', cost: 1000, magic: 0,  color: 'linear-gradient(90deg,#06b6d4,#8b5cf6,#ec4899,#f59e0b)', desc: 'Dances with living light.' },

  // BADGES
  { id: 'badge_flame',    type: 'badge',  name: 'Flame Badge',      rarity: 'common',    cost: 40,   magic: 0,  emoji: '🔥',  desc: 'For the dedicated.' },
  { id: 'badge_star',     type: 'badge',  name: 'Star Badge',       rarity: 'common',    cost: 40,   magic: 0,  emoji: '⭐',  desc: 'A shining mark.' },
  { id: 'badge_skull',    type: 'badge',  name: 'Skull Badge',      rarity: 'rare',      cost: 160,  magic: 0,  emoji: '💀',  desc: 'Fear me.' },
  { id: 'badge_crown',    type: 'badge',  name: 'Crown Badge',      rarity: 'rare',      cost: 180,  magic: 0,  emoji: '👑',  desc: 'Royalty.' },
  { id: 'badge_dragon',   type: 'badge',  name: 'Dragon Badge',     rarity: 'epic',      cost: 420,  magic: 0,  emoji: '🐲',  desc: 'Dragonslayer.' },
  { id: 'badge_legend',   type: 'badge',  name: 'Legend Badge',     rarity: 'legendary', cost: 900,  magic: 0,  emoji: '🏆',  desc: 'Only the greatest earn this.' },
];

const itemById = (id) => ITEMS.find(i => i.id === id);

module.exports = { ITEMS, RARITIES, itemById };
