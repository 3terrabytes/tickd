import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { levelTitle, xpForLevel } from '../utils/xp';

const ICONS = ['⚡','🏃','📚','🧘','💪','🥗','💧','🎯','🧠','🌅','🎨','🎸','💻','🌿','❤️'];
const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4'];

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [habits, setHabits] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', icon: '⚡', color: '#6366f1' });
  const [floats, setFloats] = useState([]); // XP float animations
  const [levelUp, setLevelUp] = useState(null);

  const load = useCallback(async () => {
    const data = await api.habits.list();
    setHabits(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const complete = async (habit) => {
    if (habit.completed_today) {
      await api.habits.uncomplete(habit.id);
      await load(); await refreshUser();
      return;
    }
    try {
      const result = await api.habits.complete(habit.id);
      // Spawn floating XP
      const id = Date.now();
      setFloats(f => [...f, { id, xp: result.xpEarned }]);
      setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 1200);

      if (result.leveledUp) {
        setLevelUp(result.newLevel);
        setTimeout(() => setLevelUp(null), 3000);
      }

      await load(); await refreshUser();
    } catch {}
  };

  const addHabit = async (e) => {
    e.preventDefault();
    if (!newHabit.name.trim()) return;
    await api.habits.create(newHabit);
    setNewHabit({ name: '', icon: '⚡', color: '#6366f1' });
    setShowAdd(false);
    await load();
  };

  const deleteHabit = async (id) => {
    if (!window.confirm('Remove this habit?')) return;
    await api.habits.delete(id);
    await load();
  };

  const completedCount = habits.filter(h => h.completed_today).length;
  const currentXP = user?.xp || 0;
  const currentLevel = user?.level || 1;
  const nextLevelXP = xpForLevel(currentLevel + 1);
  const prevLevelXP = xpForLevel(currentLevel);
  const xpProgress = Math.min(((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100, 100);

  return (
    <div style={styles.wrap}>
      {/* Level up banner */}
      {levelUp && (
        <div style={styles.levelUpBanner} className="animate-fade">
          🎉 LEVEL UP! You are now Level {levelUp} — {levelTitle(levelUp)}!
        </div>
      )}

      {/* XP floats */}
      {floats.map(f => (
        <div key={f.id} style={styles.xpFloat}>+{f.xp} XP</div>
      ))}

      {/* Player header */}
      <div style={styles.playerCard} className="card">
        <div style={styles.playerRow}>
          <div style={{ ...styles.avatar, background: user?.avatar_color || '#6366f1' }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.playerName}>{user?.username}</div>
            <div style={styles.playerTitle}>
              <span style={styles.levelBadge}>Lv.{currentLevel}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{levelTitle(currentLevel)}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>XP</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{currentXP} / {nextLevelXP}</span>
              </div>
              <div className="xp-bar-wrap">
                <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
              </div>
            </div>
          </div>
          <div style={styles.statsCol}>
            <div style={styles.statItem}>
              <span style={{ fontSize: 18 }}>🔥</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Best Streak</span>
              <span style={{ fontWeight: 700, color: 'var(--gold)' }}>
                {habits.reduce((max, h) => Math.max(max, h.best_streak || 0), 0)}
              </span>
            </div>
            <div style={styles.statItem}>
              <span style={{ fontSize: 18 }}>✅</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Today</span>
              <span style={{ fontWeight: 700, color: 'var(--green)' }}>{completedCount}/{habits.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's progress */}
      {habits.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h2 style={{ fontSize: 16, color: 'var(--text-muted)' }}>Today's Quests</h2>
            <span style={{ fontSize: 13, color: completedCount === habits.length ? 'var(--green)' : 'var(--text-muted)' }}>
              {completedCount === habits.length && habits.length > 0 ? '⭐ Perfect day!' : `${completedCount} / ${habits.length} done`}
            </span>
          </div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${habits.length ? (completedCount / habits.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* Habit list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {habits.map(habit => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onComplete={() => complete(habit)}
            onDelete={() => deleteHabit(habit.id)}
          />
        ))}

        {habits.length === 0 && !showAdd && (
          <div style={styles.empty}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗡️</div>
            <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-muted)', marginBottom: 6 }}>No quests yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Add your first habit to begin your journey</p>
          </div>
        )}
      </div>

      {/* Add habit form */}
      {showAdd ? (
        <form onSubmit={addHabit} style={{ ...styles.addCard, marginTop: 12 }} className="card animate-fade">
          <h3 style={{ fontFamily: 'Cinzel, serif', marginBottom: 16, fontSize: 16 }}>New Quest</h3>
          <input
            autoFocus value={newHabit.name}
            onChange={e => setNewHabit(f => ({ ...f, name: e.target.value }))}
            placeholder="Habit name..."
            style={styles.input}
          />
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Icon</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ICONS.map(icon => (
                <button key={icon} type="button"
                  onClick={() => setNewHabit(f => ({ ...f, icon }))}
                  style={{ ...styles.iconBtn, ...(newHabit.icon === icon ? styles.iconBtnActive : {}) }}
                >{icon}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Color</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map(c => (
                <button key={c} type="button"
                  onClick={() => setNewHabit(f => ({ ...f, color: c }))}
                  style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: newHabit.color === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Quest</button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: 12, padding: '14px', borderStyle: 'dashed' }}
          onClick={() => setShowAdd(true)}
        >
          + Add New Quest
        </button>
      )}
    </div>
  );
}

function HabitCard({ habit, onComplete, onDelete }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={habit.completed_today ? '' : ''}
      style={{
        ...styles.habitCard,
        opacity: habit.completed_today ? 0.75 : 1,
        borderColor: habit.completed_today ? habit.color + '55' : 'var(--border)',
        background: habit.completed_today ? `${habit.color}11` : 'var(--bg2)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onComplete}
        style={{
          ...styles.checkBtn,
          background: habit.completed_today ? habit.color : 'transparent',
          borderColor: habit.completed_today ? habit.color : 'var(--border-bright)',
          transform: habit.completed_today ? 'scale(1.05)' : 'scale(1)'
        }}
      >
        {habit.completed_today ? '✓' : habit.icon}
      </button>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 500, textDecoration: habit.completed_today ? 'line-through' : 'none', color: habit.completed_today ? 'var(--text-muted)' : 'var(--text)' }}>
            {habit.name}
          </span>
          {habit.streak > 0 && (
            <span className="streak-fire">🔥{habit.streak}</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {habit.total_completions} total · Best: {habit.best_streak} days
        </div>
      </div>

      {hovered && (
        <button
          onClick={onDelete}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, padding: '4px 8px', borderRadius: 6 }}
        >✕</button>
      )}
    </div>
  );
}

// XP util exposed here too for convenience

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 },
  levelUpBanner: {
    position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, var(--gold), var(--gold2))',
    color: '#1a1200', padding: '12px 24px', borderRadius: 12, fontWeight: 700,
    zIndex: 100, boxShadow: '0 8px 32px rgba(245,158,11,0.4)', whiteSpace: 'nowrap'
  },
  xpFloat: {
    position: 'fixed', top: '40%', right: '20%',
    color: 'var(--gold)', fontWeight: 700, fontSize: 18,
    animation: 'xpFloat 1.2s ease forwards', pointerEvents: 'none', zIndex: 200
  },
  playerCard: { padding: 20 },
  playerRow: { display: 'flex', gap: 16, alignItems: 'flex-start' },
  avatar: {
    width: 52, height: 52, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Cinzel, serif', fontSize: 22, fontWeight: 700, color: 'white', flexShrink: 0
  },
  playerName: { fontFamily: 'Cinzel, serif', fontSize: 18, fontWeight: 600, marginBottom: 2 },
  playerTitle: { display: 'flex', alignItems: 'center', gap: 8 },
  levelBadge: {
    background: 'var(--accent)', color: 'white', padding: '2px 8px',
    borderRadius: 99, fontSize: 12, fontWeight: 600
  },
  statsCol: { display: 'flex', gap: 12, flexShrink: 0 },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  progressBar: { height: 6, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' },
  progressFill: {
    height: '100%', borderRadius: 99,
    background: 'linear-gradient(90deg, var(--green), #34d399)',
    transition: 'width 0.5s ease'
  },
  habitCard: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 16px', borderRadius: 12, border: '1px solid',
    transition: 'all 0.2s ease', cursor: 'default'
  },
  checkBtn: {
    width: 44, height: 44, borderRadius: '50%', border: '2px solid',
    fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'all 0.2s ease', color: 'white'
  },
  addCard: { background: 'var(--bg2)' },
  input: {
    width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '12px 14px', color: 'var(--text)', fontSize: 14, outline: 'none'
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--bg3)', fontSize: 18, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center'
  },
  iconBtnActive: { border: '1px solid var(--accent)', background: 'rgba(99,102,241,0.15)' },
  empty: {
    textAlign: 'center', padding: '48px 24px',
    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12
  }
};
