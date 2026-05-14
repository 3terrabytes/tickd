import { useState, useEffect } from 'react';

const VERSION = 'v3.0';
const UPDATES = [
  { icon: '👤', title: 'Clickable Profiles',  desc: 'Click any friend on the leaderboard to see their streaks, habit calendar and stats.' },
  { icon: '📅', title: 'Streak Calendar',      desc: 'See your friends\' last 28 days of habit completions as a colour-coded calendar.' },
  { icon: '🎁', title: 'XP for Gifting',       desc: 'Earn XP every time you gift an item to a friend — more XP for rarer items.' },
  { icon: '⚔️', title: 'Visual Trade UI',      desc: 'Pick items to trade with a visual card selector — no more typing IDs.' },
  { icon: '🎨', title: 'Colour Themes',         desc: '7 colour themes to personalise your experience. Find them in ⚙️ Settings.' },
  { icon: '🔒', title: 'Privacy Controls',      desc: 'Choose who sees your XP, streaks, and habits: Everyone, Friends, or Private.' },
  { icon: '🔔', title: 'Push Notifications',    desc: 'Set a daily reminder time to check off your habits — fully customisable.' },
  { icon: '🛒', title: 'Expanded Shop',         desc: '70+ items including companions, consumables, titles, and more across all rarities.' },
  { icon: '🌍', title: 'Shareable Profiles',    desc: 'Share your profile at tickd.oscarh.co.uk/users/yourname with anyone.' },
];

export default function UpdateModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('tickd_update_seen');
    if (seen !== VERSION) setShow(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem('tickd_update_seen', VERSION);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20
    }}>
      <div style={{
        background:'var(--bg2)', border:'1px solid var(--border-bright)',
        borderRadius:16, padding:28, maxWidth:480, width:'100%',
        boxShadow:'0 24px 60px rgba(0,0,0,0.6)', maxHeight:'90vh', overflowY:'auto'
      }} className="animate-fade">
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>⚔️</div>
          <h2 style={{ fontFamily:'Cinzel,serif', fontSize:22, color:'var(--gold)', marginBottom:4 }}>Tickd {VERSION}</h2>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>Here's what's new in this update</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
          {UPDATES.map((u, i) => (
            <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'10px 14px', background:'var(--bg3)', borderRadius:10, border:'1px solid var(--border)' }}>
              <span style={{ fontSize:22, flexShrink:0 }}>{u.icon}</span>
              <div>
                <div style={{ fontWeight:600, fontSize:14, marginBottom:2 }}>{u.title}</div>
                <div style={{ color:'var(--text-muted)', fontSize:12 }}>{u.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-gold" style={{ width:'100%', padding:14, fontSize:15 }} onClick={dismiss}>
          Let's Go! 🚀
        </button>
      </div>
    </div>
  );
}
