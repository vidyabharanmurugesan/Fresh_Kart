import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPhone, FiNavigation, FiMapPin, FiCheckCircle } from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import OrderChat from '../../components/common/OrderChat';
import '../../styles/dashboard.css';
import './Delivery.css';

export default function ActiveDelivery() {
  const [activeOrder, setActiveOrder] = useState(null);
  const [activeDomain, setActiveDomain] = useState('food');
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const watchIdRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchActiveOrder();
    return () => stopTracking();
  }, [activeDomain]);

  const fetchActiveOrder = async () => {
    try {
      setLoading(true);
      // Fetch assigned or picked_up orders
      const assigned = await orderService.getDeliveryOrders('assigned_to_delivery');
      const pickedUp = await orderService.getDeliveryOrders('picked_up');
      const ordersList = [...assigned, ...pickedUp];
      
      const filtered = ordersList.filter(o => {
        const oDomain = o.domain || 'food';
        return oDomain.toLowerCase() === activeDomain.toLowerCase();
      });

      if (filtered.length > 0) {
        setActiveOrder(filtered[0]);
        startTracking(filtered[0].order_id);
      } else {
        setActiveOrder(null);
        stopTracking();
      }
    } catch (error) {
      console.error('Failed to fetch active delivery', error);
    } finally {
      setLoading(false);
    }
  };

  const startTracking = (orderId) => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    if (watchIdRef.current) return; // already tracking

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        orderService.updateLocation(orderId, latitude, longitude).catch(err => console.error('Failed to update location', err));
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError('Failed to get location. Please enable GPS.');
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const handleStatusUpdate = async (status) => {
    if (!activeOrder) return;
    try {
      await orderService.updateOrderStatus(activeOrder.order_id, status);
      if (status === 'completed' || status === 'delivered') {
        stopTracking();
        navigate('/delivery/home');
      } else {
        fetchActiveOrder();
      }
    } catch (error) {
      console.error(`Failed to update status to ${status}`, error);
      alert('Failed to update status');
    }
  };

  const handleCall = async (role) => {
    if (!activeOrder) return;
    try {
      const data = await orderService.initiateCall(activeOrder.order_id, role);
      alert(data.message || `Call initiated with ${role}`);
    } catch (error) {
      console.error(`Failed to connect call:`, error);
      alert(`Call failed: ${error.response?.data?.error || error.message}`);
    }
  };

  const renderTabs = () => (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
      <button 
        onClick={() => setActiveDomain('food')} 
        style={{
          padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
          fontWeight: 600, background: activeDomain === 'food' ? '#10b981' : '#f3f4f6',
          color: activeDomain === 'food' ? 'white' : '#4b5563', transition: 'all 0.2s'
        }}
      >
        🍔 Active Food
      </button>
      <button 
        onClick={() => setActiveDomain('grocery')} 
        style={{
          padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
          fontWeight: 600, background: activeDomain === 'grocery' ? '#10b981' : '#f3f4f6',
          color: activeDomain === 'grocery' ? 'white' : '#4b5563', transition: 'all 0.2s'
        }}
      >
        🛒 Active Grocery
      </button>
    </div>
  );

  if (loading) {
    return <div className="dashboard-page delivery-page"><p>Loading...</p></div>;
  }

  if (!activeOrder) {
    return (
      <div className="dashboard-page delivery-page" id="delivery-active">
        <div className="page-header">
          <h1>Active Delivery</h1>
          <p>Deliveries in progress</p>
        </div>
        {renderTabs()}
        <div className="empty-state">
          <div className="empty-state-icon">🏍️</div>
          <h3>No Active {activeDomain === 'food' ? 'Food' : 'Grocery'} Delivery</h3>
          <p>You don't have any deliveries in progress for this category.</p>
          <button onClick={() => navigate('/delivery/incoming')} style={{ marginTop: '20px', padding: '10px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Check Incoming Requests
          </button>
        </div>
      </div>
    );
  }

  const isPickedUp = activeOrder.status === 'picked_up';

  return (
    <div className="dashboard-page delivery-page" id="delivery-active">
      <div className="page-header">
        <h1>Active Delivery</h1>
        <p>Order #{activeOrder.order_id} ({activeDomain === 'food' ? 'Food' : 'Grocery'})</p>
      </div>
      {renderTabs()}

      <div className="content-card">
        <div className="content-card-header"><h2>🗺️ Tracking Info</h2></div>
        <div style={{
          height: '150px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', marginBottom: '20px'
        }}>
          <FiNavigation size={40} color="#059669" />
          <p style={{ color: '#059669', fontWeight: 600 }}>GPS Tracking Active</p>
          {locationError && <p style={{ color: '#dc2626', fontSize: '0.8rem' }}>{locationError}</p>}
        </div>

        <div style={{ padding: '0 10px 20px 10px' }}>
          <p><FiMapPin /> <strong>Pickup (Seller ID):</strong> {activeOrder.seller_id}</p>
          <p><FiMapPin /> <strong>Drop-off:</strong> {activeOrder.address || 'N/A'}</p>
          <p>📦 <strong>Items:</strong> {activeOrder.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}</p>
          <p>💵 <strong>Amount:</strong> ₹{activeOrder.total_amount}</p>
        </div>

        <div className="delivery-status-btns">
          {!isPickedUp ? (
            <button className="delivery-status-btn available" onClick={() => handleStatusUpdate('picked_up')}>
              📦 Picked Up Order
            </button>
          ) : (
            <button className="delivery-status-btn done">
              <FiCheckCircle /> Picked Up
            </button>
          )}

          {isPickedUp ? (
            <button className="delivery-status-btn available" onClick={() => handleStatusUpdate('delivered')}>
              ✅ Mark Delivered
            </button>
          ) : (
            <button className="delivery-status-btn" style={{ background: '#f3f4f6', color: '#9ca3af' }}>
              ✅ Mark Delivered
            </button>
          )}
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header"><h2>📞 Contact</h2></div>
        <div className="call-buttons">
          <button className="call-btn buyer" onClick={() => handleCall('buyer')}><FiPhone size={16} /> Call Buyer</button>
          <button className="call-btn seller" onClick={() => handleCall('seller')}><FiPhone size={16} /> Call Seller</button>
        </div>
      </div>

      <div className="content-card">
        <OrderChat order={activeOrder} />
      </div>
    </div>
  );
}
