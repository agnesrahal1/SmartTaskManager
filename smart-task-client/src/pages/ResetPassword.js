import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function ResetPassword() {
  const [form, setForm] = useState({ email: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    if (!form.email || !form.newPassword) return setError('Fill in all fields!');
    if (form.newPassword !== form.confirm) return setError('Passwords don\'t match!');
    if (form.newPassword.length < 6) return setError('Password must be at least 6 characters!');

    try {
      await api.post('/auth/reset-password', {
        email: form.email,
        newPassword: form.newPassword
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      setError('No account found with that email.');
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Taski 🎀</h2>
        <p style={styles.sub}>Reset your password</p>

        {success ? (
          <div style={styles.success}>
            ✅ Password reset! Redirecting to login...
          </div>
        ) : (
          <>
            {error && <p style={styles.error}>{error}</p>}
            <input
              style={styles.input}
              name="email"
              placeholder="Your email address"
              value={form.email}
              onChange={handle}
            />
            <input
              style={styles.input}
              name="newPassword"
              type="password"
              placeholder="New password"
              value={form.newPassword}
              onChange={handle}
            />
            <input
              style={styles.input}
              name="confirm"
              type="password"
              placeholder="Confirm new password"
              value={form.confirm}
              onChange={handle}
            />
            <button style={styles.btn} onClick={submit}>Reset Password</button>
          </>
        )}

        <p style={styles.link}>
          Remember it? <Link to="/login" style={{ color: '#7F77DD' }}>Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#080810' },
  card: { background: '#1a1a24', padding: '2.5rem', borderRadius: '16px', width: '380px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #2a2a3a' },
  title: { fontSize: '24px', fontWeight: '700', color: '#7F77DD', textAlign: 'center' },
  sub: { color: '#555', textAlign: 'center', marginBottom: '8px', fontSize: '14px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #2a2a3a', background: '#0d0d18', color: '#fff', fontSize: '14px', outline: 'none' },
  btn: { padding: '12px', borderRadius: '8px', background: 'linear-gradient(135deg, #7F77DD, #9f77dd)', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '15px' },
  error: { color: '#ff6b6b', fontSize: '13px', textAlign: 'center' },
  success: { color: '#69db7c', fontSize: '14px', textAlign: 'center', padding: '1rem', background: '#69db7c11', borderRadius: '8px', border: '1px solid #69db7c44' },
  link: { textAlign: 'center', fontSize: '13px', color: '#555' }
};