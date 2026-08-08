import { useState, useEffect, useRef } from 'react';
import { FiDroplet, FiChevronRight, FiX, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import theme from '../theme';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const ROTATE_INTERVAL_MS = 12000;

const CATEGORIES = [
  'Bathroom', 'Kitchen', 'Laundry', 'Outdoor & Gardening',
  'Leaks & Plumbing', 'Appliances & Technology', 'Community & Policy', 'Water Pollution',
];

const fetchTips = async (category) => {
  const url = category
    ? `${API_BASE_URL}/tips?category=${encodeURIComponent(category)}`
    : `${API_BASE_URL}/tips`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not load tips.');
  return data.tips || [];
};

const TipWidget = () => {
  const { user, initializing } = useAuth();
  const [tips, setTips] = useState([]);
  const [index, setIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryTips, setCategoryTips] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const loadedOnce = useRef(false);

  useEffect(() => {
    if (!user || loadedOnce.current) return;
    loadedOnce.current = true;
    fetchTips().then(t => { if (t.length) setTips(t); }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (tips.length < 2) return undefined;
    const rotate = setInterval(() => setIndex(i => (i + 1) % tips.length), ROTATE_INTERVAL_MS);
    return () => clearInterval(rotate);
  }, [tips]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const t = await fetchTips();
      if (t.length) { setTips(t); setIndex(0); }
    } catch {
      // silent — the widget just keeps showing the current tip
    } finally {
      setRefreshing(false);
    }
  };

  const openCategory = async (category) => {
    setSelectedCategory(category);
    setCategoryLoading(true);
    try {
      setCategoryTips(await fetchTips(category));
    } catch {
      setCategoryTips([]);
    } finally {
      setCategoryLoading(false);
    }
  };

  const closeModal = () => {
    setExpanded(false);
    setSelectedCategory(null);
  };

  if (initializing || !user) return null;

  return (
    <>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.headerLeft}>
            <FiDroplet size={15} style={styles.headerIcon} />
            <span style={styles.headerText}>Water Tip</span>
          </span>
          <button
            style={styles.refreshButton}
            onClick={handleRefresh}
            aria-label="New tips"
            disabled={refreshing}
          >
            <FiRefreshCw size={13} className={refreshing ? 'pulse' : undefined} />
          </button>
        </div>
        <p style={styles.tipText}>{tips[index] || 'Loading a fresh tip…'}</p>
        <button style={styles.moreButton} onClick={() => setExpanded(true)}>
          Browse by category <FiChevronRight size={13} />
        </button>
      </div>

      {expanded && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {selectedCategory ? selectedCategory : 'Water-Saving Tips'}
              </h3>
              <button style={styles.closeButton} onClick={closeModal} aria-label="Close">
                <FiX size={18} />
              </button>
            </div>

            {!selectedCategory ? (
              <div style={styles.categoryGrid}>
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    style={styles.categoryButton}
                    className="lift-hover"
                    onClick={() => openCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <button style={styles.backButton} onClick={() => setSelectedCategory(null)}>
                  <FiArrowLeft size={14} /> All categories
                </button>
                {categoryLoading ? (
                  <p style={styles.modalLoading}>Fetching fresh tips…</p>
                ) : categoryTips.length ? (
                  <ul style={styles.tipList}>
                    {categoryTips.map((t, i) => <li key={i} style={styles.tipItem}>{t}</li>)}
                  </ul>
                ) : (
                  <p style={styles.modalLoading}>Couldn't load tips for this category — try again.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  card: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '260px',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.glass,
    padding: '14px 16px',
    zIndex: 30,
    fontFamily: theme.fontFamily,
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '6px' },
  headerIcon: { color: theme.colors.primary },
  headerText: { fontSize: '0.78rem', fontWeight: '700', color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: '0.03em' },
  refreshButton: { background: 'transparent', border: 'none', color: theme.colors.textFaint, cursor: 'pointer', padding: '2px' },
  tipText: { fontSize: '0.88rem', color: theme.colors.textDark, lineHeight: 1.45, margin: '0 0 10px', minHeight: '2.6em' },
  moreButton: { display: 'flex', alignItems: 'center', gap: '2px', background: 'transparent', border: 'none', color: theme.colors.primary, fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', padding: 0 },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40 },
  modal: { backgroundColor: theme.colors.white, borderRadius: theme.radius.xl, padding: '24px', width: '90%', maxWidth: '480px', maxHeight: '75vh', overflowY: 'auto', boxShadow: theme.shadow.glass },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  modalTitle: { margin: 0, fontFamily: theme.fontHeading, fontSize: '1.2rem', fontWeight: '700', color: theme.colors.textDark },
  closeButton: { background: 'transparent', border: 'none', color: theme.colors.textFaint, cursor: 'pointer' },
  categoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' },
  categoryButton: { padding: '12px', borderRadius: theme.radius.md, border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.bgTint, cursor: 'pointer', fontSize: '0.88rem', fontWeight: '600', color: theme.colors.primaryDark, textAlign: 'left' },
  backButton: { display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: theme.colors.primary, fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', padding: 0, marginBottom: '14px' },
  modalLoading: { textAlign: 'center', color: theme.colors.textFaint, padding: '24px 0' },
  tipList: { margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  tipItem: { fontSize: '0.92rem', color: theme.colors.textDark, lineHeight: 1.5 },
};

export default TipWidget;
