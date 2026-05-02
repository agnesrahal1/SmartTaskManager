import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';
import Timer from '../components/Timer';

const priorityColor = { High: '#ff6b6b', Medium: '#ffa94d', Low: '#69db7c' };

export default function TodoList() {
  const [tasks, setTasks] = useState([]);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const showToast = (message, type = 'success') => setToast({ message, type });

  const load = useCallback(async () => {
    const res = await api.get('/tasks');
    setTasks(res.data.filter(t => t.isInTodo));
  }, []);

  useEffect(() => { load(); }, [load]);

  const complete = async (id) => {
    await api.patch(`/tasks/${id}/complete`);
    showToast('Task done! 🎉');
    load();
  };

  const progress = async (id) => {
    await api.patch(`/tasks/${id}/inprogress`);
    showToast('Task started! ▶️', 'info');
    load();
  };

  const filtered = tasks
    .filter(t => filter === 'All' || t.status === filter)
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  const grouped = {
    High: filtered.filter(t => t.manualPriority === 'High'),
    Medium: filtered.filter(t => t.manualPriority === 'Medium'),
    Low: filtered.filter(t => t.manualPriority === 'Low'),
  };

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'Completed').length;
  const progress_pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>To-Do List ✅</h1>
            <p style={styles.pageSub}>{done} of {total} tasks completed</p>
          </div>
        </div>

        <div style={styles.progressCard}>
          <div style={styles.progressTop}>
            <span style={styles.progressLabel}>Overall Progress</span>
            <span style={styles.progressNum}>{progress_pct}%</span>
          </div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${progress_pct}%` }} />
          </div>
        </div>

        <div style={styles.controls}>
          <input
            style={styles.search}
            placeholder="🔍 Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={styles.filters}>
            {['All', 'Pending', 'InProgress', 'Completed'].map(f => (
              <button key={f}
                style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}
                onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {['High', 'Medium', 'Low'].map(priority => (
          grouped[priority].length > 0 && (
            <div key={priority} style={styles.group}>
              <div style={styles.groupHeader}>
                <span style={{ ...styles.groupDot, background: priorityColor[priority] }} />
                <span style={{ ...styles.groupLabel, color: priorityColor[priority] }}>{priority} Priority</span>
                <span style={styles.groupCount}>{grouped[priority].length}</span>
              </div>

              {grouped[priority].map(task => (
                <div key={task.id} style={{
                  ...styles.todoItem,
                  ...(task.status === 'Completed' ? styles.todoCompleted : {}),
                  borderLeft: `3px solid ${priorityColor[priority]}44`
                }}>
                  <div style={styles.todoLeft}>
                    <div
                      style={{ ...styles.checkbox, ...(task.status === 'Completed' ? styles.checkboxDone : {}) }}
                      onClick={() => task.status !== 'Completed' && complete(task.id)}
                    >
                      {task.status === 'Completed' && '✓'}
                    </div>
                    <div style={styles.todoInfo}>
                      <span style={{ ...styles.todoTitle, ...(task.status === 'Completed' ? styles.strikethrough : {}) }}>
                        {task.title}
                      </span>
                      <div style={styles.todoMeta}>
                        <span>📁 {task.category || 'Uncategorized'}</span>
                        <span>⏰ {new Date(task.deadline).toLocaleDateString()}</span>
                        <span style={{ color: task.aiPriorityScore > 70 ? '#ff6b6b' : task.aiPriorityScore > 40 ? '#ffa94d' : '#69db7c' }}>
                          🧠 AI: {task.aiPriorityScore}
                        </span>
                      </div>
                      {task.status !== 'Completed' && <Timer taskId={task.id} />}
                    </div>
                  </div>

                  <div style={styles.todoActions}>
                    {task.status === 'Pending' && (
                      <button style={styles.startBtn} onClick={() => progress(task.id)}>▶ Start</button>
                    )}
                    {task.status === 'InProgress' && (
                      <button style={styles.doneBtn} onClick={() => complete(task.id)}>✅ Done</button>
                    )}
                    <span style={{
                      fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600',
                      background: task.status === 'Completed' ? '#69db7c22' : task.status === 'InProgress' ? '#ffa94d22' : '#ffffff11',
                      color: task.status === 'Completed' ? '#69db7c' : task.status === 'InProgress' ? '#ffa94d' : '#555'
                    }}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ))}

        {filtered.length === 0 && (
          <div style={styles.empty}>
            <p style={{ fontSize: '32px' }}>🎯</p>
            <p style={{ color: '#444', marginTop: '8px' }}>No tasks found</p>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh' },
  main: { marginLeft: '220px', flex: 1, padding: '2rem 2.5rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  pageTitle: { fontSize: '26px', fontWeight: '700', color: '#f0f0f0', marginBottom: '4px' },
  pageSub: { fontSize: '13px', color: '#555' },
  progressCard: { background: 'linear-gradient(135deg, #1a1a2e, #16162a)', border: '1px solid #2a2a3a', borderRadius: '14px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' },
  progressTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  progressLabel: { fontSize: '13px', color: '#666' },
  progressNum: { fontSize: '13px', fontWeight: '700', color: '#7F77DD' },
  progressTrack: { height: '8px', background: '#2a2a3a', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #7F77DD, #69db7c)', borderRadius: '4px', transition: 'width 0.6s ease' },
  controls: { display: 'flex', gap: '12px', marginBottom: '1.5rem', alignItems: 'center' },
  search: { padding: '10px 14px', borderRadius: '10px', border: '1px solid #2a2a3a', background: '#0d0d18', color: '#fff', fontSize: '14px', width: '260px', outline: 'none' },
  filters: { display: 'flex', gap: '6px' },
  filterBtn: { padding: '8px 14px', borderRadius: '20px', background: 'transparent', border: '1px solid #2a2a3a', color: '#666', cursor: 'pointer', fontSize: '12px' },
  filterActive: { background: '#7F77DD22', border: '1px solid #7F77DD', color: '#7F77DD' },
  group: { marginBottom: '1.5rem' },
  groupHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  groupDot: { width: '8px', height: '8px', borderRadius: '50%' },
  groupLabel: { fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },
  groupCount: { fontSize: '12px', color: '#444', background: '#ffffff08', padding: '2px 8px', borderRadius: '10px' },
  todoItem: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'linear-gradient(135deg, #1a1a2e, #16162a)', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '8px', transition: 'all 0.2s' },
  todoCompleted: { opacity: 0.5 },
  todoLeft: { display: 'flex', gap: '14px', flex: 1 },
  checkbox: { width: '22px', height: '22px', borderRadius: '6px', border: '2px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: '2px', fontSize: '13px', color: '#fff', transition: 'all 0.2s' },
  checkboxDone: { background: '#69db7c', borderColor: '#69db7c' },
  todoInfo: { flex: 1 },
  todoTitle: { fontSize: '15px', fontWeight: '500', color: '#f0f0f0' },
  strikethrough: { textDecoration: 'line-through', color: '#555' },
  todoMeta: { display: 'flex', gap: '12px', fontSize: '12px', color: '#555', marginTop: '4px' },
  todoActions: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '1rem' },
  startBtn: { padding: '6px 14px', borderRadius: '8px', background: '#ffa94d22', border: '1px solid #ffa94d', color: '#ffa94d', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  doneBtn: { padding: '6px 14px', borderRadius: '8px', background: '#69db7c22', border: '1px solid #69db7c', color: '#69db7c', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  empty: { textAlign: 'center', padding: '4rem' }
};