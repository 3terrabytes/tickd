// Pixel art RPG character — customisable appearance + equipped gear

const HAIR_STYLES = [
  // Style 0: spiky
  ({ hair, x=28, y=8 }) => (
    <g>
      <rect x={x+2}  y={y}   width="4" height="6" fill={hair}/>
      <rect x={x+8}  y={y-2} width="4" height="7" fill={hair}/>
      <rect x={x+14} y={y}   width="4" height="6" fill={hair}/>
      <rect x={x+18} y={y+2} width="4" height="4" fill={hair}/>
      <rect x={x}    y={y+2} width="4" height="4" fill={hair}/>
    </g>
  ),
  // Style 1: long straight
  ({ hair, x=28, y=8 }) => (
    <g>
      <rect x={x}    y={y}   width="24" height="4" fill={hair}/>
      <rect x={x-2}  y={y+4} width="4"  height="16" fill={hair}/>
      <rect x={x+22} y={y+4} width="4"  height="16" fill={hair}/>
    </g>
  ),
  // Style 2: short crop
  ({ hair, x=28, y=8 }) => (
    <g>
      <rect x={x}   y={y}   width="24" height="6" fill={hair}/>
      <rect x={x-2} y={y+4} width="4"  height="8" fill={hair}/>
      <rect x={x+22} y={y+4} width="4" height="8" fill={hair}/>
    </g>
  ),
  // Style 3: ponytail
  ({ hair, x=28, y=8 }) => (
    <g>
      <rect x={x}    y={y}   width="24" height="4" fill={hair}/>
      <rect x={x+20} y={y+4} width="6"  height="20" fill={hair}/>
      <rect x={x+22} y={y+22} width="4" height="6"  fill={hair}/>
    </g>
  ),
];

