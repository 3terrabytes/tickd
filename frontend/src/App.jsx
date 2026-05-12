import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import FriendsPage from './pages/FriendsPage';
import AvatarPage from './pages/AvatarPage';
import SuggestionsPage from './pages/SuggestionsPage';
import './index.css';

function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brand}>
            <span style={styles.brandIcon}>⚔️</span>
            <span style={styles.brandName}>Tickd</span>
          </div>
          <nav style={styles.nav}>
            <NavLink to="/" end style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })}>
              Quests
            </NavLink>
            <NavLink to="/guild" style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })}>
              Friends
            </NavLink>
            <NavLink to="/avatar" style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })}>
              Avatar
            </NavLink>
            <NavLink to="/suggestions" style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })}>
              Suggest
            </NavLink>
          </nav>
          <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} onClick={logout}>
            Sign Out
          </button>
        </div>
      </header>
      <main style={styles.main}>{children}</main>
      <Footer/>
    </div>
  );
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text-muted)', fontFamily: 'Cinzel, serif' }}>Loading...</div>
    </div>
  );
  return user ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<Protected><Layout><Dashboard /></Layout></Protected>} />
          <Route path="/guild" element={<Protected><Layout><FriendsPage /></Layout></Protected>} />
          <Route path="/avatar" element={<Protected><Layout><AvatarPage /></Layout></Protected>} />
          <Route path="/suggestions" element={<Protected><Layout><SuggestionsPage /></Layout></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const styles = {
  header: {
    background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0, zIndex: 50
  },
  headerInner: {
    maxWidth: 760, margin: '0 auto', padding: '0 20px',
    height: 58, display: 'flex', alignItems: 'center', gap: 16
  },
  brand: { display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' },
  brandIcon: { fontSize: 20 },
  brandName: { fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 16, color: 'var(--gold)' },
  nav: { display: 'flex', gap: 4 },
  navLink: {
    padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
    color: 'var(--text-muted)', textDecoration: 'none', transition: 'all 0.15s'
  },
  navLinkActive: { background: 'var(--bg3)', color: 'var(--text)' },
  main: { maxWidth: 760, margin: '0 auto', padding: '24px 20px' }
};

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: 40, padding: '20px', textAlign: 'center' }}>
      <a href="https://github.com/3terrabytes/tickd" target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        3terrabytes/tickd
      </a>
    </footer>
  );
}
