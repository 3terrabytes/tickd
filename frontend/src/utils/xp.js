export const xpForLevel = (level) => Math.floor(100 * Math.pow(level, 1.5));

export const levelTitle = (level) => {
  const titles = [
    '',           // L0
    'Rookie',     // L1
    'Apprentice', // L2
    'Explorer',   // L3
    'Achiever',   // L4
    'Challenger', // L5
    'Warrior',    // L6
    'Champion',   // L7
    'Master',     // L8
    'Grandmaster',// L9
    'Legend',     // L10
    'Mythic',     // L11
    'Ascendant',  // L12
    'Transcendent',// L13
    'Eternal',    // L14
    'Demigod',    // L15
    'Celestial',  // L16
    'Cosmic',     // L17
    'Apex',       // L18
    'Sovereign',  // L19
    'Tickd God',  // L20+
  ];
  return titles[Math.min(level, titles.length - 1)];
};
