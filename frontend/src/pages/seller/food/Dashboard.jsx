import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { FiPackage, FiDollarSign, FiUsers, FiTrendingUp, FiCheck, FiX, FiMessageSquare, FiChevronLeft, FiChevronRight, FiStar, FiZap, FiAward } from 'react-icons/fi';
import { orderService } from '../../../services/orderService';
import { productService } from '../../../services/productService';
import OrderChat from '../../../components/common/OrderChat';
import '../../../styles/dashboard.css';

/* ── Inline styles for the Trending Carousel & Ads (Slate + Indigo palette) ── */
const S = {
  // Carousel wrapper
  carouselSection: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    borderRadius: '20px',
    padding: '28px',
    marginBottom: '24px',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    boxShadow: '0 8px 32px rgba(15, 23, 42, 0.4)',
  },
  carouselGlow: {
    position: 'absolute',
    top: '-60%',
    right: '-10%',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  carouselHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    position: 'relative',
    zIndex: 1,
  },
  carouselTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  carouselTitleText: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#f8fafc',
    letterSpacing: '-0.02em',
  },
  trendingBadge: {
    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: '999px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  arrowBtnGroup: {
    display: 'flex',
    gap: '8px',
  },
  arrowBtn: (disabled) => ({
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: disabled ? 'rgba(51, 65, 85, 0.3)' : 'rgba(99, 102, 241, 0.15)',
    border: `1px solid ${disabled ? 'rgba(51, 65, 85, 0.2)' : 'rgba(99, 102, 241, 0.3)'}`,
    color: disabled ? '#475569' : '#a5b4fc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
  }),
  // Carousel track
  carouselTrack: {
    display: 'flex',
    gap: '16px',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  // Individual product card in carousel
  trendCard: (isActive) => ({
    minWidth: '220px',
    maxWidth: '220px',
    background: isActive
      ? 'linear-gradient(145deg, rgba(99, 102, 241, 0.15), rgba(30, 41, 59, 0.9))'
      : 'rgba(30, 41, 59, 0.6)',
    border: `1px solid ${isActive ? 'rgba(99, 102, 241, 0.35)' : 'rgba(51, 65, 85, 0.4)'}`,
    borderRadius: '16px',
    overflow: 'hidden',
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    flexShrink: 0,
    transform: isActive ? 'scale(1.02)' : 'scale(1)',
  }),
  trendCardImg: {
    height: '120px',
    background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.8rem',
    position: 'relative',
    overflow: 'hidden',
  },
  trendRankBadge: (rank) => ({
    position: 'absolute',
    top: '8px',
    left: '8px',
    background: rank === 1 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : rank === 2 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : 'linear-gradient(135deg, #a16207, #854d0e)',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: 800,
    padding: '2px 8px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  }),
  trendSalesTag: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    background: 'rgba(16, 185, 129, 0.9)',
    backdropFilter: 'blur(8px)',
    color: '#fff',
    fontSize: '0.6rem',
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: '4px',
  },
  trendCardBody: {
    padding: '14px',
  },
  trendCardName: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: '#f1f5f9',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  trendCardCategory: {
    fontSize: '0.72rem',
    color: '#94a3b8',
    marginBottom: '8px',
  },
  trendCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendCardPrice: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#a5b4fc',
  },
  trendCardStock: (inStock) => ({
    fontSize: '0.65rem',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '999px',
    background: inStock ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
    color: inStock ? '#34d399' : '#f87171',
  }),
  // Dots
  dotsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '18px',
    position: 'relative',
    zIndex: 1,
  },
  dot: (isActive) => ({
    width: isActive ? '24px' : '8px',
    height: '8px',
    borderRadius: '999px',
    background: isActive ? 'linear-gradient(90deg, #6366f1, #818cf8)' : 'rgba(71, 85, 105, 0.5)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    padding: 0,
  }),

  // ── Ads / Promotions Section ──
  adsSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
  },
  adCard: (gradient) => ({
    background: gradient,
    borderRadius: '16px',
    padding: '22px 26px',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '1px solid rgba(255,255,255,0.08)',
    minHeight: '130px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }),
  adGlow: {
    position: 'absolute',
    bottom: '-40px',
    right: '-40px',
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
    pointerEvents: 'none',
  },
  adTag: {
    fontSize: '0.6rem',
    fontWeight: 700,
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    color: '#fff',
    padding: '3px 10px',
    borderRadius: '999px',
    display: 'inline-block',
    width: 'fit-content',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: '10px',
  },
  adTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1.3,
    marginBottom: '6px',
  },
  adSubtitle: {
    fontSize: '0.78rem',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.4,
  },
  adCta: {
    marginTop: '12px',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#fff',
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    padding: '6px 14px',
    cursor: 'pointer',
    width: 'fit-content',
    transition: 'all 0.2s ease',
  },
};

