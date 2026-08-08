import { useState, useMemo } from 'react';
import { FiDroplet, FiDollarSign } from 'react-icons/fi';
import Navbar from './Navbar';
import theme from '../theme';
import { useAuth } from '../context/AuthContext';

const GAL_PER_DRIP_PER_MINUTE = 0.288; // ~0.0002 gal/drip * 1440 min/day
const RUNNING_TOILET_GAL_PER_DAY = 200;
const POOL_GALLONS = 20000;
const SHOWER_GALLONS = 17;

const Calculator = () => {
  const { user } = useAuth();
  const [leakType, setLeakType] = useState('faucet');
  const [dripsPerMinute, setDripsPerMinute] = useState(30);
  const [fixtureCount, setFixtureCount] = useState(1);
  const [costPerThousand, setCostPerThousand] = useState(6);

  const results = useMemo(() => {
    const gallonsPerDay = leakType === 'faucet'
      ? dripsPerMinute * GAL_PER_DRIP_PER_MINUTE * fixtureCount
      : RUNNING_TOILET_GAL_PER_DAY * fixtureCount;

    const gallonsPerYear = gallonsPerDay * 365;
    const costPerYear = (gallonsPerYear / 1000) * costPerThousand;
    const pools = gallonsPerYear / POOL_GALLONS;
    const showers = gallonsPerYear / SHOWER_GALLONS;

    return { gallonsPerDay, gallonsPerYear, costPerYear, pools, showers };
  }, [leakType, dripsPerMinute, fixtureCount, costPerThousand]);

  return (
    <div style={styles.container}>
      <Navbar active="calculator" user={user} />
      <div style={styles.contentArea}>
        <div style={styles.contentContainer}>
          <h2 style={styles.pageTitle}>💸 Leak & Waste Cost Calculator</h2>
          <p style={styles.subtitle}>
            See exactly what an "small" leak is costing you — in water and in money.
          </p>

          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.typeToggle}>
                <button
                  onClick={() => setLeakType('faucet')}
                  style={{ ...styles.typeButton, ...(leakType === 'faucet' ? styles.typeButtonActive : {}) }}
                >
                  Dripping faucet
                </button>
                <button
                  onClick={() => setLeakType('toilet')}
                  style={{ ...styles.typeButton, ...(leakType === 'toilet' ? styles.typeButtonActive : {}) }}
                >
                  Running toilet
                </button>
              </div>

              {leakType === 'faucet' ? (
                <div style={styles.field}>
                  <label style={styles.label}>
                    Drips per minute: <strong>{dripsPerMinute}</strong>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="120"
                    value={dripsPerMinute}
                    onChange={e => setDripsPerMinute(Number(e.target.value))}
                    style={styles.slider}
                  />
                  <div style={styles.sliderHint}>
                    <span>Slow drip</span>
                    <span>Steady trickle</span>
                  </div>
                </div>
              ) : (
                <p style={styles.presetNote}>
                  Assumes ~{RUNNING_TOILET_GAL_PER_DAY} gallons/day per running toilet — a typical estimate for a
                  toilet that silently leaks from tank to bowl.
                </p>
              )}

              <div style={styles.field}>
                <label style={styles.label}>Number of {leakType === 'faucet' ? 'leaking faucets' : 'running toilets'}</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={fixtureCount}
                  onChange={e => setFixtureCount(Math.max(1, Number(e.target.value)))}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Water + sewer cost ($ per 1,000 gallons)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={costPerThousand}
                  onChange={e => setCostPerThousand(Math.max(0, Number(e.target.value)))}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.resultsCard}>
              <div style={styles.bigStat}>
                <FiDollarSign size={26} style={styles.bigStatIcon} />
                <div>
                  <div style={styles.bigStatValue}>${results.costPerYear.toFixed(0)}</div>
                  <div style={styles.bigStatLabel}>wasted per year</div>
                </div>
              </div>
              <div style={styles.statsRow}>
                <div style={styles.stat}>
                  <FiDroplet size={18} style={styles.statIcon} />
                  <div>
                    <div style={styles.statValue}>{results.gallonsPerDay.toFixed(1)} gal</div>
                    <div style={styles.statLabel}>per day</div>
                  </div>
                </div>
                <div style={styles.stat}>
                  <FiDroplet size={18} style={styles.statIcon} />
                  <div>
                    <div style={styles.statValue}>{Math.round(results.gallonsPerYear).toLocaleString()} gal</div>
                    <div style={styles.statLabel}>per year</div>
                  </div>
                </div>
              </div>
              <div style={styles.compareBox}>
                <p style={styles.compareLine}>
                  That's enough water to fill <strong>{results.pools.toFixed(2)}</strong> swimming pools —
                  or take <strong>{Math.round(results.showers).toLocaleString()}</strong> five-minute showers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: theme.fontFamily, backgroundColor: theme.colors.bgTint },
  contentArea: { flex: 1, padding: '28px 24px', overflowY: 'auto', display: 'flex', justifyContent: 'center' },
  contentContainer: { width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '18px' },
  pageTitle: { margin: 0, color: theme.colors.primaryDark, fontFamily: theme.fontHeading, fontSize: '1.6rem', fontWeight: '700' },
  subtitle: { margin: 0, color: theme.colors.textFaint, fontSize: '0.92rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' },
  card: { backgroundColor: theme.colors.white, borderRadius: theme.radius.xl, padding: '24px', boxShadow: theme.shadow.card, display: 'flex', flexDirection: 'column', gap: '18px' },
  typeToggle: { display: 'flex', gap: '8px', backgroundColor: theme.colors.bgTint, padding: '4px', borderRadius: theme.radius.md },
  typeButton: { flex: 1, padding: '10px', borderRadius: theme.radius.sm, border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem', color: theme.colors.textMuted },
  typeButtonActive: { backgroundColor: theme.colors.white, color: theme.colors.primaryDark, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.88rem', fontWeight: '600', color: theme.colors.textMuted },
  slider: { width: '100%', accentColor: theme.colors.primary },
  sliderHint: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: theme.colors.textFaint },
  presetNote: { fontSize: '0.88rem', color: theme.colors.textFaint, backgroundColor: theme.colors.bgTint, padding: '12px 14px', borderRadius: theme.radius.sm, margin: 0, lineHeight: 1.5 },
  input: { padding: '10px 12px', borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.border}`, fontSize: '0.95rem' },
  resultsCard: { backgroundColor: theme.colors.white, borderRadius: theme.radius.xl, padding: '24px', boxShadow: theme.shadow.card, display: 'flex', flexDirection: 'column', gap: '20px' },
  bigStat: { display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '16px', borderBottom: `1px solid ${theme.colors.border}` },
  bigStatIcon: { color: theme.colors.danger },
  bigStatValue: { fontSize: '2.2rem', fontWeight: '800', color: theme.colors.textDark, lineHeight: 1 },
  bigStatLabel: { fontSize: '0.85rem', color: theme.colors.textFaint },
  statsRow: { display: 'flex', gap: '24px', flexWrap: 'wrap' },
  stat: { display: 'flex', alignItems: 'center', gap: '10px' },
  statIcon: { color: theme.colors.primary },
  statValue: { fontSize: '1.1rem', fontWeight: '700', color: theme.colors.textDark },
  statLabel: { fontSize: '0.78rem', color: theme.colors.textFaint },
  compareBox: { backgroundColor: theme.colors.accentPale, borderRadius: theme.radius.md, padding: '14px 16px' },
  compareLine: { margin: 0, fontSize: '0.92rem', color: theme.colors.primaryDark, lineHeight: 1.5 },
};

export default Calculator;
