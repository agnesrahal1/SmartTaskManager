import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const links = [
  { path: '/', icon: '📋', label: 'Dashboard' },
  { path: '/todo', icon: '✅', label: 'To-Do' },
  { path: '/pomodoro', icon: '🍅', label: 'Pomodoro' },
  { path: '/study', icon: '📚', label: 'Study' },
  { path: '/analytics', icon: '📊', label: 'Analytics' },
  { path: '/calendar', icon: '📅', label: 'Calendar' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

const isMobile = window.innerWidth <= 768 || 
  (window.Capacitor !== undefined && window.Capacitor.isNativePlatform());

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobile, setMobile] = useState(isMobile);

  useEffect(() => {
    const handle = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (mobile) {
    return (
      <>
        {/* Top bar */}
        <div style={styles.topBar}>
          <span style={styles.topLogo}>Taski 🎀</span>
          <button style={styles.logoutBtn} onClick={logout}>🚪</button>
        </div>

        {/* Bottom nav */}
        <div style={styles.bottomNav}>
          {links.map(link => (
            <button
              key={link.path}
              style={{ ...styles.bottomItem, ...(location.pathname === link.path ? styles.bottomActive : {}) }}
              onClick={() => navigate(link.path)}
            >
              <span style={styles.bottomIcon}>{link.icon}</span>
              <span style={{ ...styles.bottomLabel, color: location.pathname === link.path ? '#7F77DD' : '#555' }}>
                {link.label}
              </span>
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <span style={styles.logoDot} />
        <span>Taski</span>
      </div>

      <nav style={styles.nav}>
        {links.map(link => (
          <button
            key={link.path}
            style={{ ...styles.navItem, ...(location.pathname === link.path ? styles.active : {}) }}
            onClick={() => navigate(link.path)}
          >
            <span style={styles.icon}>{link.icon}</span>
            <span>{link.label}</span>
          </button>
        ))}
      </nav>

      <button style={styles.logout} onClick={logout}>
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </div>
  );
}

const styles = {
  // Desktop sidebar
  sidebar: { width: '220px', minHeight: '100vh', background: '#0d0d18', borderRight: '1px solid #1e1e2e', display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem', position: 'fixed', top: 0, left: 0 },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '700', color: '#7F77DD', marginBottom: '2.5rem', paddingLeft: '8px' },
  logoDot: { width: '10px', height: '10px', borderRadius: '50%', background: '#7F77DD', display: 'inline-block' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '14px', fontWeight: '500', textAlign: 'left' },
  active: { background: '#7F77DD22', color: '#7F77DD' },
  icon: { fontSize: '16px' },
  logout: { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', background: 'transparent', border: 'none', color: '#ff6b6b66', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },

  // Mobile top bar
  topBar: { position: 'fixed', top: 0, left: 0, right: 0, height: '56px', background: '#0d0d18', borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem', zIndex: 100 },
  topLogo: { fontSize: '18px', fontWeight: '700', color: '#7F77DD' },
  logoutBtn: { background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer' },

  // Mobile bottom nav
  bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px', background: '#0d0d18', borderTop: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 100, paddingBottom: '4px' },
  bottomItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: '8px', minWidth: '40px' },
  bottomActive: { background: '#7F77DD11' },
  bottomIcon: { fontSize: '18px' },
  bottomLabel: { fontSize: '9px', fontWeight: '500' },
};