import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api';

const MODES = { WORK: 'work', BREAK: 'break' };
const isMobile = window.innerWidth <= 768 ||
  (window.Capacitor !== undefined && window.Capacitor.isNativePlatform());
const LOFI_TRACKS = [
  { name: 'Lofi Study Beats', url: 'https://stream.zeno.fm/f3wvbbqmdg8uv' },
  { name: 'Chillhop Radio', url: 'https://stream.zeno.fm/0r0xa792kwzuv' },
  { name: 'Lofi Hip Hop', url: 'https://stream.zeno.fm/mvh4f9qad5zuv' },
];

export default function Pomodoro() {
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [mode, setMode] = useState(MODES.WORK);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [session, setSession] = useState(1);
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [finished, setFinished] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [sessionsToday, setSessionsToday] = useState(0);
  const interval = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    api.get('/tasks').then(res =>
      setTasks(res.data.filter(t => t.isInTodo && t.status !== 'Completed'))
    );
    api.get('/pomodoro/stats').then(res => {
      setSessionsToday(res.data.todaySessions);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setMusicPlaying(m => !m);
  };

  const changeTrack = (idx) => {
    setTrackIndex(idx);
    setMusicPlaying(false);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.load();
        audioRef.current.play().catch(() => {});
        setMusicPlaying(true);
      }
    }, 100);
  };

  const playBell = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const frequencies = [523, 659, 784, 1047];
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.3);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.3 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 1.2);
        osc.start(ctx.currentTime + i * 0.3);
        osc.stop(ctx.currentTime + i * 0.3 + 1.2);
      });
    } catch {}
  }, []);

  const logSession = useCallback(async (durationMin) => {
    try {
      await api.post('/pomodoro/session', {
        durationMinutes: durationMin,
        taskId: activeTask?.id || null
      });
      setSessionsToday(s => s + 1);
    } catch {}
  }, [activeTask]);

  const switchMode = useCallback((toMode) => {
    setRunning(false);
    setFinished(true);
    if (toMode === MODES.BREAK) logSession(workMin);
    setMode(toMode);
    setSeconds(toMode === MODES.WORK ? workMin * 60 : breakMin * 60);
    setTimeout(() => setFinished(false), 3000);
  }, [workMin, breakMin, logSession]);

  useEffect(() => {
    if (running) {
      interval.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(interval.current);
            setRunning(false);
            playBell();
            if (mode === MODES.WORK) {
              setSession(n => n + 1);
              switchMode(MODES.BREAK);
            } else {
              switchMode(MODES.WORK);
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval.current);
    }
    return () => clearInterval(interval.current);
  }, [running, mode, switchMode, playBell]);

  const reset = () => {
    setRunning(false);
    setSeconds(mode === MODES.WORK ? workMin * 60 : breakMin * 60);
    setFinished(false);
  };

  const applyCustom = () => {
    setRunning(false);
    setMode(MODES.WORK);
    setSeconds(workMin * 60);
    setCustomizing(false);
    setSession(1);
  };

  const total = mode === MODES.WORK ? workMin * 60 : breakMin * 60;
  const progress = ((total - seconds) / total) * 100;
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  const circumference = 2 * Math.PI * 120;
  const strokeDash = circumference - (progress / 100) * circumference;

  const modeColor = mode === MODES.WORK
    ? { primary: '#E8A87C', glow: '#E8A87C44', text: '#F5E6D3' }
    : { primary: '#87B5A2', glow: '#87B5A244', text: '#D3EDE8' };

  return (
    <div style={styles.layout}>
      <Sidebar />
      <audio ref={audioRef} src={LOFI_TRACKS[trackIndex].url} loop />

      <div style={styles.main}>
        <div style={{ ...styles.blob1, background: modeColor.primary + '18' }} />
        <div style={{ ...styles.blob2, background: '#9B7FA622' }} />
        <div style={{ ...styles.blob3, background: modeColor.primary + '10' }} />

        <div style={styles.content}>
          <div style={styles.header}>
            <div>
              <h1 style={{ ...styles.pageTitle, color: modeColor.text }}>Pomodoro 🍅</h1>
              <p style={styles.pageSub}>Session #{session} · {mode === MODES.WORK ? 'Focus 🎯' : 'Break ☕'} · {sessionsToday} done today</p>
            </div>
            <button style={{ ...styles.customBtn, borderColor: modeColor.primary, color: modeColor.primary }}
              onClick={() => setCustomizing(!customizing)}>
              ⚙️ Customize
            </button>
          </div>

          {/* Music player */}
          <div style={styles.musicCard}>
            <div style={styles.musicLeft}>
              <span style={styles.musicIcon}>🎵</span>
              <div>
                <div style={styles.musicName}>{LOFI_TRACKS[trackIndex].name}</div>
                <div style={styles.musicSub}>Lofi background music</div>
              </div>
            </div>
            <div style={styles.musicControls}>
              <input
                type="range" min="0" max="1" step="0.05"
                value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                style={styles.volumeSlider}
              />
              <div style={styles.trackBtns}>
                {LOFI_TRACKS.map((t, i) => (
                  <button
                    key={i}
                    style={{ ...styles.trackBtn, ...(trackIndex === i ? { background: modeColor.primary + '33', borderColor: modeColor.primary, color: modeColor.primary } : {}) }}
                    onClick={() => changeTrack(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                style={{ ...styles.musicPlayBtn, background: modeColor.primary, boxShadow: `0 4px 16px ${modeColor.glow}` }}
                onClick={toggleMusic}
              >
                {musicPlaying ? '⏸' : '▶'}
              </button>
            </div>
          </div>

          {customizing && (
            <div style={styles.customPanel}>
              <h3 style={styles.customTitle}>Set your timer ⏱️</h3>
              <div style={styles.customRow}>
                <div style={styles.customField}>
                  <label style={styles.customLabel}>Work (minutes)</label>
                  <input style={styles.customInput} type="number" min="1" max="120"
                    value={workMin} onChange={e => setWorkMin(parseInt(e.target.value) || 25)} />
                </div>
                <div style={styles.customField}>
                  <label style={styles.customLabel}>Break (minutes)</label>
                  <input style={styles.customInput} type="number" min="1" max="60"
                    value={breakMin} onChange={e => setBreakMin(parseInt(e.target.value) || 5)} />
                </div>
              </div>
              <div style={styles.presets}>
                <span style={styles.presetsLabel}>Presets:</span>
                <button style={styles.presetBtn} onClick={() => { setWorkMin(25); setBreakMin(5); }}>25/5</button>
                <button style={styles.presetBtn} onClick={() => { setWorkMin(50); setBreakMin(10); }}>50/10</button>
                <button style={styles.presetBtn} onClick={() => { setWorkMin(90); setBreakMin(20); }}>90/20</button>
              </div>
              <button style={{ ...styles.applyBtn, background: modeColor.primary }} onClick={applyCustom}>
                Apply & Reset
              </button>
            </div>
          )}

          <div style={styles.timerArea}>
            <div style={styles.ringWrapper}>
              <div style={{ ...styles.ringGlow, boxShadow: `0 0 80px ${modeColor.glow}` }} />
              <svg width="280" height="280" style={styles.svg}>
                <circle cx="140" cy="140" r="120" fill="none" stroke="#2a2018" strokeWidth="12" />
                <circle cx="140" cy="140" r="120" fill="none"
                  stroke={modeColor.primary} strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={strokeDash}
                  transform="rotate(-90 140 140)"
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
                />
              </svg>
              <div style={styles.ringInner}>
                <div style={{ ...styles.timerText, color: modeColor.text }}>{mins}:{secs}</div>
                <div style={{ ...styles.modeLabel, color: modeColor.primary }}>
                  {mode === MODES.WORK ? '🎯 Focus' : '☕ Break'}
                </div>
                {finished && (
                  <div style={{ ...styles.finishedTag, color: modeColor.primary }}>Time's up! 🔔</div>
                )}
              </div>
            </div>

            <div style={styles.controls}>
              <button style={styles.resetCircle} onClick={reset}>↺</button>
              <button
                style={{ ...styles.playBtn, background: modeColor.primary, boxShadow: `0 8px 32px ${modeColor.glow}` }}
                onClick={() => setRunning(r => !r)}
              >
                {running ? '⏸' : '▶'}
              </button>
              <button
                style={{ ...styles.skipCircle, borderColor: modeColor.primary + '66', color: modeColor.primary }}
                onClick={() => switchMode(mode === MODES.WORK ? MODES.BREAK : MODES.WORK)}
              >
                ⏭
              </button>
            </div>

            <div style={styles.modeSwitcher}>
              <button
                style={{ ...styles.modeBtn, ...(mode === MODES.WORK ? { ...styles.modeBtnActive, borderColor: '#E8A87C', color: '#E8A87C', background: '#E8A87C18' } : {}) }}
                onClick={() => switchMode(MODES.WORK)}
              >🎯 Focus</button>
              <button
                style={{ ...styles.modeBtn, ...(mode === MODES.BREAK ? { ...styles.modeBtnActive, borderColor: '#87B5A2', color: '#87B5A2', background: '#87B5A218' } : {}) }}
                onClick={() => switchMode(MODES.BREAK)}
              >☕ Break</button>
            </div>
          </div>

          <div style={styles.taskSection}>
            <h3 style={styles.taskSectionTitle}>Working on 📌</h3>
            {activeTask ? (
              <div style={{ ...styles.activeTaskCard, borderColor: modeColor.primary + '66' }}>
                <div style={styles.activeTaskTop}>
                  <span style={{ ...styles.activeTaskName, color: modeColor.text }}>{activeTask.title}</span>
                  <button style={styles.clearTask} onClick={() => setActiveTask(null)}>✕</button>
                </div>
                <div style={styles.taskTimeRow}>
                  <span style={styles.activeTaskCat}>📁 {activeTask.category || 'Uncategorized'}</span>
                  {activeTask.estimatedMinutes > 0 && (
                    <span style={styles.timeTag}>
                      ⏱️ {activeTask.spentMinutes || 0}/{activeTask.estimatedMinutes}m
                    </span>
                  )}
                </div>
                {activeTask.estimatedMinutes > 0 && (
                  <div style={styles.taskProgressTrack}>
                    <div style={{
                      height: '100%', borderRadius: '2px',
                      background: modeColor.primary,
                      width: `${Math.min(((activeTask.spentMinutes || 0) / activeTask.estimatedMinutes) * 100, 100)}%`,
                      transition: 'width 0.5s'
                    }} />
                  </div>
                )}
              </div>
            ) : (
              <p style={styles.noTask}>Select a task below to focus on 👇</p>
            )}

            <div style={styles.todoList}>
              {tasks.length === 0 ? (
                <p style={styles.emptyTodo}>No To-Do tasks yet — add some from the Dashboard! 📋</p>
              ) : tasks.map(task => (
                <button key={task.id}
                  style={{
                    ...styles.todoItem,
                    ...(activeTask?.id === task.id ? { ...styles.todoItemActive, borderColor: modeColor.primary, background: modeColor.primary + '12' } : {})
                  }}
                  onClick={() => setActiveTask(task)}
                >
                  <div style={styles.todoItemLeft}>
                    <span style={styles.todoItemName}>{task.title}</span>
                    {task.estimatedMinutes > 0 && (
                      <span style={styles.todoTimeTag}>⏱️ {task.spentMinutes || 0}/{task.estimatedMinutes}m</span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600',
                    background: task.manualPriority === 'High' ? '#ff6b6b22' : task.manualPriority === 'Low' ? '#69db7c22' : '#ffa94d22',
                    color: task.manualPriority === 'High' ? '#ff6b6b' : task.manualPriority === 'Low' ? '#69db7c' : '#ffa94d'
                  }}>{task.manualPriority}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh', background: '#0e0b08' },
main: { 
  marginLeft: isMobile ? '0' : '220px', 
  flex: 1, 
  padding: isMobile ? '72px 1rem 80px' : '2rem 2.5rem' 
},  blob1: { position: 'fixed', width: '500px', height: '500px', borderRadius: '50%', top: '-100px', right: '-100px', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 },
  blob2: { position: 'fixed', width: '400px', height: '400px', borderRadius: '50%', bottom: '-50px', left: '200px', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 },
  blob3: { position: 'fixed', width: '300px', height: '300px', borderRadius: '50%', top: '50%', right: '20%', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0 },
  content: { position: 'relative', zIndex: 1, padding: '2rem 2.5rem', maxWidth: '700px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  pageTitle: { fontSize: '26px', fontWeight: '700', marginBottom: '4px' },
  pageSub: { fontSize: '13px', color: '#6b5e4e' },
  customBtn: { padding: '8px 16px', borderRadius: '10px', background: 'transparent', border: '1px solid', cursor: 'pointer', fontSize: '13px' },
  musicCard: { background: '#1a150f', border: '1px solid #3a2e22', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
  musicLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  musicIcon: { fontSize: '24px' },
  musicName: { fontSize: '14px', fontWeight: '600', color: '#D4A574' },
  musicSub: { fontSize: '11px', color: '#6b5e4e', marginTop: '2px' },
  musicControls: { display: 'flex', alignItems: 'center', gap: '10px' },
  volumeSlider: { width: '80px', accentColor: '#E8A87C', cursor: 'pointer' },
  trackBtns: { display: 'flex', gap: '4px' },
  trackBtn: { width: '28px', height: '28px', borderRadius: '6px', background: '#2a1f15', border: '1px solid #3a2e22', color: '#6b5e4e', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  musicPlayBtn: { width: '36px', height: '36px', borderRadius: '50%', border: 'none', color: '#1a0f08', cursor: 'pointer', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  customPanel: { background: '#1a150f', border: '1px solid #3a2e22', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' },
  customTitle: { fontSize: '15px', fontWeight: '600', color: '#D4A574', marginBottom: '1rem' },
  customRow: { display: 'flex', gap: '16px', marginBottom: '1rem' },
  customField: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  customLabel: { fontSize: '12px', color: '#6b5e4e', textTransform: 'uppercase', letterSpacing: '0.05em' },
  customInput: { padding: '10px 14px', borderRadius: '10px', border: '1px solid #3a2e22', background: '#0e0b08', color: '#F5E6D3', fontSize: '16px', fontWeight: '600', outline: 'none', width: '100%' },
  presets: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' },
  presetsLabel: { fontSize: '12px', color: '#6b5e4e' },
  presetBtn: { padding: '5px 12px', borderRadius: '8px', background: '#2a1f15', border: '1px solid #3a2e22', color: '#D4A574', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  applyBtn: { padding: '10px 24px', borderRadius: '10px', border: 'none', color: '#1a0f08', fontWeight: '700', cursor: 'pointer', fontSize: '14px' },
  timerArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' },
  ringWrapper: { position: 'relative', width: '280px', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  ringGlow: { position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', filter: 'blur(40px)', transition: 'box-shadow 0.5s' },
  svg: { position: 'absolute', top: 0, left: 0 },
  ringInner: { position: 'relative', zIndex: 1, textAlign: 'center' },
  timerText: { fontSize: '52px', fontWeight: '300', letterSpacing: '4px', fontVariantNumeric: 'tabular-nums', lineHeight: 1 },
  modeLabel: { fontSize: '14px', fontWeight: '500', marginTop: '8px' },
  finishedTag: { fontSize: '13px', fontWeight: '600', marginTop: '6px' },
  controls: { display: 'flex', alignItems: 'center', gap: '20px' },
  resetCircle: { width: '44px', height: '44px', borderRadius: '50%', background: '#1a150f', border: '1px solid #3a2e22', color: '#6b5e4e', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: '72px', height: '72px', borderRadius: '50%', border: 'none', color: '#1a0f08', cursor: 'pointer', fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
  skipCircle: { width: '44px', height: '44px', borderRadius: '50%', background: '#1a150f', border: '1px solid', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modeSwitcher: { display: 'flex', gap: '8px' },
  modeBtn: { padding: '8px 20px', borderRadius: '20px', background: 'transparent', border: '1px solid #3a2e22', color: '#6b5e4e', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s' },
  modeBtnActive: { fontWeight: '700' },
  taskSection: { width: '100%' },
  taskSectionTitle: { fontSize: '14px', fontWeight: '600', color: '#6b5e4e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' },
  activeTaskCard: { background: '#1a150f', border: '1px solid', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1rem' },
  activeTaskTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  activeTaskName: { fontSize: '15px', fontWeight: '600' },
  clearTask: { background: 'transparent', border: 'none', color: '#6b5e4e', cursor: 'pointer', fontSize: '14px' },
  taskTimeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  activeTaskCat: { fontSize: '12px', color: '#6b5e4e' },
  timeTag: { fontSize: '12px', color: '#D4A574', fontWeight: '600' },
  taskProgressTrack: { height: '4px', background: '#2a1f15', borderRadius: '2px', overflow: 'hidden' },
  noTask: { fontSize: '13px', color: '#3a2e22', marginBottom: '1rem', fontStyle: 'italic' },
  todoList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  todoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a150f', border: '1px solid #2a1f15', borderRadius: '12px', padding: '12px 16px', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.2s' },
  todoItemActive: { border: '1px solid' },
  todoItemLeft: { display: 'flex', flexDirection: 'column', gap: '3px' },
  todoItemName: { fontSize: '14px', color: '#D4A574', fontWeight: '500' },
  todoTimeTag: { fontSize: '11px', color: '#6b5e4e' },
  emptyTodo: { fontSize: '13px', color: '#3a2e22', fontStyle: 'italic' }
};