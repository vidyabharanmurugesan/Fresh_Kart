import { useState, useEffect } from 'react';
import { FiSearch, FiEye, FiShoppingBag, FiDollarSign, FiUsers, FiPackage, FiDownload } from 'react-icons/fi';
import { authService } from '../../../services/authService';
import { orderService } from '../../../services/orderService';
import { productService } from '../../../services/productService';
import '../../../styles/dashboard.css';

export default function SellerDetails({ domain = 'food' }) {
  const [sellers, setSellers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await authService.downloadSystemReport('sellers');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FreshKart_Seller_Details_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download seller details:", error);
      alert("Error: Failed to generate or download the seller details. Please try again.");
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
      const sellersList = await authService.getUsersByRole('seller');
      const ordersList = await orderService.getAdminOrders();
      
      // Fetch both food and grocery products
      const foodProducts = await productService.getAllProducts('food');
      const groceryProducts = await productService.getAllProducts('grocery');
      
      const allProductsList = [
        ...(foodProducts.products || []),
        ...(groceryProducts.products || [])
      ];

      setSellers(sellersList || []);
      setOrders(ordersList || []);
      setProducts(allProductsList || []);
    } catch (err) {
      console.error('Failed to load seller administration data', err);
    } finally {
      setLoading(false);
    }
  };

  const getSellerStats = (sellerId) => {
    const sellerOrders = orders.filter(o => 
      String(o.seller_id) === String(sellerId) && 
      o.domain?.toLowerCase() === domain.toLowerCase()
    );
    const sellerProducts = products.filter(p => 
      String(p.seller_id) === String(sellerId) && 
      p.domain?.toLowerCase() === domain.toLowerCase()
    );
    
    const completedOrders = sellerOrders.filter(o => 
      ['completed', 'delivered'].includes(o.status.toLowerCase())
    );
    const revenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Count unique customer IDs
    const uniqueCustomers = new Set(sellerOrders.map(o => o.buyer_id)).size;

    return {
      productsCount: sellerProducts.length,
      ordersCount: sellerOrders.length,
      completedCount: completedOrders.length,
      customersCount: uniqueCustomers,
      revenue: Math.round(revenue * 100) / 100,
      recentOrders: sellerOrders,
      products: sellerProducts
    };
  };

  const filteredSellers = sellers.filter(s => {
    return (
      (s.shop_name || s.name)?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleViewDetails = (seller) => {
    const stats = getSellerStats(seller.id);
    setSelectedSeller({ ...seller, ...stats });
    setShowModal(true);
  };

  if (loading) {
    return <div className="dashboard-page"><p>Loading seller details...</p></div>;
  }

  return (
    <div className="dashboard-page" id="admin-food-sellers">
      <style>{`
        @keyframes admin-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Seller Details</h1>
          <p style={{ margin: '4px 0 0 0' }}>Monitor shop performance, product listings, active transactions, and platform payouts</p>
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
              <span>Download Sellers PDF</span>
            </>
          )}
        </button>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h2>🏪 Active Sellers & Shops</h2>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input 
              placeholder="Search stores..." 
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
              <th>Shop Name</th>
              <th>Owner Name</th>
              <th>Email</th>
              <th>Menu Items</th>
              <th>Total Orders</th>
              <th>Revenue Earned</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSellers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  No sellers registered.
                </td>
              </tr>
            ) : (
              filteredSellers.map((s) => {
                const stats = getSellerStats(s.id);
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700, color: '#111827' }}>{s.shop_name || 'N/A'}</td>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td style={{ fontWeight: 600 }}>{stats.productsCount} items</td>
                    <td style={{ fontWeight: 600 }}>{stats.ordersCount} orders</td>
                    <td style={{ color: '#059669', fontWeight: 600 }}>₹{stats.revenue.toFixed(2)}</td>
                    <td>
                      <button 
                        onClick={() => handleViewDetails(s)}
                        style={{ 
                          padding: '6px 12px', background: '#dbeafe', color: '#2563eb', 
                          borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, 
                          display: 'flex', alignItems: 'center', gap: '4px', border: 'none', cursor: 'pointer' 
                        }}
                      >
                        <FiEye size={12} /> Inspect Store
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Seller details modal */}
      {showModal && selectedSeller && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 1200, backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: 'white', width: '92%', maxWidth: '850px', borderRadius: '12px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', background: '#dbeafe', color: '#2563eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem'
                }}>
                  🏪
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#111827' }}>{selectedSeller.shop_name}</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Owner: {selectedSeller.name} | {selectedSeller.email}</p>
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
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>REVENUE</span>
                  <strong style={{ fontSize: '1.1rem', color: '#059669' }}>₹{selectedSeller.revenue.toFixed(2)}</strong>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>TOTAL ORDERS</span>
                  <strong style={{ fontSize: '1.1rem', color: '#374151' }}>{selectedSeller.ordersCount} orders</strong>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>MENU PRODUCTS</span>
                  <strong style={{ fontSize: '1.1rem', color: '#374151' }}>{selectedSeller.productsCount} items</strong>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: '4px' }}>UNIQUE BUYERS</span>
                  <strong style={{ fontSize: '1.1rem', color: '#374151' }}>{selectedSeller.customersCount} clients</strong>
                </div>
              </div>

              {/* Grid: Left - Products list, Right - Incoming Orders (Taking Orders) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* Product Catalog */}
                <div>
                  <h4 style={{ fontSize: '1.05rem', color: '#111827', marginBottom: '12px', borderBottom: '2px solid #f3f4f6', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiShoppingBag /> Menu Items ({selectedSeller.productsCount})
                  </h4>
                  {selectedSeller.products.length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>No products listed.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                      {selectedSeller.products.map(product => (
                        <div key={product.product_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block' }}>{product.name}</span>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Category: {product.category} | Stock: {product.stock_count}</span>
                          </div>
                          <span style={{ fontWeight: 700, color: '#374151', fontSize: '0.9rem' }}>₹{product.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Orders taking */}
                <div>
                  <h4 style={{ fontSize: '1.05rem', color: '#111827', marginBottom: '12px', borderBottom: '2px solid #f3f4f6', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiPackage /> Taking Orders History ({selectedSeller.ordersCount})
                  </h4>
                  {selectedSeller.recentOrders.length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>No orders placed with this store.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                      {selectedSeller.recentOrders.map(order => (
                        <div key={order.order_id} style={{ padding: '10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>#{order.order_id}</span>
                            <span className={`status-badge ${order.status}`} style={{ fontSize: '0.65rem' }}>{order.status.replace(/_/g, ' ')}</span>
                          </div>
                          <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: '#4b5563' }}>
                            <strong>Buyer:</strong> {order.buyer_name} ({order.buyer_phone})
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {order.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}
                            </span>
                            <strong style={{ fontSize: '0.85rem', color: '#111827' }}>₹{order.total_amount?.toFixed(2)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
