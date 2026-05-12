export const xpForLevel = (level) => Math.floor(100 * Math.pow(level, 1.5));

export const levelTitle = (level) => {
  const titles = ['','Rookie','Apprentice','Explorer','Achiever','Challenger','Warrior','Champion','Master','Grandmaster','Legend'];
  return titles[Math.min(level, titles.length - 1)];
};
