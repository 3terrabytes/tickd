// ── Pixel-art RPG avatar ────────────────────────────────────────────────────
// Fully customisable: skin, hair colour & style, eye colour, beard, gender,
// plus equipped weapon / armor / banner / badge / companion.
//
// Use:
//   <PixelCharacter
//     appearance={{ skin, hair, eyes, hair_style, gender, beard }}
//     equipped={{ weapon, armor, banner, badge, companion }}
//     size={120}
//   />
//
// Everything is optional — anything missing falls back to a sensible default.

export const HAIR_STYLES = [
  { id: 0, name: 'Spiky' },
  { id: 1, name: 'Long' },
  { id: 2, name: 'Buzz' },
  { id: 3, name: 'Mohawk' },
  { id: 4, name: 'Curly' },
  { id: 5, name: 'Bald' },
];

export const BEARD_STYLES = [
  { id: 0, name: 'None' },
  { id: 1, name: 'Stubble' },
  { id: 2, name: 'Goatee' },
  { id: 3, name: 'Full' },
];

export const SKIN_TONES  = ['#f5d0b0', '#e8b88a', '#d4986a', '#a06840', '#704020', '#3d2412'];
export const HAIR_COLORS = ['#1a1a1a', '#5a2d00', '#8B4513', '#c97a3a', '#e6c068', '#f0e0a0', '#7a4a8a', '#c83a3a', '#3a8aaa', '#9a9a9a'];
export const EYE_COLORS  = ['#2a4a8a', '#3a8a4a', '#8a5a2a', '#5a2a8a', '#8a2a2a', '#2a8a8a', '#1a1a1a'];

