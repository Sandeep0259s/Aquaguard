import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSend, FiTrash2 } from 'react-icons/fi';
import waterAnimation from './water-animation.mp4';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from './Navbar';
import theme from '../theme';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'AI',
      text: "💧 Hi! I'm AquaGuard, your water conservation assistant. Ask me how to save water or get personalized tips!"
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const quickActions = [
    { text: "💧 Water saving tips", action: () => navigate('/tips') },
    { text: "📊 Calculate my usage", action: () => navigate('/usage') },
    { text: "🚰 Report a leak", action: () => handleSendMessage("How do I report a water leak?") },
    { text: "🍂 Seasonal advice", action: () => handleSendMessage("What seasonal water saving tips do you have?") },
    { text: "🏠 Appliance recommendations", action: () => handleSendMessage("What water efficient appliances do you recommend?") }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    setMessages(prev => [...prev, { sender: 'You', text: message }]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      if (response.ok && data.response) {
        setMessages(prev => [...prev, { sender: 'AI', text: data.response }]);
      } else if (data.error) {
        setMessages(prev => [...prev, { sender: 'AI', text: `⚠️ ${data.error}` }]);
      } else {
        setMessages(prev => [...prev, { sender: 'AI', text: "⚠️ Unexpected response from server." }]);
      }
    } catch (error) {
      console.error('API error:', error);
      setMessages(prev => [...prev, {
        sender: 'AI',
        text: "⚠️ Sorry, I'm having trouble connecting to the server. Please try again later."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: 'AI',
        text: "💧 Hi! I'm AquaGuard, your water conservation assistant. Ask me how to save water or get personalized tips!"
      }
    ]);
  };

  return (
    <div style={styles.container}>
      <div style={styles.waterAnimation}>
        <video autoPlay loop muted style={styles.video}>
          <source src={waterAnimation} type="video/mp4" />
        </video>
      </div>

      <Navbar active="chat" user={user} />

      {/* Chat UI */}
      <div style={styles.chatArea}>
        <div style={styles.chatContainer}>
          <div style={styles.messagesContainer}>
            <div style={styles.messages}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.message,
                    ...(msg.sender === 'You' ? styles.userMessage : styles.aiMessage)
                  }}
                >
                  <div style={styles.messageSender}>{msg.sender}:</div>
                  <div style={styles.messageText}>{msg.text}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div style={styles.quickActions}>
            <div style={styles.quickActionsHeader}>
              <h3 style={styles.quickActionsTitle}>💧 Quick actions:</h3>
              <button style={styles.clearButton} onClick={handleClearChat}>
                <FiTrash2 size={16} /> Clear Chat
              </button>
            </div>
            <div style={styles.quickActionsGrid}>
              {quickActions.map((qa, index) => (
                <button key={index} onClick={qa.action} style={styles.quickActionButton}>
                  {qa.text}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ ...styles.inputContainer, ...(isLoading ? styles.inputContainerActive : {}) }}>
            <input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything about saving water..."
              style={styles.input}
              disabled={isLoading}
            />
            <button
              type="submit"
              style={{ ...styles.sendButton, ...(isLoading ? styles.sendButtonLoading : {}) }}
              disabled={isLoading}
              aria-label="Send message"
            >
              <FiSend size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: theme.fontFamily,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.colors.bgTint,
  },
  waterAnimation: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    opacity: 0.7,
    filter: 'blur(1px)',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    padding: '16px 24px',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  chatContainer: {
    width: '100%',
    maxWidth: '960px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: theme.radius.md,
    boxShadow: theme.shadow.panel,
    overflow: 'hidden',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    position: 'relative',
  },
  messages: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minHeight: '100%',
  },
  message: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '18px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.09)',
    lineHeight: 1.4,
  },
  userMessage: {
    backgroundColor: theme.colors.accentPale,
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
  },
  aiMessage: {
    backgroundColor: theme.colors.accentLight,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '4px',
  },
  messageSender: {
    fontWeight: '700',
    marginBottom: '6px',
    fontSize: '0.9rem',
    color: theme.colors.primaryDark,
  },
  messageText: {
    whiteSpace: 'pre-wrap',
    fontSize: '1rem',
  },
  quickActions: {
    backgroundColor: theme.colors.accentPale,
    padding: '14px',
    borderRadius: theme.radius.md,
    margin: '8px 16px 0',
  },
  quickActionsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  quickActionsTitle: {
    margin: 0,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  clearButton: {
    backgroundColor: theme.colors.danger,
    color: theme.colors.white,
    border: 'none',
    padding: '6px 12px',
    borderRadius: theme.radius.sm,
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  quickActionsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  quickActionButton: {
    flex: '1 1 150px',
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
    border: 'none',
    padding: '10px',
    borderRadius: theme.radius.md,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  inputContainer: {
    margin: '16px',
    display: 'flex',
    gap: '8px',
    padding: '12px',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    boxShadow: theme.shadow.panel,
  },
  inputContainerActive: {
    backgroundColor: '#cce7ff',
  },
  input: {
    flex: 1,
    padding: '14px 18px',
    borderRadius: '30px',
    border: `1px solid ${theme.colors.border}`,
    fontSize: '1rem',
    outline: 'none',
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    border: 'none',
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    color: theme.colors.white,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
  },
  sendButtonLoading: {
    backgroundColor: theme.colors.primaryDark,
    cursor: 'not-allowed',
  }
};

export default Chat;