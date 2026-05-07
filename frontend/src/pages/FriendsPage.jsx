import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

function levelTitle(level) {
  const t = ['','Rookie','Apprentice','Explorer','Achiever','Challenger','Warrior','Champion','Master','Grandmaster','Legend'];
  return t[Math.min(level, t.length - 1)];
}

function xpForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export default function FriendsPage() {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [requested, setRequested] = useState(new Set());
  const [tab, setTab] = useState('leaderboard');

  const load = async () => {
    const [f, p] = await Promise.all([api.friends.list(), api.friends.pending()]);
    setFriends(f);
    setPending(p);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      const results = await api.friends.search(search);
      setSearchResults(results);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const sendRequest = async (id) => {
    try {
      await api.friends.request(id);
      setRequested(s => new Set([...s, id]));
    } catch {}
  };

  const accept = async (id) => {
    await api.friends.accept(id);
    await load();
  };

  const remove = async (id) => {
    await api.friends.remove(id);
    await load();
  };

  // Build leaderboard (self + friends)
  const board = [
    {
      id: user?.id,
      username: user?.username + ' (you)',
      xp: user?.xp || 0,
      level: user?.level || 1,
      avatar_color: user?.avatar_color,
      isSelf: true
    },
    ...friends
  ].sort((a, b) => b.xp - a.xp);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 }}>
      <div style={styles.tabs}>
        {['leaderboard', 'friends', 'find'].map(t => (
          <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
            onClick={() => setTab(t)}>
            {t === 'leaderboard' ? '🏆 Board' : t === 'friends' ? `👥 Friends${pending.length ? ` (${pending.length})` : ''}` : '🔍 Find'}
          </button>
        ))}
      </div>

      {tab === 'leaderboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>Add friends to see them here</p>
          {board.map((p, i) => (
            <PlayerCard key={p.id} player={p} rank={i + 1} />
          ))}
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
                    <div style={{ fontWeight: 500 }}>{p.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lv.{p.level} {levelTitle(p.level)}</div>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => accept(p.id)}>Accept</button>
                  <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => remove(p.id)}>Decline</button>
                </div>
              ))}
            </div>
          )}

          <h3 style={styles.sectionTitle}>Your Friends ({friends.length})</h3>
          {friends.length === 0 && (
            <div style={styles.empty}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No friends yet — find players below!</p>
            </div>
          )}
          {friends.map(f => (
            <div key={f.id} style={styles.friendRow} className="card">
              <Avatar user={f} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{f.username}</div>
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
            {searchResults.map(u => {
              const isFriend = friends.some(f => f.id === u.id);
              const sent = requested.has(u.id);
              return (
                <div key={u.id} style={styles.friendRow} className="card">
                  <Avatar user={u} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{u.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lv.{u.level} {levelTitle(u.level)}</div>
                  </div>
                  {isFriend ? (
                    <span style={{ fontSize: 12, color: 'var(--green)' }}>✓ Friends</span>
                  ) : sent ? (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sent!</span>
                  ) : (
                    <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => sendRequest(u.id)}>+ Add</button>
                  )}
                </div>
              );
            })}
            {search && searchResults.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 24 }}>No players found</p>
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

function PlayerCard({ player, rank }) {
  const medals = ['🥇', '🥈', '🥉'];
  const xpPrev = Math.floor(100 * Math.pow(player.level, 1.5));
  const xpNext = xpForLevel(player.level + 1);
  const pct = Math.min(((player.xp - xpPrev) / (xpNext - xpPrev)) * 100, 100);

  return (
    <div style={{
      ...styles.playerCard,
      ...(player.isSelf ? { borderColor: 'var(--accent)', background: 'rgba(99,102,241,0.08)' } : {})
    }} className="card">
      <div style={{ fontSize: 20, width: 28, textAlign: 'center' }}>
        {rank <= 3 ? medals[rank - 1] : <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>#{rank}</span>}
      </div>
      <Avatar user={player} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>{player.username}</span>
          <span style={{ ...styles.levelBadge, background: player.isSelf ? 'var(--accent)' : 'var(--bg3)' }}>Lv.{player.level}</span>
        </div>
        <div className="xp-bar-wrap" style={{ marginTop: 4 }}>
          <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 15 }}>{player.xp.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>XP</div>
      </div>
    </div>
  );
}

const styles = {
  tabs: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
    background: 'var(--bg2)', borderRadius: 10, padding: 4,
    border: '1px solid var(--border)'
  },
  tab: {
    padding: '10px 6px', border: 'none', background: 'transparent',
    color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, borderRadius: 7, cursor: 'pointer'
  },
  tabActive: { background: 'var(--bg3)', color: 'var(--text)' },
  sectionTitle: { fontFamily: 'Cinzel, serif', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
  friendRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' },
  playerCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' },
  levelBadge: { padding: '2px 8px', borderRadius: 99, fontSize: 11, color: 'var(--text-muted)' },
  input: {
    width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '12px 16px', color: 'var(--text)', fontSize: 14, outline: 'none'
  },
  empty: { textAlign: 'center', padding: 32 }
};
