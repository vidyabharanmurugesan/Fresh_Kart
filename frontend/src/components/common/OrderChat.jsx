import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { FiSend, FiX, FiMessageSquare } from 'react-icons/fi';

const SOCKET_SERVER_URL = 'http://localhost:5000'; // Make sure this matches your Flask backend

export default function OrderChat({ order, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState(order?.chat_messages || []);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    // Join room
    newSocket.emit('join_order', {
      order_id: order.order_id,
      user_id: user.id,
      role: user.role
    });

    // Listen for messages
    newSocket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      newSocket.emit('leave_order', {
        order_id: order.order_id,
        user_id: user.id
      });
      newSocket.disconnect();
    };
  }, [order.order_id, user.id, user.role]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    const messagePayload = {
      id: Math.random().toString(36).substr(2, 9),
      order_id: order.order_id,
      sender_id: user.id,
      sender_name: user.name,
      sender_role: user.role,
      text: inputText,
      timestamp: new Date().toISOString()
    };

    socket.emit('send_message', messagePayload);
    setInputText('');
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '400px', width: '100%',
      background: 'white', borderRadius: '12px', overflow: 'hidden',
      border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        padding: '12px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiMessageSquare color="#10b981" />
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#111827' }}>Order Chat #{order.order_id}</h3>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
            <FiX size={18} />
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f3f4f6' }}>
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.85rem', margin: 'auto' }}>
            No messages yet. Send a message to start!
          </p>
        )}
        {messages.map((msg) => {
          const isMe = String(msg.sender_id) === String(user.id);
          return (
            <div key={msg.id} style={{
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              display: 'flex', flexDirection: 'column'
            }}>
              {!isMe && <span style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '2px', marginLeft: '4px' }}>{msg.sender_name} ({msg.sender_role})</span>}
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

      <form onSubmit={handleSend} style={{ display: 'flex', padding: '12px', background: 'white', borderTop: '1px solid #e5e7eb', gap: '8px' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid #d1d5db',
            fontSize: '0.9rem', outline: 'none'
          }}
        />
        <button type="submit" disabled={!inputText.trim()} style={{
          background: inputText.trim() ? '#10b981' : '#e5e7eb',
          color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: inputText.trim() ? 'pointer' : 'not-allowed',
          transition: 'background 0.2s'
        }}>
          <FiSend size={16} />
        </button>
      </form>
    </div>
  );
}
