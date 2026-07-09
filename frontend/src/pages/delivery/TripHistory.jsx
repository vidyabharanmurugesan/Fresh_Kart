import { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import '../../styles/dashboard.css';
import './Delivery.css';

export default function TripHistory() {
  const [orders, setOrders] = useState([]);
  const [activeDomain, setActiveDomain] = useState('food');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await orderService.getDeliveryOrders();
        setOrders(data || []);
      } catch (error) {
        console.error("Failed to fetch delivery orders for trip history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return <div className="dashboard-page delivery-page"><p>Loading trip history...</p></div>;
  }

  const trips = orders.filter(o => 
    (o.status === 'delivered' || o.status === 'completed') &&
    (o.domain || 'food').toLowerCase() === activeDomain.toLowerCase()
  );
  const hasTrips = trips.length > 0;

  return (
    <div className="dashboard-page delivery-page" id="delivery-history">
      <div className="page-header">
        <h1>Trip History</h1>
        <p>Your completed deliveries ({activeDomain === 'food' ? 'Food' : 'Grocery'})</p>
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
          🍔 Food Deliveries
        </button>
        <button 
          onClick={() => setActiveDomain('grocery')} 
          style={{
            padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, background: activeDomain === 'grocery' ? '#10b981' : '#f3f4f6',
            color: activeDomain === 'grocery' ? 'white' : '#4b5563', transition: 'all 0.2s'
          }}
        >
          🛒 Grocery Deliveries
        </button>
      </div>

      <div className="content-card">
        <div className="content-card-header"><h2>📋 Recent Trips ({activeDomain === 'food' ? 'Food' : 'Grocery'})</h2></div>
        {hasTrips ? (
          <table className="data-table">
            <thead><tr><th>Order</th><th>From</th><th>To</th><th>Payout</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>
              {trips.map((t, i) => {
                const formattedTime = t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{t.order_id}</td>
                    <td>Seller #{t.seller_id}</td>
                    <td>{t.address || 'N/A'}</td>
                    <td style={{ color: '#059669', fontWeight: 600 }}>₹50</td>
                    <td>{formattedTime}</td>
                    <td><span className="status-badge completed">completed</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <p>No trip history available yet. Go online and complete some deliveries!</p>
          </div>
        )}
      </div>
    </div>
  );
}
