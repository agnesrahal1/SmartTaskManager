export default function Modal({ title, message, onConfirm, onCancel }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.box}>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.msg}>{message}</p>
        <div style={styles.btns}>
          <button style={styles.cancel} onClick={onCancel}>Cancel</button>
          <button style={styles.confirm} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: '#000000aa', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 },
  box: { background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '2rem', width: '360px', textAlign: 'center' },
  title: { fontSize: '18px', fontWeight: '700', color: '#f0f0f0', marginBottom: '10px' },
  msg: { fontSize: '14px', color: '#888', marginBottom: '1.5rem' },
  btns: { display: 'flex', gap: '10px', justifyContent: 'center' },
  cancel: { padding: '10px 24px', borderRadius: '8px', background: 'transparent', border: '1px solid #333', color: '#aaa', cursor: 'pointer', fontSize: '14px' },
  confirm: { padding: '10px 24px', borderRadius: '8px', background: '#ff6b6b22', border: '1px solid #ff6b6b', color: '#ff6b6b', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }
};