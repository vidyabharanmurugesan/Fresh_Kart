import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
import { supportService } from '../../../services/supportService';
import { FiSend, FiMessageCircle, FiHelpCircle } from 'react-icons/fi';
import '../../../styles/dashboard.css';

const faqItems = [
  'How do I track my order?',
  'How can I cancel an order?',
  'What payment methods are accepted?',
  'How do I report an issue with my order?',
];

const SOCKET_SERVER_URL = 'http://localhost:5000';

export default function Help({ domain = 'food' }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Load chat history
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const chat = await supportService.getBuyerSupportChat(domain);
        if (chat && chat.chat_messages) {
          setMessages(chat.chat_messages);
        }
      } catch (err) {
        console.error("Failed to load support chat history", err);
      }
    };
    if (user?.id) {
      fetchChatHistory();
    }
  }, [domain, user?.id]);

  // Handle socket connection
  useEffect(() => {
    if (!user?.id) return;

    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    // Join support chat room
    newSocket.emit('join_support', {
      buyer_id: user.id,
      user_id: user.id,
      role: user.role
    });

    // Listen for new messages
    newSocket.on('receive_support_message', (message) => {
      setMessages((prev) => {
        // Prevent duplicate messages if already in state
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    return () => {
      newSocket.emit('leave_support', {
        buyer_id: user.id,
        user_id: user.id
      });
      newSocket.disconnect();
    };
  }, [user?.id, user?.role]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socket || !user) return;

    const messagePayload = {
      id: Math.random().toString(36).substr(2, 9),
      buyer_id: user.id,
      sender_id: user.id,
      sender_name: user.name,
      sender_role: user.role,
      text: input,
      timestamp: new Date().toISOString()
    };

    socket.emit('send_support_message', messagePayload);
    setInput('');
  };

  return (
    <div className="dashboard-page" id="buyer-support-help">
      <div className="page-header">
        <h1>Help & Support</h1>
        <p>Get assistance with your orders directly from Admin support</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', flexWrap: 'wrap' }}>
        {/* Chat Box */}
        <div className="chat-container" style={{ display: 'flex', flexDirection: 'column', height: '500px' }}>
          <div className="chat-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiMessageCircle size={20} color="#10b981" />
            <span>Live Admin Support Chat</span>
          </div>
          
          <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f3f4f6' }}>
            {messages.length === 0 && (
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.85rem', margin: 'auto' }}>
                Hello! Welcome to FreshKart support. Send a message to connect with the Admin side directly.
              </p>
            )}
            {messages.map((msg) => {
              const isMe = String(msg.sender_id) === String(user?.id);
              return (
                <div key={msg.id} style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  display: 'flex', flexDirection: 'column'
                }}>
                  {!isMe && <span style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '2px', marginLeft: '4px' }}>Admin Support</span>}
                  <div style={{
                    background: isMe ? '#10b981' : 'white',
                    color: isMe ? 'white' : '#1f2937',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    borderBottomRightRadius: isMe ? '2px' : '12px',
                    borderBottomLeftRadius: isMe ? '12px' : '2px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    wordBreak: 'break-word',
                    fontSize: '0.9rem'
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '4px', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area" style={{ display: 'flex', padding: '12px', background: 'white', borderTop: '1px solid #e5e7eb', gap: '8px' }}>
            <input
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message to the Admin support..."
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid #d1d5db',
                fontSize: '0.9rem', outline: 'none'
              }}
            />
            <button 
              className="chat-send-btn" 
              onClick={sendMessage}
              disabled={!input.trim()}
              style={{
                background: input.trim() ? '#10b981' : '#e5e7eb',
                color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s'
              }}
            >
              <FiSend size={16} />
            </button>
          </div>
        </div>

        {/* FAQ Panel */}
        <div className="content-card">
          <div className="content-card-header">
            <h2><FiHelpCircle size={18} /> FAQ</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {faqItems.map((q, i) => (
              <button 
                key={i} 
                style={{
                  textAlign: 'left', padding: '12px', background: '#f9fafb', borderRadius: '8px',
                  fontSize: '0.85rem', color: '#374151', border: '1px solid #f3f4f6', cursor: 'pointer',
                  transition: 'all 0.2s', fontWeight: 500,
                }}
                onClick={() => { setInput(q); }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
