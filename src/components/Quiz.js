import { useState } from 'react';
import { FiDroplet, FiArrowRight, FiArrowLeft, FiAward, FiRefreshCw } from 'react-icons/fi';
import { db } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Navbar from './Navbar';
import theme from '../theme';
import { useAuth } from '../context/AuthContext';

const NATIONAL_AVG_GAL_PER_DAY = 82;

const QUESTIONS = [
  {
    id: 'shower',
    question: 'How long are your showers, typically?',
    options: [
      { label: 'Under 5 minutes', value: 10 },
      { label: '5–10 minutes', value: 20, tip: 'Cutting showers to under 5 minutes can save ~10 gal/day.' },
      { label: '10–15 minutes', value: 35, tip: 'A shower timer or low-flow showerhead can cut this significantly.' },
      { label: '15+ minutes', value: 50, tip: 'Long showers are one of the biggest indoor water uses — try the 5-minute challenge.' },
    ],
  },
  {
    id: 'laundry',
    question: 'How many loads of laundry does your household run per week?',
    options: [
      { label: '0–2 loads', value: 5 },
      { label: '3–5 loads', value: 10 },
      { label: '6–8 loads', value: 15, tip: 'Always run full loads — half-empty loads waste water per garment washed.' },
      { label: '9+ loads', value: 20, tip: 'Consider a high-efficiency washer; it can use 30% less water per load.' },
    ],
  },
  {
    id: 'dishes',
    question: 'How do you usually wash dishes?',
    options: [
      { label: 'Full dishwasher loads only', value: 4 },
      { label: 'Dishwasher, not always full', value: 8, tip: 'Wait for a full load before running the dishwasher.' },
      { label: 'Hand-wash with tap running', value: 14, tip: 'Hand-washing with the tap running uses far more water than an efficient dishwasher — try filling a basin instead.' },
    ],
  },
  {
    id: 'leaks',
    question: 'Any leaky faucets or running toilets at home?',
    options: [
      { label: 'No, everything is checked and fine', value: 0 },
      { label: 'A minor drip somewhere', value: 10, tip: 'A single dripping faucet can waste 3,000+ gallons a year — worth a $5 washer fix.' },
      { label: 'A noticeable leak or running toilet', value: 25, tip: 'A running toilet can waste 200 gallons a day — this is the highest-impact fix on this list.' },
      { label: "Haven't checked recently", value: 15, tip: 'Try the food-coloring toilet test — add a few drops to the tank and watch if it bleeds into the bowl without flushing.' },
    ],
  },
  {
    id: 'lawn',
    question: 'How often do you water a lawn or garden?',
    options: [
      { label: "Never / don't have one", value: 0 },
      { label: '1–2 times a week', value: 10 },
      { label: '3–4 times a week', value: 20, tip: 'Deep, infrequent watering (1-2x/week) grows stronger roots and uses less water than frequent shallow watering.' },
      { label: 'Daily', value: 35, tip: 'Switch to drip irrigation and water at dawn/dusk to cut evaporation losses drastically.' },
    ],
  },
  {
    id: 'diet',
    question: "What's closest to your typical diet?",
    options: [
      { label: 'Mostly plant-based', value: 20 },
      { label: 'Balanced / mixed', value: 40 },
      { label: 'Meat-heavy, most meals', value: 60, tip: 'Meat has a much higher "virtual water" footprint than plants — even one or two meat-free days a week adds up.' },
    ],
  },
];

const getCategory = (gallons) => {
  if (gallons < 60) return { label: 'Water Saver', color: '#2a9d8f' };
  if (gallons <= 100) return { label: 'Average User', color: theme.colors.primary };
  return { label: 'Heavy User', color: theme.colors.danger };
};

