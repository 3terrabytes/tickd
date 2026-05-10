import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import PixelCharacter from '../components/PixelCharacter';

function levelTitle(level) {
  const t = ['','Rookie','Apprentice','Explorer','Achiever','Challenger','Warrior','Champion','Master','Grandmaster','Legend'];
  return t[Math.min(level, t.length - 1)];
}
function xpForLevel(level) { return Math.floor(100 * Math.pow(level, 1.5)); }

const RARITY_COLORS = { common: '#9ca3af', rare: '#3b82f6', epic: '#8b5cf6', legendary: '#f59e0b' };

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
    const users = await api.friends.all(q);
    setAllUsers(users);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab === 'find') loadAll(search);
  }, [tab, search, loadAll]);

  const sendRequest = async (id) => {
    try {
      await api.friends.request(id);
      loadAll(search);
    } catch {}
  };

  const accept = async (id) => { await api.friends.accept(id); await load(); };
  const remove = async (id) => { await api.friends.remove(id); await load(); loadAll(search); };

  // Build leaderboard (self + friends)
  const board = [
    { id: user?.id, username: user?.username, xp: user?.xp || 0, level: user?.level || 1, avatar_color: user?.avatar_color, isSelf: true, equipped: {} },
    ...friends
  ].sort((a, b) => b.xp - a.xp);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 }}>
      <div style={styles.tabs}>
        {['leaderboard', 'friends', 'find'].map(t => (
          <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }} onClick={() => setTab(t)}>
            {t === 'leaderboard' ? '👥 Friends' : t === 'friends' ? `📨 Requests${pending.length ? ` (${pending.length})` : ''}` : '🔍 Find'}
          </button>
        ))}
      </div>

      {tab === 'leaderboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {board.length <= 1 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
              Add friends to see them here
            </p>
          )}

          {board.map((p, i) => {
            const totalMagic = Object.values(p.equipped || {})
              .filter(Boolean)
              .reduce((s, item) => s + (item.magic || 0), 0);

            return (
              <div
                key={p.id}
                className="card"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  border: `1px solid ${p.isSelf ? 'var(--accent)' : 'var(--border)'}`
                }}
              >
                {p.equipped?.banner && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: p.equipped.banner.color,
                      opacity: 0.18
                    }}
                  />
                )}

                <div style={{ position: 'relative', zIndex: 2, width: 28, textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-muted)' }}>
                    #{i + 1}
                  </div>
                </div>

                <div style={{ position: 'relative', zIndex: 2 }}>
                  <PixelCharacter
                    equipped={p.equipped || {}}
                    appearance={p}
                    size={72}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 2 }}>
                  <NameWithBanner user={p} />

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginTop: 6,
                      fontSize: 12,
                      color: 'var(--text-muted)'
                    }}
                  >
                    <span>Lv.{p.level}</span>
                    <span>✨ {totalMagic} Magic</span>
                    <span>🔥 {p.best_streak || 0}</span>
                    <span>{p.completed_today || 0}/{p.total_habits || 0} today</span>
                  </div>
                </div>

                <div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    textAlign: 'right',
                    flexShrink: 0
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 15 }}>
                    {p.xp?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    XP
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'friends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pending.length > 0 && (
            <div>
              <h3 style={styles.sectionTitle}>Pending Requests</h3>
              {pending.map(p => (
                <div key={p.id} style={styles.friendRow} className="card">
                  <Avatar user={p} />
                  <div style={{ flex: 1 }}>
                    <NameWithBanner user={p} />
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lv.{p.level} {levelTitle(p.level)}</div>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => accept(p.id)}>Accept</button>
                  <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => remove(p.id)}>Decline</button>
                </div>
              ))}
            </div>
          )}
          <h3 style={styles.sectionTitle}>Your Friends ({friends.length})</h3>
          {friends.length === 0 && <div style={styles.empty}><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No friends yet — find players below!</p></div>}
          {friends.map(f => (
            <div key={f.id} style={styles.friendRow} className="card">
              <Avatar user={f} />
              <div style={{ flex: 1 }}>
                <NameWithBanner user={f} />
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lv.{f.level} · {f.completed_today}/{f.total_habits} today · 🔥{f.best_streak}</div>
              </div>
              <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => remove(f.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'find' && (
        <div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by username..."
            style={styles.input}
            autoFocus
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>Loading...</p>}
            {!loading && allUsers.map(u => {
              const isFriend = u.friendship_status === 'accepted';
              const sent = u.friendship_status === 'pending' && u.friendship_dir === 'sent';
              const received = u.friendship_status === 'pending' && u.friendship_dir === 'received';
              return (
                <div key={u.id} style={styles.friendRow} className="card">
                  <Avatar user={u} />
                  <div style={{ flex: 1 }}>
                    <NameWithBanner user={u} />
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lv.{u.level} {levelTitle(u.level)}</div>
                  </div>
                  {isFriend ? (
                    <span style={{ fontSize: 12, color: 'var(--green)' }}>✓ Friends</span>
                  ) : sent ? (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sent</span>
                  ) : received ? (
                    <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => accept(u.id)}>Accept</button>
                  ) : (
                    <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => sendRequest(u.id)}>+ Add</button>
                  )}
                </div>
              );
            })}
            {!loading && allUsers.length === 0 && search && (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 24 }}>No players found</p>
            )}
            {!loading && allUsers.length === 0 && !search && (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 24 }}>No other players yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ user }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      background: user.avatar_color || '#6366f1',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Cinzel, serif', fontWeight: 700, color: 'white', fontSize: 16, flexShrink: 0
    }}>
      {user.username?.[0]?.toUpperCase()}
    </div>
  );
}

