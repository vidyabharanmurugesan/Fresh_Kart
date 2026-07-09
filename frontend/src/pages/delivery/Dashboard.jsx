import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiDollarSign, FiPackage, FiMapPin, FiClock, FiCheck, FiX } from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import '../../styles/dashboard.css';
import './Delivery.css';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [skippedOrderIds, setSkippedOrderIds] = useState([]);
  const [activeDomain, setActiveDomain] = useState('food');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const data = await orderService.getDeliveryOrders();
      setOrders(data || []);
    } catch (error) {
      console.error("Failed to fetch delivery dashboard data", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
    const interval = setInterval(() => fetchDashboardData(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAvailableOrders = async () => {
    try {
      const data = await orderService.getDeliveryOrders('accepted');
      setAvailableOrders(data || []);
    } catch (error) {
      console.error("Failed to fetch available orders", error);
    }
  };

  useEffect(() => {
    let interval;
    if (isOnline) {
      fetchAvailableOrders();
      interval = setInterval(fetchAvailableOrders, 5000);
    } else {
      setAvailableOrders([]);
    }
    return () => clearInterval(interval);
  }, [isOnline]);

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
    return <div className="dashboard-page delivery-page"><p>Loading delivery dashboard...</p></div>;
  }

  const completed = orders.filter(o => 
    (o.status === 'delivered' || o.status === 'completed') &&
    (o.domain || 'food').toLowerCase() === activeDomain.toLowerCase()
  );
  
  // Calculate today's deliveries
  const todayStr = new Date().toDateString();
  const todayDeliveries = completed.filter(o => o.created_at && new Date(o.created_at).toDateString() === todayStr);

  const flatPayout = 50; // ₹50 flat payout per completed order
  const todayEarnings = todayDeliveries.length * flatPayout;
  const deliveriesCount = todayDeliveries.length;
  const distanceCovered = (deliveriesCount * 3.5).toFixed(1); // Avg 3.5 km per delivery

  const filteredAvailable = availableOrders.filter(o => 
    (o.domain || 'food').toLowerCase() === activeDomain.toLowerCase() && !skippedOrderIds.includes(o.order_id)
  );

  const isApproved = user?.category_manager_approval;

  return (
    <div className="dashboard-page delivery-page" id="delivery-dashboard">
      <div className="delivery-header">
        <div>
          <h1>Hi, {user?.name} 🛵</h1>
          <p>
            {!isApproved ? ' Onboarding Pending' : isOnline ? ' You are online' : ' You are offline'}{' '}
            ({activeDomain === 'food' ? 'Food Mode' : 'Grocery Mode'})
          </p>
        </div>
        <button
          className={`toggle-btn ${isOnline ? 'online' : 'offline'}`}
          onClick={() => {
            if (!isApproved) {
              alert('Your application is pending verification. Once approved, you can start accepting delivery orders.');
              return;
            }
            setIsOnline(!isOnline);
          }}
          disabled={!isApproved}
          style={{
            opacity: isApproved ? 1 : 0.6,
            cursor: isApproved ? 'pointer' : 'not-allowed'
          }}
          id="online-toggle"
        >
          {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
        </button>
      </div>

      {!isApproved && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          color: '#f59e0b',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '2.5rem' }}></span>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Verification Pending</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', maxWidth: '600px' }}>
            Your application has been submitted successfully. Our verification team will review your documents. Once approved, you can start accepting delivery orders.
          </p>
        </div>
      )}

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
           Food Dashboard
        </button>
        <button 
          onClick={() => setActiveDomain('grocery')} 
          style={{
            padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, background: activeDomain === 'grocery' ? '#10b981' : '#f3f4f6',
            color: activeDomain === 'grocery' ? 'white' : '#4b5563', transition: 'all 0.2s'
          }}
        >
           Grocery Dashboard
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon green"><FiDollarSign /></div>
          <div className="stat-card-info"><h3>₹{todayEarnings}</h3><p>Today's Earnings</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon blue"><FiPackage /></div>
          <div className="stat-card-info"><h3>{deliveriesCount}</h3><p>Deliveries Today</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon orange"><FiClock /></div>
          <div className="stat-card-info"><h3>{isOnline ? 'Active' : '0.0 hrs'}</h3><p>Online Status</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon purple"><FiMapPin /></div>
          <div className="stat-card-info"><h3>{distanceCovered} km</h3><p>Distance Covered</p></div>
        </div>
      </div>

      {!isOnline && (
        <div className="content-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🛵</div>
          <h3 style={{ fontSize: '1.2rem', color: '#374151', marginBottom: '8px' }}>You're Currently Offline</h3>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Go online to start receiving delivery requests</p>
        </div>
      )}

      {isOnline && (
        <div className="content-card">
          <div className="content-card-header">
            <h2>📡 {filteredAvailable.length > 0 ? 'Available Delivery Requests' : 'Waiting for Orders...'}</h2>
          </div>
          {filteredAvailable.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredAvailable.map((order, i) => (
                <div className="order-ring-card" key={order.order_id || i} style={{ animation: 'none', margin: '8px 0' }}>
                  <h2>🔔 New Order Request!</h2>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '12px' }}>Order #{order.order_id}</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>PICKUP</p>
                      <p style={{ fontWeight: 600 }}><FiMapPin size={12} style={{ marginRight: '4px' }} /> Seller ID: {order.seller_id}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>DROP-OFF</p>
                      <p style={{ fontWeight: 600 }}><FiMapPin size={12} style={{ marginRight: '4px' }} /> {order.address || 'N/A'}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                     {order.items?.length || 0} items • <strong>₹{order.total_amount}</strong>
                  </p>
                  <div className="order-ring-actions">
                    <button className="btn-accept" onClick={() => handleAccept(order.order_id)} style={{ cursor: 'pointer', border: 'none' }}>
                      Accept Order
                    </button>
                    <button className="btn-reject" onClick={() => handleSkip(order.order_id)} style={{ cursor: 'pointer', border: 'none' }}>
                      Skip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: '60px', height: '60px', border: '3px solid #e5e7eb', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Looking for delivery requests near you...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
