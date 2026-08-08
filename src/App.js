import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Auth } from "./components/auth";
import Chat from './components/Chat';
import Quiz from './components/Quiz';
import Dashboard from './components/Dashboard';
import Calculator from './components/Calculator';
import Leaderboard from './components/Leaderboard';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
          <Route path="/quiz" element={<RequireAuth><Quiz /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/calculator" element={<RequireAuth><Calculator /></RequireAuth>} />
          <Route path="/leaderboard" element={<RequireAuth><Leaderboard /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 
