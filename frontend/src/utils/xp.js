export const xpForLevel = (level) => Math.floor(100 * Math.pow(level, 1.5));

// Title for every level 1-100. Past 100 you get the final form.
const TITLES = [
  '',                  // L0 placeholder
  'Rookie',            // L1
  'Apprentice',        // L2
  'Explorer',          // L3
  'Achiever',          // L4
  'Challenger',        // L5
  'Warrior',           // L6
  'Champion',          // L7
  'Master',            // L8
  'Grandmaster',       // L9
  'Legend',            // L10
  'Mythic',            // L11
  'Ascendant',         // L12
  'Transcendent',      // L13
  'Eternal',           // L14
  'Demigod',           // L15
  'Celestial',         // L16
  'Cosmic',            // L17
  'Apex',              // L18
  'Sovereign',         // L19
  'Avatar',            // L20
  'Stargazer',         // L21
  'Starborn',          // L22
  'Astral Knight',     // L23
  'Solar Sage',        // L24
  'Lunar Lord',        // L25
  'Comet',             // L26
  'Pulsar',            // L27
  'Nebula',            // L28
  'Galaxy-Walker',     // L29
  'Cosmonaut',         // L30
  'Chrono-Touched',    // L31
  'Time Reaver',       // L32
  'Era Walker',        // L33
  'Aeon Lord',         // L34
  'Epoch',             // L35
  'Past-Eater',        // L36
  'Future-Seer',       // L37
  'Now',               // L38
  'Forever',           // L39
  'Outside Time',      // L40
  'Saint',             // L41
  'Prophet',           // L42
  'Cardinal',          // L43
  'Hierophant',        // L44
  'Oracle',            // L45
  'Seraph',            // L46
  'Cherub',            // L47
  'Throne',            // L48
  'Power',             // L49
  'Dominion',          // L50
  'Constellation',     // L51
  'Singularity',       // L52
  'Black Hole',        // L53
  'White Hole',        // L54
  'Universe-Bound',    // L55
  'Multiverse',        // L56
  'Quantum',           // L57
  'Wavefront',         // L58
  'Particle',          // L59
  'Reality Anchor',    // L60
  'Dreamwalker',       // L61
  'Nightmare',         // L62
  'Vision',            // L63
  'Mirage',            // L64
  'Echo',              // L65
  'Shadow',            // L66
  'Reflection',        // L67
  'Whisper',           // L68
  'Murmur',            // L69
  'Forgotten',         // L70
  'Unwritten',         // L71
  'Unspoken',          // L72
  'Unsung',            // L73
  'Hidden',            // L74
  'Veiled',            // L75
  'Sealed',            // L76
  'Locked',            // L77
  'Bound',             // L78
  'Unbound',           // L79
  'Released',          // L80
  'The Nameless',      // L81
  'Without Form',      // L82
  'Beyond Words',      // L83
  'Inconceivable',     // L84
  'The Other',         // L85
  'Outside',           // L86
  'Beyond',            // L87
  'Without End',       // L88
  'Without Beginning', // L89
  'Eternal Now',       // L90
  'He Who Was',        // L91
  'She Who Will Be',   // L92
  'The All',           // L93
  'The One',           // L94
  'The Many',          // L95
  'The Source',        // L96
  'The Sink',          // L97
  'Penultimate',       // L98
  'Tickd God',         // L99
  'Tickd Incarnate',   // L100+
];

export const levelTitle = (level) => TITLES[Math.min(level, TITLES.length - 1)] || 'Tickd Incarnate';
