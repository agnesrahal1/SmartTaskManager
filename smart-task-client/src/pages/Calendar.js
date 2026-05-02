import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(new Date());

  useEffect(() => {
    api.get('/tasks').then(res => setTasks(res.data));
  }, []);

  const tasksOnDay = (date) => tasks.filter(t => {
    const d = new Date(t.deadline);
    return d.getFullYear() === date.getFullYear() &&
           d.getMonth() === date.getMonth() &&
           d.getDate() === date.getDate();
  });

  const selectedTasks = tasksOnDay(selected);

  const tileContent = ({ date }) => {
    const dayTasks = tasksOnDay(date);
    if (dayTasks.length === 0) return null;
    const hasHigh = dayTasks.some(t => t.manualPriority === 'High');
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: hasHigh ? '#ff6b6b' : '#7F77DD' }} />
      </div>
    );
  };

  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <h1 style={styles.pageTitle}>Calendar 📅</h1>
        <p style={styles.pageSub}>Your tasks by deadline</p>

        <div style={styles.content}>
          <div style={styles.calCard}>
            <ReactCalendar
              onChange={setSelected}
              value={selected}
              tileContent={tileContent}
            />
          </div>

          <div style={styles.taskPanel}>
            <h3 style={styles.dateTitle}>
              {selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            {selectedTasks.length === 0 ? (
              <div style={styles.empty}>
                <p style={styles.emptyIcon}>📭</p>
                <p style={styles.emptyText}>No tasks due on this day</p>
              </div>
            ) : (
              selectedTasks.map(task => (
                <div key={task.id} style={styles.taskItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={styles.taskName}>{task.title}</span>
                    <span style={{
                      fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
                      background: task.manualPriority === 'High' ? '#ff6b6b22' : task.manualPriority === 'Low' ? '#69db7c22' : '#ffa94d22',
                      color: task.manualPriority === 'High' ? '#ff6b6b' : task.manualPriority === 'Low' ? '#69db7c' : '#ffa94d'
                    }}>{task.manualPriority}</span>
                  </div>
                  <p style={styles.taskCat}>📁 {task.category || 'Uncategorized'}</p>
                  <div style={styles.scoreRow}>
                    <span style={styles.scoreLabel}>AI Score</span>
                    <div style={styles.scoreTrack}>
                      <div style={{ height: '100%', borderRadius: '3px', background: task.aiPriorityScore > 70 ? '#ff6b6b' : '#7F77DD', width: `${task.aiPriorityScore}%` }} />
                    </div>
                    <span style={styles.scoreNum}>{task.aiPriorityScore}</span>
                  </div>
                </div>
              ))
            )}
          </div>
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
  content: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', alignItems: 'start' },
  calCard: { background: 'linear-gradient(135deg, #1a1a2e, #16162a)', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '1.25rem' },
  taskPanel: { background: 'linear-gradient(135deg, #1a1a2e, #16162a)', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '1.5rem', minHeight: '400px' },
  dateTitle: { fontSize: '16px', fontWeight: '600', color: '#7F77DD', marginBottom: '1.25rem' },
  taskItem: { background: '#0d0d18', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '1rem', marginBottom: '10px' },
  taskName: { fontSize: '14px', fontWeight: '600', color: '#f0f0f0' },
  taskCat: { fontSize: '12px', color: '#555', marginTop: '4px', marginBottom: '8px' },
  scoreRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  scoreLabel: { fontSize: '11px', color: '#555', width: '55px' },
  scoreTrack: { flex: 1, height: '4px', background: '#2a2a3a', borderRadius: '2px', overflow: 'hidden' },
  scoreNum: { fontSize: '11px', color: '#aaa', fontWeight: '600', width: '20px', textAlign: 'right' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' },
  emptyIcon: { fontSize: '32px', marginBottom: '8px' },
  emptyText: { fontSize: '14px', color: '#444' }
};