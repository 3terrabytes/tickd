const RARITIES = {
  common:    { label: 'Common',    color: '#9ca3af', glow: '#9ca3af33', magic: [0, 5] },
  rare:      { label: 'Rare',      color: '#3b82f6', glow: '#3b82f633', magic: [6, 15] },
  epic:      { label: 'Epic',      color: '#8b5cf6', glow: '#8b5cf633', magic: [16, 30] },
  legendary: { label: 'Legendary', color: '#f59e0b', glow: '#f59e0b33', magic: [31, 50] },
};

const ITEMS = [
  // WEAPONS
  { id: 'sword_iron',      type: 'weapon', name: 'Iron Sword',         rarity: 'common',    cost: 80,   magic: 2,  emoji: '🗡️',  desc: 'A trusty blade for any adventurer.' },
  { id: 'sword_silver',    type: 'weapon', name: 'Silver Sword',       rarity: 'rare',      cost: 220,  magic: 10, emoji: '⚔️',  desc: 'Gleams with focused power.' },
  { id: 'sword_obsidian',  type: 'weapon', name: 'Obsidian Sword',     rarity: 'epic',      cost: 580,  magic: 26, emoji: '🔪',  desc: 'Carved from volcanic glass.' },
  { id: 'staff_oak',       type: 'weapon', name: 'Oak Staff',          rarity: 'common',    cost: 70,   magic: 4,  emoji: '🪄',  desc: 'Channels minor arcane energy.' },
  { id: 'staff_arcane',    type: 'weapon', name: 'Arcane Staff',       rarity: 'epic',      cost: 500,  magic: 24, emoji: '✨',  desc: 'Hums with unstable magic.' },
  { id: 'staff_void',      type: 'weapon', name: 'Void Staff',         rarity: 'legendary', cost: 1300, magic: 48, emoji: '🌌',  desc: 'Tears rifts in reality.' },
  { id: 'bow_hunters',     type: 'weapon', name: "Hunter's Bow",       rarity: 'common',    cost: 90,   magic: 3,  emoji: '🏹',  desc: 'Swift and accurate.' },
  { id: 'bow_elven',       type: 'weapon', name: 'Elven Bow',          rarity: 'rare',      cost: 280,  magic: 12, emoji: '🎯',  desc: 'Carved from ancient wood.' },
  { id: 'bow_storm',       type: 'weapon', name: 'Storm Bow',          rarity: 'epic',      cost: 560,  magic: 22, emoji: '⚡',  desc: 'Arrows crackle with lightning.' },
  { id: 'axe_battle',      type: 'weapon', name: 'Battle Axe',         rarity: 'rare',      cost: 240,  magic: 8,  emoji: '🪓',  desc: 'Heavy and devastating.' },
  { id: 'axe_rune',        type: 'weapon', name: 'Runic Axe',          rarity: 'epic',      cost: 520,  magic: 20, emoji: '🔱',  desc: 'Ancient runes glow along the blade.' },
  { id: 'dagger_shadow',   type: 'weapon', name: 'Shadow Dagger',      rarity: 'rare',      cost: 260,  magic: 11, emoji: '🌑',  desc: 'Strike from the darkness.' },
  { id: 'hammer_storm',    type: 'weapon', name: 'Stormhammer',        rarity: 'epic',      cost: 600,  magic: 25, emoji: '🔨',  desc: 'Thunder follows every swing.' },
  { id: 'scythe_death',    type: 'weapon', name: "Death's Scythe",     rarity: 'legendary', cost: 1600, magic: 50, emoji: '💀',  desc: 'Harvests the souls of the fallen.' },
  { id: 'blade_soul',      type: 'weapon', name: 'Soul Blade',         rarity: 'legendary', cost: 1200, magic: 45, emoji: '🌟',  desc: 'Forged from the tears of fallen heroes.' },
  { id: 'wand_chaos',      type: 'weapon', name: 'Chaos Wand',         rarity: 'legendary', cost: 1500, magic: 50, emoji: '💫',  desc: 'Reality bends around its tip.' },
  { id: 'lance_celestial', type: 'weapon', name: 'Celestial Lance',    rarity: 'legendary', cost: 1400, magic: 47, emoji: '☄️',  desc: 'Thrown by the gods themselves.' },

  // ARMOR
  { id: 'armor_leather',   type: 'armor',  name: 'Leather Armor',      rarity: 'common',    cost: 60,   magic: 1,  emoji: '🥋',  desc: 'Light and flexible.' },
  { id: 'armor_chain',     type: 'armor',  name: 'Chainmail',          rarity: 'common',    cost: 100,  magic: 3,  emoji: '🛡️',  desc: 'Solid protection.' },
  { id: 'armor_plate',     type: 'armor',  name: 'Plate Armor',        rarity: 'rare',      cost: 300,  magic: 9,  emoji: '⚙️',  desc: 'Heavy but near-impenetrable.' },
  { id: 'robe_mage',       type: 'armor',  name: 'Mage Robes',         rarity: 'rare',      cost: 260,  magic: 14, emoji: '👘',  desc: 'Woven with arcane thread.' },
  { id: 'robe_archmage',   type: 'armor',  name: 'Archmage Robes',     rarity: 'epic',      cost: 580,  magic: 27, emoji: '🎭',  desc: 'Worn by the great sorcerers.' },
  { id: 'cloak_shadow',    type: 'armor',  name: 'Shadow Cloak',       rarity: 'epic',      cost: 550,  magic: 22, emoji: '🌒',  desc: 'Shifts between shadows.' },
  { id: 'armor_dragon',    type: 'armor',  name: 'Dragonscale Mail',   rarity: 'epic',      cost: 620,  magic: 28, emoji: '🐉',  desc: 'Scales of an ancient dragon.' },
  { id: 'armor_celestial', type: 'armor',  name: 'Celestial Plate',    rarity: 'legendary', cost: 1400, magic: 46, emoji: '☀️',  desc: 'Blessed by the gods themselves.' },
  { id: 'armor_void',      type: 'armor',  name: 'Void Shroud',        rarity: 'legendary', cost: 1350, magic: 44, emoji: '🌌',  desc: 'Woven from the fabric of space.' },
  { id: 'hood_assassin',   type: 'armor',  name: "Assassin's Hood",    rarity: 'rare',      cost: 290,  magic: 13, emoji: '🕶️',  desc: 'You were never here.' },
  { id: 'cloak_phoenix',   type: 'armor',  name: 'Phoenix Cloak',      rarity: 'legendary', cost: 1500, magic: 48, emoji: '🦅',  desc: 'Rise from the ashes.' },

  // BANNERS
  { id: 'banner_red',      type: 'banner', name: 'Crimson Banner',     rarity: 'common',    cost: 50,   magic: 0,  color: 'linear-gradient(90deg,#7f1d1d,#dc2626)', desc: 'Bold and fierce.' },
  { id: 'banner_blue',     type: 'banner', name: 'Ocean Banner',       rarity: 'common',    cost: 50,   magic: 0,  color: 'linear-gradient(90deg,#1e3a5f,#3b82f6)', desc: 'Cool and steady.' },
  { id: 'banner_green',    type: 'banner', name: 'Forest Banner',      rarity: 'common',    cost: 50,   magic: 0,  color: 'linear-gradient(90deg,#14532d,#22c55e)', desc: 'Rooted and enduring.' },
  { id: 'banner_purple',   type: 'banner', name: 'Arcane Banner',      rarity: 'rare',      cost: 180,  magic: 0,  color: 'linear-gradient(90deg,#3b0764,#8b5cf6)', desc: 'Shimmers with magic.' },
  { id: 'banner_gold',     type: 'banner', name: 'Golden Banner',      rarity: 'rare',      cost: 200,  magic: 0,  color: 'linear-gradient(90deg,#78350f,#f59e0b)', desc: 'For champions only.' },
  { id: 'banner_midnight', type: 'banner', name: 'Midnight Banner',    rarity: 'rare',      cost: 190,  magic: 0,  color: 'linear-gradient(90deg,#0f0f2e,#3730a3)', desc: 'Draped in night.' },
  { id: 'banner_galaxy',   type: 'banner', name: 'Galaxy Banner',      rarity: 'epic',      cost: 480,  magic: 0,  color: 'linear-gradient(90deg,#0f172a,#6366f1,#ec4899)', desc: 'The cosmos itself.' },
  { id: 'banner_flame',    type: 'banner', name: 'Inferno Banner',     rarity: 'epic',      cost: 460,  magic: 0,  color: 'linear-gradient(90deg,#431407,#ea580c,#fbbf24)', desc: 'Burns eternal.' },
  { id: 'banner_storm',    type: 'banner', name: 'Tempest Banner',     rarity: 'epic',      cost: 470,  magic: 0,  color: 'linear-gradient(90deg,#0c1445,#0ea5e9,#a5f3fc)', desc: 'Lightning in the sky.' },
  { id: 'banner_aurora',   type: 'banner', name: 'Aurora Banner',      rarity: 'legendary', cost: 1000, magic: 0,  color: 'linear-gradient(90deg,#06b6d4,#8b5cf6,#ec4899,#f59e0b)', desc: 'Dances with living light.' },
  { id: 'banner_void',     type: 'banner', name: 'Void Banner',        rarity: 'legendary', cost: 980,  magic: 0,  color: 'linear-gradient(90deg,#000000,#1e1b4b,#7c3aed,#000000)', desc: 'Swallows all light.' },

  // BADGES
  { id: 'badge_flame',     type: 'badge',  name: 'Flame Badge',        rarity: 'common',    cost: 40,   magic: 0,  emoji: '🔥',  desc: 'For the dedicated.' },
  { id: 'badge_star',      type: 'badge',  name: 'Star Badge',         rarity: 'common',    cost: 40,   magic: 0,  emoji: '⭐',  desc: 'A shining mark.' },
  { id: 'badge_bolt',      type: 'badge',  name: 'Lightning Badge',    rarity: 'common',    cost: 45,   magic: 0,  emoji: '⚡',  desc: 'Fast and electric.' },
  { id: 'badge_leaf',      type: 'badge',  name: 'Leaf Badge',         rarity: 'common',    cost: 35,   magic: 0,  emoji: '🍃',  desc: 'Grounded and consistent.' },
  { id: 'badge_skull',     type: 'badge',  name: 'Skull Badge',        rarity: 'rare',      cost: 160,  magic: 0,  emoji: '💀',  desc: 'Fear me.' },
  { id: 'badge_crown',     type: 'badge',  name: 'Crown Badge',        rarity: 'rare',      cost: 180,  magic: 0,  emoji: '👑',  desc: 'Royalty.' },
  { id: 'badge_gem',       type: 'badge',  name: 'Gem Badge',          rarity: 'rare',      cost: 170,  magic: 0,  emoji: '💎',  desc: 'Precious and rare.' },
  { id: 'badge_moon',      type: 'badge',  name: 'Moon Badge',         rarity: 'rare',      cost: 155,  magic: 0,  emoji: '🌙',  desc: 'A night owl.' },
  { id: 'badge_dragon',    type: 'badge',  name: 'Dragon Badge',       rarity: 'epic',      cost: 420,  magic: 0,  emoji: '🐲',  desc: 'Dragonslayer.' },
  { id: 'badge_ghost',     type: 'badge',  name: 'Ghost Badge',        rarity: 'epic',      cost: 400,  magic: 0,  emoji: '👻',  desc: 'Haunt the leaderboard.' },
  { id: 'badge_phoenix',   type: 'badge',  name: 'Phoenix Badge',      rarity: 'epic',      cost: 440,  magic: 0,  emoji: '🦅',  desc: 'Never give up.' },
  { id: 'badge_legend',    type: 'badge',  name: 'Legend Badge',       rarity: 'legendary', cost: 900,  magic: 0,  emoji: '🏆',  desc: 'Only the greatest earn this.' },
  { id: 'badge_infinity',  type: 'badge',  name: 'Infinity Badge',     rarity: 'legendary', cost: 950,  magic: 0,  emoji: '♾️',  desc: 'Beyond measure.' },
  { id: 'badge_void',      type: 'badge',  name: 'Void Badge',         rarity: 'legendary', cost: 1000, magic: 0,  emoji: '🌌',  desc: 'From beyond the stars.' },

  // COMPANIONS
  { id: 'pet_cat',         type: 'companion', name: 'Habit Cat',       rarity: 'common',    cost: 120,  magic: 5,  emoji: '🐱',  desc: 'Meows judgementally if you miss a day.' },
  { id: 'pet_fox',         type: 'companion', name: 'Spirit Fox',      rarity: 'rare',      cost: 350,  magic: 15, emoji: '🦊',  desc: 'Cunning and swift. Boosts your XP sense.' },
  { id: 'pet_owl',         type: 'companion', name: 'Wise Owl',        rarity: 'epic',      cost: 600,  magic: 28, emoji: '🦉',  desc: 'Ancient wisdom flows through it.' },
  { id: 'pet_dragon',      type: 'companion', name: 'Mini Dragon',     rarity: 'legendary', cost: 1800, magic: 50, emoji: '🐲',  desc: 'A legendary companion. Fiercely loyal.' },

  // CONSUMABLES
  { id: 'baguette_stale',  type: 'consumable', name: 'Stale Baguette', rarity: 'common',    cost: 10,   magic: 0,  emoji: '🥖',  desc: 'A crusty baguette of mysterious origin. Somehow still here.' },
  { id: 'potion_xp',       type: 'consumable', name: 'XP Potion',      rarity: 'rare',      cost: 300,  magic: 0,  emoji: '🧪',  desc: 'Grants a burst of XP. Use wisely.' },
  { id: 'scroll_streak',   type: 'consumable', name: 'Streak Scroll',  rarity: 'epic',      cost: 700,  magic: 0,  emoji: '📜',  desc: 'Protect your streak for one missed day.' },
  { id: 'elixir_gold',     type: 'consumable', name: 'Golden Elixir',  rarity: 'legendary', cost: 1100, magic: 0,  emoji: '✨',  desc: 'Transmutes hard work into pure gold XP.' },

  // TITLES
  { id: 'title_grinder',   type: 'title',  name: '"The Grinder"',      rarity: 'rare',      cost: 250,  magic: 0,  emoji: '⚙️',  desc: 'Never stops. Never rests.' },
  { id: 'title_phantom',   type: 'title',  name: '"The Phantom"',      rarity: 'epic',      cost: 550,  magic: 0,  emoji: '👁️',  desc: 'Appears from nowhere to top the board.' },
  { id: 'title_eternal',   type: 'title',  name: '"The Eternal"',      rarity: 'legendary', cost: 1200, magic: 0,  emoji: '♾️',  desc: 'Streaks that outlast empires.' },
];

const itemById = (id) => ITEMS.find(i => i.id === id);

module.exports = { ITEMS, RARITIES, itemById };
