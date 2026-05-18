import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function SuspensionWarning() {
  const { user, refreshUser } = useAuth();
  const [dismissing, setDismissing] = useState(false);

  if (!user || user.suspension_type !== 'warn' || user.warning_seen) return null;

  const dismiss = async () => {
    setDismissing(true);
    try {
      await api.auth.warningSeen();
      await refreshUser();
    } catch {
      setDismissing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20,
    }}>
      <div style={{
        maxWidth: 460, width: '100%', background: 'var(--bg2)',
        border: '1px solid #f59e0b66', borderRadius: 14, padding: 24,
      }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>⚠️</div>
        <h2 style={{ fontFamily: 'Cinzel,serif', fontSize: 20, color: '#fbbf24', marginBottom: 10 }}>
          Account Warning
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          An admin has issued a warning on your account. Repeated violations may lead to suspension.
        </p>
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
          className="btn btn-primary"
          style={{ width: '100%', padding: '10px 16px', fontSize: 13 }}
          onClick={dismiss}
          disabled={dismissing}
        >
          {dismissing ? '...' : 'I understand'}
        </button>
      </div>
    </div>
  );
}
