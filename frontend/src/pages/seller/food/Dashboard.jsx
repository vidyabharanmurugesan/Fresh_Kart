import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { FiPackage, FiDollarSign, FiUsers, FiTrendingUp, FiCheck, FiX, FiMessageSquare } from 'react-icons/fi';
import { orderService } from '../../../services/orderService';
import OrderChat from '../../../components/common/OrderChat';
import '../../../styles/dashboard.css';

export default function SellerFoodDashboard({ domain = 'food' }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatOrder, setSelectedChatOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [domain]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getSellerOrders();
      const filtered = (data || []).filter(o => {
        const oDomain = o.domain || 'food';
        return oDomain.toLowerCase() === domain.toLowerCase();
      });
      setOrders(filtered);
    } catch (error) {
      console.error("Failed to fetch seller orders", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      fetchOrders();
    } catch (error) {
      console.error(`Failed to update order status to ${status}`, error);
      alert(`Failed to update order status: ` + (error.response?.data?.error || error.message));
    }
  };

  // Metrics calculations
  const todayRevenue = orders
    .filter(o => o.status === 'completed' || o.status === 'active' || o.status === 'delivered')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  
  const totalCustomers = new Set(orders.map(o => o.buyer_id).filter(Boolean)).size;

  return (
    <div className="dashboard-page" id="seller-food-dashboard">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {user?.shop_logo && (
          <img 
            src={user.shop_logo.startsWith('http') ? user.shop_logo : `${import.meta.env.VITE_API_BASE_URL || ''}${user.shop_logo.startsWith('/') ? '' : '/'}${user.shop_logo}`} 
            alt="Shop Logo" 
            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '12px' }}
          />
        )}
        <div>
          <h1 style={{ margin: '0 0 5px 0' }}>Welcome, {user?.shop_name || user?.name} </h1>
          <p style={{ margin: 0 }}>Manage your food orders and inventory</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon green"><FiDollarSign /></div>
          <div className="stat-card-info"><h3>₹{todayRevenue.toLocaleString('en-IN')}</h3><p>Revenue (Active/Completed)</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon orange"><FiPackage /></div>
          <div className="stat-card-info"><h3>{pendingOrders}</h3><p>Pending Orders</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon blue"><FiUsers /></div>
          <div className="stat-card-info"><h3>{totalCustomers}</h3><p>Total Customers</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon purple"><FiTrendingUp /></div>
          <div className="stat-card-info"><h3>+{Math.min(50, orders.length * 4)}%</h3><p>Growth Score</p></div>
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h2> Incoming Orders</h2>
          <span className="status-badge pending">{pendingOrders} Pending</span>
        </div>
        {loading ? (
          <p style={{ padding: '20px' }}>Loading orders...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Order Details</th><th>Total (Incl. GST)</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {orders.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', padding:'20px'}}>No orders received yet.</td></tr>}
              {orders.map((order, i) => {
                const itemsString = order.items?.map(item => `${item.name} x${item.quantity}`).join(', ') || 'N/A';
                return (
                  <tr key={order.order_id || i}>
                    <td style={{ fontWeight: 600 }}>{order.order_id}</td>
                    <td>{order.customer_name || 'Anonymous'}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                        <div><strong>Items:</strong> {itemsString}</div>
                        <div><strong>Address:</strong> {order.address || 'N/A'}</div>
                        <div><strong>Payment:</strong> {order.payment_method || 'COD'}</div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#059669' }}>
                      ₹{order.total_amount}<br/>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'normal' }}>
                        (Inc. GST: ₹{order.gst_amount || 0})
                      </span>
                    </td>
                    <td><span className={`status-badge ${order.status}`}>{order.status}</span></td>
                    <td>
                      {order.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => handleStatusChange(order.order_id, 'accepted')}
                            title="Accept & Assign Delivery"
                            style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}
                          >
                            <FiCheck size={14} />
                          </button>
                          <button 
                            onClick={() => handleStatusChange(order.order_id, 'cancelled')}
                            title="Reject Order"
                            style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}
                          >
                            <FiX size={14} />
                          </button>
                        </div>
                      )}
                      {(order.status === 'active' || order.status === 'accepted') && (
                        <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginTop: '4px' }}>Waiting for Delivery Partner</span>
                      )}
                      {(order.status === 'assigned_to_delivery' || order.status === 'picked_up') && (
                        <span style={{ fontSize: '0.8rem', color: '#2563eb', display: 'block', marginTop: '4px' }}>With Delivery Partner</span>
                      )}
                      
                      {/* Chat Button for active/accepted orders */}
                      {['accepted', 'assigned_to_delivery', 'picked_up'].includes(order.status) && (
                        <button 
                          onClick={() => setSelectedChatOrder(order)}
                          style={{ marginTop: '8px', padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <FiMessageSquare /> Open Chat
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedChatOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '500px', padding: '20px' }}>
            <OrderChat order={selectedChatOrder} onClose={() => setSelectedChatOrder(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
