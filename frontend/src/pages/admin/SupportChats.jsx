import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { supportService } from '../../services/supportService';
import { FiSend, FiMessageSquare, FiUser, FiSearch, FiCircle, FiInfo } from 'react-icons/fi';
import '../../styles/dashboard.css';

const SOCKET_SERVER_URL = 'http://localhost:5000';

export default function SupportChats({ domain = 'food' }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch all support chats
  const fetchChats = async () => {
    try {
      setLoading(true);
      const data = await supportService.getAdminSupportChats();
      // Filter support chats by domain
      const filtered = (data || []).filter(c => (c.domain || 'food').toLowerCase() === domain.toLowerCase());
      setChats(filtered);
      
      // If we have chats, default to the first one
      if (filtered.length > 0) {
        setActiveChat(filtered[0]);
      }
    } catch (err) {
      console.error("Failed to fetch support chats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [domain]);

  // Handle Socket.io lifecycle
  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL);
    socketRef.current = socket;

    // Join all support rooms for buyers so admin gets notification of new messages
    // Wait, let's join active rooms or listen globally.
    // In our sockets.py, emit('receive_support_message') is sent to the room support_buyer_id.
    // So the admin needs to join the support room of the selected buyer, or join all rooms.
    // When activeChat changes, we join that specific room!
    if (activeChat?.buyer_id) {
      socket.emit('join_support', {
        buyer_id: activeChat.buyer_id,
        user_id: user.id,
        role: user.role
      });
      console.log(`[Admin Support] Joined support room support_${activeChat.buyer_id}`);
    }

    // Listen for new support messages
    socket.on('receive_support_message', (message) => {
      console.log("[Admin Support] Received support message:", message);
      
      // Update chats list in real-time
      setChats(prevChats => {
        return prevChats.map(c => {
          if (String(c.buyer_id) === String(message.buyer_id)) {
            // Append message to history
            const exists = c.chat_messages.some(m => m.id === message.id);
            const messages = exists ? c.chat_messages : [...c.chat_messages, message];
            return {
              ...c,
              chat_messages: messages,
              updated_at: message.timestamp
            };
          }
          return c;
        });
      });

      // Update currently active chat if it matches
      setActiveChat(prevActive => {
        if (prevActive && String(prevActive.buyer_id) === String(message.buyer_id)) {
          const exists = prevActive.chat_messages.some(m => m.id === message.id);
          const messages = exists ? prevActive.chat_messages : [...prevActive.chat_messages, message];
          return {
            ...prevActive,
            chat_messages: messages,
            updated_at: message.timestamp
          };
        }
        return prevActive;
      });
    });

    return () => {
      if (activeChat?.buyer_id) {
        socket.emit('leave_support', {
          buyer_id: activeChat.buyer_id,
          user_id: user.id
        });
      }
      socket.disconnect();
    };
  }, [activeChat?.buyer_id, user.id, user.role]);

  // Scroll to bottom of chat window
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.chat_messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat || !socketRef.current) return;

    const messagePayload = {
      id: Math.random().toString(36).substr(2, 9),
      buyer_id: activeChat.buyer_id,
      sender_id: user.id,
      sender_name: user.name,
      sender_role: user.role, // 'admin'
      text: inputText,
      timestamp: new Date().toISOString()
    };

    socketRef.current.emit('send_support_message', messagePayload);
    setInputText('');
  };

  const handleSelectChat = (chat) => {
    // Leave previous room if any
    if (activeChat && activeChat.buyer_id !== chat.buyer_id && socketRef.current) {
      socketRef.current.emit('leave_support', {
        buyer_id: activeChat.buyer_id,
        user_id: user.id
      });
    }
    setActiveChat(chat);
  };

  const filteredChats = chats.filter(c => 
    c.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.buyer_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-page" id="admin-support-dashboard">
      <div className="page-header">
        <h1>Customer Support Chat </h1>
        <p>Manage all incoming buyer queries and support tickets</p>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          Loading support tickets...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', height: 'calc(100vh - 220px)', minHeight: '500px' }}>
          
          {/* Left Panel: Tickets List */}
          <div className="content-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input 
                  type="text"
                  placeholder="Search buyer or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px 10px 38px', background: '#f3f4f6',
                    borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.85rem', color: '#111827'
                  }}
                />
              </div>
            </div>

            {/* Scrollable list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredChats.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                  No active support requests.
                </div>
              ) : (
                filteredChats.map((c) => {
                  const isActive = activeChat?.buyer_id === c.buyer_id;
                  const lastMsg = c.chat_messages && c.chat_messages.length > 0 
                    ? c.chat_messages[c.chat_messages.length - 1] 
                    : null;

                  return (
                    <div 
                      key={c.buyer_id}
                      onClick={() => handleSelectChat(c)}
                      style={{
                        padding: '16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
                        background: isActive ? '#f0fdf4' : 'transparent',
                        borderLeft: isActive ? '4px solid #10b981' : '4px solid transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#111827', fontWeight: 600 }}>{c.buyer_name}</h4>
                        {c.status === 'open' && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
                            <FiCircle size={6} fill="#10b981" /> Active
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '0 0 6px 0', fontSize: '0.75rem', color: '#6b7280' }}>{c.buyer_email}</p>
                      
                      {lastMsg ? (
                        <p style={{ 
                          margin: 0, fontSize: '0.8rem', color: '#4b5563',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          fontWeight: lastMsg.sender_role !== 'admin' ? 600 : 'normal'
                        }}>
                          {lastMsg.sender_role === 'admin' ? 'You: ' : ''}{lastMsg.text}
                        </p>
                      ) : (
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>No messages yet</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Chat Room */}
          <div className="chat-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {activeChat ? (
              <>
                {/* Chat Room Header */}
                <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 700 }}>
                      {activeChat.buyer_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#111827' }}>Support Ticket: {activeChat.buyer_name}</h3>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Phone: {activeChat.buyer_phone}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#6b7280', background: '#f3f4f6', padding: '6px 12px', borderRadius: '20px' }}>
                    <FiInfo size={14} />
                    <span>Domain: {(activeChat.domain || 'food').toUpperCase()}</span>
                  </div>
                </div>

                {/* Chat Messages scroll area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f3f4f6' }}>
                  {activeChat.chat_messages?.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.85rem', margin: 'auto' }}>
                      No support history. Type a message to welcome the user!
                    </p>
                  ) : (
                    activeChat.chat_messages?.map((msg) => {
                      const isAdmin = msg.sender_role === 'admin';
                      return (
                        <div key={msg.id} style={{
                          alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                          maxWidth: '70%',
                          display: 'flex', flexDirection: 'column'
                        }}>
                          {!isAdmin && (
                            <span style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '2px', marginLeft: '4px' }}>
                              {msg.sender_name}
                            </span>
                          )}
                          <div style={{
                            background: isAdmin ? '#10b981' : 'white',
                            color: isAdmin ? 'white' : '#1f2937',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            borderBottomRightRadius: isAdmin ? '2px' : '12px',
                            borderBottomLeftRadius: isAdmin ? '12px' : '2px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            wordBreak: 'break-word',
                            fontSize: '0.88rem',
                            lineHeight: '1.4'
                          }}>
                            {msg.text}
                          </div>
                          <span style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '4px', alignSelf: isAdmin ? 'flex-end' : 'flex-start' }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input form */}
                <form onSubmit={handleSend} style={{ display: 'flex', padding: '16px', background: 'white', borderTop: '1px solid #e5e7eb', gap: '10px' }}>
                  <input 
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Reply to ${activeChat.buyer_name}...`}
                    style={{
                      flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #d1d5db',
                      fontSize: '0.9rem', outline: 'none'
                    }}
                  />
                  <button 
                    type="submit"
                    disabled={!inputText.trim()}
                    style={{
                      background: inputText.trim() ? '#10b981' : '#e5e7eb',
                      color: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                      transition: 'background 0.2s'
                    }}
                  >
                    <FiSend size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', background: '#f9fafb' }}>
                <FiMessageSquare size={48} style={{ marginBottom: '16px', color: '#d1d5db' }} />
                <h3>No Customer Chat Selected</h3>
                <p style={{ fontSize: '0.85rem' }}>Select a ticket from the left panel to begin support assistance.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
