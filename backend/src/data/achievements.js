// Achievement definitions. Add new entries here — they auto-appear in the
// Achievements page and are checked after every habit completion. `criteria`
// names a key returned by collectStats() in routes/achievements.js.

const ACHIEVEMENTS = [
  // First steps
  { code: 'first_step',       name: 'First Step',        desc: 'Complete a habit for the first time',     emoji: '👣', rarity: 'common',    criteria: 'total_completions', threshold: 1 },
  { code: 'devoted_10',       name: 'Building a Habit',  desc: 'Complete 10 habits total',                emoji: '📌', rarity: 'common',    criteria: 'total_completions', threshold: 10 },
  { code: 'devoted_100',      name: 'Devoted',           desc: 'Complete 100 habits total',               emoji: '🎯', rarity: 'rare',      criteria: 'total_completions', threshold: 100 },
  { code: 'devoted_500',      name: 'Unstoppable',       desc: 'Complete 500 habits total',               emoji: '🚀', rarity: 'epic',      criteria: 'total_completions', threshold: 500 },
  { code: 'devoted_1000',     name: 'Habit Machine',     desc: 'Complete 1000 habits total',              emoji: '⚙️', rarity: 'legendary', criteria: 'total_completions', threshold: 1000 },

  // Streaks (highest streak on any single habit)
  { code: 'streak_3',         name: 'Getting Started',   desc: 'Reach a 3-day streak',                    emoji: '🔥', rarity: 'common',    criteria: 'best_streak', threshold: 3 },
  { code: 'streak_7',         name: 'Week Warrior',      desc: 'Reach a 7-day streak',                    emoji: '🔥', rarity: 'common',    criteria: 'best_streak', threshold: 7 },
  { code: 'streak_30',        name: 'Iron Will',         desc: 'Reach a 30-day streak',                   emoji: '🔥', rarity: 'rare',      criteria: 'best_streak', threshold: 30 },
  { code: 'streak_100',       name: 'Centurion',         desc: 'Reach a 100-day streak',                  emoji: '💯', rarity: 'epic',      criteria: 'best_streak', threshold: 100 },
  { code: 'streak_365',       name: 'Eternal Flame',     desc: 'Reach a 365-day streak',                  emoji: '🌟', rarity: 'legendary', criteria: 'best_streak', threshold: 365 },

  // Levels
  { code: 'level_5',          name: 'Apprentice',        desc: 'Reach level 5',                           emoji: '⭐', rarity: 'common',    criteria: 'level', threshold: 5 },
  { code: 'level_10',         name: 'Adept',             desc: 'Reach level 10',                          emoji: '✨', rarity: 'rare',      criteria: 'level', threshold: 10 },
  { code: 'level_25',         name: 'Veteran',           desc: 'Reach level 25',                          emoji: '🏅', rarity: 'epic',      criteria: 'level', threshold: 25 },
  { code: 'level_50',         name: 'Hero',              desc: 'Reach level 50',                          emoji: '🏆', rarity: 'legendary', criteria: 'level', threshold: 50 },

  // Habit variety
  { code: 'habits_3',         name: 'Diversifying',      desc: 'Track 3 habits at once',                  emoji: '📋', rarity: 'common',    criteria: 'habit_count', threshold: 3 },
  { code: 'habits_5',         name: 'Habit Collector',   desc: 'Track 5 habits at once',                  emoji: '📚', rarity: 'common',    criteria: 'habit_count', threshold: 5 },
  { code: 'habits_10',        name: 'Habit Architect',   desc: 'Track 10 habits at once',                 emoji: '🏛️', rarity: 'rare',      criteria: 'habit_count', threshold: 10 },

  // Wealth
  { code: 'first_purchase',   name: 'Window Shopper',    desc: 'Buy your first item',                     emoji: '🛒', rarity: 'common',    criteria: 'items_owned', threshold: 1 },
  { code: 'legendary_owner',  name: 'Treasure Hunter',   desc: 'Own a legendary item',                    emoji: '💎', rarity: 'epic',      criteria: 'legendary_owned', threshold: 1 },
  { code: 'rich_1000',        name: 'Comfortable',       desc: 'Earn 1000 gold lifetime',                 emoji: '🪙', rarity: 'common',    criteria: 'lifetime_gold', threshold: 1000 },
  { code: 'rich_10000',       name: 'Wealthy',           desc: 'Earn 10000 gold lifetime',                emoji: '💰', rarity: 'rare',      criteria: 'lifetime_gold', threshold: 10000 },

  // Social
  { code: 'first_friend',     name: 'Companion',         desc: 'Make your first friend',                  emoji: '🤝', rarity: 'common',    criteria: 'friend_count', threshold: 1 },
  { code: 'social_5',         name: 'Well Connected',    desc: 'Have 5 friends',                          emoji: '👥', rarity: 'rare',      criteria: 'friend_count', threshold: 5 },

  // Special — checked separately
  { code: 'perfect_day',      name: 'Perfect Day',       desc: 'Complete all habits in one day (3+ habits)', emoji: '⭐', rarity: 'rare',  criteria: 'perfect_day', threshold: 1 },
];

const byCode = (code) => ACHIEVEMENTS.find(a => a.code === code);

module.exports = { ACHIEVEMENTS, byCode };
