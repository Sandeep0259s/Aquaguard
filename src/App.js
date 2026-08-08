import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Auth } from "./components/auth";
import Chat from './components/Chat';
import Tips from './components/Tips';
import Usage from './components/Usage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/tips" element={<Tips />} />
        <Route path="/usage" element={<Usage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App; 
