import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiDroplet, FiHome, FiClock, FiBarChart2,
  FiUser, FiChevronDown, FiLogOut
} from 'react-icons/fi';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import theme from '../theme';

const TABS = [
  { key: 'chat', label: 'Chat', path: '/chat', icon: FiHome },
  { key: 'tips', label: 'Tips', path: '/tips', icon: FiClock },
  { key: 'usage', label: 'Usage', path: '/usage', icon: FiBarChart2 },
];

const Navbar = ({ active, user }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setShowProfileDropdown(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div style={styles.navBar}>
      <div style={styles.logoContainer} onClick={() => navigate('/chat')}>
        <FiDroplet size={28} style={styles.logoIcon} />
        <h1 style={styles.logoText}>AquaGuard</h1>
      </div>

      <div style={styles.navTabs}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              style={{ ...styles.navTab, ...(isActive ? styles.activeTab : {}) }}
              onClick={() => navigate(tab.path)}
            >
              <Icon size={18} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div style={styles.profileContainer} ref={profileRef}>
        <button
          style={styles.profileButton}
          onClick={() => setShowProfileDropdown(prev => !prev)}
          aria-haspopup="true"
          aria-expanded={showProfileDropdown}
        >
          <FiUser size={20} />
          <span style={styles.profileName}>{user?.displayName || user?.email || 'User'}</span>
          <FiChevronDown
            size={16}
            style={{
              transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {showProfileDropdown && (
          <div style={styles.dropdownMenu} role="menu">
            <div style={styles.dropdownHeader}>
              <FiUser size={18} style={styles.dropdownIcon} />
              <span style={styles.dropdownName}>{user?.displayName || user?.email || 'User'}</span>
            </div>
            <button
              style={styles.dropdownSignOut}
              onClick={handleSignOut}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.colors.dangerDark}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = theme.colors.danger}
            >
              <FiLogOut size={16} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  navBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    height: '72px',
    backgroundColor: theme.colors.primary,
    boxShadow: theme.shadow.nav,
    position: 'relative',
    zIndex: 10,
  },
  logoContainer: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' },
  logoIcon: { color: theme.colors.white, flexShrink: 0 },
  logoText: { fontSize: '1.5rem', fontWeight: '600', color: theme.colors.white, margin: 0 },
  navTabs: { display: 'flex', gap: '8px', flex: 1, justifyContent: 'center', maxWidth: '500px' },
  navTab: {
    background: 'transparent',
    border: 'none',
    color: theme.colors.white,
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    borderRadius: theme.radius.sm,
    transition: 'background-color 0.2s ease',
  },
  activeTab: { backgroundColor: theme.colors.white, color: '#000', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
  profileContainer: { position: 'relative' },
  profileButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: theme.radius.sm,
    padding: '8px 16px',
    cursor: 'pointer',
    color: theme.colors.white,
    fontWeight: '500',
    fontSize: '0.95rem',
  },
  profileName: {
    fontWeight: '500',
    fontSize: '0.95rem',
    whiteSpace: 'nowrap',
    maxWidth: '130px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dropdownMenu: {
    position: 'absolute',
    right: 0,
    top: 'calc(100% + 8px)',
    width: '220px',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    boxShadow: theme.shadow.dropdown,
    color: '#333',
    padding: '12px',
    zIndex: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  dropdownHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  dropdownIcon: { color: theme.colors.primary },
  dropdownName: {
    fontWeight: '600',
    fontSize: '1rem',
    flexGrow: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dropdownSignOut: {
    backgroundColor: theme.colors.danger,
    color: theme.colors.white,
    border: 'none',
    borderRadius: theme.radius.sm,
    padding: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'background-color 0.2s ease',
  },
};

export default Navbar;