function NameWithBanner({ user }) {
  const banner = user.equipped?.banner;
  const badge = user.equipped?.badge;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap'
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 10px',
          borderRadius: 999,
          overflow: 'hidden'
        }}
      >
        {banner && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: banner.color,
              opacity: 0.35
            }}
          />
        )}

        <span
          style={{
            position: 'relative',
            zIndex: 1,
            fontWeight: 700
          }}
        >
          {user.username}
        </span>
      </div>

      {badge && (
        <span style={{ fontSize: 16 }}>
          {badge.emoji}
        </span>
      )}
    </div>
  );
}

      {banner && <div style={{ position:'absolute', inset:0, background:banner.color, opacity:0.12 }}/>}
      <div style={{ fontSize:20, width:28, textAlign:'center', zIndex:1 }}>
        {rank <= 3 ? medals[rank-1] : <span style={{ color:'var(--text-muted)', fontSize:14 }}>#{rank}</span>}
      </div>
      <div style={{ zIndex:1, flexShrink:0 }}>
        <PixelCharacter equipped={player.equipped||{}} appearance={player} size={56}/>
      </div>
      <div style={{ flex:1, zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          {banner && (
            <div style={{ background:banner.color, borderRadius:4, padding:'1px 7px', fontSize:11, fontWeight:600, color:'white', textShadow:'0 1px 2px rgba(0,0,0,0.6)' }}>{banner.name}</div>
          )}
          <span style={{ fontWeight:600 }}>{player.username}{player.isSelf ? ' (you)' : ''}</span>
          {badge  && <span style={{ fontSize:15 }}>{badge.emoji}</span>}
          {weapon && <span style={{ fontSize:13 }}>{weapon.emoji}</span>}
          <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, color:'var(--text-muted)', background: player.isSelf ? 'var(--accent)' : 'var(--bg3)' }}>Lv.{player.level}</span>
        </div>
        <div className="xp-bar-wrap" style={{ marginTop:4 }}>
          <div className="xp-bar-fill" style={{ width:`${pct}%` }}/>
        </div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0, zIndex:1 }}>
        <div style={{ fontWeight:700, color:'var(--gold)', fontSize:15 }}>{player.xp?.toLocaleString()}</div>
        <div style={{ fontSize:11, color:'var(--text-muted)' }}>XP</div>
      </div>
    </div>
  );
}

const styles = {
  tabs: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'var(--bg2)', borderRadius: 10, padding: 4, border: '1px solid var(--border)' },
  tab: { padding: '10px 6px', border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, borderRadius: 7, cursor: 'pointer' },
  tabActive: { background: 'var(--bg3)', color: 'var(--text)' },
  sectionTitle: { fontFamily: 'Cinzel, serif', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
  friendRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' },
  levelBadge: { padding: '2px 8px', borderRadius: 99, fontSize: 11, color: 'var(--text-muted)' },
  input: { width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--text)', fontSize: 14, outline: 'none' },
  empty: { textAlign: 'center', padding: 32 }
};
