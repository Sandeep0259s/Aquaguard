import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSend, FiUser, FiDroplet, FiPlus, FiTrash2, FiMessageSquare, FiAlertTriangle,
} from 'react-icons/fi';
import { db } from '../config/firebase';
import {
  collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, orderBy, query, serverTimestamp,
} from 'firebase/firestore';
import Navbar from './Navbar';
import theme from '../theme';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const GREETING = {
  sender: 'AI',
  text: "💧 Hi! I'm AquaGuard, your water conservation assistant. Ask me how to save water, or try a quick action below.",
};

const quickPrompts = [
  { text: "🚰 Report a leak", prompt: "How do I report a water leak?" },
  { text: "🍂 Seasonal advice", prompt: "What seasonal water saving tips do you have?" },
  { text: "🏠 Appliance recommendations", prompt: "What water efficient appliances do you recommend?" },
];

const Chat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [localMessages, setLocalMessages] = useState([GREETING]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const hasAutoSelected = useRef(false);
  const conversationsRef = useRef([]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return undefined;
    const q = query(collection(db, 'users', user.uid, 'conversations'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, snapshot => {
      setConversations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => {
      console.error('Failed to load conversation history (check Firestore rules):', err);
      setSaveError(true);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (!hasAutoSelected.current && conversations.length > 0) {
      setActiveId(conversations[0].id);
      hasAutoSelected.current = true;
    }
  }, [conversations]);

  // Local state is the source of truth for what's rendered — Firestore is
  // best-effort persistence layered on top, so the chat still works even if
  // a write fails (e.g. security rules not set up yet).
  useEffect(() => {
    if (!activeId) {
      setLocalMessages([GREETING]);
      return;
    }
    const convo = conversationsRef.current.find(c => c.id === activeId);
    setLocalMessages(convo?.messages || []);
  }, [activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, isLoading]);

  const handleNewChat = () => {
    hasAutoSelected.current = true;
    setActiveId(null);
  };

  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'conversations', id));
      if (id === activeId) setActiveId(null);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() || !user) return;

    const userMsg = { sender: 'You', text };
    const afterUser = [...localMessages, userMsg];

    setLocalMessages(afterUser);
    setInputMessage('');
    setIsLoading(true);

    let convoId = activeId;

    // Best-effort persistence — the chat itself never depends on this succeeding.
    const persist = async (msgs) => {
      try {
        if (!convoId) {
          const docRef = await addDoc(collection(db, 'users', user.uid, 'conversations'), {
            title: text.slice(0, 42),
            messages: msgs,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          convoId = docRef.id;
          hasAutoSelected.current = true;
          setActiveId(convoId);
        } else {
          await updateDoc(doc(db, 'users', user.uid, 'conversations', convoId), {
            messages: msgs,
            updatedAt: serverTimestamp(),
          });
        }
        setSaveError(false);
      } catch (err) {
        console.error('Failed to save conversation (check Firestore rules):', err);
        setSaveError(true);
      }
    };

    await persist(afterUser);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json();

      const aiText = response.ok && data.response
        ? data.response
        : `⚠️ ${data.error || 'Unexpected response from server.'}`;

      const afterAi = [...afterUser, { sender: 'AI', text: aiText }];
      setLocalMessages(afterAi);
      await persist(afterAi);
    } catch (error) {
      console.error('Chat error:', error);
      setLocalMessages([...afterUser, {
        sender: 'AI',
        text: "⚠️ Sorry, I'm having trouble connecting to the server. Please try again later.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  return (
    <div style={styles.container}>
      <Navbar active="chat" user={user} />

      <div style={styles.body}>
        <div style={styles.sidebar}>
          <button style={styles.newChatButton} className="lift-hover" onClick={handleNewChat}>
            <FiPlus size={18} /> New Chat
          </button>
          <div style={styles.convoList}>
            {conversations.length === 0 && (
              <p style={styles.convoEmpty}>Your conversations will appear here.</p>
            )}
            {conversations.map(c => (
              <div
                key={c.id}
                style={{ ...styles.convoItem, ...(c.id === activeId ? styles.convoItemActive : {}) }}
                onClick={() => setActiveId(c.id)}
              >
                <FiMessageSquare size={15} style={styles.convoIcon} />
                <span style={styles.convoTitle}>{c.title || 'New conversation'}</span>
                <button
                  style={styles.convoDelete}
                  onClick={(e) => handleDeleteConversation(c.id, e)}
                  aria-label="Delete conversation"
                >
                  <FiTrash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.chatArea}>
          <div style={styles.chatContainer}>
            <div style={styles.messagesContainer}>
              <div style={styles.messages}>
                {localMessages.map((msg, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.messageRow,
                      ...(msg.sender === 'You' ? styles.messageRowUser : {}),
                    }}
                  >
                    <div style={{ ...styles.avatar, ...(msg.sender === 'You' ? styles.avatarUser : styles.avatarAi) }}>
                      {msg.sender === 'You' ? <FiUser size={16} /> : <FiDroplet size={16} />}
                    </div>
                    <div
                      style={{
                        ...styles.message,
                        ...(msg.sender === 'You' ? styles.userMessage : styles.aiMessage)
                      }}
                    >
                      <div style={styles.messageText}>{msg.text}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div style={styles.messageRow}>
                    <div style={{ ...styles.avatar, ...styles.avatarAi }}>
                      <FiDroplet size={16} />
                    </div>
                    <div style={{ ...styles.message, ...styles.aiMessage, ...styles.typingBubble }}>
                      <span className="pulse" style={styles.typingDot} />
                      <span className="pulse" style={{ ...styles.typingDot, animationDelay: '0.2s' }} />
                      <span className="pulse" style={{ ...styles.typingDot, animationDelay: '0.4s' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {localMessages.length <= 1 && (
              <div style={styles.quickActions}>
                <h3 style={styles.quickActionsTitle}>Try asking about:</h3>
                <div style={styles.quickActionsGrid}>
                  {quickPrompts.map((qa, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(qa.prompt)}
                      style={styles.quickActionButton}
                      className="lift-hover"
                    >
                      {qa.text}
                    </button>
                  ))}
                  <button
                    onClick={() => navigate('/quiz')}
                    style={styles.quickActionButton}
                    className="lift-hover"
                  >
                    🧮 Take the water footprint quiz
                  </button>
                </div>
              </div>
            )}

            {saveError && (
              <div style={styles.saveErrorBanner}>
                <FiAlertTriangle size={15} style={styles.saveErrorIcon} />
                Chat is working, but your history isn't saving — check your Firestore security rules.
              </div>
            )}

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
                className="lift-hover"
              >
                <FiSend size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    overflow: 'hidden',
    fontFamily: theme.fontFamily,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.colors.bgTint,
  },
  body: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  sidebar: {
    width: '270px',
    flexShrink: 0,
    backgroundColor: theme.colors.white,
    borderRight: `1px solid ${theme.colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    gap: '12px',
  },
  newChatButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: theme.gradient.button,
    color: theme.colors.white,
    border: 'none',
    borderRadius: theme.radius.md,
    padding: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  convoList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  convoEmpty: {
    fontSize: '0.85rem',
    color: theme.colors.textFaint,
    textAlign: 'center',
    marginTop: '24px',
  },
  convoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 10px',
    borderRadius: theme.radius.sm,
    cursor: 'pointer',
    color: theme.colors.textMuted,
  },
  convoItemActive: {
    backgroundColor: theme.colors.accentPale,
    color: theme.colors.primaryDark,
  },
  convoIcon: {
    flexShrink: 0,
  },
  convoTitle: {
    flex: 1,
    fontSize: '0.88rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  convoDelete: {
    background: 'transparent',
    border: 'none',
    color: theme.colors.textFaint,
    cursor: 'pointer',
    padding: '2px',
    flexShrink: 0,
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    padding: '20px 24px',
    overflow: 'hidden',
  },
  chatContainer: {
    width: '100%',
    maxWidth: '860px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 4px 16px',
  },
  messages: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    minHeight: '100%',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    maxWidth: '78%',
    alignSelf: 'flex-start',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: theme.colors.white,
  },
  avatarAi: {
    background: theme.gradient.button,
  },
  avatarUser: {
    backgroundColor: theme.colors.primaryDark,
  },
  message: {
    padding: '12px 16px',
    borderRadius: '18px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
    lineHeight: 1.5,
    backgroundColor: theme.colors.white,
  },
  userMessage: {
    backgroundColor: theme.colors.accentPale,
    borderBottomRightRadius: '4px',
  },
  aiMessage: {
    borderBottomLeftRadius: '4px',
  },
  messageText: {
    whiteSpace: 'pre-wrap',
    fontSize: '0.98rem',
  },
  typingBubble: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '16px',
  },
  typingDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: theme.colors.primaryDark,
    display: 'inline-block',
  },
  quickActions: {
    padding: '0 4px 14px',
  },
  quickActionsTitle: {
    margin: '0 0 10px',
    fontWeight: '600',
    fontSize: '0.9rem',
    color: theme.colors.textMuted,
  },
  quickActionsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  quickActionButton: {
    background: theme.colors.white,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.primaryDark,
    padding: '10px 14px',
    borderRadius: theme.radius.md,
    fontWeight: '500',
    fontSize: '0.88rem',
    cursor: 'pointer',
  },
  saveErrorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    marginBottom: '8px',
    backgroundColor: '#fff3e0',
    color: '#9a5b00',
    borderRadius: theme.radius.sm,
    fontSize: '0.82rem',
  },
  saveErrorIcon: {
    flexShrink: 0,
  },
  inputContainer: {
    display: 'flex',
    gap: '8px',
    padding: '10px',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    boxShadow: theme.shadow.panel,
  },
  inputContainerActive: {
    backgroundColor: '#f2fbff',
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
    background: theme.gradient.button,
    border: 'none',
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    color: theme.colors.white,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonLoading: {
    backgroundColor: theme.colors.primaryDark,
    cursor: 'not-allowed',
  },
};

export default Chat;