export default function PixelCharacter({ equipped = {}, appearance = {}, size = 120 }) {
  const skin      = appearance.avatar_skin      || '#e8b88a';
  const hair      = appearance.avatar_hair      || '#8B4513';
  const eyes      = appearance.avatar_eyes      || '#2a4a8a';
  const hairStyle = appearance.avatar_hair_style || 0;

  const weapon = equipped.weapon;
  const armor  = equipped.armor;

  const bodyColor  = armor ? armorBody(armor.rarity)  : '#5a7fa5';
  const armorAccent = armor ? armorAccentColor(armor.rarity) : '#7aafc5';
  const capeCol    = armor ? capeColor(armor.rarity)  : null;

  const HairComp = HAIR_STYLES[hairStyle] || HAIR_STYLES[0];

  return (
    <div style={{ width: size, height: size, flexShrink: 0, imageRendering: 'pixelated' }}>
      <svg width={size} height={size} viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>

        {/* Shadow */}
        <ellipse cx="40" cy="86" rx="18" ry="3" fill="rgba(0,0,0,0.25)"/>

        {/* Cape */}
        {capeCol && <>
          <rect x="26" y="40" width="6"  height="22" fill={capeCol}/>
          <rect x="48" y="40" width="6"  height="22" fill={capeCol}/>
          <rect x="26" y="60" width="6"  height="4"  fill={darken(capeCol)}/>
          <rect x="48" y="60" width="6"  height="4"  fill={darken(capeCol)}/>
        </>}

        {/* Legs */}
        <rect x="32" y="58" width="6"  height="14" fill="#2e3a5e"/>
        <rect x="42" y="58" width="6"  height="14" fill="#2e3a5e"/>
        {/* Boots */}
        <rect x="30" y="70" width="9"  height="4"  fill="#1a1414"/>
        <rect x="41" y="70" width="9"  height="4"  fill="#1a1414"/>
        <rect x="29" y="72" width="4"  height="2"  fill="#0e0c0c"/>
        <rect x="41" y="72" width="4"  height="2"  fill="#0e0c0c"/>

        {/* Body */}
        <rect x="28" y="38" width="24" height="22" fill={bodyColor}/>
        <rect x="30" y="40" width="20" height="2"  fill={armorAccent}/>
        <rect x="37" y="40" width="6"  height="20" fill={darken(bodyColor)}/>
        <rect x="24" y="38" width="6"  height="7"  fill={armorAccent}/>
        <rect x="50" y="38" width="6"  height="7"  fill={armorAccent}/>

        {/* Arms */}
        <rect x="21" y="40" width="6"  height="18" fill={bodyColor}/>
        <rect x="53" y="40" width="6"  height="18" fill={bodyColor}/>
        <rect x="21" y="56" width="6"  height="4"  fill="#3a2010"/>
        <rect x="53" y="56" width="6"  height="4"  fill="#3a2010"/>

        {/* Weapon */}
        {weapon ? (
          <text x="57" y="60" fontSize="14" textAnchor="middle">{weapon.emoji}</text>
        ) : (
          <>
            <rect x="56" y="32" width="3" height="28" fill="#b8b8c8"/>
            <rect x="54" y="44" width="7" height="3"  fill="#8b6914"/>
            <rect x="56" y="30" width="3" height="4"  fill="#e8d060"/>
          </>
        )}

        {/* Neck */}
        <rect x="36" y="32" width="8" height="8" fill={skin}/>

        {/* Head */}
        <rect x="28" y="14" width="24" height="20" fill={skin}/>

        {/* Hair */}
        <HairComp hair={hair} x={28} y={8}/>
        {/* Hair sides */}
        <rect x="24" y="16" width="4" height="10" fill={hair}/>
        <rect x="52" y="16" width="4" height="10" fill={hair}/>

        {/* Eyes */}
        <rect x="32" y="22" width="6" height="5" fill="white"/>
        <rect x="42" y="22" width="6" height="5" fill="white"/>
        <rect x="34" y="23" width="3" height="3" fill={eyes}/>
        <rect x="44" y="23" width="3" height="3" fill={eyes}/>
        <rect x="35" y="23" width="1" height="1" fill="#111"/>
        <rect x="45" y="23" width="1" height="1" fill="#111"/>
        <rect x="34" y="23" width="1" height="1" fill="white" opacity="0.6"/>
        <rect x="44" y="23" width="1" height="1" fill="white" opacity="0.6"/>

        {/* Eyebrows */}
        <rect x="32" y="20" width="7" height="2" fill={darken(hair)}/>
        <rect x="41" y="20" width="7" height="2" fill={darken(hair)}/>

        {/* Nose */}
        <rect x="38" y="28" width="4" height="2" fill={darken(skin)}/>

        {/* Mouth */}
        <rect x="35" y="31" width="10" height="2" fill="#c06050"/>
        <rect x="36" y="30" width="2"  height="2" fill="#c06050"/>
        <rect x="42" y="30" width="2"  height="2" fill="#c06050"/>

        {/* Ears */}
        <rect x="24" y="24" width="4" height="5" fill={skin}/>
        <rect x="52" y="24" width="4" height="5" fill={skin}/>

        {/* Armor headband */}
        {armor && <rect x="28" y="16" width="24" height="3" fill={armorAccent} opacity="0.7"/>}
      </svg>
    </div>
  );
}

function armorBody(rarity) {
  return { common: '#8a9aaa', rare: '#4a6fa5', epic: '#6a4fa5', legendary: '#c8860a' }[rarity] || '#8a9aaa';
}
function armorAccentColor(rarity) {
  return { common: '#b0c0cc', rare: '#7a9fce', epic: '#9a7fce', legendary: '#f0b040' }[rarity] || '#b0c0cc';
}
function capeColor(rarity) {
  return { common: '#6a5030', rare: '#1a3a7a', epic: '#4a1a7a', legendary: '#8a4a00' }[rarity] || null;
}
function darken(hex) {
  if (!hex || !hex.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - 35);
  const g = Math.max(0, ((n >> 8) & 0xff) - 35);
  const b = Math.max(0, (n & 0xff) - 35);
  return `#${[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('')}`;
}
