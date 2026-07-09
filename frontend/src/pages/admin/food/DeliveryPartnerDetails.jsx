import { useState, useEffect } from 'react';
import { FiSearch, FiEye, FiTruck, FiUser, FiMapPin, FiClock, FiDownload } from 'react-icons/fi';
import { authService } from '../../../services/authService';
import { orderService } from '../../../services/orderService';
import '../../../styles/dashboard.css';

export default function DeliveryPartnerDetails({ domain = 'food' }) {
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await authService.downloadSystemReport('delivery');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FreshKart_Delivery_Partner_Details_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download delivery partner details:", error);
      alert("Error: Failed to generate or download the delivery partner details. Please try again.");
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
      const driversList = await authService.getUsersByRole('delivery');
      const ordersList = await orderService.getAdminOrders();
      setDrivers(driversList || []);
      setOrders(ordersList || []);
    } catch (err) {
      console.error('Failed to load drivers and orders data', err);
    } finally {
      setLoading(false);
    }
  };

  const getDriverStats = (driverId) => {
    const driverOrders = orders.filter(o => 
      String(o.delivery_partner_id) === String(driverId) &&
      o.domain?.toLowerCase() === domain.toLowerCase()
    );
    const activeDelivery = driverOrders.find(o => 
      ['assigned_to_delivery', 'picked_up'].includes(o.status.toLowerCase())
    );
    const completedOrders = driverOrders.filter(o => 
      ['completed', 'delivered'].includes(o.status.toLowerCase())
    );
    const earnings = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    return {
      tripsCount: driverOrders.length,
      completedCount: completedOrders.length,
      activeOrder: activeDelivery || null,
      earnings: Math.round(earnings * 100) / 100,
      allOrders: driverOrders
    };
  };

  const filteredDrivers = drivers.filter(d => {
    return (
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone?.includes(searchQuery)
    );
  });

  const handleViewDetails = (driver) => {
    const stats = getDriverStats(driver.id);
    setSelectedDriver({ ...driver, ...stats });
    setShowModal(true);
  };

  if (loading) {
    return <div className="dashboard-page"><p>Loading delivery partners information...</p></div>;
  }

  return (
    <div className="dashboard-page" id="admin-food-delivery">
      <style>{`
        @keyframes admin-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Delivery Person Details</h1>
          <p style={{ margin: '4px 0 0 0' }}>Monitor status, vehicle details, completed trips, and payout analytics for delivery partners</p>
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
              <span>Download Delivery Partners PDF</span>
            </>
          )}
        </button>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h2>🏍️ Active Delivery Partners</h2>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input 
              placeholder="Search delivery personnel..." 
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
              <th>Vehicle Number</th>
              <th>Trips Done</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrivers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  No delivery partners found.
                </td>
              </tr>
            ) : (
              filteredDrivers.map((d) => {
                const stats = getDriverStats(d.id);
                const isOnline = stats.activeOrder ? 'Delivering' : 'Idle';
                const statusColorClass = stats.activeOrder ? 'pending' : 'completed';
                
                return (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', background: '#fef3c7', color: '#d97706',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                      }}>
                        {d.name?.charAt(0).toUpperCase()}
                      </div>
                      {d.name}
                    </td>
                    <td>{d.email}</td>
                    <td>{d.phone || 'N/A'}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{d.vehicle_number || 'N/A'}</td>
                    <td style={{ fontWeight: 600 }}>{stats.completedCount} trips</td>
                    <td>
                      <span className={`status-badge ${statusColorClass}`}>{isOnline}</span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleViewDetails(d)}
                        style={{ 
                          padding: '6px 12px', background: '#fef3c7', color: '#d97706', 
                          borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, 
                          display: 'flex', alignItems: 'center', gap: '4px', border: 'none', cursor: 'pointer' 
                        }}
                      >
                        <FiEye size={12} /> View Stats
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Driver Details Modal */}
      {showModal && selectedDriver && (
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
                  width: '40px', height: '40px', borderRadius: '50%', background: '#fef3c7', color: '#d97706',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem'
                }}>
                  {selectedDriver.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#111827' }}>{selectedDriver.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Delivery Partner Account Profile</p>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>VEHICLE NUMBER</span>
                  <strong style={{ fontSize: '0.95rem', color: '#374151', fontFamily: 'monospace' }}>{selectedDriver.vehicle_number || 'N/A'}</strong>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>CONTACT</span>
                  <strong style={{ fontSize: '0.95rem', color: '#374151' }}>{selectedDriver.phone || 'N/A'}</strong>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>COMPLETED TRIPS</span>
                  <strong style={{ fontSize: '0.95rem', color: '#374151' }}>{selectedDriver.completedCount} deliveries</strong>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>TOTAL TRANSITED</span>
                  <strong style={{ fontSize: '0.95rem', color: '#059669' }}>₹{selectedDriver.earnings.toFixed(2)}</strong>
                </div>
              </div>

              {/* Active Delivery Status */}
              {selectedDriver.activeOrder ? (
                <div style={{
                  background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', marginBottom: '24px'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiTruck /> Active Delivery in Progress
                  </h4>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#1e3a8a' }}>
                    <strong>Order ID:</strong> #{selectedDriver.activeOrder.order_id} ({selectedDriver.activeOrder.status.replace(/_/g, ' ')})
                  </p>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#1e3a8a' }}>
                    <strong>Pickup Store:</strong> {selectedDriver.activeOrder.seller_name}
                  </p>
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#1e3a8a' }}>
                    <strong>Drop-off Address:</strong> {selectedDriver.activeOrder.address || 'N/A'}
                  </p>
                </div>
              ) : (
                <div style={{
                  background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', marginBottom: '24px'
                }}>
                  <p style={{ margin: 0, color: '#166534', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     Delivery partner is currently Idle (waiting for new orders)
                  </p>
                </div>
              )}

              {/* Trip Logs */}
              <h4 style={{ fontSize: '1.05rem', color: '#111827', marginBottom: '12px', borderBottom: '2px solid #f3f4f6', paddingBottom: '8px' }}>
                🏍️ Completed Trip Logs
              </h4>
              
              {selectedDriver.allOrders.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>No completed orders registered.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedDriver.allOrders.map((order, idx) => (
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
                            <strong>Buyer:</strong> {order.buyer_name} ({order.buyer_phone})
                          </span>
                          <span>
                            <strong>Pickup Store:</strong> {order.seller_name}
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
