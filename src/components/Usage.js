import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2, FiDroplet, FiTrendingUp, FiTarget } from 'react-icons/fi';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import waterAnimation from './water-animation.mp4';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp,
} from 'firebase/firestore';
import Navbar from './Navbar';
import theme from '../theme';

const NATIONAL_AVG_GAL_PER_DAY = 82;

const todayISO = () => new Date().toISOString().slice(0, 10);

const Usage = () => {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState(todayISO());
  const [gallons, setGallons] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      if (!currentUser) navigate('/');
      else setUser(currentUser);
    });
    return unsubscribe;
  }, [navigate]);

  useEffect(() => {
    if (!user) return undefined;
    const usageQuery = query(collection(db, 'users', user.uid, 'usage'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(usageQuery, snapshot => {
      setEntries(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => {
      console.error('Failed to load usage entries:', err);
      setError('Could not load your usage history.');
    });
    return unsubscribe;
  }, [user]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    setError('');
    const gallonsNum = Number(gallons);
    if (!date || !gallonsNum || gallonsNum <= 0) {
      setError('Enter a valid date and a positive number of gallons.');
      return;
    }
    try {
      await addDoc(collection(db, 'users', user.uid, 'usage'), {
        date,
        gallons: gallonsNum,
        createdAt: serverTimestamp(),
      });
      setGallons('');
    } catch (err) {
      console.error('Failed to save usage entry:', err);
      setError('Could not save that entry. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'usage', id));
    } catch (err) {
      console.error('Failed to delete usage entry:', err);
    }
  };

  const totalGallons = entries.reduce((sum, e) => sum + e.gallons, 0);
  const avgGallons = entries.length ? Math.round(totalGallons / entries.length) : 0;
  const vsAverage = avgGallons ? Math.round(((avgGallons - NATIONAL_AVG_GAL_PER_DAY) / NATIONAL_AVG_GAL_PER_DAY) * 100) : 0;

  const chartData = entries.slice(-30).map(e => ({ date: e.date, gallons: e.gallons }));

  return (
    <div style={styles.container}>
      <div style={styles.waterAnimation}>
        <video autoPlay loop muted style={styles.video}>
          <source src={waterAnimation} type="video/mp4" />
        </video>
      </div>

      <Navbar active="usage" user={user} />

      <div style={styles.contentArea}>
        <div style={styles.contentContainer}>
          <h2 style={styles.pageTitle}>💧 Your Water Usage</h2>

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <FiDroplet size={22} style={styles.statIcon} />
              <div style={styles.statValue}>{totalGallons.toLocaleString()}</div>
              <div style={styles.statLabel}>Total gallons logged</div>
            </div>
            <div style={styles.statCard}>
              <FiTrendingUp size={22} style={styles.statIcon} />
              <div style={styles.statValue}>{avgGallons.toLocaleString()}</div>
              <div style={styles.statLabel}>Average gal/entry</div>
            </div>
            <div style={styles.statCard}>
              <FiTarget size={22} style={styles.statIcon} />
              <div style={styles.statValue}>
                {entries.length ? `${vsAverage > 0 ? '+' : ''}${vsAverage}%` : '—'}
              </div>
              <div style={styles.statLabel}>vs. US average ({NATIONAL_AVG_GAL_PER_DAY} gal/day)</div>
            </div>
          </div>

          <form onSubmit={handleAddEntry} style={styles.form}>
            <div style={styles.formField}>
              <label style={styles.label}>Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={styles.input}
                max={todayISO()}
              />
            </div>
            <div style={styles.formField}>
              <label style={styles.label}>Gallons used</label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 75"
                value={gallons}
                onChange={e => setGallons(e.target.value)}
                style={styles.input}
              />
            </div>
            <button type="submit" style={styles.addButton}>
              <FiPlus size={18} /> Log entry
            </button>
          </form>
          {error && <div style={styles.errorMessage}>{error}</div>}

          <div style={styles.chartCard}>
            {chartData.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.accentPale} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="gallons" stroke={theme.colors.primary} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={styles.emptyState}>Log your first entry above to see your usage trend here.</p>
            )}
          </div>

          {entries.length > 0 && (
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Gallons</th>
                    <th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {[...entries].reverse().map(entry => (
                    <tr key={entry.id}>
                      <td style={styles.td}>{entry.date}</td>
                      <td style={styles.td}>{entry.gallons}</td>
                      <td style={styles.tdAction}>
                        <button
                          style={styles.deleteButton}
                          onClick={() => handleDelete(entry.id)}
                          aria-label="Delete entry"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: theme.fontFamily, backgroundColor: theme.colors.bgTint },
  waterAnimation: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.7, filter: 'blur(1px)' },
  video: { width: '100%', height: '100%', objectFit: 'cover' },
  contentArea: { flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', justifyContent: 'center', zIndex: 1 },
  contentContainer: { width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '20px' },
  pageTitle: { margin: 0, color: theme.colors.primaryDark, fontSize: '1.6rem', fontWeight: '700' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  statCard: { backgroundColor: theme.colors.white, borderRadius: theme.radius.lg, padding: '20px', boxShadow: theme.shadow.card, border: `2px solid ${theme.colors.accent}`, textAlign: 'center' },
  statIcon: { color: theme.colors.primary, marginBottom: '8px' },
  statValue: { fontSize: '1.8rem', fontWeight: '700', color: theme.colors.textDark },
  statLabel: { fontSize: '0.85rem', color: theme.colors.textFaint, marginTop: '4px' },
  form: { display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', backgroundColor: theme.colors.white, borderRadius: theme.radius.lg, padding: '20px', boxShadow: theme.shadow.card },
  formField: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.85rem', fontWeight: '500', color: theme.colors.textMuted },
  input: { padding: '10px 12px', borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.border}`, fontSize: '0.95rem', outline: 'none' },
  addButton: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: theme.colors.primary, color: theme.colors.white, border: 'none', borderRadius: theme.radius.sm, padding: '11px 18px', fontWeight: '600', cursor: 'pointer' },
  errorMessage: { padding: '10px 14px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: theme.radius.sm, fontSize: '0.875rem' },
  chartCard: { backgroundColor: theme.colors.white, borderRadius: theme.radius.lg, padding: '20px', boxShadow: theme.shadow.card },
  emptyState: { textAlign: 'center', color: theme.colors.textFaint, padding: '40px 0', margin: 0 },
  tableCard: { backgroundColor: theme.colors.white, borderRadius: theme.radius.lg, padding: '8px 20px', boxShadow: theme.shadow.card, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 8px', fontSize: '0.85rem', color: theme.colors.textFaint, borderBottom: `1px solid ${theme.colors.border}` },
  td: { padding: '10px 8px', fontSize: '0.95rem', color: theme.colors.textDark, borderBottom: '1px solid #eee' },
  tdAction: { padding: '10px 8px', borderBottom: '1px solid #eee', textAlign: 'right' },
  deleteButton: { background: 'transparent', border: 'none', color: theme.colors.danger, cursor: 'pointer', padding: '4px' },
};

export default Usage;
