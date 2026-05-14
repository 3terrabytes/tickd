// Pixel art RPG character that reflects equipped weapon, armor, banner and badge
export default function PixelCharacter({ equipped = {}, size = 100 }) {
  const weapon = equipped.weapon;
  const armor  = equipped.armor;

  // Armor tints the body
  const bodyColor   = armor ? armorColor(armor.rarity) : '#c8a96e';
  const armorColor2 = armor ? armorHighlight(armor.rarity) : '#e8c98e';
  const capeColor   = armor ? capeTone(armor.rarity) : null;

  // Weapon determines what's in the hand
  const weaponEmoji = weapon?.emoji || null;

  const scale = size / 80;

  return (
    <div style={{ width: size, height: size, imageRendering: 'pixelated', flexShrink: 0 }}>
      <svg
        width={size} height={size}
        viewBox="0 0 80 80"
        xmlns="http://www.w3.org/2000/svg"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Glow under character */}
        <ellipse cx="40" cy="74" rx="18" ry="4" fill="rgba(0,0,0,0.3)" />

        {/* === CAPE (armor) === */}
        {capeColor && (
          <g>
            <rect x="27" y="38" width="6"  height="20" fill={capeColor} />
            <rect x="47" y="38" width="6"  height="20" fill={capeColor} />
            <rect x="27" y="56" width="6"  height="4"  fill={darken(capeColor)} />
            <rect x="47" y="56" width="6"  height="4"  fill={darken(capeColor)} />
          </g>
        )}

        {/* === LEGS === */}
        <rect x="32" y="54" width="6" height="14" fill="#3b3060" />
        <rect x="42" y="54" width="6" height="14" fill="#3b3060" />
        {/* Boots */}
        <rect x="31" y="66" width="8" height="4"  fill="#2a2020" />
        <rect x="41" y="66" width="8" height="4"  fill="#2a2020" />
        <rect x="30" y="68" width="4" height="2"  fill="#1a1010" />
        <rect x="40" y="68" width="4" height="2"  fill="#1a1010" />

        {/* === BODY (torso) === */}
        <rect x="28" y="36" width="24" height="20" fill={bodyColor} />
        {/* Chest detail */}
        <rect x="30" y="38" width="20" height="2"  fill={armorColor2} />
        <rect x="38" y="38" width="4"  height="18" fill={darken(bodyColor)} />
        {/* Shoulder guards */}
        <rect x="25" y="36" width="6"  height="6"  fill={armorColor2} />
        <rect x="49" y="36" width="6"  height="6"  fill={armorColor2} />

        {/* === ARMS === */}
        <rect x="22" y="38" width="6" height="16" fill={bodyColor} />
        <rect x="52" y="38" width="6" height="16" fill={bodyColor} />
        {/* Gloves */}
        <rect x="22" y="52" width="6" height="4"  fill="#3a2010" />
        <rect x="52" y="52" width="6" height="4"  fill="#3a2010" />

        {/* === WEAPON in right hand === */}
        {weaponEmoji ? (
          <text x="54" y="58" font-size="14" text-anchor="middle">{weaponEmoji}</text>
        ) : (
          // Default sword
          <>
            <rect x="55" y="30" width="3"  height="26" fill="#c0c0c0" />
            <rect x="53" y="42" width="7"  height="3"  fill="#8b6914" />
            <rect x="55" y="28" width="3"  height="4"  fill="#f0d060" />
          </>
        )}

        {/* === NECK === */}
        <rect x="36" y="30" width="8" height="8" fill="#d4a574" />

        {/* === HEAD === */}
        {/* Hair back */}
        <rect x="28" y="10" width="24" height="6"  fill="#7B3F00" />
        {/* Head */}
        <rect x="28" y="12" width="24" height="20" fill="#e8b88a" />
        {/* Hair top spiky */}
        <rect x="30" y="8"  width="4"  height="6"  fill="#8B4513" />
        <rect x="36" y="6"  width="4"  height="7"  fill="#8B4513" />
        <rect x="42" y="8"  width="4"  height="6"  fill="#8B4513" />
        <rect x="46" y="10" width="4"  height="4"  fill="#8B4513" />
        <rect x="28" y="10" width="4"  height="4"  fill="#8B4513" />
        {/* Hair side */}
        <rect x="24" y="14" width="4"  height="10" fill="#8B4513" />
        <rect x="52" y="14" width="4"  height="10" fill="#8B4513" />
        {/* Eyes */}
        <rect x="32" y="20" width="6"  height="5"  fill="white" />
        <rect x="42" y="20" width="6"  height="5"  fill="white" />
        <rect x="34" y="21" width="3"  height="3"  fill="#2a4a8a" />
        <rect x="44" y="21" width="3"  height="3"  fill="#2a4a8a" />
        <rect x="35" y="21" width="1"  height="1"  fill="black" />
        <rect x="45" y="21" width="1"  height="1"  fill="black" />
        {/* Eye shine */}
        <rect x="34" y="21" width="1"  height="1"  fill="white" opacity="0.7"/>
        <rect x="44" y="21" width="1"  height="1"  fill="white" opacity="0.7"/>
        {/* Eyebrows */}
        <rect x="32" y="18" width="7"  height="2"  fill="#5a2d00" />
        <rect x="41" y="18" width="7"  height="2"  fill="#5a2d00" />
        {/* Nose */}
        <rect x="38" y="26" width="4"  height="2"  fill="#c89060" />
        {/* Mouth */}
        <rect x="35" y="29" width="10" height="2"  fill="#c06050" />
        <rect x="36" y="28" width="2"  height="2"  fill="#c06050" />
        <rect x="42" y="28" width="2"  height="2"  fill="#c06050" />
        {/* Ear */}
        <rect x="24" y="22" width="4"  height="5"  fill="#e8b88a" />
        <rect x="52" y="22" width="4"  height="5"  fill="#e8b88a" />
        {/* Headband / helmet hint based on armor */}
        {armor && (
          <rect x="28" y="14" width="24" height="3" fill={armorColor2} opacity="0.7" />
        )}
      </svg>
    </div>
  );
}

function armorColor(rarity) {
  const map = { common: '#8a9aaa', rare: '#4a6fa5', epic: '#6a4fa5', legendary: '#c8860a' };
  return map[rarity] || '#8a9aaa';
}
function armorHighlight(rarity) {
  const map = { common: '#b0c0cc', rare: '#7a9fce', epic: '#9a7fce', legendary: '#f0b040' };
  return map[rarity] || '#b0c0cc';
}
function capeTone(rarity) {
  const map = { common: '#6a5030', rare: '#1a3a7a', epic: '#4a1a7a', legendary: '#8a4a00' };
  return map[rarity] || null;
}
function darken(hex) {
  // Simple darken by reducing hex values
  if (!hex || !hex.startsWith('#')) return hex;
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - 30);
  const g = Math.max(0, ((num >> 8) & 0xff) - 30);
  const b = Math.max(0, (num & 0xff) - 30);
  return `#${[r,g,b].map(v => v.toString(16).padStart(2,'0')).join('')}`;
}