export default function PixelCharacter({
  appearance = {},
  equipped   = {},
  size       = 120,
  cheering   = false,
}) {
  // ── Appearance defaults ──────────────────────────────────────────────────
  // Accept both bare names ({skin, hair, ...}) and prefixed names
  // ({avatar_skin, avatar_hair, ...}) so callers can pass the user object directly.
  const skin       = appearance.skin       ?? appearance.avatar_skin       ?? '#e8b88a';
  const hair       = appearance.hair       ?? appearance.avatar_hair       ?? '#8B4513';
  const eyes       = appearance.eyes       ?? appearance.avatar_eyes       ?? '#2a4a8a';
  const hairStyle  = appearance.hair_style ?? appearance.avatar_hair_style ?? 0;
  const gender     = appearance.gender     ?? appearance.avatar_gender     ?? 0; // 0 male, 1 female
  const beard      = appearance.beard      ?? appearance.avatar_beard      ?? 0;

  // ── Equipped gear ────────────────────────────────────────────────────────
  const weapon    = equipped.weapon;
  const armor     = equipped.armor;
  const companion = equipped.companion;

  const bodyColor   = armor ? armorColor(armor.rarity)     : '#6b5b9a';
  const armorHL     = armor ? armorHighlight(armor.rarity) : '#9c89c8';
  const capeColor   = armor ? capeTone(armor.rarity)       : null;
  const skinDark    = darken(skin, 25);
  const hairDark    = darken(hair, 30);

  return (
    <div style={{ width: size, height: size, imageRendering: 'pixelated', flexShrink: 0 }}>
      <svg
        width={size} height={size}
        viewBox="0 0 80 80"
        xmlns="http://www.w3.org/2000/svg"
        style={{ imageRendering: 'pixelated', display: 'block' }}
        shapeRendering="crispEdges"
      >
        {/* Soft ground shadow */}
        <ellipse cx="40" cy="74" rx="18" ry="3" fill="rgba(0,0,0,0.35)" />

        {/* ── CAPE (armor) ─────────────────────────────────────────────── */}
        {capeColor && (
          <g>
            <rect x="26" y="36" width="6" height="22" fill={capeColor} />
            <rect x="48" y="36" width="6" height="22" fill={capeColor} />
            <rect x="26" y="56" width="6" height="3" fill={darken(capeColor, 30)} />
            <rect x="48" y="56" width="6" height="3" fill={darken(capeColor, 30)} />
          </g>
        )}

        {/* ── LEGS ─────────────────────────────────────────────────────── */}
        <rect x="32" y="54" width="6" height="14" fill="#3b3060" />
        <rect x="42" y="54" width="6" height="14" fill="#3b3060" />
        <rect x="32" y="54" width="6" height="2"  fill="#251a40" />
        <rect x="42" y="54" width="6" height="2"  fill="#251a40" />
        {/* Boots */}
        <rect x="31" y="66" width="8" height="4" fill="#2a2020" />
        <rect x="41" y="66" width="8" height="4" fill="#2a2020" />
        <rect x="30" y="68" width="4" height="2" fill="#1a1010" />
        <rect x="40" y="68" width="4" height="2" fill="#1a1010" />

        {/* ── TORSO ────────────────────────────────────────────────────── */}
        <rect x="28" y="36" width="24" height="20" fill={bodyColor} />
        {/* Belt / waist */}
        <rect x="28" y="52" width="24" height="3" fill={darken(bodyColor, 20)} />
        <rect x="38" y="52" width="4"  height="3" fill="#f5c542" />
        {/* Chest highlight */}
        <rect x="30" y="38" width="20" height="2"  fill={armorHL} />
        {/* Center line */}
        <rect x="39" y="38" width="2"  height="14" fill={darken(bodyColor, 25)} />
        {/* Shoulder guards */}
        <rect x="25" y="36" width="6"  height="6"  fill={armorHL} />
        <rect x="49" y="36" width="6"  height="6"  fill={armorHL} />
        {/* Female: subtle torso shaping */}
        {gender === 1 && (
          <>
            <rect x="30" y="42" width="4" height="2" fill={darken(bodyColor, 15)} />
            <rect x="46" y="42" width="4" height="2" fill={darken(bodyColor, 15)} />
          </>
        )}

        {/* ── ARMS ─────────────────────────────────────────────────────── */}
        <rect x="22" y="38" width="6" height="16" fill={bodyColor} />
        <rect x="52" y="38" width="6" height="16" fill={bodyColor} />
        <rect x="22" y="38" width="6" height="2"  fill={armorHL} />
        <rect x="52" y="38" width="6" height="2"  fill={armorHL} />
        {/* Hands (skin) */}
        <rect x="22" y="52" width="6" height="4" fill={skin} />
        <rect x="52" y="52" width="6" height="4" fill={skin} />

        {/* ── WEAPON in right hand ─────────────────────────────────────── */}
        {weapon ? (
          <text x="55" y="58" fontSize="14" textAnchor="middle">{weapon.emoji}</text>
        ) : (
          <>
            {/* Default plain sword */}
            <rect x="55" y="30" width="3" height="26" fill="#c0c0c0" />
            <rect x="53" y="42" width="7" height="3"  fill="#8b6914" />
            <rect x="55" y="28" width="3" height="4"  fill="#f0d060" />
          </>
        )}

        {/* ── NECK ─────────────────────────────────────────────────────── */}
        <rect x="36" y="30" width="8" height="6" fill={skinDark} />

        {/* ── HEAD (base skin) ─────────────────────────────────────────── */}
        <rect x="28" y="12" width="24" height="20" fill={skin} />
        {/* Subtle face shading */}
        <rect x="28" y="30" width="24" height="2" fill={skinDark} />
        {/* Ears */}
        <rect x="24" y="20" width="4" height="6" fill={skin} />
        <rect x="52" y="20" width="4" height="6" fill={skin} />
        <rect x="24" y="24" width="4" height="2" fill={skinDark} />
        <rect x="52" y="24" width="4" height="2" fill={skinDark} />

        {/* ── HAIR ─────────────────────────────────────────────────────── */}
        {renderHair(hairStyle, hair, hairDark, gender)}

        {/* ── EYES ─────────────────────────────────────────────────────── */}
        {/* Sclera */}
        <rect x="32" y="20" width="6" height="5" fill="white" />
        <rect x="42" y="20" width="6" height="5" fill="white" />
        {/* Iris */}
        <rect x="34" y="21" width="3" height="3" fill={eyes} />
        <rect x="44" y="21" width="3" height="3" fill={eyes} />
        {/* Pupil */}
        <rect x="35" y="22" width="1" height="1" fill="black" />
        <rect x="45" y="22" width="1" height="1" fill="black" />
        {/* Catchlight */}
        <rect x="34" y="21" width="1" height="1" fill="white" opacity="0.8" />
        <rect x="44" y="21" width="1" height="1" fill="white" opacity="0.8" />
        {/* Brows */}
        <rect x="32" y="18" width="6" height="2" fill={hairDark} />
        <rect x="42" y="18" width="6" height="2" fill={hairDark} />

        {/* ── NOSE ─────────────────────────────────────────────────────── */}
        <rect x="38" y="25" width="4" height="2" fill={skinDark} />

        {/* ── MOUTH ────────────────────────────────────────────────────── */}
        {gender === 1 ? (
          <>
            <rect x="35" y="28" width="10" height="2" fill="#c84a5a" />
            <rect x="36" y="27" width="8"  height="1" fill="#a83a4a" />
          </>
        ) : (
          <rect x="35" y="28" width="10" height="2" fill="#9c5040" />
        )}

        {/* ── BEARD ────────────────────────────────────────────────────── */}
        {renderBeard(beard, hair, hairDark)}

        {/* ── HELM hint when armor is equipped ─────────────────────────── */}
        {armor && hairStyle !== 5 && (
          <rect x="28" y="14" width="24" height="2" fill={armorHL} opacity="0.55" />
        )}

        {/* ── COMPANION (pet) — left of body, on the same ground plane ── */}
        {companion && (
          <g className={`pet pet-${companion.id}${cheering ? ' pet-cheer' : ''}`}>
            <title>{companion.name}: {companion.desc}</title>
            <ellipse cx="14" cy="74" rx="6" ry="1.5" fill="rgba(0,0,0,0.35)" />
            <text x="14" y="72" fontSize="12" textAnchor="middle">{companion.emoji}</text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── Hair renderers ────────────────────────────────────────────────────────
function renderHair(style, hair, hairDark) {
  switch (style) {
    case 0: // Spiky
      return (
        <g>
          <rect x="28" y="10" width="24" height="6" fill={hairDark} />
          <rect x="30" y="8"  width="4"  height="5" fill={hair} />
          <rect x="36" y="6"  width="4"  height="7" fill={hair} />
          <rect x="42" y="8"  width="4"  height="5" fill={hair} />
          <rect x="46" y="10" width="4"  height="4" fill={hair} />
          <rect x="28" y="10" width="4"  height="4" fill={hair} />
          <rect x="24" y="14" width="4"  height="6" fill={hair} />
          <rect x="52" y="14" width="4"  height="6" fill={hair} />
        </g>
      );
    case 1: // Long
      return (
        <g>
          <rect x="26" y="10" width="28" height="8"  fill={hair} />
          <rect x="26" y="10" width="28" height="2"  fill={hairDark} />
          <rect x="24" y="12" width="4"  height="22" fill={hair} />
          <rect x="52" y="12" width="4"  height="22" fill={hair} />
          <rect x="28" y="14" width="24" height="4"  fill={hair} />
          <rect x="22" y="32" width="3"  height="14" fill={hair} opacity="0.85" />
          <rect x="55" y="32" width="3"  height="14" fill={hair} opacity="0.85" />
        </g>
      );
    case 2: // Buzz cut
      return (
        <g>
          <rect x="28" y="12" width="24" height="4" fill={hair} />
          <rect x="28" y="12" width="24" height="1" fill={hairDark} />
        </g>
      );
    case 3: // Mohawk
      return (
        <g>
          <rect x="28" y="14" width="24" height="2" fill={darken(hair, 50)} opacity="0.4" />
          <rect x="36" y="6"  width="8"  height="10" fill={hair} />
          <rect x="36" y="6"  width="8"  height="2"  fill={hairDark} />
          <rect x="38" y="4"  width="4"  height="3"  fill={hair} />
        </g>
      );
    case 4: // Curly afro
      return (
        <g>
          <rect x="26" y="8"  width="28" height="10" fill={hair} />
          <rect x="24" y="10" width="4"  height="10" fill={hair} />
          <rect x="52" y="10" width="4"  height="10" fill={hair} />
          <rect x="28" y="8"  width="2" height="2" fill={hairDark} />
          <rect x="34" y="10" width="2" height="2" fill={hairDark} />
          <rect x="42" y="8"  width="2" height="2" fill={hairDark} />
          <rect x="48" y="10" width="2" height="2" fill={hairDark} />
        </g>
      );
    case 5: // Bald
      return null;
    default:
      return null;
  }
}

// ── Beard renderers ──────────────────────────────────────────────────────
function renderBeard(style, hair, hairDark) {
  if (style === 0) return null;
  switch (style) {
    case 1: // Stubble
      return (
        <g opacity="0.55">
          <rect x="32" y="29" width="2" height="1" fill={hairDark} />
          <rect x="36" y="30" width="2" height="1" fill={hairDark} />
          <rect x="42" y="30" width="2" height="1" fill={hairDark} />
          <rect x="46" y="29" width="2" height="1" fill={hairDark} />
          <rect x="34" y="31" width="3" height="1" fill={hairDark} />
          <rect x="43" y="31" width="3" height="1" fill={hairDark} />
        </g>
      );
    case 2: // Goatee
      return (
        <g>
          <rect x="36" y="30" width="8" height="3" fill={hair} />
          <rect x="36" y="30" width="8" height="1" fill={hairDark} />
        </g>
      );
    case 3: // Full beard
      return (
        <g>
          <rect x="30" y="29" width="20" height="4" fill={hair} />
          <rect x="30" y="29" width="20" height="1" fill={hairDark} />
          <rect x="32" y="32" width="16" height="2" fill={hair} />
          <rect x="34" y="27" width="12" height="2" fill={hair} />
        </g>
      );
    default:
      return null;
  }
}

// ── Color helpers ────────────────────────────────────────────────────────
function armorColor(rarity) {
  const map = { common: '#8a9aaa', rare: '#4a6fa5', epic: '#6a4fa5', legendary: '#c8860a' };
  return map[rarity] || '#6b5b9a';
}
function armorHighlight(rarity) {
  const map = { common: '#b0c0cc', rare: '#7a9fce', epic: '#9a7fce', legendary: '#f0b040' };
  return map[rarity] || '#9c89c8';
}
function capeTone(rarity) {
  const map = { common: '#6a5030', rare: '#1a3a7a', epic: '#4a1a7a', legendary: '#8a4a00' };
  return map[rarity] || null;
}
function darken(hex, amt = 30) {
  if (!hex || !hex.startsWith('#') || hex.length !== 7) return hex;
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - amt);
  const g = Math.max(0, ((num >> 8) & 0xff) - amt);
  const b = Math.max(0, (num & 0xff) - amt);
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}
