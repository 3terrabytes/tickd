import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Compute a "d h m s" remaining string from the current time to `until`.
// Returns null once the duration has elapsed so the caller knows to refresh.
function remaining(until) {
  if (!until) return null;
  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [
    d ? `${d}d` : null,
    h ? `${h}h` : null,
    m ? `${m}m` : null,
    `${s}s`,
  ].filter(Boolean).join(' ');
}

export default function BanScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [tick, setTick] = useState(0);

  const type = user?.suspension_type;
  const isTemp = type === 'temp';
  const isPerm = type === 'perm';
  const isBanned = isTemp || isPerm;

  // Tick every second so the countdown updates in real time. When the timer
  // hits zero we refresh /auth/me — the backend auth middleware clears
  // expired temp suspensions on the next request, so the user becomes
  // unbanned automatically.
  useEffect(() => {
    if (!isTemp) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [isTemp]);

  useEffect(() => {
    if (!isTemp || !user?.suspended_until) return;
    if (new Date(user.suspended_until).getTime() <= Date.now()) {
      refreshUser();
    }
  }, [tick, isTemp, user?.suspended_until, refreshUser]);

  if (!isBanned) return null;

  const left = isTemp ? remaining(user.suspended_until) : null;
  const unbanDate = isTemp && user.suspended_until
    ? new Date(user.suspended_until).toLocaleString()
    : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'radial-gradient(circle at 50% 30%, rgba(127,29,29,0.35), rgba(0,0,0,0.92) 70%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        maxWidth: 460, width: '100%',
        background: 'var(--bg2)', border: '1px solid #ef444466', borderRadius: 14,
        padding: 28, boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 6, textAlign: 'center' }}>⛔</div>
        <h2 style={{
          fontFamily: 'Cinzel,serif', fontSize: 22, color: '#fca5a5',
          textAlign: 'center', marginBottom: 6,
        }}>
          {isPerm ? 'Account Banned' : 'Account Suspended'}
        </h2>
        <p style={{
          textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 18,
        }}>
          {isPerm
            ? 'This account has been permanently banned by an administrator.'
            : 'This account is temporarily suspended. You\'ll regain access automatically when the timer ends.'}
        </p>

        {isTemp && (
          <div style={{
            background: 'rgba(127,29,29,0.2)', border: '1px solid #ef444433',
            borderRadius: 10, padding: 14, marginBottom: 14, textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>
              TIME REMAINING
            </div>
            <div style={{
              fontFamily: 'Cinzel,serif', fontSize: 26, fontWeight: 700,
              color: '#fecaca', letterSpacing: '0.04em',
            }}>
              {left || 'Unlocking…'}
            </div>
            {unbanDate && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Unbans at {unbanDate}
              </div>
            )}
          </div>
        )}

        {user.suspension_reason && (
          <div style={{
            background: 'var(--bg3)', borderRadius: 8, padding: 12,
            fontSize: 13, color: 'var(--text)', marginBottom: 16, whiteSpace: 'pre-wrap',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Reason</div>
            {user.suspension_reason}
          </div>
        )}

        <button
          className="btn btn-ghost"
          style={{ width: '100%', padding: '10px 16px', fontSize: 13 }}
          onClick={logout}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
