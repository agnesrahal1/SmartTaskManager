import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import Sidebar from '../components/Sidebar';
import TaskCard from '../components/TaskCard';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

const FILTERS = ['All', 'Pending', 'InProgress', 'Completed'];

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', description: '', deadline: '', manualPriority: 1, category: '', estimatedMinutes: 0 });

  const load = useCallback(async () => {
    const res = await api.get('/tasks');
    setTasks(res.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (message, type = 'success') => setToast({ message, type });
  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    try {
      const payload = {
        title: form.title,
        description: form.description || '',
        deadline: new Date(form.deadline).toISOString(),
        manualPriority: parseInt(form.manualPriority),
        category: form.category || 'General',
        estimatedMinutes: parseInt(form.estimatedMinutes) || 0
      };
      if (editTask) {
        await api.put(`/tasks/${editTask.id}`, payload);
        showToast('Task updated! ✨');
        setEditTask(null);
      } else {
        await api.post('/tasks', payload);
        showToast('Task created! 🚀');
      }
      setShowForm(false);
      setForm({ title: '', description: '', deadline: '', manualPriority: 1, category: '', estimatedMinutes: 0 });
      load();
    } catch (err) {
      showToast('Something went wrong', 'error');
    }
  };

  const startEdit = (task) => {
    setForm({
      title: task.title,
      description: task.description || '',
      deadline: task.deadline?.slice(0, 16) || '',
      manualPriority: task.manualPriority === 'High' ? 2 : task.manualPriority === 'Low' ? 0 : 1,
      category: task.category || '',
      estimatedMinutes: task.estimatedMinutes || 0
    });
    setEditTask(task);
    setShowForm(true);
  };

  const complete = async (id) => {
    await api.patch(`/tasks/${id}/complete`);
    showToast('Task completed! 🎉');
    load();
  };

  const progress = async (id) => {
    await api.patch(`/tasks/${id}/inprogress`);
    showToast('Task started! ▶️', 'info');
    load();
  };

  const toggleTodo = async (id) => {
    const task = tasks.find(t => t.id === id);
    await api.patch(`/tasks/${id}/todo`);
    showToast(task.isInTodo ? 'Removed from To-Do ✗' : 'Added to To-Do ✅', 'info');
    load();
  };

  const confirmDelete = async () => {
    await api.delete(`/tasks/${deleteId}`);
    setDeleteId(null);
    showToast('Task deleted', 'info');
    load();
  };

  const filtered = tasks
    .filter(t => filter === 'All' || t.status === filter)
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()) ||
                 (t.category || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>My Tasks</h1>
            <p style={styles.pageSub}>{tasks.length} tasks · {tasks.filter(t => t.status === 'Completed').length} completed</p>
          </div>
          <button style={styles.addBtn} onClick={() => {
            setEditTask(null);
            setForm({ title: '', description: '', deadline: '', manualPriority: 1, category: '', estimatedMinutes: 0 });
            setShowForm(!showForm);
          }}>
            ➕ Add Task
          </button>
        </div>

        <div style={styles.controls}>
          <input
            style={styles.search}
            placeholder="🔍 Search by title or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={styles.filters}>
            {FILTERS.map(f => (
              <button key={f} style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {showForm && (
          <div style={styles.form}>
            <h3 style={styles.formTitle}>{editTask ? '✏️ Edit Task' : '➕ New Task'}</h3>
            <div style={styles.formGrid}>
              <input style={styles.input} name="title" placeholder="Task title" value={form.title} onChange={handle} />
              <input style={styles.input} name="category" placeholder="Category" value={form.category} onChange={handle} />
              <input style={{ ...styles.input, gridColumn: 'span 2' }} name="description" placeholder="Description (optional)" value={form.description} onChange={handle} />
              <input style={styles.input} name="deadline" type="datetime-local" value={form.deadline} onChange={handle} />
              <select style={styles.input} name="manualPriority" value={form.manualPriority} onChange={handle}>
                <option value={0}>🟢 Low Priority</option>
                <option value={1}>🟡 Medium Priority</option>
                <option value={2}>🔴 High Priority</option>
              </select>
              <input
                style={{ ...styles.input, gridColumn: 'span 2' }}
                name="estimatedMinutes"
                type="number"
                min="0"
                placeholder="⏱️ Estimated time (minutes) — optional"
                value={form.estimatedMinutes || ''}
                onChange={handle}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button style={styles.btn} onClick={submit}>{editTask ? 'Save Changes' : 'Create Task'}</button>
              <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🎯</div>
            <h3 style={styles.emptyTitle}>{search ? 'No results found' : 'No tasks here!'}</h3>
            <p style={styles.emptySub}>{search ? `Nothing matches "${search}"` : filter === 'All' ? 'Add your first task to get started' : `No ${filter} tasks found`}</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={complete}
                onProgress={progress}
                onDelete={setDeleteId}
                onEdit={startEdit}
                onToggleTodo={toggleTodo}
              />
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {deleteId && <Modal title="Delete Task" message="Are you sure you want to delete this task?" onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />}
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh' },
  main: { marginLeft: '220px', flex: 1, padding: '2rem 2.5rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  pageTitle: { fontSize: '26px', fontWeight: '700', color: '#f0f0f0' },
  pageSub: { fontSize: '13px', color: '#555', marginTop: '4px' },
  addBtn: { padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #7F77DD, #9f77dd)', border: 'none', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  controls: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' },
  search: { padding: '10px 14px', borderRadius: '10px', border: '1px solid #2a2a3a', background: '#0d0d18', color: '#fff', fontSize: '14px', width: '280px', outline: 'none' },
  filters: { display: 'flex', gap: '6px' },
  filterBtn: { padding: '8px 16px', borderRadius: '20px', background: 'transparent', border: '1px solid #2a2a3a', color: '#666', cursor: 'pointer', fontSize: '13px' },
  filterActive: { background: '#7F77DD22', border: '1px solid #7F77DD', color: '#7F77DD' },
  form: { background: 'linear-gradient(135deg, #1a1a2e, #16162a)', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' },
  formTitle: { fontSize: '16px', fontWeight: '600', color: '#7F77DD', marginBottom: '1rem' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' },
  input: { padding: '11px 14px', borderRadius: '10px', border: '1px solid #2a2a3a', background: '#0d0d18', color: '#fff', fontSize: '14px', outline: 'none' },
  btn: { padding: '11px 24px', borderRadius: '10px', background: 'linear-gradient(135deg, #7F77DD, #9f77dd)', border: 'none', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  cancelBtn: { padding: '11px 24px', borderRadius: '10px', background: 'transparent', border: '1px solid #2a2a3a', color: '#666', cursor: 'pointer', fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem', textAlign: 'center' },
  emptyIcon: { fontSize: '48px', marginBottom: '1rem' },
  emptyTitle: { fontSize: '20px', fontWeight: '600', color: '#444', marginBottom: '8px' },
  emptySub: { fontSize: '14px', color: '#333' }
};