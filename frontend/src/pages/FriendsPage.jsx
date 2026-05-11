import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import PixelCharacter from '../components/PixelCharacter';

function levelTitle(level) {
  const t = ['','Rookie','Apprentice','Explorer','Achiever','Challenger','Warrior','Champion','Master','Grandmaster','Legend'];
  return t[Math.min(level, t.length - 1)];
}
function xpForLevel(level) { return Math.floor(100 * Math.pow(level, 1.5)); }
const RARITY_COLORS = { common:'#9ca3af', rare:'#3b82f6', epic:'#8b5cf6', legendary:'#f59e0b' };

export default function FriendsPage() {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('leaderboard');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const [f, p] = await Promise.all([api.friends.list(), api.friends.pending()]);
    setFriends(f);
    setPending(p);
  }, []);

  const loadAll = useCallback(async (q = '') => {
    setLoading(true);
    try { setAllUsers(await api.friends.all(q)); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'find') loadAll(search); }, [tab, search, loadAll]);

  const sendRequest = async (id) => { try { await api.friends.request(id); loadAll(search); } catch {} };
  const accept = async (id) => { await api.friends.accept(id); await load(); };
  const remove = async (id) => { await api.friends.remove(id); await load(); loadAll(search); };

  // Self entry uses the user's own appearance fields
  const board = [
    {
      id: user?.id, username: user?.username, xp: user?.xp||0, level: user?.level||1,
      avatar_skin: user?.avatar_skin, avatar_hair: user?.avatar_hair,
      avatar_eyes: user?.avatar_eyes, avatar_hair_style: user?.avatar_hair_style,
      isSelf: true, equipped: {}
    },
    ...friends
  ].sort((a, b) => b.xp - a.xp);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, paddingBottom:32 }}>
      <div style={S.tabs}>
        {['leaderboard','friends','find'].map(t => (
          <button key={t} style={{ ...S.tab, ...(tab===t ? S.tabActive:{}) }} onClick={() => setTab(t)}>
            {t==='leaderboard' ? '🏆 Board' : t==='friends' ? `Friends${pending.length ? ` (${pending.length})`:'' }` : '🔍 Find'}
          </button>
        ))}
      </div>

      {/* LEADERBOARD */}
      {tab==='leaderboard' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {board.length <= 1 && <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center' }}>Add friends to see them on the board</p>}
          {board.map((p, i) => <PlayerCard key={p.id} player={p} rank={i+1}/>)}
        </div>
      )}

      {/* FRIENDS LIST */}
      {tab==='friends' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {pending.length > 0 && <>
            <h3 style={S.sectionTitle}>Pending Requests</h3>
            {pending.map(p => (
              <div key={p.id} className="card" style={S.friendCard}>
                <PixelCharacter equipped={p.equipped||{}} appearance={p} size={52}/>
                <div style={{ flex:1 }}>
                  <NameWithBanner user={p}/>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>Lv.{p.level} {levelTitle(p.level)}</div>
                </div>
                <button className="btn btn-primary" style={{ padding:'8px 14px', fontSize:13 }} onClick={() => accept(p.id)}>Accept</button>
                <button className="btn btn-ghost"   style={{ padding:'8px 14px', fontSize:13 }} onClick={() => remove(p.id)}>Decline</button>
              </div>
            ))}
          </>}
          <h3 style={S.sectionTitle}>Your Friends ({friends.length})</h3>
          {friends.length === 0 && <div style={S.empty}><p style={{ color:'var(--text-muted)', fontSize:14 }}>No friends yet — find players in the Find tab!</p></div>}
          {friends.map(f => <FriendCard key={f.id} friend={f} onRemove={() => remove(f.id)}/>)}
        </div>
      )}

      {/* FIND */}
      {tab==='find' && (
        <div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by username..." style={S.input} autoFocus/>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:12 }}>
            {loading && <p style={{ color:'var(--text-muted)', textAlign:'center', padding:16 }}>Loading...</p>}
            {!loading && allUsers.map(u => {
              const isFriend = u.friendship_status === 'accepted';
              const sent     = u.friendship_status === 'pending' && u.friendship_dir === 'sent';
              const received = u.friendship_status === 'pending' && u.friendship_dir === 'received';
              return (
                <div key={u.id} className="card" style={S.friendCard}>
                  <PixelCharacter equipped={u.equipped||{}} appearance={u} size={52}/>
                  <div style={{ flex:1 }}>
                    <NameWithBanner user={u}/>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>Lv.{u.level} {levelTitle(u.level)}</div>
                  </div>
                  {isFriend  ? <span style={{ fontSize:12, color:'var(--green)' }}>✓ Friends</span>
                  : sent     ? <span style={{ fontSize:12, color:'var(--text-muted)' }}>Sent</span>
                  : received ? <button className="btn btn-primary" style={{ padding:'8px 14px', fontSize:13 }} onClick={() => accept(u.id)}>Accept</button>
                  :            <button className="btn btn-primary" style={{ padding:'8px 14px', fontSize:13 }} onClick={() => sendRequest(u.id)}>+ Add</button>}
                </div>
              );
            })}
            {!loading && allUsers.length===0 && search  && <p style={{ color:'var(--text-muted)', fontSize:14, textAlign:'center', padding:24 }}>No players found</p>}
            {!loading && allUsers.length===0 && !search && <p style={{ color:'var(--text-muted)', fontSize:14, textAlign:'center', padding:24 }}>No other players yet</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// Expanded friend card — avatar with armor, banner behind name, badge, gear list, stats
function FriendCard({ friend: f, onRemove }) {
  const banner = f.equipped?.banner;
  const badge  = f.equipped?.badge;
  const weapon = f.equipped?.weapon;
  const armor  = f.equipped?.armor;
  const magic  = Object.values(f.equipped||{}).filter(Boolean).reduce((s,i) => s+(i.magic||0), 0);
  const gear   = [weapon, armor, banner, badge].filter(Boolean);

  return (
    <div className="card" style={{ padding:0, overflow:'hidden', position:'relative' }}>
      {banner && <div style={{ position:'absolute', top:0, left:0, right:0, height:44, background:banner.color, opacity:0.2 }}/>}
      <div style={{ display:'flex', gap:14, padding:'14px 16px', position:'relative', zIndex:1 }}>
        <div style={{ flexShrink:0 }}>
          <PixelCharacter equipped={f.equipped||{}} appearance={f} size={80}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          {/* Name */}
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:5 }}>
            {banner && <div style={{ background:banner.color, borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:600, color:'white', textShadow:'0 1px 2px rgba(0,0,0,0.5)' }}>{banner.name}</div>}
            <span style={{ fontWeight:700, fontSize:15 }}>{f.username}</span>
            {badge && <span style={{ fontSize:16 }}>{badge.emoji}</span>}
            <span style={{ background:'var(--bg3)', padding:'2px 8px', borderRadius:99, fontSize:11, color:'var(--text-muted)' }}>Lv.{f.level} {levelTitle(f.level)}</span>
          </div>
          {/* Stats */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:8 }}>
            <Stat icon="🔥" label="Streak" value={f.best_streak||0}/>
            <Stat icon="✅" label="Today"  value={`${f.completed_today||0}/${f.total_habits||0}`}/>
            {magic > 0 && <Stat icon="✨" label="Magic" value={magic}/>}
            <Stat icon="⭐" label="XP"    value={(f.xp||0).toLocaleString()}/>
          </div>
          {/* Gear */}
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {gear.length === 0
              ? <span style={{ fontSize:11, color:'var(--text-muted)' }}>No gear equipped</span>
              : gear.map((item, i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:4,
                  background:'var(--bg3)', borderRadius:6, padding:'3px 8px',
                  border:`1px solid ${RARITY_COLORS[item.rarity]||'var(--border)'}55`,
                  fontSize:11, color:RARITY_COLORS[item.rarity]||'var(--text-muted)'
                }}>
                  {item.type==='banner'
                    ? <div style={{ width:10, height:10, borderRadius:2, background:item.color, display:'inline-block' }}/>
                    : <span>{item.emoji}</span>}
                  {item.name}
                </div>
              ))}
          </div>
        </div>
        <button onClick={onRemove} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:16, padding:'4px 8px', borderRadius:6, cursor:'pointer', alignSelf:'flex-start' }}>✕</button>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <span style={{ fontSize:13 }}>{icon}</span>
      <span style={{ fontSize:11, color:'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:600 }}>{value}</span>
    </div>
  );
}

