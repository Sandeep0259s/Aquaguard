import { Navigate } from 'react-router-dom';
import { FiDroplet } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';

const RequireAuth = ({ children }) => {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div style={styles.loading}>
        <FiDroplet size={36} style={styles.icon} className="pulse" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return children;
};

const styles = {
  loading: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgTint,
  },
  icon: {
    color: theme.colors.primary,
  },
};

export default RequireAuth;
