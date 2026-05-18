import { useState, useEffect } from 'react';
import { api } from '../api';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StatsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.stats.get().then(setData).catch(e => setError(e.message));
  }, []);

  if (error) return <div style={{ color: 'var(--text-muted)' }}>Couldn't load stats: {error}</div>;
  if (!data) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div style={styles.wrap}>
      <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 22, margin: 0 }}>📊 Stats</h1>

      {/* Big number summary */}
      <div style={styles.summaryGrid}>
        <Stat label="Habits Tracked"   value={data.totals.habit_count}        icon="📋" />
        <Stat label="Total Completions" value={data.totals.total_completions} icon="✅" />
        <Stat label="Lifetime XP"       value={data.totals.lifetime_xp_earned.toLocaleString()} icon="⚡" />
        <Stat label="Lifetime Gold"     value={data.user.lifetime_gold.toLocaleString()}        icon="🪙" />
        <Stat label="Best Streak"       value={`${data.totals.best_streak_overall}d`}           icon="🔥" />
        <Stat label="Active Streaks"    value={data.totals.current_streak_total}                icon="📈" />
      </div>

      {/* Last 30 days XP chart */}
      <Card title="XP Earned · Last 30 Days">
        <DailyBars data={data.xp_daily} />
      </Card>

      {/* Heatmap */}
      <Card title="Activity · Last 90 Days">
        <Heatmap data={data.heatmap} maxPerDay={Math.max(data.totals.habit_count, 1)} />
      </Card>

      {/* Weekday distribution */}
      <Card title="Completions by Weekday">
        <WeekdayBars counts={data.weekday} />
      </Card>

      {/* Per-habit table */}
      <Card title="Per-Habit Breakdown">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.habits.map(h => (
            <HabitRow key={h.id} habit={h} />
          ))}
          {data.habits.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 16 }}>
              No habits yet — add one on the Quests page.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div style={styles.statBox}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>{label}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function DailyBars({ data }) {
  // Fill in zero-days so the axis is continuous
  const byDate = {};
  data.forEach(d => { byDate[d.completed_date?.split('T')[0]] = Number(d.xp); });
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ key, xp: byDate[key] || 0, label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
  }

  const max = Math.max(...days.map(d => d.xp), 1);
  const W = 600, H = 140, padL = 32, padB = 18, padT = 4;
  const innerW = W - padL, innerH = H - padB - padT;
  const barW = innerW / days.length - 2;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
        {/* Y-axis label */}
        <text x={2} y={padT + 8} fontSize="10" fill="var(--text-muted)">{max}</text>
        <text x={2} y={H - padB - 2} fontSize="10" fill="var(--text-muted)">0</text>
        <line x1={padL} y1={H - padB} x2={W} y2={H - padB} stroke="var(--border)" strokeWidth="1" />

        {days.map((d, i) => {
          const h = (d.xp / max) * innerH;
          const x = padL + i * (innerW / days.length) + 1;
          const y = H - padB - h;
          return (
            <g key={d.key}>
              <rect x={x} y={y} width={barW} height={h}
                fill={d.xp > 0 ? 'var(--accent)' : 'transparent'}
                rx={2}>
                <title>{d.label}: {d.xp} XP</title>
              </rect>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Heatmap({ data, maxPerDay }) {
  const byDate = {};
  data.forEach(d => { byDate[d.completed_date?.split('T')[0]] = Number(d.count); });

  const cells = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    cells.push({ key, count: byDate[key] || 0 });
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {cells.map(c => {
        const pct = c.count / maxPerDay;
        const bg = c.count === 0 ? 'var(--bg3)'
          : pct >= 1 ? 'var(--green)'
          : pct >= 0.66 ? 'var(--accent)'
          : pct >= 0.33 ? 'var(--accent)88'
          : 'var(--accent)44';
        return (
          <div key={c.key} title={`${c.key}: ${c.count}/${maxPerDay}`}
            style={{ width: 12, height: 12, borderRadius: 2, background: bg, cursor: 'default' }}/>
        );
      })}
    </div>
  );
}

function WeekdayBars({ counts }) {
  const max = Math.max(...counts, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
      {counts.map((c, i) => {
        const pct = (c / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%' }}>
            <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
              <div title={`${DAY_LABELS[i]}: ${c}`}
                style={{ width: '100%', height: `${pct}%`, background: 'var(--accent)', borderRadius: '4px 4px 0 0', minHeight: c > 0 ? 4 : 0 }}/>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{DAY_LABELS[i]}</div>
            <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600 }}>{c}</div>
          </div>
        );
      })}
    </div>
  );
}

function HabitRow({ habit: h }) {
  const last30Pct = Math.round((h.last_30 / 30) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: h.color || 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{h.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{h.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {h.total_completions} total · {h.last_7}/7 this week · {h.last_30}/30 last month ({last30Pct}%)
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>🔥{h.streak}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Best: {h.best_streak}d</div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 },
  summaryGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10,
  },
  statBox: {
    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12,
    padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  },
};
