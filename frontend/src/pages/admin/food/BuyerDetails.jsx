import { useState, useEffect } from 'react';
import { FiSearch, FiEye, FiUser, FiPackage, FiShoppingBag, FiDollarSign, FiDownload } from 'react-icons/fi';
import { authService } from '../../../services/authService';
import { orderService } from '../../../services/orderService';
import '../../../styles/dashboard.css';

export default function BuyerDetails({ domain = 'food' }) {
  const [buyers, setBuyers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await authService.downloadSystemReport('buyers');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FreshKart_Buyer_Details_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download buyer details:", error);
      alert("Error: Failed to generate or download the buyer details. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const buyersList = await authService.getUsersByRole('buyer');
      const ordersList = await orderService.getAdminOrders();
      setBuyers(buyersList || []);
      setOrders(ordersList || []);
    } catch (err) {
      console.error('Failed to load buyers and orders data', err);
    } finally {
      setLoading(false);
    }
  };

  const getBuyerStats = (buyerId) => {
    const buyerOrders = orders.filter(o => 
      String(o.buyer_id) === String(buyerId) && 
      o.domain?.toLowerCase() === domain.toLowerCase()
    );
    const totalSpent = buyerOrders
      .filter(o => ['completed', 'delivered'].includes(o.status.toLowerCase()))
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    return {
      ordersCount: buyerOrders.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      recentOrders: buyerOrders.slice(0, 5),
      allOrders: buyerOrders
    };
  };

  const filteredBuyers = buyers.filter(b => {
    return (
      b.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone?.includes(searchQuery)
    );
  });

  const handleViewDetails = (buyer) => {
    const stats = getBuyerStats(buyer.id);
    setSelectedBuyer({ ...buyer, ...stats });
    setShowModal(true);
  };

  if (loading) {
    return <div className="dashboard-page"><p>Loading buyer information...</p></div>;
  }

  return (
    <div className="dashboard-page" id="admin-food-buyers">
      <style>{`
        @keyframes admin-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Buyer Details</h1>
          <p style={{ margin: '4px 0 0 0' }}>Review customer profiles, contact info, and complete purchasing history</p>
        </div>
        <button 
          onClick={handleDownload} 
          disabled={downloading}
          className="admin-download-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#004F9F',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: downloading ? 'not-allowed' : 'pointer',
            opacity: downloading ? 0.7 : 1,
            transition: 'background-color 0.2s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          {downloading ? (
            <>
              <span className="spinner-loader" style={{
                width: '14px',
                height: '14px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'admin-spin 1s linear infinite'
              }} />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <FiDownload />
              <span>Download Buyers PDF</span>
            </>
          )}
        </button>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h2>👥 Active Buyers</h2>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input 
              placeholder="Search buyers..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px 8px 36px', background: '#f3f4f6', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #e5e7eb', color: '#111827',
              }} 
            />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Orders Placed</th>
              <th>Total Spending</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBuyers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  No buyers found.
                </td>
              </tr>
            ) : (
              filteredBuyers.map((b) => {
                const stats = getBuyerStats(b.id);
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                      }}>
                        {b.name?.charAt(0).toUpperCase()}
                      </div>
                      {b.name}
                    </td>
                    <td>{b.email}</td>
                    <td>{b.phone || 'N/A'}</td>
                    <td style={{ fontWeight: 600 }}>{stats.ordersCount} orders</td>
                    <td style={{ color: '#059669', fontWeight: 600 }}>₹{stats.totalSpent.toFixed(2)}</td>
                    <td>
                      <button 
                        onClick={() => handleViewDetails(b)}
                        style={{ 
                          padding: '6px 12px', background: '#e0f2fe', color: '#0284c7', 
                          borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, 
                          display: 'flex', alignItems: 'center', gap: '4px', border: 'none', cursor: 'pointer' 
                        }}
                      >
                        <FiEye size={12} /> View History
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Buyer Details Modal */}
      {showModal && selectedBuyer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 1200, backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: 'white', width: '90%', maxWidth: '750px', borderRadius: '12px',
            maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem'
                }}>
                  {selectedBuyer.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#111827' }}>{selectedBuyer.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Registered Account Profile</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#4b5563', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
              {/* Profile Card */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>EMAIL</span>
                  <strong style={{ fontSize: '0.95rem', color: '#374151' }}>{selectedBuyer.email}</strong>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>PHONE</span>
                  <strong style={{ fontSize: '0.95rem', color: '#374151' }}>{selectedBuyer.phone || 'N/A'}</strong>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>TOTAL SPENDING</span>
                  <strong style={{ fontSize: '0.95rem', color: '#059669' }}>₹{selectedBuyer.totalSpent.toFixed(2)}</strong>
                </div>
              </div>

              {/* Order History */}
              <h4 style={{ fontSize: '1.05rem', color: '#111827', marginBottom: '12px', borderBottom: '2px solid #f3f4f6', paddingBottom: '8px' }}>
                🛒 Order History ({selectedBuyer.ordersCount})
              </h4>
              
              {selectedBuyer.allOrders.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>No orders placed yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedBuyer.allOrders.map((order, idx) => (
                    <div key={order.order_id || idx} style={{
                      border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px',
                      background: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ color: '#111827', fontSize: '0.9rem' }}>Order #{order.order_id}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#6b7280', marginLeft: '12px' }}>
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`status-badge ${order.status}`} style={{ textTransform: 'capitalize' }}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '12px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                          <span style={{ display: 'block', marginBottom: '4px' }}>
                            <strong>Store:</strong> {order.seller_name}
                          </span>
                          <span>
                            <strong>Items:</strong> {order.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}
                          </span>
                        </div>
                        <strong style={{ color: '#111827', fontSize: '1rem' }}>₹{order.total_amount?.toFixed(2)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', background: '#f9fafb' }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{ padding: '8px 16px', background: '#374151', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
