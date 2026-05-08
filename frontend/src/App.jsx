import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import FriendsPage from './pages/FriendsPage';
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
            <NavLink to="/friends" style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })}>
              Friends
            </NavLink>
          </nav>
          <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} onClick={logout}>
            Sign Out
          </button>
        </div>
      </header>
      <main style={styles.main}>{children}</main>
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
          <Route path="/" element={
            <Protected>
              <Layout>
                <Dashboard />
              </Layout>
            </Protected>
          } />
          <Route path="/friends" element={
            <Protected>
              <Layout>
                <FriendsPage />
              </Layout>
            </Protected>
          } />
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
