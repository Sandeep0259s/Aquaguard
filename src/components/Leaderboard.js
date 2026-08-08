import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDroplet } from 'react-icons/fi';
import { db } from '../config/firebase';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import Navbar from './Navbar';
import theme from '../theme';
import { useAuth } from '../context/AuthContext';

const MEDALS = ['🥇', '🥈', '🥉'];

const Leaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'leaderboard'), orderBy('score', 'asc'), limit(50));
    const unsubscribe = onSnapshot(q, snapshot => {
      setEntries(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  return (
    <div style={styles.container}>
      <Navbar active="leaderboard" user={user} />
      <div style={styles.contentArea}>
        <div style={styles.contentContainer}>
          <h2 style={styles.pageTitle}>🏆 Water Footprint Leaderboard</h2>
          <p style={styles.subtitle}>
            Ranked by estimated daily water footprint from the quiz — lowest wins.
          </p>

          {entries.length === 0 ? (
            <div style={styles.emptyCard}>
              <FiDroplet size={32} style={styles.emptyIcon} />
              <p style={styles.emptyText}>No scores yet — be the first on the board.</p>
              <button style={styles.ctaButton} className="lift-hover" onClick={() => navigate('/quiz')}>
                Take the footprint quiz
              </button>
            </div>
          ) : (
            <div style={styles.listCard}>
              {entries.map((entry, i) => (
                <div
                  key={entry.id}
                  style={{
                    ...styles.row,
                    ...(entry.id === user?.uid ? styles.rowSelf : {}),
                  }}
                >
                  <span style={styles.rank}>{MEDALS[i] || `#${i + 1}`}</span>
                  <span style={styles.name}>{entry.name || 'Anonymous'}</span>
                  <span style={styles.score}>{entry.score} gal/day</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: theme.fontFamily, backgroundColor: theme.colors.bgTint },
  contentArea: { flex: 1, padding: '28px 24px', overflowY: 'auto', display: 'flex', justifyContent: 'center' },
  contentContainer: { width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '18px' },
  pageTitle: { margin: 0, color: theme.colors.primaryDark, fontFamily: theme.fontHeading, fontSize: '1.6rem', fontWeight: '700' },
  subtitle: { margin: 0, color: theme.colors.textFaint, fontSize: '0.92rem' },
  listCard: { backgroundColor: theme.colors.white, borderRadius: theme.radius.xl, boxShadow: theme.shadow.card, overflow: 'hidden' },
  row: { display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 22px', borderBottom: `1px solid ${theme.colors.border}` },
  rowSelf: { backgroundColor: theme.colors.accentPale },
  rank: { width: '36px', fontSize: '1.1rem', fontWeight: '700', color: theme.colors.textMuted, flexShrink: 0 },
  name: { flex: 1, fontWeight: '600', color: theme.colors.textDark },
  score: { fontWeight: '700', color: theme.colors.primaryDark },
  emptyCard: { backgroundColor: theme.colors.white, borderRadius: theme.radius.xl, boxShadow: theme.shadow.card, padding: '48px 24px', textAlign: 'center' },
  emptyIcon: { color: theme.colors.primary, marginBottom: '12px' },
  emptyText: { color: theme.colors.textFaint, marginBottom: '18px' },
  ctaButton: { background: theme.gradient.button, color: theme.colors.white, border: 'none', padding: '12px 24px', borderRadius: theme.radius.md, fontWeight: '600', cursor: 'pointer' },
};

export default Leaderboard;
