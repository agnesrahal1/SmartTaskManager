import Timer from './Timer';

const priorityColor = { High: '#ff6b6b', Medium: '#ffa94d', Low: '#69db7c' };
const statusColor = { Completed: '#69db7c', InProgress: '#ffa94d', Pending: '#888' };

export default function TaskCard({ task, onComplete, onProgress, onDelete, onEdit, onToggleTodo }) {
  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'Completed';

  return (
    <div style={{ ...styles.card, ...(isOverdue ? styles.overdue : {}) }}>
      {isOverdue && <div style={styles.overdueTag}>⚠️ Overdue</div>}

      <div style={styles.top}>
        <h3 style={styles.title}>{task.title}</h3>
        <span style={{ ...styles.badge, background: priorityColor[task.manualPriority] + '22', color: priorityColor[task.manualPriority] }}>
          {task.manualPriority}
        </span>
      </div>

      {task.description && <p style={styles.desc}>{task.description}</p>}

      <div style={styles.meta}>
        <span>📁 {task.category || 'Uncategorized'}</span>
        <span>⏰ {new Date(task.deadline).toLocaleDateString()}</span>
      </div>

      <div style={styles.scoreRow}>
        <span style={styles.scoreLabel}>AI Score</span>
        <div style={styles.scoreTrack}>
          <div style={{
            ...styles.scoreFill,
            width: `${task.aiPriorityScore}%`,
            background: task.aiPriorityScore > 70 ? '#ff6b6b' : task.aiPriorityScore > 40 ? '#ffa94d' : '#69db7c'
          }} />
        </div>
        <span style={styles.scoreNum}>{task.aiPriorityScore}</span>
      </div>

      {(task.estimatedMinutes > 0 || task.spentMinutes > 0) && (
        <div style={styles.timeRow}>
          <span style={styles.scoreLabel}>⏱️ Time</span>
          <div style={styles.scoreTrack}>
            <div style={{
              ...styles.scoreFill,
              width: task.estimatedMinutes > 0
                ? `${Math.min((task.spentMinutes / task.estimatedMinutes) * 100, 100)}%`
                : '100%',
              background: '#7F77DD'
            }} />
          </div>
          <span style={{ ...styles.scoreNum, width: 'auto', fontSize: '11px' }}>
            {task.spentMinutes || 0}{task.estimatedMinutes > 0 ? `/${task.estimatedMinutes}m` : 'm'}
          </span>
        </div>
      )}

      {task.status !== 'Completed' && <Timer taskId={task.id} />}

      <div style={{ ...styles.footer, marginTop: '12px' }}>
        <span style={{ ...styles.statusBadge, background: statusColor[task.status] + '22', color: statusColor[task.status] }}>
          {task.status}
        </span>
        <div style={styles.actions}>
          <button
            style={{ ...styles.actionBtn, ...(task.isInTodo ? { color: '#7F77DD', borderColor: '#7F77DD' } : {}) }}
            onClick={() => onToggleTodo(task.id)}
            title={task.isInTodo ? 'Remove from To-Do' : 'Add to To-Do'}
          >
            {task.isInTodo ? '📌' : '📎'}
          </button>
          {task.status === 'Pending' && (
            <button style={styles.actionBtn} onClick={() => onProgress(task.id)} title="Start task">▶️</button>
          )}
          {task.status !== 'Completed' && (
            <button style={styles.actionBtn} onClick={() => onComplete(task.id)} title="Mark complete">✅</button>
          )}
          <button style={styles.actionBtn} onClick={() => onEdit(task)} title="Edit">✏️</button>
          <button style={{ ...styles.actionBtn, color: '#ff6b6b' }} onClick={() => onDelete(task.id)} title="Delete">🗑️</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: { background: 'linear-gradient(135deg, #1a1a2e 0%, #16162a 100%)', borderRadius: '16px', padding: '1.25rem', border: '1px solid #2a2a3a', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' },
  overdue: { border: '1px solid #ff6b6b44' },
  overdueTag: { fontSize: '11px', color: '#ff6b6b', marginBottom: '8px', fontWeight: '600' },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
  title: { fontSize: '15px', fontWeight: '600', color: '#f0f0f0', flex: 1, marginRight: '8px' },
  desc: { fontSize: '13px', color: '#666', marginBottom: '10px', lineHeight: '1.5' },
  meta: { display: 'flex', gap: '12px', fontSize: '12px', color: '#555', marginBottom: '12px' },
  badge: { fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' },
  scoreRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  timeRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  scoreLabel: { fontSize: '11px', color: '#555', width: '55px' },
  scoreTrack: { flex: 1, height: '5px', background: '#2a2a3a', borderRadius: '3px', overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: '3px', transition: 'width 0.5s ease' },
  scoreNum: { fontSize: '12px', fontWeight: '700', color: '#aaa', width: '24px', textAlign: 'right' },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' },
  actions: { display: 'flex', gap: '6px' },
  actionBtn: { padding: '6px 10px', borderRadius: '8px', background: '#ffffff08', border: '1px solid #2a2a3a', color: '#aaa', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }
};