const Quiz = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);

  const question = QUESTIONS[step];
  const selectedValue = answers[question?.id];

  const handleSelect = (option) => {
    setAnswers(prev => ({ ...prev, [question.id]: option }));
  };

  const handleNext = () => {
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    else setDone(true);
  };

  const handleBack = () => setStep(Math.max(0, step - 1));

  const handleRestart = () => {
    setStep(0);
    setAnswers({});
    setDone(false);
    setSaved(false);
  };

  const totalGallons = Object.values(answers).reduce((sum, opt) => sum + (opt?.value || 0), 0);
  const category = getCategory(totalGallons);
  const improvementTips = Object.values(answers).filter(opt => opt?.tip).map(opt => opt.tip);

  const handleSaveToLeaderboard = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'leaderboard', user.uid), {
        name: user.displayName || (user.email ? user.email.split('@')[0] : 'Anonymous'),
        score: totalGallons,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSaved(true);
    } catch (err) {
      console.error('Failed to save leaderboard score:', err);
    }
  };

  return (
    <div style={styles.container}>
      <Navbar active="quiz" user={user} />
      <div style={styles.contentArea}>
        <div style={styles.contentContainer}>
          {!done ? (
            <div style={styles.card}>
              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressFill, width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
              </div>
              <p style={styles.stepLabel}>Question {step + 1} of {QUESTIONS.length}</p>
              <h2 style={styles.question}>{question.question}</h2>
              <div style={styles.options}>
                {question.options.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => handleSelect(opt)}
                    style={{
                      ...styles.option,
                      ...(selectedValue?.label === opt.label ? styles.optionSelected : {}),
                    }}
                    className="lift-hover"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div style={styles.navRow}>
                <button
                  onClick={handleBack}
                  disabled={step === 0}
                  style={{ ...styles.navButton, ...(step === 0 ? styles.navButtonDisabled : {}) }}
                >
                  <FiArrowLeft size={16} /> Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedValue}
                  style={{ ...styles.navButtonPrimary, ...(!selectedValue ? styles.navButtonDisabled : {}) }}
                  className="lift-hover"
                >
                  {step === QUESTIONS.length - 1 ? 'See my results' : 'Next'} <FiArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.card}>
              <div style={{ ...styles.resultBadge, backgroundColor: category.color }}>
                <FiDroplet size={32} color={theme.colors.white} />
              </div>
              <h2 style={{ ...styles.resultTitle, color: category.color }}>{category.label}</h2>
              <p style={styles.resultScore}>
                ~<strong>{totalGallons}</strong> gallons/day estimated footprint
              </p>
              <p style={styles.resultCompare}>
                US average is {NATIONAL_AVG_GAL_PER_DAY} gal/day — you're{' '}
                {totalGallons > NATIONAL_AVG_GAL_PER_DAY
                  ? `${Math.round(((totalGallons - NATIONAL_AVG_GAL_PER_DAY) / NATIONAL_AVG_GAL_PER_DAY) * 100)}% above it`
                  : `${Math.round(((NATIONAL_AVG_GAL_PER_DAY - totalGallons) / NATIONAL_AVG_GAL_PER_DAY) * 100)}% below it`}
              </p>

              {improvementTips.length > 0 && (
                <div style={styles.tipsBox}>
                  <h3 style={styles.tipsTitle}>Where you can save the most:</h3>
                  <ul style={styles.tipsList}>
                    {improvementTips.map((tip, i) => <li key={i} style={styles.tipItem}>{tip}</li>)}
                  </ul>
                </div>
              )}

              <div style={styles.resultActions}>
                <button onClick={handleRestart} style={styles.navButton} className="lift-hover">
                  <FiRefreshCw size={16} /> Retake quiz
                </button>
                <button
                  onClick={handleSaveToLeaderboard}
                  disabled={saved}
                  style={{ ...styles.navButtonPrimary, ...(saved ? styles.navButtonDisabled : {}) }}
                  className="lift-hover"
                >
                  <FiAward size={16} /> {saved ? 'Saved to leaderboard' : 'Add to leaderboard'}
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
  progressTrack: { height: '6px', backgroundColor: theme.colors.accentPale, borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' },
  progressFill: { height: '100%', background: theme.gradient.button, transition: 'width 0.3s ease' },
  stepLabel: { margin: '0 0 6px', fontSize: '0.85rem', color: theme.colors.textFaint, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.03em' },
  question: { fontFamily: theme.fontHeading, fontSize: '1.4rem', fontWeight: '700', color: theme.colors.textDark, margin: '0 0 24px' },
  options: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' },
  option: { textAlign: 'left', padding: '14px 18px', borderRadius: theme.radius.md, border: `2px solid ${theme.colors.border}`, backgroundColor: theme.colors.white, cursor: 'pointer', fontSize: '0.98rem', color: theme.colors.textDark },
  optionSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.accentPale, fontWeight: '600' },
  navRow: { display: 'flex', justifyContent: 'space-between' },
  navButton: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: theme.radius.md, border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.white, color: theme.colors.textMuted, cursor: 'pointer', fontWeight: '600' },
  navButtonPrimary: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: theme.radius.md, border: 'none', background: theme.gradient.button, color: theme.colors.white, cursor: 'pointer', fontWeight: '600' },
  navButtonDisabled: { opacity: 0.45, cursor: 'not-allowed' },
  resultBadge: { width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  resultTitle: { textAlign: 'center', fontFamily: theme.fontHeading, fontSize: '1.6rem', fontWeight: '700', margin: '0 0 8px' },
  resultScore: { textAlign: 'center', fontSize: '1.05rem', color: theme.colors.textDark, margin: '0 0 4px' },
  resultCompare: { textAlign: 'center', fontSize: '0.9rem', color: theme.colors.textFaint, margin: '0 0 24px' },
  tipsBox: { backgroundColor: theme.colors.bgTint, borderRadius: theme.radius.md, padding: '18px 20px', marginBottom: '24px' },
  tipsTitle: { margin: '0 0 10px', fontSize: '0.95rem', fontWeight: '700', color: theme.colors.primaryDark },
  tipsList: { margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  tipItem: { fontSize: '0.92rem', color: theme.colors.textDark, lineHeight: 1.5 },
  resultActions: { display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' },
};

export default Quiz;
