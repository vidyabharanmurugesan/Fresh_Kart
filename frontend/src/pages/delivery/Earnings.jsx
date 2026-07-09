import { useState, useEffect } from 'react';
import { FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import '../../styles/dashboard.css';
import './Delivery.css';

export default function Earnings() {
  const [orders, setOrders] = useState([]);
  const [activeDomain, setActiveDomain] = useState('food');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const data = await orderService.getDeliveryOrders();
        setOrders(data || []);
      } catch (error) {
        console.error("Failed to fetch delivery orders for earnings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  if (loading) {
    return <div className="dashboard-page delivery-page"><p>Loading earnings payout summary...</p></div>;
  }

  const completed = orders.filter(o => 
    (o.status === 'delivered' || o.status === 'completed') &&
    (o.domain || 'food').toLowerCase() === activeDomain.toLowerCase()
  );
  const flatPayout = 50; // Flat ₹50 payout per completed delivery

  // Group completed orders by date
  const earningsByDate = {};
  completed.forEach(o => {
    if (o.created_at) {
      const dateStr = new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      if (!earningsByDate[dateStr]) {
        earningsByDate[dateStr] = { date: dateStr, count: 0, total: 0 };
      }
      earningsByDate[dateStr].count += 1;
      earningsByDate[dateStr].total += flatPayout;
    }
  });

  const breakdown = Object.values(earningsByDate);

  // Calculate Stats
  const todayStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const todayEarnings = earningsByDate[todayStr]?.total || 0;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekEarnings = completed
    .filter(o => o.created_at && new Date(o.created_at) >= weekAgo)
    .length * flatPayout;

  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const thisMonthEarnings = completed
    .filter(o => o.created_at && new Date(o.created_at) >= monthAgo)
    .length * flatPayout;

  const hasEarnings = completed.length > 0;

  return (
    <div className="dashboard-page delivery-page" id="delivery-earnings">
      <div className="page-header">
        <h1>Earnings</h1>
        <p>Your payout summary ({activeDomain === 'food' ? 'Food' : 'Grocery'})</p>
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
           Food Earnings
        </button>
        <button 
          onClick={() => setActiveDomain('grocery')} 
          style={{
            padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, background: activeDomain === 'grocery' ? '#10b981' : '#f3f4f6',
            color: activeDomain === 'grocery' ? 'white' : '#4b5563', transition: 'all 0.2s'
          }}
        >
           Grocery Earnings
        </button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon green"><FiDollarSign /></div>
          <div className="stat-card-info"><h3>₹{todayEarnings}</h3><p>Today's Payout</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon blue"><FiDollarSign /></div>
          <div className="stat-card-info"><h3>₹{thisWeekEarnings}</h3><p>This Week</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon orange"><FiTrendingUp /></div>
          <div className="stat-card-info"><h3>₹{thisMonthEarnings}</h3><p>This Month</p></div>
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header"><h2> Earnings Breakdown</h2></div>
        {hasEarnings ? (
          <table className="data-table">
            <thead><tr><th>Date</th><th>Deliveries</th><th>Base Pay</th><th>Tips</th><th>Total Payout</th></tr></thead>
            <tbody>
              {breakdown.map((d, i) => (
                <tr key={i}>
                  <td>{d.date}</td>
                  <td>{d.count}</td>
                  <td>₹{d.count * 40}</td>
                  <td style={{ color: '#059669' }}>₹{d.count * 10}</td>
                  <td style={{ fontWeight: 700 }}>₹{d.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <p>No earnings breakdown available yet. Go online and complete some deliveries!</p>
          </div>
        )}
      </div>
    </div>
  );
}
