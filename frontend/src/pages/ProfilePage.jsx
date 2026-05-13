import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import PixelCharacter from '../components/PixelCharacter';

function xpForLevel(l) { return Math.floor(100 * Math.pow(l, 1.5)); }
function levelTitle(l) {
  const t=['','Rookie','Apprentice','Explorer','Achiever','Challenger','Warrior','Champion','Master','Grandmaster','Legend'];
  return t[Math.min(l, t.length-1)];
}
const RARITY_COLORS = { common:'#9ca3af', rare:'#3b82f6', epic:'#8b5cf6', legendary:'#f59e0b' };

export default function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.profile.get(username)
      .then(setProfile)
      .catch(() => setError('Profile not found'))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div style={S.center}><p style={{ color:'var(--text-muted)' }}>Loading...</p></div>;
  if (error)   return <div style={S.center}><p style={{ color:'var(--text-muted)' }}>{error}</p><Link to="/" style={{ color:'var(--accent)', fontSize:14 }}>← Back to Tickd</Link></div>;

  const xpNext = xpForLevel(profile.level + 1);
  const xpPrev = xpForLevel(profile.level);
  const xpPct  = profile.xp != null ? Math.min(((profile.xp - xpPrev) / (xpNext - xpPrev)) * 100, 100) : 0;
  const banner = profile.equipped?.banner;
  const badge  = profile.equipped?.badge;
  const gear   = Object.values(profile.equipped || {}).filter(Boolean);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', padding:'24px 20px' }}>
      <div style={{ maxWidth:640, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>

        {/* Back link */}
        <Link to="/" style={{ color:'var(--text-muted)', fontSize:13, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>← Tickd</Link>

        {/* Profile header */}
        <div className="card" style={{ padding:0, overflow:'hidden', position:'relative' }}>
          {banner && <div style={{ position:'absolute', top:0, left:0, right:0, height:60, background:banner.color, opacity:0.25 }}/>}
          <div style={{ display:'flex', gap:20, padding:24, position:'relative', zIndex:1 }}>
            <PixelCharacter equipped={profile.equipped||{}} appearance={profile} size={100}/>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:6 }}>
                {banner && <div style={{ background:banner.color, borderRadius:5, padding:'2px 10px', fontSize:12, fontWeight:600, color:'white', textShadow:'0 1px 2px rgba(0,0,0,0.5)' }}>{banner.name}</div>}
                <h1 style={{ fontFamily:'Cinzel,serif', fontSize:22, margin:0 }}>{profile.username}</h1>
                {badge && <span style={{ fontSize:20 }}>{badge.emoji}</span>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <span style={{ background:'var(--accent)', color:'white', padding:'2px 10px', borderRadius:99, fontSize:12, fontWeight:600 }}>Lv.{profile.level}</span>
                <span style={{ color:'var(--text-muted)', fontSize:13 }}>{levelTitle(profile.level)}</span>
              </div>
              {profile.xp != null && (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>XP</span>
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>{profile.xp.toLocaleString()} / {xpNext.toLocaleString()}</span>
                  </div>
                  <div className="xp-bar-wrap"><div className="xp-bar-fill" style={{ width:`${xpPct}%` }}/></div>
                </div>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ display:'flex', borderTop:'1px solid var(--border)' }}>
            {[
              { icon:'🔥', label:'Best Streak', val: profile.best_streak != null ? `${profile.best_streak}d` : '🔒' },
              { icon:'📋', label:'Habits',      val: profile.habits?.length > 0 ? profile.habits.length : (profile.habits?.length === 0 && profile.isFriend !== undefined ? '🔒' : 0) },
              { icon:'📅', label:'Member Since',val: new Date(profile.member_since).toLocaleDateString('en-GB', { month:'short', year:'numeric' }) },
            ].map((s,i) => (
              <div key={i} style={{ flex:1, padding:'14px 8px', textAlign:'center', borderRight: i<2 ? '1px solid var(--border)':'' }}>
                <div style={{ fontSize:18, marginBottom:2 }}>{s.icon}</div>
                <div style={{ fontWeight:700, fontSize:15 }}>{s.val}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Gear */}
        {gear.length > 0 && (
          <div className="card" style={{ padding:16 }}>
            <h3 style={{ fontFamily:'Cinzel,serif', fontSize:13, color:'var(--text-muted)', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.05em' }}>Equipment</h3>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {gear.map((item,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--bg3)', borderRadius:8, padding:'6px 12px', border:`1px solid ${RARITY_COLORS[item.rarity]||'var(--border)'}44` }}>
                  <span style={{ fontSize:18 }}>{item.type==='banner' ? '🏷️' : item.emoji}</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:RARITY_COLORS[item.rarity]||'var(--text)' }}>{item.name}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)' }}>{item.rarity}{item.magic>0?` · ✨${item.magic}`:''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity heatmap */}
        {profile.heatmap && profile.heatmap.length > 0 && (
          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontFamily:'Cinzel,serif', fontSize:13, color:'var(--text-muted)', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.05em' }}>Activity (Last 90 Days)</h3>
            <Heatmap data={profile.heatmap} habits={profile.habits||[]}/>
          </div>
        )}

        {/* 28-day streak calendar */}
        {profile.completed_days != null && (
          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontFamily:'Cinzel,serif', fontSize:13, color:'var(--text-muted)', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.05em' }}>Streak Calendar (Last 28 Days)</h3>
            <StreakCalendar completedDays={profile.completed_days} />
          </div>
        )}

        {/* Habits */}
        {profile.habits && profile.habits.length > 0 && (
          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontFamily:'Cinzel,serif', fontSize:13, color:'var(--text-muted)', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.05em' }}>Habits</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {profile.habits.map(h => (
                <div key={h.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'var(--bg3)', borderRadius:10, border:'1px solid var(--border)' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:h.color||'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{h.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{h.name}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{h.total_completions} completions · Best: {h.best_streak}d</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ color:'#f59e0b', fontWeight:700, fontSize:14 }}>🔥{h.streak}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>streak</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Private notice */}
        {profile.habits && profile.habits.length === 0 && !profile.isSelf && (
          <div className="card" style={{ padding:24, textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🔒</div>
            <p style={{ color:'var(--text-muted)', fontSize:14 }}>This user's habits are private.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StreakCalendar({ completedDays = [] }) {
  const today = new Date();
  const days = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    days.push({ iso, label: d.toLocaleDateString('en-GB', { day:'numeric', month:'short' }) });
  }
  const done = new Set(completedDays.map(d => d.slice(0, 10)));
  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
        {days.map(({ iso, label }) => (
          <div key={iso} title={label} style={{
            width:22, height:22, borderRadius:5,
            background: done.has(iso) ? 'var(--green)' : 'var(--bg3)',
            border:`1px solid ${done.has(iso) ? 'var(--green)' : 'var(--border)'}`,
            opacity: done.has(iso) ? 1 : 0.45,
          }}/>
        ))}
      </div>
      <div style={{ display:'flex', gap:12, marginTop:8, fontSize:11, color:'var(--text-muted)' }}>
        <span style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ width:10, height:10, borderRadius:2, background:'var(--green)', display:'inline-block' }}/>Completed
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ width:10, height:10, borderRadius:2, background:'var(--bg3)', border:'1px solid var(--border)', display:'inline-block' }}/>Missed
        </span>
      </div>
    </div>
  );
}

function Heatmap({ data, habits }) {
  const maxCount = habits.length || 1;
  const byDate = {};
  data.forEach(d => { byDate[d.completed_date?.split('T')[0]] = Number(d.count); });

  const days = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ key, count: byDate[key] || 0 });
  }

  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
      {days.map(d => {
        const pct = d.count / maxCount;
        const bg = d.count === 0 ? 'var(--bg3)'
          : pct >= 0.8 ? 'var(--accent)'
          : pct >= 0.5 ? 'var(--accent)88'
          : 'var(--accent)44';
        return (
          <div key={d.key} title={`${d.key}: ${d.count}/${maxCount}`}
            style={{ width:10, height:10, borderRadius:2, background:bg, cursor:'default' }}/>
        );
      })}
    </div>
  );
}

const S = {
  center: { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }
};
