import { useState, useEffect, useRef } from 'react';

export default function Timer({ taskId }) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const interval = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(`timer_${taskId}`);
    if (saved) setSeconds(parseInt(saved));
  }, [taskId]);

  useEffect(() => {
    if (running) {
      interval.current = setInterval(() => {
        setSeconds(s => {
          const next = s + 1;
          localStorage.setItem(`timer_${taskId}`, next);
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval.current);
    }
    return () => clearInterval(interval.current);
  }, [running, taskId]);

  const format = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const reset = () => {
    setRunning(false);
    setSeconds(0);
    localStorage.removeItem(`timer_${taskId}`);
  };

  const btnStyle = running
    ? { background: '#ff6b6b22', borderColor: '#ff6b6b', color: '#ff6b6b' }
    : { background: '#69db7c22', borderColor: '#69db7c', color: '#69db7c' };

  return (
    <div style={styles.wrapper}>
      <span style={{ ...styles.time, color: running ? '#69db7c' : '#aaa' }}>
        ⏱️ {format(seconds)}
      </span>
      <button style={{ ...styles.btn, ...btnStyle }} onClick={() => setRunning(r => !r)}>
        {running ? '⏸' : '▶'}
      </button>
      {seconds > 0 && (
        <button style={styles.resetBtn} onClick={reset}>↺</button>
      )}
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', padding: '8px 10px', background: '#ffffff06', borderRadius: '8px', border: '1px solid #2a2a3a' },
  time: { fontSize: '13px', fontWeight: '700', flex: 1, fontVariantNumeric: 'tabular-nums' },
  btn: { padding: '4px 10px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontSize: '13px', background: 'transparent' },
  resetBtn: { padding: '4px 8px', borderRadius: '6px', border: '1px solid #333', background: 'transparent', color: '#555', cursor: 'pointer', fontSize: '13px' }
};