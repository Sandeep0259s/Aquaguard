import { useState, useEffect, useCallback } from 'react';
import {
  FiDroplet, FiCheck, FiX, FiArrowRight, FiAward, FiRefreshCw, FiAlertTriangle,
} from 'react-icons/fi';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Navbar from './Navbar';
import theme from '../theme';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const DIFFICULTY_TIERS = ['easy', 'medium', 'hard', 'expert'];
const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert' };
// Every 2 completed sessions bumps you up a tier, capping at "expert".
const SESSIONS_PER_TIER = 2;

const difficultyForSessions = (sessionsCompleted) =>
  DIFFICULTY_TIERS[Math.min(Math.floor(sessionsCompleted / SESSIONS_PER_TIER), DIFFICULTY_TIERS.length - 1)];

const Quiz = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null); // { sessionsCompleted, totalCorrect, totalAnswered }
  const [phase, setPhase] = useState('loading'); // loading | active | summary | error
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState([]); // booleans, one per answered question
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadProgress = useCallback(async () => {
    if (!user) return { sessionsCompleted: 0, totalCorrect: 0, totalAnswered: 0 };
    try {
      const snap = await getDoc(doc(db, 'quizProgress', user.uid));
      if (snap.exists()) return snap.data();
    } catch (err) {
      console.error('Failed to load quiz progress (check Firestore rules):', err);
      setSaveError(true);
    }
    return { sessionsCompleted: 0, totalCorrect: 0, totalAnswered: 0 };
  }, [user]);

  const startSession = useCallback(async (currentProgress) => {
    setPhase('loading');
    setError('');
    setIndex(0);
    setSelected(null);
    setResults([]);
    const difficulty = difficultyForSessions(currentProgress.sessionsCompleted);
    try {
      const res = await fetch(`${API_BASE_URL}/quiz-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty }),
      });
      const data = await res.json();
      if (!res.ok || !data.questions || !data.questions.length) {
        throw new Error(data.error || 'Could not load quiz questions.');
      }
      setQuestions(data.questions);
      setPhase('active');
    } catch (err) {
      setError(err.message || 'Could not load quiz questions. Please try again.');
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await loadProgress();
      if (cancelled) return;
      setProgress(p);
      startSession(p);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const currentQuestion = questions[index];
  const currentDifficulty = progress ? difficultyForSessions(progress.sessionsCompleted) : 'easy';

  const handleSelect = (optionIndex) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    setResults(prev => [...prev, optionIndex === currentQuestion.correctIndex]);
  };

  const handleNext = async () => {
    if (index < questions.length - 1) {
      setIndex(index + 1);
      setSelected(null);
      return;
    }

    // Session finished — persist progress. `results` already includes the
    // last answer (appended synchronously in handleSelect).
    const totalSessionCorrect = results.filter(Boolean).length;
    const updated = {
      sessionsCompleted: (progress?.sessionsCompleted || 0) + 1,
      totalCorrect: (progress?.totalCorrect || 0) + totalSessionCorrect,
      totalAnswered: (progress?.totalAnswered || 0) + questions.length,
    };
    setProgress(updated);
    setPhase('summary');

    if (user) {
      try {
        await setDoc(doc(db, 'quizProgress', user.uid), { ...updated, updatedAt: serverTimestamp() });
        setSaveError(false);
      } catch (err) {
        console.error('Failed to save quiz progress (check Firestore rules):', err);
        setSaveError(true);
      }
    }
  };

  const handlePlayAgain = () => {
    setSaved(false);
    startSession(progress);
  };

  const handleSaveToLeaderboard = async () => {
    if (!user || !progress) return;
    try {
      await setDoc(doc(db, 'leaderboard', user.uid), {
        name: user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous'),
        score: progress.totalCorrect,
        difficulty: DIFFICULTY_LABELS[currentDifficulty],
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSaved(true);
    } catch (err) {
      console.error('Failed to save leaderboard score:', err);
    }
  };

  const sessionCorrectCount = results.filter(Boolean).length;

  return (
    <div style={styles.container}>
      <Navbar active="quiz" user={user} />
      <div style={styles.contentArea}>
        <div style={styles.contentContainer}>
          {phase === 'loading' && (
            <div style={styles.card}>
              <FiDroplet size={32} className="pulse" style={styles.loadingIcon} />
              <p style={styles.loadingText}>Generating fresh questions…</p>
            </div>
          )}

          {phase === 'error' && (
            <div style={styles.card}>
              <FiAlertTriangle size={28} style={styles.errorIcon} />
              <p style={styles.loadingText}>{error}</p>
              <button style={styles.navButtonPrimary} className="lift-hover" onClick={() => startSession(progress)}>
                <FiRefreshCw size={16} /> Try again
              </button>
            </div>
          )}

          {phase === 'active' && currentQuestion && (
            <div style={styles.card}>
              <div style={styles.topRow}>
                <span style={styles.difficultyBadge}>{DIFFICULTY_LABELS[currentDifficulty]}</span>
                <p style={styles.stepLabel}>Question {index + 1} of {questions.length}</p>
              </div>
              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressFill, width: `${((index + 1) / questions.length) * 100}%` }} />
              </div>
              <h2 style={styles.question}>{currentQuestion.question}</h2>
              <div style={styles.options}>
                {currentQuestion.options.map((opt, i) => {
                  const isCorrect = i === currentQuestion.correctIndex;
                  const isChosen = i === selected;
                  let optionStyle = styles.option;
                  if (selected !== null) {
                    if (isCorrect) optionStyle = { ...styles.option, ...styles.optionCorrect };
                    else if (isChosen) optionStyle = { ...styles.option, ...styles.optionWrong };
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(i)}
                      style={optionStyle}
                      disabled={selected !== null}
                      className={selected === null ? 'lift-hover' : undefined}
                    >
                      <span>{opt}</span>
                      {selected !== null && isCorrect && <FiCheck size={18} />}
                      {selected !== null && isChosen && !isCorrect && <FiX size={18} />}
                    </button>
                  );
                })}
              </div>

              {selected !== null && (
                <div style={styles.explanationBox}>
                  <strong>{selected === currentQuestion.correctIndex ? 'Correct! ' : 'Not quite. '}</strong>
                  {currentQuestion.explanation}
                </div>
              )}

              <div style={styles.navRow}>
                <button
                  onClick={handleNext}
                  disabled={selected === null}
                  style={{ ...styles.navButtonPrimary, ...(selected === null ? styles.navButtonDisabled : {}) }}
                  className="lift-hover"
                >
                  {index === questions.length - 1 ? 'See results' : 'Next'} <FiArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {phase === 'summary' && (
            <div style={styles.card}>
              <div style={styles.resultBadge}>
                <FiAward size={32} color={theme.colors.white} />
              </div>
              <h2 style={styles.resultTitle}>{sessionCorrectCount} / {questions.length} correct</h2>
              <p style={styles.resultSub}>
                Difficulty: {DIFFICULTY_LABELS[currentDifficulty]} · Lifetime score: {progress?.totalCorrect ?? 0} correct
                across {progress?.sessionsCompleted ?? 0} sessions
              </p>
              <p style={styles.resultHint}>
                Next session unlocks at{' '}
                {DIFFICULTY_LABELS[difficultyForSessions(progress?.sessionsCompleted ?? 0)]} difficulty.
              </p>

              {saveError && (
                <div style={styles.saveErrorBanner}>
                  <FiAlertTriangle size={14} /> Your progress isn't saving — check your Firestore security rules.
                </div>
              )}

              <div style={styles.resultActions}>
                <button onClick={handlePlayAgain} style={styles.navButton} className="lift-hover">
                  <FiRefreshCw size={16} /> Play again
                </button>
                <button
                  onClick={handleSaveToLeaderboard}
                  disabled={saved}
                  style={{ ...styles.navButtonPrimary, ...(saved ? styles.navButtonDisabled : {}) }}
                  className="lift-hover"
                >
                  <FiAward size={16} /> {saved ? 'Saved to leaderboard' : 'Save to leaderboard'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: theme.fontFamily, backgroundColor: theme.colors.bgTint },
  contentArea: { flex: 1, padding: '32px 24px', overflowY: 'auto', display: 'flex', justifyContent: 'center' },
  contentContainer: { width: '100%', maxWidth: '640px' },
  card: { backgroundColor: theme.colors.white, borderRadius: theme.radius.xl, padding: '36px', boxShadow: theme.shadow.glass },
  loadingIcon: { color: theme.colors.primary, display: 'block', margin: '0 auto 16px' },
  loadingText: { textAlign: 'center', color: theme.colors.textMuted },
  errorIcon: { color: theme.colors.danger, display: 'block', margin: '0 auto 16px' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  difficultyBadge: { backgroundColor: theme.colors.accentPale, color: theme.colors.primaryDark, fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '4px 10px', borderRadius: '999px' },
  progressTrack: { height: '6px', backgroundColor: theme.colors.accentPale, borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' },
  progressFill: { height: '100%', background: theme.gradient.button, transition: 'width 0.3s ease' },
  stepLabel: { margin: 0, fontSize: '0.85rem', color: theme.colors.textFaint, fontWeight: '600' },
  question: { fontFamily: theme.fontHeading, fontSize: '1.4rem', fontWeight: '700', color: theme.colors.textDark, margin: '0 0 24px' },
  options: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' },
  option: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', padding: '14px 18px', borderRadius: theme.radius.md, border: `2px solid ${theme.colors.border}`, backgroundColor: theme.colors.white, cursor: 'pointer', fontSize: '0.98rem', color: theme.colors.textDark },
  optionCorrect: { borderColor: '#2a9d8f', backgroundColor: '#e6f7f4', fontWeight: '600', color: '#177267' },
  optionWrong: { borderColor: theme.colors.danger, backgroundColor: '#fee2e2', fontWeight: '600', color: '#b91c1c' },
  explanationBox: { backgroundColor: theme.colors.bgTint, borderRadius: theme.radius.md, padding: '14px 16px', fontSize: '0.92rem', color: theme.colors.textDark, lineHeight: 1.5, marginBottom: '20px' },
  navRow: { display: 'flex', justifyContent: 'flex-end' },
  navButton: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: theme.radius.md, border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.white, color: theme.colors.textMuted, cursor: 'pointer', fontWeight: '600' },
  navButtonPrimary: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: theme.radius.md, border: 'none', background: theme.gradient.button, color: theme.colors.white, cursor: 'pointer', fontWeight: '600', margin: '0 auto' },
  navButtonDisabled: { opacity: 0.45, cursor: 'not-allowed' },
  resultBadge: { width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: theme.gradient.button },
  resultTitle: { textAlign: 'center', fontFamily: theme.fontHeading, fontSize: '1.6rem', fontWeight: '700', margin: '0 0 8px', color: theme.colors.textDark },
  resultSub: { textAlign: 'center', fontSize: '0.92rem', color: theme.colors.textMuted, margin: '0 0 4px' },
  resultHint: { textAlign: 'center', fontSize: '0.85rem', color: theme.colors.textFaint, margin: '0 0 20px' },
  saveErrorBanner: { display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '8px 14px', marginBottom: '16px', backgroundColor: '#fff3e0', color: '#9a5b00', borderRadius: theme.radius.sm, fontSize: '0.82rem' },
  resultActions: { display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' },
};

export default Quiz;
