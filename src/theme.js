// Shared design tokens used across AquaGuard's pages (Chat, Tips, Usage, Auth).
const theme = {
  colors: {
    primary: '#0077b6',
    primaryDark: '#023e8a',
    accent: '#00b4d8',
    accentLight: '#90e0ef',
    accentPale: '#caf0f8',
    danger: '#e63946',
    dangerDark: '#d62828',
    bgTint: '#f5f7fa',
    white: '#ffffff',
    textDark: '#1f2937',
    textMuted: '#4b5563',
    textFaint: '#666666',
    border: '#d1d5db',
  },
  gradient: {
    ocean: 'linear-gradient(135deg, #023e8a 0%, #0077b6 50%, #00b4d8 100%)',
    surface: 'linear-gradient(135deg, #f5f7fa 0%, #e0f4fa 100%)',
    button: 'linear-gradient(135deg, #0077b6 0%, #00b4d8 100%)',
  },
  shadow: {
    card: '0 4px 20px rgba(0, 0, 0, 0.08)',
    cardHover: '0 12px 28px rgba(2, 62, 138, 0.16)',
    panel: '0 8px 20px rgba(0, 0, 0, 0.1)',
    dropdown: '0 8px 24px rgba(0, 0, 0, 0.15)',
    nav: '0 2px 15px rgba(0, 0, 0, 0.1)',
    glass: '0 8px 32px rgba(2, 62, 138, 0.12)',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
  fontHeading: "'Poppins', 'Segoe UI', Roboto, sans-serif",
};

export default theme;
