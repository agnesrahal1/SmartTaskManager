import { useNavigate, useLocation } from 'react-router-dom';

const links = [
  { path: '/', icon: '📋', label: 'Dashboard' },
  { path: '/todo', icon: '✅', label: 'To-Do List' },
  { path: '/pomodoro', icon: '🍅', label: 'Pomodoro' },
  { path: '/study-planner', icon: '📚', label: 'Study Planner' },
  { path: '/analytics', icon: '📊', label: 'Analytics' },
  { path: '/calendar', icon: '📅', label: 'Calendar' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <span style={styles.logoDot} />
        <span>TaskOracle</span>
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
  sidebar: { width: '220px', minHeight: '100vh', background: '#0d0d18', borderRight: '1px solid #1e1e2e', display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem', position: 'fixed', top: 0, left: 0 },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '700', color: '#7F77DD', marginBottom: '2.5rem', paddingLeft: '8px' },
  logoDot: { width: '10px', height: '10px', borderRadius: '50%', background: '#7F77DD', display: 'inline-block' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '14px', fontWeight: '500', textAlign: 'left', transition: 'all 0.2s' },
  active: { background: '#7F77DD22', color: '#7F77DD' },
  icon: { fontSize: '16px' },
  logout: { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', background: 'transparent', border: 'none', color: '#ff6b6b66', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }
};