function NameWithBanner({ user }) {
  const banner = user.equipped?.banner;
  const badge  = user.equipped?.badge;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
      {banner && <div style={{ background:banner.color, borderRadius:4, padding:'1px 7px', fontSize:11, fontWeight:600, color:'white', textShadow:'0 1px 2px rgba(0,0,0,0.6)' }}>{banner.name}</div>}
      <span style={{ fontWeight:500 }}>{user.username}</span>
      {badge && <span style={{ fontSize:15 }}>{badge.emoji}</span>}
    </div>
  );
}

// Leaderboard card — customised avatar, banner behind name, badge, weapon, no XP bar
function PlayerCard({ player, rank }) {
  const medals = ['🥇','🥈','🥉'];
  const banner = player.equipped?.banner;
  const badge  = player.equipped?.badge;
  const weapon = player.equipped?.weapon;
  const magic  = Object.values(player.equipped||{}).filter(Boolean).reduce((s,i) => s+(i.magic||0), 0);

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
      background:'var(--bg2)',
      border:`1px solid ${player.isSelf ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius:12, position:'relative', overflow:'hidden'
    }}>
      {banner && <div style={{ position:'absolute', inset:0, background:banner.color, opacity:0.12 }}/>}

      {/* Rank */}
      <div style={{ fontSize:20, width:28, textAlign:'center', zIndex:1, flexShrink:0 }}>
        {rank <= 3 ? medals[rank-1] : <span style={{ color:'var(--text-muted)', fontSize:14 }}>#{rank}</span>}
      </div>

      {/* Pixel avatar — uses appearance fields directly on player object */}
      <div style={{ zIndex:1, flexShrink:0 }}>
        <PixelCharacter equipped={player.equipped||{}} appearance={player} size={60}/>
      </div>

      {/* Info */}
      <div style={{ flex:1, zIndex:1, minWidth:0 }}>
        {/* Name row */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:4 }}>
          {banner && <div style={{ background:banner.color, borderRadius:4, padding:'1px 7px', fontSize:11, fontWeight:600, color:'white', textShadow:'0 1px 2px rgba(0,0,0,0.6)' }}>{banner.name}</div>}
          <span style={{ fontWeight:600 }}>{player.username}{player.isSelf ? ' (you)':''}</span>
          {badge  && <span style={{ fontSize:15 }}>{badge.emoji}</span>}
          {weapon && <span style={{ fontSize:13 }}>{weapon.emoji}</span>}
          <span style={{ background: player.isSelf ? 'var(--accent)':'var(--bg3)', color: player.isSelf ? 'white':'var(--text-muted)', padding:'2px 8px', borderRadius:99, fontSize:11 }}>Lv.{player.level}</span>
        </div>
        {/* Stats row */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {player.best_streak > 0 && <Stat icon="🔥" label="Streak" value={player.best_streak}/>}
          {magic > 0             && <Stat icon="✨" label="Magic"  value={magic}/>}
          <Stat icon="⭐" label="XP" value={(player.xp||0).toLocaleString()}/>
        </div>
      </div>
    </div>
  );
}

const S = {
  tabs:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', background:'var(--bg2)', borderRadius:10, padding:4, border:'1px solid var(--border)' },
  tab:{ padding:'10px 6px', border:'none', background:'transparent', color:'var(--text-muted)', fontSize:13, fontWeight:500, borderRadius:7, cursor:'pointer' },
  tabActive:{ background:'var(--bg3)', color:'var(--text)' },
  sectionTitle:{ fontFamily:'Cinzel, serif', fontSize:13, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' },
  friendCard:{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px' },
  input:{ width:'100%', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', color:'var(--text)', fontSize:14, outline:'none' },
  empty:{ textAlign:'center', padding:32 }
};
