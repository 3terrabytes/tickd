// Random text events that can appear in place of combat rooms (floors 2-4
// of the dungeon). Each event has 2-3 choices with declarative outcomes
// the frontend applies (gain/lose hp, gold, relic, gain card).
//
// `outcome` types the frontend understands:
//   { kind: 'hp',     delta:  N }      // heal/damage
//   { kind: 'gold',   delta:  N }      // gain/lose gold
//   { kind: 'relic',  rarity: 'common' | 'uncommon' | 'rare' }
//   { kind: 'card',   pool:   'common' | 'uncommon' | 'rare' }
//   { kind: 'nothing' }

const EVENTS = [
  {
    id: 'old_beggar',
    title: 'An Old Beggar',
    text: 'An emaciated figure huddles in the corner, hand outstretched. He whispers of buried treasures only the kind can find.',
    sprite: '🧓',
    choices: [
      { label: 'Give 50 gold',     desc: 'He blesses you.',          outcome: [{ kind: 'gold', delta: -50 }, { kind: 'relic', rarity: 'uncommon' }] },
      { label: 'Walk past',        desc: '"Cold heart."',            outcome: [{ kind: 'hp',   delta: -8 }] },
    ],
  },
  {
    id: 'shrine_of_pain',
    title: 'Shrine of Pain',
    text: 'A black-iron shrine. The air around it tastes of copper. It promises power, at a cost.',
    sprite: '⛩️',
    choices: [
      { label: 'Offer 15 HP', desc: 'Gain a rare relic.', outcome: [{ kind: 'hp', delta: -15 }, { kind: 'relic', rarity: 'rare' }] },
      { label: 'Leave it',    desc: 'You feel cleaner.', outcome: [{ kind: 'nothing' }] },
    ],
  },
  {
    id: 'mysterious_chest',
    title: 'Mysterious Chest',
    text: 'A chest sits in the middle of the room. It is humming softly. Almost… expectantly.',
    sprite: '🎁',
    choices: [
      { label: 'Open it',     desc: 'High risk, high reward.', outcome: [{ kind: 'gold', delta: 80 }, { kind: 'hp', delta: -10 }] },
      { label: 'Pick the lock (skill check)', desc: 'Safer if you can do it.', outcome: [{ kind: 'gold', delta: 50 }] },
      { label: 'Leave it alone', desc: 'Caution is a virtue.', outcome: [{ kind: 'nothing' }] },
    ],
  },
  {
    id: 'forgotten_library',
    title: 'Forgotten Library',
    text: 'Dusty tomes line the walls. One of them seems to be reading itself.',
    sprite: '📚',
    choices: [
      { label: 'Study a tome', desc: 'Learn a new card.', outcome: [{ kind: 'card', pool: 'uncommon' }, { kind: 'hp', delta: -3 }] },
      { label: 'Loot the gold', desc: 'A small pouch on the floor.', outcome: [{ kind: 'gold', delta: 35 }] },
    ],
  },
  {
    id: 'wounded_traveller',
    title: 'Wounded Traveller',
    text: 'A traveller, badly hurt, holds out a strange artefact. "Take it. I won\'t make it out."',
    sprite: '🤕',
    choices: [
      { label: 'Help them up',  desc: 'You patch them up.', outcome: [{ kind: 'relic', rarity: 'common' }, { kind: 'hp', delta: -5 }] },
      { label: 'Take and leave', desc: 'A grim choice.',     outcome: [{ kind: 'relic', rarity: 'uncommon' }] },
    ],
  },
  {
    id: 'card_remover',
    title: 'A Wandering Hermit',
    text: 'An old hermit offers to erase a memory from your deck — make you sharper, cleaner.',
    sprite: '🧙‍♂️',
    choices: [
      { label: 'Pay 25 gold to forget', desc: 'Remove a card from your deck.', outcome: [{ kind: 'gold', delta: -25 }, { kind: 'remove_card', count: 1 }] },
      { label: 'Decline politely',      desc: 'Wisdom in restraint.',          outcome: [{ kind: 'nothing' }] },
    ],
  },
];

const eventById = (id) => EVENTS.find(e => e.id === id);

// Pick a random event for placement on the map.
const pickEvent = () => EVENTS[Math.floor(Math.random() * EVENTS.length)];

module.exports = { EVENTS, eventById, pickEvent };
