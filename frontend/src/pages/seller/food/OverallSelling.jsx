import { useState, useEffect } from 'react';
import { FiTrendingUp, FiBarChart2, FiDollarSign } from 'react-icons/fi';
import { orderService } from '../../../services/orderService';
import '../../../styles/dashboard.css';

export default function OverallSelling({ domain = 'food' }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const data = await orderService.getSellerOrders();
        const filtered = (data || []).filter(o => {
          const oDomain = o.domain || 'food';
          return oDomain.toLowerCase() === domain.toLowerCase();
        });
        setOrders(filtered);
      } catch (error) {
        console.error("Failed to fetch seller orders for sales page", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSalesData();
  }, [domain]);

  if (loading) {
    return <div className="dashboard-page"><p>Loading sales performance...</p></div>;
  }

  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalOrdersCount = orders.length;
  
  // Calculate weekly data from actual completed orders
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const salesByDay = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };

  completedOrders.forEach(o => {
    if (o.created_at) {
      const date = new Date(o.created_at);
      const dayName = dayNames[date.getDay()];
      if (salesByDay[dayName] !== undefined) {
        salesByDay[dayName] += (o.total_amount || 0);
      }
    }
  });

  const weeklyData = Object.keys(salesByDay).map(day => ({
    day,
    sales: salesByDay[day]
  }));

  const maxSales = Math.max(...weeklyData.map(d => d.sales), 1);
  const hasSales = completedOrders.length > 0;

  return (
    <div className="dashboard-page" id="seller-food-sales">
      <div className="page-header">
        <h1>Overall Selling</h1>
        <p>Track your sales analytics and performance</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon green"><FiDollarSign /></div>
          <div className="stat-card-info">
            <h3>₹{totalRevenue.toLocaleString('en-IN')}</h3>
            <p>Total Revenue (Dynamic)</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon blue"><FiBarChart2 /></div>
          <div className="stat-card-info">
            <h3>{totalOrdersCount}</h3>
            <p>Total Orders Received</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon orange"><FiTrendingUp /></div>
          <div className="stat-card-info">
            <h3>{hasSales ? '+100%' : '0%'}</h3>
            <p>Growth Score</p>
          </div>
        </div>
      </div>

      {hasSales ? (
        <div className="content-card">
          <div className="content-card-header"><h2> Weekly Sales Performance</h2></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '200px', padding: '0 16px' }}>
            {weeklyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600 }}>₹{d.sales.toLocaleString('en-IN')}</span>
                <div style={{
                  width: '100%', maxWidth: '48px', height: `${(d.sales / maxSales) * 160}px`,
                  background: 'linear-gradient(180deg, #10b981, #059669)', borderRadius: '8px 8px 4px 4px',
                  transition: 'height 0.5s ease',
                }} />
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="content-card" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          <FiBarChart2 size={40} style={{ marginBottom: '12px', color: '#9ca3af' }} />
          <h3>No Sales Performance Data</h3>
          <p>Deliver your assigned orders to see your sales charts here.</p>
        </div>
      )}
    </div>
  );
}
