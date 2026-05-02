import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch {
      setError('Invalid email or password');
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>TaskOracle 🧠</h2>
        <p style={styles.sub}>Sign in to your account</p>
        {error && <p style={styles.error}>{error}</p>}
        <input style={styles.input} name="email" placeholder="Email" onChange={handle} />
        <input style={styles.input} name="password" type="password" placeholder="Password" onChange={handle} />
        <button style={styles.btn} onClick={submit}>Login</button>
        <p style={styles.link}>No account? <Link to="/register" style={{ color: '#7F77DD' }}>Register</Link></p>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
  card: { background: '#1a1a24', padding: '2.5rem', borderRadius: '16px', width: '380px', display: 'flex', flexDirection: 'column', gap: '12px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#7F77DD', textAlign: 'center' },
  sub: { color: '#888', textAlign: 'center', marginBottom: '8px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#0f0f13', color: '#fff', fontSize: '14px' },
  btn: { padding: '12px', borderRadius: '8px', background: '#7F77DD', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '15px' },
  error: { color: '#ff6b6b', fontSize: '13px', textAlign: 'center' },
  link: { textAlign: 'center', fontSize: '13px', color: '#888' }
};