// ── Emoji map for product categories ──
const CATEGORY_EMOJI = {
  starters: '🍢',
  'main course': '🍛',
  shakes: '🥤',
  desserts: '🍰',
  beverages: '☕',
  snacks: '🍟',
  rice: '🍚',
  dal: '🫘',
  bread: '🍞',
  dairy: '🥛',
  fruits: '🍎',
  vegetables: '🥬',
};

const getCategoryEmoji = (cat) => {
  if (!cat) return '📦';
  const lower = cat.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '📦';
};

export default function SellerFoodDashboard({ domain = 'food' }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatOrder, setSelectedChatOrder] = useState(null);

  // Carousel state
  const [carouselIndex, setCarouselIndex] = useState(0);
  const trackRef = useRef(null);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
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

  const fetchProducts = async () => {
    try {
      const data = await productService.getSellerProducts(domain);
      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to fetch seller products for trending", error);
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

  // ── Trending products: sort by stock_count desc as a proxy for popularity ──
  const trendingProducts = [...products]
    .sort((a, b) => (b.stock_count || 0) - (a.stock_count || 0))
    .slice(0, 10);

  // Items visible per page in carousel
  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.max(1, Math.ceil(trendingProducts.length / ITEMS_PER_PAGE));

  const scrollToPage = useCallback((pageIdx) => {
    const clamped = Math.max(0, Math.min(pageIdx, totalPages - 1));
    setCarouselIndex(clamped);
    if (trackRef.current) {
      const cardWidth = 220 + 16; // card width + gap
      trackRef.current.style.transition = 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)';
      trackRef.current.style.transform = `translateX(-${clamped * ITEMS_PER_PAGE * cardWidth}px)`;
    }
  }, [totalPages]);

  const goNext = () => scrollToPage(carouselIndex + 1);
  const goPrev = () => scrollToPage(carouselIndex - 1);

  // Metrics calculations
  const todayRevenue = orders
    .filter(o => o.status === 'completed' || o.status === 'active' || o.status === 'delivered')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  
  const totalCustomers = new Set(orders.map(o => o.buyer_id).filter(Boolean)).size;

  return (
    <div className="dashboard-page" id="seller-food-dashboard">
      <div className="page-header">
        <h1>Welcome, {user?.shop_name || user?.name} 🏪</h1>
        <p>Manage your {domain} orders and inventory</p>
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

      {/* ═══════════════════════════════════════════════
          🔥 TRENDING NOW — Product Carousel
          ═══════════════════════════════════════════════ */}
      {trendingProducts.length > 0 && (
        <div style={S.carouselSection} id="trending-carousel">
          <div style={S.carouselGlow} />

          {/* Header */}
          <div style={S.carouselHeader}>
            <div style={S.carouselTitle}>
              <FiTrendingUp size={20} color="#818cf8" />
              <span style={S.carouselTitleText}>Trending Now</span>
              <span style={S.trendingBadge}>🔥 Hot</span>
            </div>
            <div style={S.arrowBtnGroup}>
              <button
                style={S.arrowBtn(carouselIndex === 0)}
                onClick={goPrev}
                disabled={carouselIndex === 0}
                aria-label="Previous"
              >
                <FiChevronLeft size={18} />
              </button>
              <button
                style={S.arrowBtn(carouselIndex >= totalPages - 1)}
                onClick={goNext}
                disabled={carouselIndex >= totalPages - 1}
                aria-label="Next"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Track */}
          <div style={{ overflow: 'hidden' }}>
            <div ref={trackRef} style={S.carouselTrack}>
              {trendingProducts.map((product, idx) => {
                const rank = idx + 1;
                const inStock = product.in_stock !== false && (product.stock_count || 0) > 0;
                const sales = Math.floor(Math.random() * 80) + 20; // simulated
                return (
                  <div
                    key={product.product_id || idx}
                    style={S.trendCard(
                      idx >= carouselIndex * ITEMS_PER_PAGE &&
                      idx < (carouselIndex + 1) * ITEMS_PER_PAGE
                    )}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={S.trendCardImg}>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span>{getCategoryEmoji(product.category)}</span>
                      )}
                      {rank <= 3 && (
                        <div style={S.trendRankBadge(rank)}>
                          <FiAward size={10} /> #{rank}
                        </div>
                      )}
                      <div style={S.trendSalesTag}>
                        {sales} sold
                      </div>
                    </div>
                    <div style={S.trendCardBody}>
                      <div style={S.trendCardName}>{product.name}</div>
                      <div style={S.trendCardCategory}>
                        {product.category || 'Uncategorized'} {product.subcategory ? `› ${product.subcategory}` : ''}
                      </div>
                      <div style={S.trendCardFooter}>
                        <span style={S.trendCardPrice}>₹{product.price}</span>
                        <span style={S.trendCardStock(inStock)}>
                          {inStock ? `${product.stock_count} left` : 'Out'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dots Navigation */}
          <div style={S.dotsContainer}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                style={S.dot(i === carouselIndex)}
                onClick={() => scrollToPage(i)}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          📢 ADS & PROMOTIONS BANNERS
          ═══════════════════════════════════════════════ */}
      <div style={S.adsSection} id="seller-ads">
        <div
          style={S.adCard('linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)')}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(99, 102, 241, 0.3)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={S.adGlow} />
          <div>
            <div style={S.adTag}>⚡ Sponsored</div>
            <div style={S.adTitle}>Boost Your Top Products</div>
            <div style={S.adSubtitle}>
              Promote your best sellers to appear first in buyer search results. Get up to 3x more visibility.
            </div>
          </div>
          <button style={S.adCta} onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.25)'; }} onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.15)'; }}>
            Start Promotion →
          </button>
        </div>

        <div
          style={S.adCard('linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #2dd4bf 100%)')}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(20, 184, 166, 0.3)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={S.adGlow} />
          <div>
            <div style={S.adTag}>🎯 FreshKart Ads</div>
            <div style={S.adTitle}>Weekend Flash Sale Setup</div>
            <div style={S.adSubtitle}>
              Create time-limited offers with automated discount badges. Drive 40% more orders on weekends.
            </div>
          </div>
          <button style={S.adCta} onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.25)'; }} onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.15)'; }}>
            Create Flash Sale →
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          📦 INCOMING ORDERS TABLE (scrollable)
          ═══════════════════════════════════════════════ */}
      <div className="content-card">
        <div className="content-card-header">
          <h2>📦 Incoming Orders</h2>
          <span className="status-badge pending">{pendingOrders} Pending</span>
        </div>
        <div style={{ maxHeight: '460px', overflowY: 'auto', overflowX: 'auto' }}>
          {loading ? (
            <p style={{ padding: '20px' }}>Loading orders...</p>
          ) : (
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, background: 'var(--color-white)', zIndex: 2 }}>
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
