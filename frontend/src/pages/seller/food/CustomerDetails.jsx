import { useState, useEffect } from 'react';
import { FiSend, FiMessageCircle } from 'react-icons/fi';
import { orderService } from '../../../services/orderService';
import '../../../styles/dashboard.css';

export default function CustomerDetails({ domain = 'food' }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [chatHistory, setChatHistory] = useState({});
  const [input, setInput] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const data = await orderService.getSellerCustomers(domain);
        setCustomers(data || []);
        if (data && data.length > 0) {
          setActiveCustomer(data[0]);
        } else {
          setActiveCustomer(null);
        }
      } catch (error) {
        console.error("Failed to fetch customers", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [domain]);

  const getMessagesForActiveCustomer = () => {
    if (!activeCustomer) return [];
    const buyerId = activeCustomer.buyer_id;
    if (!chatHistory[buyerId]) {
      return [
        { id: 1, text: `Hi! This is ${activeCustomer.name}. I have a question about my orders.`, type: 'received' },
        { id: 2, text: `Hello! Thanks for reaching out. How can I help you today?`, type: 'sent' }
      ];
    }
    return chatHistory[buyerId];
  };

  const sendMessage = () => {
    if (!input.trim() || !activeCustomer) return;
    const buyerId = activeCustomer.buyer_id;
    const currentMsgs = getMessagesForActiveCustomer();
    const updatedMsgs = [...currentMsgs, { id: Date.now(), text: input, type: 'sent' }];
    
    setChatHistory(prev => ({
      ...prev,
      [buyerId]: updatedMsgs
    }));
    setInput('');

    // Simulated user response after 1.5s
    setTimeout(() => {
      setChatHistory(prev => {
        const msgs = prev[buyerId] || updatedMsgs;
        return {
          ...prev,
          [buyerId]: [...msgs, { id: Date.now() + 1, text: `Got it! Thanks for the update.`, type: 'received' }]
        };
      });
    }, 1500);
  };

  const activeMessages = getMessagesForActiveCustomer();

  return (
    <div className="dashboard-page" id="seller-food-customers">
      <div className="page-header">
        <h1>Customer Details</h1>
        <p>View customer information and communicate</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', flexWrap: 'wrap' }}>
        {/* Customer List */}
        <div className="content-card">
          <div className="content-card-header"><h2> Customers</h2></div>
          {loading ? (
            <p style={{ padding: '20px' }}>Loading customers...</p>
          ) : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Orders</th><th>Spent</th><th>Last Order</th></tr></thead>
              <tbody>
                {customers.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>No customers found.</td></tr>}
                {customers.map((c) => (
                  <tr 
                    key={c.buyer_id} 
                    onClick={() => setActiveCustomer(c)}
                    style={{ 
                      cursor: 'pointer', 
                      background: activeCustomer?.buyer_id === c.buyer_id ? '#f0fdf4' : 'transparent',
                      fontWeight: activeCustomer?.buyer_id === c.buyer_id ? 600 : 'normal'
                    }}
                  >
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.orders_count}</td>
                    <td style={{ color: '#059669', fontWeight: 600 }}>₹{c.total_spent}</td>
                    <td style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                      {c.last_order_time ? new Date(c.last_order_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Chat Box */}
        <div className="chat-container">
          <div className="chat-header">
            <FiMessageCircle size={18} />
            <span>Chat with {activeCustomer?.name || 'Customer'}</span>
          </div>
          <div className="chat-messages">
            {!activeCustomer ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '100px' }}>Select a customer to start chatting</p>
            ) : (
              activeMessages.map(msg => (
                <div key={msg.id} className={`chat-message ${msg.type}`}>
                  <div className="chat-bubble">{msg.text}</div>
                </div>
              ))
            )}
          </div>
          <div className="chat-input-area">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Type a message..."
              disabled={!activeCustomer}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
            />
            <button 
              className="chat-send-btn" 
              onClick={sendMessage}
              disabled={!activeCustomer}
            >
              <FiSend size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
