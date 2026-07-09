import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiX, FiMapPin } from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import '../../styles/dashboard.css';
import './Delivery.css';

export default function IncomingOrders() {
  const [orders, setOrders] = useState([]);
  const [skippedOrderIds, setSkippedOrderIds] = useState([]);
  const [activeDomain, setActiveDomain] = useState('food');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchIncomingOrders(true);
    const interval = setInterval(() => fetchIncomingOrders(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchIncomingOrders = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const data = await orderService.getDeliveryOrders('accepted');
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to fetch incoming orders', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleAccept = async (orderId) => {
    try {
      await orderService.assignDelivery(orderId);
      navigate('/delivery/active');
    } catch (error) {
      console.error('Failed to accept order', error);
      alert('Failed to accept order: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSkip = (orderId) => {
    setSkippedOrderIds(prev => [...prev, orderId]);
  };

  if (loading) {
    return <div className="dashboard-page delivery-page"><p>Loading...</p></div>;
  }

  const filteredOrders = orders.filter(o => {
    const oDomain = o.domain || 'food';
    return oDomain.toLowerCase() === activeDomain.toLowerCase() && !skippedOrderIds.includes(o.order_id);
  });

  return (
    <div className="dashboard-page delivery-page" id="delivery-incoming">
      <div className="page-header">
        <h1>Incoming Orders</h1>
        <p>New delivery requests</p>
      </div>

      {/* Domain Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveDomain('food')} 
          style={{
            padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, background: activeDomain === 'food' ? '#10b981' : '#f3f4f6',
            color: activeDomain === 'food' ? 'white' : '#4b5563', transition: 'all 0.2s'
          }}
        >
          🍔 Food requests
        </button>
        <button 
          onClick={() => setActiveDomain('grocery')} 
          style={{
            padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, background: activeDomain === 'grocery' ? '#10b981' : '#f3f4f6',
            color: activeDomain === 'grocery' ? 'white' : '#4b5563', transition: 'all 0.2s'
          }}
        >
          🛒 Grocery requests
        </button>
      </div>

      {filteredOrders.length > 0 ? (
        filteredOrders.map((order, i) => (
          <div className="order-ring-card" key={order.order_id || i}>
            <h2>🔔 New Order! ({activeDomain === 'food' ? 'Food' : 'Grocery'})</h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '12px' }}>Order #{order.order_id}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '12px' }}>
              <div>
                <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>PICKUP</p>
                <p style={{ fontWeight: 600 }}><FiMapPin size={12} /> Seller ID: {order.seller_id}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>DROP-OFF</p>
                <p style={{ fontWeight: 600 }}><FiMapPin size={12} /> {order.address || 'N/A'}</p>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem' }}>
              📦 {order.items?.length || 0} items • <strong>₹{order.total_amount}</strong>
            </p>
            <div className="order-ring-actions">
              <button className="btn-accept" onClick={() => handleAccept(order.order_id)} style={{ cursor: 'pointer', border: 'none' }}>
                <FiCheck /> Accept
              </button>
              <button className="btn-reject" onClick={() => handleSkip(order.order_id)} style={{ cursor: 'pointer', border: 'none' }}>
                <FiX /> Skip
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No incoming {activeDomain} orders</h3>
          <p>New requests will appear here</p>
        </div>
      )}
    </div>
  );
}

