import { useEffect, useState } from 'react';
import api from '../api';
import Sidebar from '../components/Sidebar';

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/tasks/analytics').then(res => setData(res.data));
  }, []);

  if (!data) return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}><p style={{ color: '#555' }}>Loading analytics...</p></div>
    </div>
  );

  const completion = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <h1 style={styles.pageTitle}>Analytics 📊</h1>
        <p style={styles.pageSub}>Your productivity at a glance</p>

        <div style={styles.grid}>
          {[
            { label: 'Total Tasks', value: data.total, color: '#f0f0f0' },
            { label: 'Completed', value: data.completed, color: '#69db7c' },
            { label: 'Overdue', value: data.overdue, color: '#ff6b6b' },
            { label: 'Avg AI Score', value: Math.round(data.avgAIScore), color: '#7F77DD' },
          ].map(m => (
            <div key={m.label} style={styles.metricCard}>
              <div style={styles.metricLabel}>{m.label}</div>
              <div style={{ ...styles.metricValue, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Completion Rate</h3>
          <div style={styles.completionRow}>
            <div style={styles.bigTrack}>
              <div style={{ ...styles.bigFill, width: `${completion}%` }} />
            </div>
            <span style={styles.completionNum}>{completion}%</span>
          </div>
        </div>
        <div style={styles.section}>
  <h3 style={styles.sectionTitle}>Pomodoro Stats 🍅</h3>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
    {[
      { label: 'Total Sessions', value: data.pomodoroSessions || 0 },
      { label: 'Total Minutes', value: data.pomodoroMinutes || 0 },
      { label: 'Today', value: data.todayPomodoros || 0 },
    ].map(s => (
      <div key={s.label} style={{ background: '#0d0d18', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', marginBottom: '6px' }}>{s.label}</div>
        <div style={{ fontSize: '24px', fontWeight: '700', color: '#7F77DD' }}>{s.value}</div>
      </div>
    ))}
  </div>
  <div style={{ marginTop: '1rem' }}>
    <h4 style={{ fontSize: '13px', color: '#555', marginBottom: '10px' }}>Time spent per task</h4>
    {data.byCategory && data.byCategory.map(c => (
      <div key={c.category} style={styles.catRow}>
        <span style={styles.catLabel}>{c.category}</span>
        <div style={styles.barTrack}>
          <div style={{ ...styles.barFill, width: `${(c.count / data.total) * 100}%` }} />
        </div>
        <span style={styles.catCount}>{c.count}</span>
      </div>
    ))}
  </div>
</div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Tasks by Category</h3>
          {data.byCategory.length === 0 ? (
            <p style={{ color: '#444', fontSize: '14px' }}>No categories yet</p>
          ) : data.byCategory.map(c => (
            <div key={c.category} style={styles.catRow}>
              <span style={styles.catLabel}>{c.category}</span>
              <div style={styles.barTrack}>
                <div style={{ ...styles.barFill, width: `${(c.count / data.total) * 100}%` }} />
              </div>
              <span style={styles.catCount}>{c.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh' },
  main: { marginLeft: '220px', flex: 1, padding: '2rem 2.5rem' },
  pageTitle: { fontSize: '26px', fontWeight: '700', color: '#f0f0f0', marginBottom: '4px' },
  pageSub: { fontSize: '13px', color: '#555', marginBottom: '2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '2rem' },
  metricCard: { background: 'linear-gradient(135deg, #1a1a2e, #16162a)', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' },
  metricLabel: { fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' },
  metricValue: { fontSize: '36px', fontWeight: '700' },
  section: { background: 'linear-gradient(135deg, #1a1a2e, #16162a)', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '1.5rem', marginBottom: '1rem' },
  sectionTitle: { fontSize: '15px', fontWeight: '600', color: '#7F77DD', marginBottom: '1.25rem' },
  completionRow: { display: 'flex', alignItems: 'center', gap: '16px' },
  bigTrack: { flex: 1, height: '12px', background: '#2a2a3a', borderRadius: '6px', overflow: 'hidden' },
  bigFill: { height: '100%', background: 'linear-gradient(90deg, #7F77DD, #69db7c)', borderRadius: '6px', transition: 'width 0.8s ease' },
  completionNum: { fontSize: '20px', fontWeight: '700', color: '#7F77DD', width: '50px' },
  catRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  catLabel: { width: '110px', fontSize: '13px', color: '#888' },
  barTrack: { flex: 1, height: '8px', background: '#2a2a3a', borderRadius: '4px', overflow: 'hidden' },
  barFill: { height: '100%', background: 'linear-gradient(90deg, #7F77DD, #9f77dd)', borderRadius: '4px', transition: 'width 0.5s ease' },
  catCount: { fontSize: '13px', color: '#fff', fontWeight: '600', width: '20px', textAlign: 'right' }
};