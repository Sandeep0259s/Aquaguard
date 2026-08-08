import { useState } from 'react';
import { FiDroplet, FiUsers, FiInfo } from 'react-icons/fi';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import Navbar from './Navbar';
import theme from '../theme';
import { useAuth } from '../context/AuthContext';

const STRESS_COLORS = {
  Extreme: '#e63946',
  High: '#f4a261',
  Medium: '#0077b6',
  Low: '#2a9d8f',
};

// Illustrative, rounded figures for demo purposes — not precise live statistics.
const REGIONS = [
  { name: 'Qatar', stress: 'Extreme', perCapita: 26, population: 2.9, fact: 'Relies on desalination for over 99% of its drinking water.' },
  { name: 'Egypt', stress: 'Extreme', perCapita: 500, population: 112, fact: 'Depends on the Nile River for roughly 97% of its freshwater needs.' },
  { name: 'Saudi Arabia', stress: 'Extreme', perCapita: 89, population: 36, fact: 'One of the most water-scarce nations on Earth; heavy reliance on desalination.' },
  { name: 'India', stress: 'High', perCapita: 1100, population: 1420, fact: 'Over 600 million people face high-to-extreme water stress.' },
  { name: 'South Africa', stress: 'High', perCapita: 840, population: 60, fact: "Cape Town nearly reached 'Day Zero' — no municipal water — in 2018." },
  { name: 'Australia', stress: 'High', perCapita: 21000, population: 26, fact: 'The driest inhabited continent; frequent droughts drive strict water restrictions.' },
  { name: 'China', stress: 'Medium', perCapita: 1900, population: 1410, fact: 'Northern China faces severe scarcity despite abundant water in the south.' },
  { name: 'United States', stress: 'Medium', perCapita: 8800, population: 335, fact: 'The average American uses about 82 gallons of water at home per day.' },
  { name: 'Brazil', stress: 'Low', perCapita: 28000, population: 216, fact: 'Home to roughly 12% of the world’s freshwater resources via the Amazon basin.' },
  { name: 'Canada', stress: 'Low', perCapita: 80000, population: 39, fact: 'Holds about 20% of the world’s freshwater, though only 7% is renewable annually.' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [selected, setSelected] = useState(REGIONS[7]); // default: United States

  return (
    <div style={styles.container}>
      <Navbar active="dashboard" user={user} />
      <div style={styles.contentArea}>
        <div style={styles.contentContainer}>
          <h2 style={styles.pageTitle}>🌍 Global Water Scarcity Dashboard</h2>
          <p style={styles.subtitle}>
            Renewable freshwater available per person varies enormously by country.
            Tap a region to see details. Figures are rounded, illustrative estimates.
          </p>

          <div style={styles.legend}>
            {Object.entries(STRESS_COLORS).map(([label, color]) => (
              <div key={label} style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: color }} />
                {label} stress
              </div>
            ))}
          </div>

          <div style={styles.regionGrid}>
            {REGIONS.map(r => (
              <button
                key={r.name}
                onClick={() => setSelected(r)}
                style={{
                  ...styles.regionCard,
                  ...(selected.name === r.name ? styles.regionCardActive : {}),
                }}
                className="lift-hover"
              >
                <span style={{ ...styles.regionDot, backgroundColor: STRESS_COLORS[r.stress] }} />
                {r.name}
              </button>
            ))}
          </div>

          <div style={styles.detailCard}>
            <div style={styles.detailHeader}>
              <div>
                <h3 style={styles.detailName}>{selected.name}</h3>
                <span style={{ ...styles.detailBadge, backgroundColor: STRESS_COLORS[selected.stress] }}>
                  {selected.stress} water stress
                </span>
              </div>
            </div>
            <div style={styles.detailStats}>
              <div style={styles.detailStat}>
                <FiDroplet size={18} style={styles.detailIcon} />
                <div>
                  <div style={styles.detailStatValue}>{selected.perCapita.toLocaleString()} m³</div>
                  <div style={styles.detailStatLabel}>renewable water / person / year</div>
                </div>
              </div>
              <div style={styles.detailStat}>
                <FiUsers size={18} style={styles.detailIcon} />
                <div>
                  <div style={styles.detailStatValue}>{selected.population.toLocaleString()}M</div>
                  <div style={styles.detailStatLabel}>population</div>
                </div>
              </div>
            </div>
            <div style={styles.factBox}>
              <FiInfo size={16} style={styles.factIcon} />
              <span>{selected.fact}</span>
            </div>
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Renewable water per capita by region (log scale)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={REGIONS} margin={{ top: 8, right: 16, left: 8, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.accentPale} />
                <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                <YAxis scale="log" domain={[10, 100000]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value.toLocaleString()} m³`, 'Per capita / year']} />
                <Bar dataKey="perCapita" radius={[6, 6, 0, 0]}>
                  {REGIONS.map((r) => (
                    <Cell key={r.name} fill={STRESS_COLORS[r.stress]} opacity={r.name === selected.name ? 1 : 0.55} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
  subtitle: { margin: 0, color: theme.colors.textFaint, fontSize: '0.92rem', maxWidth: '640px' },
  legend: { display: 'flex', gap: '18px', flexWrap: 'wrap' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: theme.colors.textMuted },
  legendDot: { width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' },
  regionGrid: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  regionCard: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: theme.radius.md, border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.white, cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', color: theme.colors.textDark },
  regionCardActive: { borderColor: theme.colors.primary, boxShadow: `0 0 0 2px ${theme.colors.accentPale}` },
  regionDot: { width: '9px', height: '9px', borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
  detailCard: { backgroundColor: theme.colors.white, borderRadius: theme.radius.xl, padding: '24px', boxShadow: theme.shadow.card },
  detailHeader: { marginBottom: '18px' },
  detailName: { margin: '0 0 8px', fontFamily: theme.fontHeading, fontSize: '1.3rem', fontWeight: '700', color: theme.colors.textDark },
  detailBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '999px', color: theme.colors.white, fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.03em' },
  detailStats: { display: 'flex', gap: '32px', marginBottom: '18px', flexWrap: 'wrap' },
  detailStat: { display: 'flex', alignItems: 'center', gap: '10px' },
  detailIcon: { color: theme.colors.primary },
  detailStatValue: { fontSize: '1.3rem', fontWeight: '700', color: theme.colors.textDark },
  detailStatLabel: { fontSize: '0.8rem', color: theme.colors.textFaint },
  factBox: { display: 'flex', gap: '10px', alignItems: 'flex-start', backgroundColor: theme.colors.bgTint, borderRadius: theme.radius.md, padding: '14px 16px', fontSize: '0.9rem', color: theme.colors.textDark, lineHeight: 1.5 },
  factIcon: { color: theme.colors.primary, flexShrink: 0, marginTop: '2px' },
  chartCard: { backgroundColor: theme.colors.white, borderRadius: theme.radius.xl, padding: '24px', boxShadow: theme.shadow.card },
  chartTitle: { margin: '0 0 8px', fontSize: '1rem', fontWeight: '700', color: theme.colors.textDark },
};

export default Dashboard;
