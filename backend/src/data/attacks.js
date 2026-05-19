// Attacks available in the dungeon mini-game.
// Each attack belongs to a `weaponClass`. The player can only equip attacks
// whose weaponClass matches their currently equipped weapon's class (with
// 'any' being usable by everyone).
//
// power      = base damage. Final dmg = power + equipped magic
// cooldown   = turns until reusable (0 = always available)
// element    = used for animation tint + future resistance system
// animation  = key the frontend uses to play the right effect
//
// kept deliberately ASCII-only in identifiers so we can url-encode safely.

const ATTACKS = [
  // ── universal (any weapon) ───────────────────────────────────────────
  { id: 'punch',         name: 'Punch',          weaponClass: 'any',    power: 8,  cooldown: 0, element: 'physical', animation: 'dash',    emoji: '👊', desc: 'A no-nonsense fist to the face.' },
  { id: 'kick',          name: 'Roundhouse',     weaponClass: 'any',    power: 12, cooldown: 1, element: 'physical', animation: 'spin',    emoji: '🦵', desc: 'High-impact kick. Brief recovery after.' },
  { id: 'guard',         name: 'Guard',          weaponClass: 'any',    power: 0,  cooldown: 0, element: 'physical', animation: 'guard',   emoji: '🛡️', desc: 'Reduce incoming damage by 60% this turn.', tag: 'defend' },
  { id: 'rally',         name: 'Rally',          weaponClass: 'any',    power: 0,  cooldown: 4, element: 'holy',     animation: 'heal',    emoji: '💖', desc: 'Restore 25 HP.', tag: 'heal', heal: 25 },

  // ── sword ─────────────────────────────────────────────────────────────
  { id: 'slash',         name: 'Slash',          weaponClass: 'sword',  power: 14, cooldown: 0, element: 'physical', animation: 'slash',   emoji: '⚔️', desc: 'A clean, fast cut.' },
  { id: 'heavy_slash',   name: 'Heavy Slash',    weaponClass: 'sword',  power: 26, cooldown: 2, element: 'physical', animation: 'heavy',   emoji: '🗡️', desc: 'A wide, punishing swing.' },
  { id: 'riposte',       name: 'Riposte',        weaponClass: 'sword',  power: 18, cooldown: 1, element: 'physical', animation: 'parry',   emoji: '✨', desc: 'Counter-strike on the back foot.' },
  { id: 'whirlwind',     name: 'Whirlwind',      weaponClass: 'sword',  power: 22, cooldown: 3, element: 'physical', animation: 'spin',    emoji: '🌪️', desc: 'Spin attack — hits hard but leaves you open.' },

  // ── staff ─────────────────────────────────────────────────────────────
  { id: 'magic_missile', name: 'Magic Missile',  weaponClass: 'staff',  power: 16, cooldown: 0, element: 'arcane',   animation: 'missile', emoji: '✨', desc: 'Arcane projectile. Never misses.' },
  { id: 'fireball',      name: 'Fireball',       weaponClass: 'staff',  power: 24, cooldown: 2, element: 'fire',     animation: 'fire',    emoji: '🔥', desc: 'A roaring sphere of flame. Applies BURN.', tag: 'burn' },
  { id: 'frost_nova',    name: 'Frost Nova',     weaponClass: 'staff',  power: 20, cooldown: 2, element: 'ice',      animation: 'frost',   emoji: '❄️', desc: 'A shockwave of cold.' },
  { id: 'mend',          name: 'Mend',           weaponClass: 'staff',  power: 0,  cooldown: 3, element: 'holy',     animation: 'heal',    emoji: '💚', desc: 'Restore 40 HP.', tag: 'heal', heal: 40 },

  // ── bow ───────────────────────────────────────────────────────────────
  { id: 'quick_shot',    name: 'Quick Shot',     weaponClass: 'bow',    power: 13, cooldown: 0, element: 'physical', animation: 'arrow',   emoji: '🏹', desc: 'A swift, low-commitment arrow.' },
  { id: 'aimed_shot',    name: 'Aimed Shot',     weaponClass: 'bow',    power: 30, cooldown: 3, element: 'physical', animation: 'arrow',   emoji: '🎯', desc: 'Slow draw, devastating hit.' },
  { id: 'volley',        name: 'Volley',         weaponClass: 'bow',    power: 22, cooldown: 2, element: 'physical', animation: 'volley',  emoji: '🌧️', desc: 'A rain of arrows.' },
  { id: 'storm_shot',    name: 'Storm Shot',     weaponClass: 'bow',    power: 22, cooldown: 2, element: 'lightning',animation: 'lightning',emoji: '⚡', desc: 'Crackling lightning. Chance to STUN.', tag: 'stun' },

  // ── axe ───────────────────────────────────────────────────────────────
  { id: 'cleave',        name: 'Cleave',         weaponClass: 'axe',    power: 18, cooldown: 0, element: 'physical', animation: 'slash',   emoji: '🪓', desc: 'A brutal downward chop.' },
  { id: 'rend',          name: 'Rend',           weaponClass: 'axe',    power: 24, cooldown: 2, element: 'physical', animation: 'heavy',   emoji: '🩸', desc: 'Tears flesh and armor alike.' },
  { id: 'execute',       name: 'Execute',        weaponClass: 'axe',    power: 36, cooldown: 4, element: 'physical', animation: 'heavy',   emoji: '💀', desc: 'A finisher. Wide swing, huge damage.' },

  // ── dagger ────────────────────────────────────────────────────────────
  { id: 'stab',          name: 'Stab',           weaponClass: 'dagger', power: 12, cooldown: 0, element: 'physical', animation: 'dash',    emoji: '🗡️', desc: 'A quick, precise jab.' },
  { id: 'backstab',      name: 'Backstab',       weaponClass: 'dagger', power: 28, cooldown: 3, element: 'physical', animation: 'dash',    emoji: '🌑', desc: 'Strike from the shadows.' },
  { id: 'poison_dart',   name: 'Poison Dart',    weaponClass: 'dagger', power: 14, cooldown: 1, element: 'poison',   animation: 'poison',  emoji: '☠️', desc: 'Venomous. Applies POISON for 3 turns.', tag: 'poison' },

  // ── hammer ────────────────────────────────────────────────────────────
  { id: 'smash',         name: 'Smash',          weaponClass: 'hammer', power: 20, cooldown: 0, element: 'physical', animation: 'heavy',   emoji: '🔨', desc: 'Crushing overhead blow.' },
  { id: 'shockwave',     name: 'Shockwave',      weaponClass: 'hammer', power: 26, cooldown: 2, element: 'lightning',animation: 'shockwave',emoji: '💥', desc: 'Ground-shaking impact.' },
  { id: 'thunderclap',   name: 'Thunderclap',    weaponClass: 'hammer', power: 28, cooldown: 3, element: 'lightning',animation: 'lightning',emoji: '⚡', desc: 'Storm-fueled finisher. STUNS the target.', tag: 'stun' },

  // ── wand ──────────────────────────────────────────────────────────────
  { id: 'bolt',          name: 'Arcane Bolt',    weaponClass: 'wand',   power: 14, cooldown: 0, element: 'arcane',   animation: 'missile', emoji: '✨', desc: 'A focused beam of magic.' },
  { id: 'hex',           name: 'Hex',            weaponClass: 'wand',   power: 18, cooldown: 2, element: 'shadow',   animation: 'shadow',  emoji: '🌀', desc: 'Curses the target.' },
  { id: 'chaos_blast',   name: 'Chaos Blast',    weaponClass: 'wand',   power: 30, cooldown: 3, element: 'arcane',   animation: 'fire',    emoji: '💫', desc: 'Reality bends around the impact.' },

  // ── lance ─────────────────────────────────────────────────────────────
  { id: 'pierce',        name: 'Pierce',         weaponClass: 'lance',  power: 18, cooldown: 0, element: 'physical', animation: 'dash',    emoji: '🔱', desc: 'Drive the point home.' },
  { id: 'charge',        name: 'Charge',         weaponClass: 'lance',  power: 30, cooldown: 3, element: 'physical', animation: 'dash',    emoji: '🐎', desc: 'Full-tilt running attack.' },
  { id: 'celestial',     name: 'Celestial Bolt', weaponClass: 'lance',  power: 28, cooldown: 2, element: 'holy',     animation: 'lightning',emoji: '☄️', desc: 'Thrown like a falling star.' },

  // ── scythe ────────────────────────────────────────────────────────────
  { id: 'reap',          name: 'Reap',           weaponClass: 'scythe', power: 22, cooldown: 0, element: 'shadow',   animation: 'slash',   emoji: '💀', desc: 'A wide harvesting arc.' },
  { id: 'soul_drain',    name: 'Soul Drain',     weaponClass: 'scythe', power: 18, cooldown: 2, element: 'shadow',   animation: 'shadow',  emoji: '👻', desc: 'Heal for half the damage dealt.', tag: 'lifesteal' },
  { id: 'death_blossom', name: "Death's Blossom",weaponClass: 'scythe', power: 32, cooldown: 4, element: 'shadow',   animation: 'shadow',  emoji: '🌑', desc: 'The harvest comes for all.' },
];

