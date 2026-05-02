import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';
import api from '../api';

const COLORS = ['#7F77DD', '#E8A87C', '#87B5A2', '#ff6b6b', '#ffa94d', '#69db7c', '#c77dff', '#48cae4'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const diffColor = { Easy: '#69db7c', Medium: '#ffa94d', Hard: '#ff6b6b' };

export default function StudyPlanner() {
  const [subjects, setSubjects] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [today, setToday] = useState([]);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [hoursPerDay, setHoursPerDay] = useState(6);
  const [view, setView] = useState('overview');
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [chapters, setChapters] = useState({});
  const [showChapterForm, setShowChapterForm] = useState(null);
  const [chapterForm, setChapterForm] = useState({ title: '', description: '', estimatedHours: 1 });
  const [form, setForm] = useState({
    name: '', color: COLORS[0], difficulty: 'Medium',
    examDate: '', totalHoursNeeded: 0
  });

  const showToast = (message, type = 'success') => setToast({ message, type });

  const load = useCallback(async () => {
    const [subRes, schedRes, todayRes] = await Promise.all([
      api.get('/studyplanner/subjects'),
      api.get('/studyplanner/schedule'),
      api.get('/studyplanner/today')
    ]);
    setSubjects(subRes.data);
    setSchedule(schedRes.data);
    setToday(todayRes.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadChapters = async (subjectId) => {
    const res = await api.get(`/studyplanner/subjects/${subjectId}/chapters`);
    setChapters(prev => ({ ...prev, [subjectId]: res.data }));
  };

  const toggleExpand = async (subjectId) => {
    if (expandedSubject === subjectId) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(subjectId);
      await loadChapters(subjectId);
    }
  };

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleChapter = (e) => setChapterForm({ ...chapterForm, [e.target.name]: e.target.value });

  const addSubject = async () => {
    if (!form.name || !form.examDate) return showToast('Fill in name and exam date!', 'error');
    try {
      await api.post('/studyplanner/subjects', {
        ...form,
        examDate: new Date(form.examDate).toISOString(),
        totalHoursNeeded: 0,
        difficulty: DIFFICULTIES.indexOf(form.difficulty)
      });
      setShowForm(false);
      setForm({ name: '', color: COLORS[0], difficulty: 'Medium', examDate: '', totalHoursNeeded: 0 });
      showToast('Subject added! 📚');
      load();
    } catch { showToast('Something went wrong', 'error'); }
  };

  const deleteSubject = async (id) => {
    await api.delete(`/studyplanner/subjects/${id}`);
    showToast('Subject removed', 'info');
    load();
  };

  const addChapter = async (subjectId) => {
    if (!chapterForm.title) return showToast('Enter chapter title!', 'error');
    try {
      await api.post(`/studyplanner/subjects/${subjectId}/chapters`, {
        title: chapterForm.title,
        description: chapterForm.description || '',
        estimatedHours: parseInt(chapterForm.estimatedHours) || 1
      });
      setChapterForm({ title: '', description: '', estimatedHours: 1 });
      setShowChapterForm(null);
      showToast('Chapter added! 📖');
      loadChapters(subjectId);
      load();
    } catch { showToast('Something went wrong', 'error'); }
  };

  const completeChapter = async (chapterId, subjectId) => {
    await api.patch(`/studyplanner/chapters/${chapterId}/complete`);
    showToast('Chapter done! 🎉');
    loadChapters(subjectId);
    load();
  };

  const deleteChapter = async (chapterId, subjectId) => {
    await api.delete(`/studyplanner/chapters/${chapterId}`);
    showToast('Chapter removed', 'info');
    loadChapters(subjectId);
    load();
  };

  const generate = async () => {
    try {
      await api.post('/studyplanner/generate', { hoursPerDay: parseInt(hoursPerDay) });
      showToast('Schedule generated! 🧠✨');
      load();
      setView('schedule');
    } catch { showToast('Add subjects with chapters first!', 'error'); }
  };

  const completeSession = async (id) => {
    await api.patch(`/studyplanner/sessions/${id}/complete`);
    showToast('Session done! 🎉');
    load();
  };

  const grouped = schedule.reduce((acc, s) => {
    const date = new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(s);
    return acc;
  }, {});

  const totalHours = subjects.reduce((a, s) => a + s.totalHoursNeeded, 0);
  const completedHours = subjects.reduce((a, s) => a + s.hoursCompleted, 0);
  const overallProgress = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.bgBlob1} />
        <div style={styles.bgBlob2} />

        <div style={styles.content}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.pageTitle}>Study Planner 📚</h1>
              <p style={styles.pageSub}>AI-powered exam schedule · {subjects.length} subjects · {overallProgress}% complete</p>
            </div>
            <div style={styles.headerBtns}>
              <button style={styles.outlineBtn} onClick={() => setShowForm(!showForm)}>➕ Add Subject</button>
              <button style={styles.generateBtn} onClick={generate}>🧠 Generate Schedule</button>
            </div>
          </div>

          {/* Today's plan */}
          {today.length > 0 && (
            <div style={styles.todayCard}>
              <div style={styles.todayHeader}>
                <span style={styles.todayTitle}>📅 Today's Study Plan</span>
                <span style={styles.todaySub}>{today.reduce((a, s) => a + s.plannedHours, 0)} hours planned</span>
              </div>
              <div style={styles.todayList}>
                {today.map(session => (
                  <div key={session.id} style={{ ...styles.todayItem, opacity: session.isCompleted ? 0.5 : 1 }}>
                    <div style={{ ...styles.subjectDot, background: session.subject.color }} />
                    <div style={styles.todayInfo}>
                      <div>
                        <span style={styles.todaySubject}>{session.subject.name}</span>
                        {session.chapter && (
                          <span style={styles.chapterTag}>📖 {session.chapter.title}</span>
                        )}
                      </div>
                      <span style={styles.todayHours}>{session.plannedHours}h</span>
                    </div>
                    {!session.isCompleted ? (
                      <button style={styles.doneBtn} onClick={() => completeSession(session.id)}>✅ Done</button>
                    ) : (
                      <span style={styles.completedTag}>✓ Done</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add subject form */}
          {showForm && (
            <div style={styles.formCard}>
              <h3 style={styles.formTitle}>➕ New Subject</h3>
              <div style={styles.formGrid}>
                <input style={styles.input} name="name" placeholder="Subject name (e.g. Algorithms)" value={form.name} onChange={handle} />
                <select style={styles.input} name="difficulty" value={form.difficulty} onChange={handle}>
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input style={styles.input} name="examDate" type="date" value={form.examDate} onChange={handle} />
                <div style={{ ...styles.input, display: 'flex', alignItems: 'center', color: '#555', fontSize: '13px' }}>
                  📖 Hours auto-calculated from chapters
                </div>
              </div>
              <div style={styles.colorRow}>
                <span style={styles.colorLabel}>Color:</span>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setForm({ ...form, color: c })}
                    style={{ ...styles.colorDot, background: c, ...(form.color === c ? styles.colorSelected : {}) }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <button style={styles.btn} onClick={addSubject}>Add Subject</button>
                <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* View tabs */}
          <div style={styles.tabs}>
            {['overview', 'schedule', 'progress'].map(v => (
              <button key={v} style={{ ...styles.tab, ...(view === v ? styles.tabActive : {}) }}
                onClick={() => setView(v)}>
                {v === 'overview' ? '📋 Overview' : v === 'schedule' ? '📅 Schedule' : '📊 Progress'}
              </button>
            ))}
            {view === 'schedule' && (
              <div style={styles.hoursControl}>
                <span style={styles.hoursLabel}>Hours/day:</span>
                <input style={styles.hoursInput} type="number" min="1" max="12"
                  value={hoursPerDay} onChange={e => setHoursPerDay(e.target.value)} />
              </div>
            )}
          </div>

          {/* OVERVIEW */}
          {view === 'overview' && (
            <div>
              {subjects.length === 0 ? (
                <div style={styles.empty}>
                  <div style={styles.emptyIcon}>📚</div>
                  <h3 style={styles.emptyTitle}>No subjects yet!</h3>
                  <p style={styles.emptySub}>Add your subjects and chapters, then generate your schedule 🧠</p>
                </div>
              ) : (
                <div style={styles.subjectList}>
                  {subjects.map(subject => {
                    const daysLeft = Math.max(0, Math.ceil((new Date(subject.examDate) - new Date()) / (1000 * 60 * 60 * 24)));
                    const progress = subject.totalHoursNeeded > 0
                      ? Math.round((subject.hoursCompleted / subject.totalHoursNeeded) * 100) : 0;
                    const isExpanded = expandedSubject === subject.id;
                    const subjectChapters = chapters[subject.id] || [];

                    return (
                      <div key={subject.id} style={{ ...styles.subjectCard, borderColor: subject.color + '44' }}>
                        {/* Subject header */}
                        <div style={styles.subjectTop}>
                          <div style={styles.subjectLeft}>
                            <div style={{ ...styles.subjectColor, background: subject.color }} />
                            <div>
                              <h3 style={styles.subjectName}>{subject.name}</h3>
                              <div style={styles.subjectMeta}>
                                <span style={{ ...styles.diffBadge, background: diffColor[subject.difficulty] + '22', color: diffColor[subject.difficulty] }}>
                                  {subject.difficulty}
                                </span>
                                <span style={styles.metaItem}>📅 {new Date(subject.examDate).toLocaleDateString()}</span>
                                <span style={{ ...styles.metaItem, color: daysLeft <= 3 ? '#ff6b6b' : daysLeft <= 7 ? '#ffa94d' : '#666' }}>
                                  ⏳ {daysLeft}d left
                                </span>
                                <span style={styles.metaItem}>📖 {subject.totalHoursNeeded}h total</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button style={styles.expandBtn} onClick={() => toggleExpand(subject.id)}>
                              {isExpanded ? '▲ Hide' : '▼ Chapters'}
                            </button>
                            <button style={styles.deleteBtn} onClick={() => deleteSubject(subject.id)}>🗑️</button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={styles.progressRow}>
                          <span style={styles.progressLabel}>{subject.hoursCompleted}/{subject.totalHoursNeeded}h</span>
                          <span style={styles.progressPct}>{progress}%</span>
                        </div>
                        <div style={styles.progressTrack}>
                          <div style={{ ...styles.progressFill, width: `${progress}%`, background: subject.color }} />
                        </div>

                        {/* Chapters section */}
                        {isExpanded && (
                          <div style={styles.chaptersSection}>
                            <div style={styles.chaptersHeader}>
                              <span style={styles.chaptersTitle}>📖 Chapters ({subjectChapters.length})</span>
                              <button
                                style={{ ...styles.addChapterBtn, borderColor: subject.color, color: subject.color }}
                                onClick={() => setShowChapterForm(showChapterForm === subject.id ? null : subject.id)}
                              >
                                ➕ Add Chapter
                              </button>
                            </div>

                            {/* Add chapter form */}
                            {showChapterForm === subject.id && (
                              <div style={styles.chapterForm}>
                                <input
                                  style={styles.chapterInput}
                                  name="title"
                                  placeholder="Chapter title (e.g. Chapter 1 - Sorting)"
                                  value={chapterForm.title}
                                  onChange={handleChapter}
                                />
                                <input
                                  style={styles.chapterInput}
                                  name="description"
                                  placeholder="Description (optional)"
                                  value={chapterForm.description}
                                  onChange={handleChapter}
                                />
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                  <input
                                    style={{ ...styles.chapterInput, width: '120px' }}
                                    name="estimatedHours"
                                    type="number"
                                    min="1"
                                    placeholder="Hours"
                                    value={chapterForm.estimatedHours}
                                    onChange={handleChapter}
                                  />
                                  <button style={{ ...styles.btn, padding: '8px 16px', fontSize: '13px' }}
                                    onClick={() => addChapter(subject.id)}>
                                    Add
                                  </button>
                                  <button style={{ ...styles.cancelBtn, padding: '8px 16px', fontSize: '13px' }}
                                    onClick={() => setShowChapterForm(null)}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Chapter list */}
                            {subjectChapters.length === 0 ? (
                              <p style={styles.noChapters}>No chapters yet — add some above! 👆</p>
                            ) : (
                              subjectChapters.map((chapter, idx) => (
                                <div key={chapter.id} style={{ ...styles.chapterItem, opacity: chapter.isCompleted ? 0.5 : 1 }}>
                                  <div style={{ ...styles.chapterNum, background: subject.color + '22', color: subject.color }}>
                                    {idx + 1}
                                  </div>
                                  <div style={styles.chapterInfo}>
                                    <span style={{ ...styles.chapterTitle, textDecoration: chapter.isCompleted ? 'line-through' : 'none' }}>
                                      {chapter.title}
                                    </span>
                                    {chapter.description && (
                                      <span style={styles.chapterDesc}>{chapter.description}</span>
                                    )}
                                    <span style={styles.chapterHours}>⏱️ {chapter.estimatedHours}h estimated</span>
                                  </div>
                                  <div style={styles.chapterActions}>
                                    {!chapter.isCompleted && (
                                      <button style={styles.doneBtn} onClick={() => completeChapter(chapter.id, subject.id)}>✅</button>
                                    )}
                                    {chapter.isCompleted && <span style={styles.completedTag}>✓</span>}
                                    <button style={styles.deleteBtn} onClick={() => deleteChapter(chapter.id, subject.id)}>🗑️</button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SCHEDULE */}
          {view === 'schedule' && (
            <div>
              {Object.keys(grouped).length === 0 ? (
                <div style={styles.empty}>
                  <div style={styles.emptyIcon}>🧠</div>
                  <h3 style={styles.emptyTitle}>No schedule yet!</h3>
                  <p style={styles.emptySub}>Set your hours/day and hit Generate Schedule 👆</p>
                </div>
              ) : (
                <div style={styles.scheduleList}>
                  {Object.entries(grouped).map(([date, sessions]) => {
                    const isToday = date === new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    return (
                      <div key={date} style={{ ...styles.dayCard, ...(isToday ? styles.todayDayCard : {}) }}>
                        <div style={styles.dayHeader}>
                          <span style={{ ...styles.dayLabel, color: isToday ? '#7F77DD' : '#aaa' }}>
                            {isToday ? '📍 Today' : date}
                          </span>
                          <span style={styles.dayHours}>
                            {sessions.reduce((a, s) => a + s.plannedHours, 0)}h total
                          </span>
                        </div>
                        <div style={styles.sessionList}>
                          {sessions.map(session => (
                            <div key={session.id} style={{ ...styles.sessionItem, opacity: session.isCompleted ? 0.5 : 1 }}>
                              <div style={{ ...styles.sessionBar, background: session.subject.color }} />
                              <div style={styles.sessionInfo}>
                                <div>
                                  <div style={styles.sessionSubject}>{session.subject.name}</div>
                                  {session.chapter && (
                                    <div style={styles.sessionChapter}>📖 {session.chapter.title}</div>
                                  )}
                                </div>
                                <span style={styles.sessionHours}>{session.plannedHours}h</span>
                              </div>
                              <span style={{ ...styles.diffBadge, background: diffColor[session.subject.difficulty] + '22', color: diffColor[session.subject.difficulty] }}>
                                {session.subject.difficulty}
                              </span>
                              {!session.isCompleted ? (
                                <button style={styles.doneBtn} onClick={() => completeSession(session.id)}>✅</button>
                              ) : (
                                <span style={styles.completedTag}>✓</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PROGRESS */}
          {view === 'progress' && (
            <div>
              <div style={styles.overallCard}>
                <div style={styles.overallTop}>
                  <span style={styles.overallLabel}>Overall Progress</span>
                  <span style={styles.overallPct}>{overallProgress}%</span>
                </div>
                <div style={styles.bigTrack}>
                  <div style={{ ...styles.bigFill, width: `${overallProgress}%` }} />
                </div>
                <div style={styles.overallStats}>
                  <span style={styles.statItem}>📚 {subjects.length} subjects</span>
                  <span style={styles.statItem}>✅ {completedHours}h done</span>
                  <span style={styles.statItem}>⏳ {totalHours - completedHours}h left</span>
                </div>
              </div>

              {subjects.map(subject => {
                const progress = subject.totalHoursNeeded > 0
                  ? Math.round((subject.hoursCompleted / subject.totalHoursNeeded) * 100) : 0;
                const daysLeft = Math.max(0, Math.ceil((new Date(subject.examDate) - new Date()) / (1000 * 60 * 60 * 24)));
                const subjectChapters = chapters[subject.id] || [];
                const completedChapters = subjectChapters.filter(c => c.isCompleted).length;

                return (
                  <div key={subject.id} style={styles.progressCard}>
                    <div style={styles.progressCardTop}>
                      <div style={styles.subjectLeft}>
                        <div style={{ ...styles.subjectColor, background: subject.color }} />
                        <div>
                          <span style={styles.subjectName}>{subject.name}</span>
                          {subjectChapters.length > 0 && (
                            <span style={styles.chapterCount}>
                              {completedChapters}/{subjectChapters.length} chapters
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={styles.progressRight}>
                        <span style={{ color: daysLeft <= 3 ? '#ff6b6b' : daysLeft <= 7 ? '#ffa94d' : '#555', fontSize: '12px' }}>
                          {daysLeft}d left
                        </span>
                        <span style={{ ...styles.diffBadge, background: diffColor[subject.difficulty] + '22', color: diffColor[subject.difficulty] }}>
                          {subject.difficulty}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: subject.color }}>{progress}%</span>
                      </div>
                    </div>
                    <div style={styles.progressTrack}>
                      <div style={{ ...styles.progressFill, width: `${progress}%`, background: subject.color, transition: 'width 0.8s ease' }} />
                    </div>
                    <div style={styles.hoursRow}>
                      <span style={styles.hoursText}>{subject.hoursCompleted}h completed</span>
                      <span style={styles.hoursText}>{subject.totalHoursNeeded - subject.hoursCompleted}h remaining</span>
                    </div>
                    {/* Chapter progress */}
                    {subjectChapters.length === 0 && (
                      <button style={{ ...styles.addChapterBtn, marginTop: '10px', borderColor: subject.color, color: subject.color }}
                        onClick={() => { setView('overview'); toggleExpand(subject.id); }}>
                        📖 Add chapters
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh', background: '#080810' },
  main: { marginLeft: '220px', flex: 1, position: 'relative', overflow: 'hidden' },
  bgBlob1: { position: 'fixed', width: '500px', height: '500px', borderRadius: '50%', top: '-100px', right: '-100px', background: '#7F77DD18', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 },
  bgBlob2: { position: 'fixed', width: '400px', height: '400px', borderRadius: '50%', bottom: '-50px', left: '200px', background: '#87B5A218', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 },
  content: { position: 'relative', zIndex: 1, padding: '2rem 2.5rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  pageTitle: { fontSize: '26px', fontWeight: '700', color: '#f0f0f0', marginBottom: '4px' },
  pageSub: { fontSize: '13px', color: '#555' },
  headerBtns: { display: 'flex', gap: '10px' },
  outlineBtn: { padding: '10px 18px', borderRadius: '10px', background: 'transparent', border: '1px solid #2a2a3a', color: '#aaa', cursor: 'pointer', fontSize: '13px' },
  generateBtn: { padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #7F77DD, #9f77dd)', border: 'none', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '14px' },
  todayCard: { background: 'linear-gradient(135deg, #1a1a2e, #16162a)', border: '1px solid #7F77DD44', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' },
  todayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  todayTitle: { fontSize: '14px', fontWeight: '700', color: '#7F77DD' },
  todaySub: { fontSize: '12px', color: '#555' },
  todayList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  todayItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#0d0d18', borderRadius: '10px', border: '1px solid #2a2a3a' },
  subjectDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  todayInfo: { flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  todaySubject: { fontSize: '14px', fontWeight: '500', color: '#f0f0f0', display: 'block' },
  chapterTag: { fontSize: '11px', color: '#7F77DD', marginTop: '2px', display: 'block' },
  todayHours: { fontSize: '13px', color: '#666', fontWeight: '600' },
  doneBtn: { padding: '5px 12px', borderRadius: '8px', background: '#69db7c22', border: '1px solid #69db7c', color: '#69db7c', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  completedTag: { fontSize: '12px', color: '#69db7c', fontWeight: '600' },
  formCard: { background: 'linear-gradient(135deg, #1a1a2e, #16162a)', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' },
  formTitle: { fontSize: '16px', fontWeight: '600', color: '#7F77DD', marginBottom: '1rem' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' },
  input: { padding: '11px 14px', borderRadius: '10px', border: '1px solid #2a2a3a', background: '#0d0d18', color: '#fff', fontSize: '14px', outline: 'none' },
  colorRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  colorLabel: { fontSize: '12px', color: '#555' },
  colorDot: { width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.2s' },
  colorSelected: { border: '2px solid #fff', transform: 'scale(1.2)' },
  btn: { padding: '11px 24px', borderRadius: '10px', background: 'linear-gradient(135deg, #7F77DD, #9f77dd)', border: 'none', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  cancelBtn: { padding: '11px 24px', borderRadius: '10px', background: 'transparent', border: '1px solid #2a2a3a', color: '#666', cursor: 'pointer', fontSize: '14px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '1.5rem', alignItems: 'center' },
  tab: { padding: '8px 18px', borderRadius: '20px', background: 'transparent', border: '1px solid #2a2a3a', color: '#666', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  tabActive: { background: '#7F77DD22', border: '1px solid #7F77DD', color: '#7F77DD' },
  hoursControl: { display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' },
  hoursLabel: { fontSize: '13px', color: '#555' },
  hoursInput: { width: '60px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #2a2a3a', background: '#0d0d18', color: '#fff', fontSize: '14px', outline: 'none', textAlign: 'center' },
  subjectList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  subjectCard: { background: 'linear-gradient(135deg, #1a1a2e, #16162a)', border: '1px solid', borderRadius: '16px', padding: '1.25rem 1.5rem' },
  subjectTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  subjectLeft: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  subjectColor: { width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0, marginTop: '4px' },
  subjectName: { fontSize: '16px', fontWeight: '600', color: '#f0f0f0', marginBottom: '6px' },
  subjectMeta: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  diffBadge: { fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '10px' },
  metaItem: { fontSize: '12px', color: '#666' },
  expandBtn: { padding: '6px 14px', borderRadius: '8px', background: '#ffffff08', border: '1px solid #2a2a3a', color: '#aaa', cursor: 'pointer', fontSize: '12px' },
  deleteBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: 0.5 },
  progressRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  progressLabel: { fontSize: '12px', color: '#555' },
  progressPct: { fontSize: '12px', fontWeight: '700', color: '#aaa' },
  progressTrack: { height: '6px', background: '#2a2a3a', borderRadius: '3px', overflow: 'hidden', marginBottom: '0' },
  progressFill: { height: '100%', borderRadius: '3px', transition: 'width 0.5s ease' },
  chaptersSection: { marginTop: '1rem', borderTop: '1px solid #2a2a3a', paddingTop: '1rem' },
  chaptersHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  chaptersTitle: { fontSize: '13px', fontWeight: '600', color: '#aaa' },
  addChapterBtn: { padding: '5px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  chapterForm: { background: '#0d0d18', borderRadius: '12px', padding: '12px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' },
  chapterInput: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #2a2a3a', background: '#1a1a2e', color: '#fff', fontSize: '13px', outline: 'none', width: '100%' },
  noChapters: { fontSize: '13px', color: '#333', fontStyle: 'italic', padding: '1rem 0' },
  chapterItem: { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px', background: '#0d0d18', borderRadius: '10px', marginBottom: '6px' },
  chapterNum: { width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 },
  chapterInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' },
  chapterTitle: { fontSize: '14px', fontWeight: '500', color: '#f0f0f0' },
  chapterDesc: { fontSize: '12px', color: '#555' },
  chapterHours: { fontSize: '11px', color: '#444' },
  chapterActions: { display: 'flex', gap: '6px', alignItems: 'center' },
  chapterCount: { fontSize: '11px', color: '#555', display: 'block', marginTop: '2px' },
  scheduleList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  dayCard: { background: 'linear-gradient(135deg, #1a1a2e, #16162a)', border: '1px solid #2a2a3a', borderRadius: '14px', padding: '1rem 1.25rem' },
  todayDayCard: { border: '1px solid #7F77DD44' },
  dayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  dayLabel: { fontSize: '13px', fontWeight: '700' },
  dayHours: { fontSize: '12px', color: '#555' },
  sessionList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  sessionItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#0d0d18', borderRadius: '8px' },
  sessionBar: { width: '4px', height: '36px', borderRadius: '2px', flexShrink: 0 },
  sessionInfo: { flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sessionSubject: { fontSize: '13px', fontWeight: '500', color: '#f0f0f0' },
  sessionChapter: { fontSize: '11px', color: '#7F77DD', marginTop: '2px' },
  sessionHours: { fontSize: '12px', color: '#666', fontWeight: '600' },
  overallCard: { background: 'linear-gradient(135deg, #1a1a2e, #16162a)', border: '1px solid #7F77DD44', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' },
  overallTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  overallLabel: { fontSize: '14px', color: '#666' },
  overallPct: { fontSize: '20px', fontWeight: '700', color: '#7F77DD' },
  bigTrack: { height: '10px', background: '#2a2a3a', borderRadius: '5px', overflow: 'hidden', marginBottom: '12px' },
  bigFill: { height: '100%', background: 'linear-gradient(90deg, #7F77DD, #69db7c)', borderRadius: '5px', transition: 'width 0.8s ease' },
  overallStats: { display: 'flex', gap: '1.5rem' },
  statItem: { fontSize: '13px', color: '#555' },
  progressCard: { background: 'linear-gradient(135deg, #1a1a2e, #16162a)', border: '1px solid #2a2a3a', borderRadius: '14px', padding: '1.25rem', marginBottom: '10px' },
  progressCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  progressRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  hoursRow: { display: 'flex', justifyContent: 'space-between', marginTop: '6px' },
  hoursText: { fontSize: '11px', color: '#444' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', textAlign: 'center' },
  emptyIcon: { fontSize: '48px', marginBottom: '1rem' },
  emptyTitle: { fontSize: '20px', fontWeight: '600', color: '#444', marginBottom: '8px' },
  emptySub: { fontSize: '14px', color: '#333' }
};