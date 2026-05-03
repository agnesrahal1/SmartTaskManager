import Sidebar from '../components/Sidebar';

const isMobile = window.innerWidth <= 768 ||
  (window.Capacitor !== undefined && window.Capacitor.isNativePlatform());
export default function Profile() {
  const token = localStorage.getItem('token');
  let name = 'User';
  let email = '';

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    name = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'User';
    email = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '';
  } catch {}

  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <h1 style={styles.pageTitle}>Profile 👤</h1>
        <p style={styles.pageSub}>Your account details</p>

        <div style={styles.card}>
          <div style={styles.avatar}>{name[0].toUpperCase()}</div>
          <div>
            <h2 style={styles.name}>{name}</h2>
            <p style={styles.email}>{email}</p>
          </div>
        </div>

        <div style={styles.infoCard}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Full name</span>
            <span style={styles.infoValue}>{name}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Email</span>
            <span style={styles.infoValue}>{email}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Account type</span>
            <span style={styles.infoValue}>Free</span>
          </div>
          <div style={{ ...styles.infoRow, borderBottom: 'none' }}>
            <span style={styles.infoLabel}>Token status</span>
            <span style={{ ...styles.infoValue, color: '#69db7c' }}>Active ✅</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh' },
main: { 
  marginLeft: isMobile ? '0' : '220px', 
  flex: 1, 
  padding: isMobile ? '72px 1rem 80px' : '2rem 2.5rem' 
},  pageTitle: { fontSize: '26px', fontWeight: '700', color: '#f0f0f0', marginBottom: '4px' },
  pageSub: { fontSize: '13px', color: '#555', marginBottom: '2rem' },
  card: { background: 'linear-gradient(135deg, #1a1a2e, #16162a)', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' },
  avatar: { width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #7F77DD, #9f77dd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', color: '#fff', flexShrink: 0 },
  name: { fontSize: '22px', fontWeight: '700', color: '#f0f0f0' },
  email: { fontSize: '14px', color: '#666', marginTop: '4px' },
  infoCard: { background: 'linear-gradient(135deg, #1a1a2e, #16162a)', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '1.5rem' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #1e1e2e' },
  infoLabel: { fontSize: '14px', color: '#555' },
  infoValue: { fontSize: '14px', color: '#aaa', fontWeight: '500' }
};