// Lookup by id
const attackById = (id) => ATTACKS.find(a => a.id === id);

// Attacks usable with a given weapon class (always includes 'any' attacks).
const attacksForClass = (weaponClass) => {
  if (!weaponClass) return ATTACKS.filter(a => a.weaponClass === 'any');
  return ATTACKS.filter(a => a.weaponClass === 'any' || a.weaponClass === weaponClass);
};

// The four attacks new players start with — usable regardless of gear.
const DEFAULT_LOADOUT = ['punch', 'kick', 'guard', 'rally'];

// Build a sensible default loadout for a given weapon class. When the user
// equips a weapon (e.g. a sword), they should immediately get the signature
// moves for that class plus a Rally (heal) slot, so the weapon swap feels
// meaningful instead of all four slots staying as Punch/Kick.
const defaultLoadoutFor = (weaponClass) => {
  if (!weaponClass) return DEFAULT_LOADOUT;
  const classMoves = ATTACKS
    .filter(a => a.weaponClass === weaponClass)
    .sort((a, b) => (a.cooldown || 0) - (b.cooldown || 0))
    .slice(0, 3)
    .map(a => a.id);
  // If somehow a class has fewer than 3 moves, fall back to universal fillers.
  while (classMoves.length < 3) {
    const filler = DEFAULT_LOADOUT[classMoves.length];
    if (filler && !classMoves.includes(filler)) classMoves.push(filler);
    else break;
  }
  return [...classMoves, 'rally'];
};

module.exports = { ATTACKS, attackById, attacksForClass, DEFAULT_LOADOUT, defaultLoadoutFor };
