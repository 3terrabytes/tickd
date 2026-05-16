import { useState, useEffect } from 'react';
import { api } from '../api';

const RARITY_COLORS = {
  common:    '#9ca3af',
  rare:      '#3b82f6',
  epic:      '#8b5cf6',
  legendary: '#f59e0b',
};

export default function AchievementsPage() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('all'); // all | earned | locked

  useEffect(() => {
    api.achievements.list().then(setData).catch(() => setData({ achievements: [], earned_count: 0, total: 0 }));
  }, []);

  if (!data) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  const filtered = data.achievements.filter(a =>
    filter === 'earned' ? a.earned :
    filter === 'locked' ? !a.earned :
    true
  );

  const pct = data.total ? Math.round((data.earned_count / data.total) * 100) : 0;

  return (
    <div style={styles.wrap}>
      <div className="card" style={{ padding: 20 }}>
        <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 22, marginBottom: 6 }}>🏆 Achievements</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
          {data.earned_count} of {data.total} unlocked · {pct}% complete
        </div>
        <div className="xp-bar-wrap"><div className="xp-bar-fill" style={{ width: `${pct}%` }} /></div>
      </div>

      <div style={styles.filterRow}>
        {['all', 'earned', 'locked'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.grid}>
        {filtered.map(a => (
          <AchievementCard key={a.code} achievement={a} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
          Nothing to show here.
        </div>
      )}
    </div>
  );
}

function AchievementCard({ achievement: a }) {
  const color = RARITY_COLORS[a.rarity] || '#9ca3af';
  return (
    <div style={{
      ...styles.card,
      borderColor: a.earned ? color + '88' : 'var(--border)',
      opacity: a.earned ? 1 : 0.55,
      background: a.earned ? `${color}11` : 'var(--bg2)',
    }}>
      <div style={{
        ...styles.emojiCircle,
        background: a.earned ? `${color}33` : 'var(--bg3)',
        filter: a.earned ? 'none' : 'grayscale(1)',
      }}>
        {a.earned ? a.emoji : '🔒'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</span>
          <span style={{ ...styles.rarityChip, color, borderColor: color + '55' }}>{a.rarity}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{a.desc}</div>
        {a.earned && a.earned_at && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Earned {new Date(a.earned_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 },
  filterRow: { display: 'flex', gap: 6 },
  filterBtn: {
    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
    background: 'var(--bg2)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', cursor: 'pointer',
  },
  filterBtnActive: {
    background: 'var(--bg3)', color: 'var(--text)', borderColor: 'var(--accent)',
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10,
  },
  card: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 12, border: '1px solid',
    transition: 'all 0.2s ease',
  },
  emojiCircle: {
    width: 48, height: 48, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, flexShrink: 0,
  },
  rarityChip: {
    fontSize: 10, padding: '1px 8px', borderRadius: 99,
    border: '1px solid', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600,
  },
};
