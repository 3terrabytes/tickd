export const THEMES = {
  default:  { label: 'Default',   preview: ['#0a0a0f','#6366f1','#06b6d4'] },
  midnight: { label: 'Midnight',  preview: ['#060614','#818cf8','#c084fc'] },
  forest:   { label: 'Forest',    preview: ['#071a0e','#22c55e','#86efac'] },
  rose:     { label: 'Rose',      preview: ['#160810','#f43f5e','#fb7185'] },
  ocean:    { label: 'Ocean',     preview: ['#030d1a','#0ea5e9','#38bdf8'] },
  sunset:   { label: 'Sunset',    preview: ['#150a03','#f97316','#fbbf24'] },
  mono:     { label: 'Mono',      preview: ['#0a0a0a','#e5e5e5','#a3a3a3'] },
};

const THEME_VARS = {
  default: {
    '--bg':'#0a0a0f','--bg2':'#111118','--bg3':'#1a1a25',
    '--border':'#2a2a3a','--border-bright':'#3a3a55',
    '--text':'#e8e8f0','--text-muted':'#7878a0',
    '--accent':'#7c6af7','--accent2':'#a78bfa',
    '--gold':'#06b6d4','--gold2':'#67e8f9',
    '--green':'#10b981','--red':'#ef4444',
  },
  midnight: {
    '--bg':'#060614','--bg2':'#0d0d24','--bg3':'#161630',
    '--border':'#2a2a4a','--border-bright':'#3a3a6a',
    '--text':'#e8e8ff','--text-muted':'#6868a0',
    '--accent':'#818cf8','--accent2':'#c084fc',
    '--gold':'#c084fc','--gold2':'#e879f9',
    '--green':'#34d399','--red':'#f87171',
  },
  forest: {
    '--bg':'#071a0e','--bg2':'#0d2618','--bg3':'#143320',
    '--border':'#1a3a28','--border-bright':'#2a5040',
    '--text':'#e8f5e8','--text-muted':'#608a70',
    '--accent':'#22c55e','--accent2':'#86efac',
    '--gold':'#86efac','--gold2':'#bbf7d0',
    '--green':'#4ade80','--red':'#f87171',
  },
  rose: {
    '--bg':'#160810','--bg2':'#200e18','--bg3':'#2e1222',
    '--border':'#3a1a2a','--border-bright':'#5a2a3a',
    '--text':'#ffe8f0','--text-muted':'#a06878',
    '--accent':'#f43f5e','--accent2':'#fb7185',
    '--gold':'#fb7185','--gold2':'#fda4af',
    '--green':'#34d399','--red':'#ef4444',
  },
  ocean: {
    '--bg':'#030d1a','--bg2':'#071828','--bg3':'#0c2238',
    '--border':'#102a40','--border-bright':'#1a4060',
    '--text':'#e0f2fe','--text-muted':'#4a80a0',
    '--accent':'#0ea5e9','--accent2':'#38bdf8',
    '--gold':'#38bdf8','--gold2':'#7dd3fc',
    '--green':'#34d399','--red':'#f87171',
  },
  sunset: {
    '--bg':'#150a03','--bg2':'#201008','--bg3':'#2e1a0c',
    '--border':'#3a2010','--border-bright':'#5a3020',
    '--text':'#fff7ed','--text-muted':'#a07050',
    '--accent':'#f97316','--accent2':'#fb923c',
    '--gold':'#fbbf24','--gold2':'#fcd34d',
    '--green':'#34d399','--red':'#ef4444',
  },
  mono: {
    '--bg':'#0a0a0a','--bg2':'#141414','--bg3':'#1e1e1e',
    '--border':'#2a2a2a','--border-bright':'#3a3a3a',
    '--text':'#e5e5e5','--text-muted':'#737373',
    '--accent':'#d4d4d4','--accent2':'#e5e5e5',
    '--gold':'#a3a3a3','--gold2':'#d4d4d4',
    '--green':'#a3a3a3','--red':'#737373',
  },
};

export function applyTheme(theme) {
  const vars = THEME_VARS[theme] || THEME_VARS.default;
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}
