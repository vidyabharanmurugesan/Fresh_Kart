import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiShoppingCart, FiFilter, FiInfo, FiX, FiCheck, FiPlus, FiMinus, FiTag, FiChevronLeft, FiChevronRight, FiStar, FiAward, FiPlay, FiPause } from 'react-icons/fi';
import { productService } from '../../../services/productService';
import { useCart } from '../../../context/CartContext';
import '../../../styles/dashboard.css';

/* ── OTT-style Hero Banner + White Trending Theme ── */

/* Keyframe animation CSS injected once */
const OTT_STYLE_TAG_ID = 'ott-hero-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(OTT_STYLE_TAG_ID)) {
  const styleEl = document.createElement('style');
  styleEl.id = OTT_STYLE_TAG_ID;
  styleEl.textContent = `
    @keyframes ottProgressFill {
      from { width: 0%; }
      to   { width: 100%; }
    }
    @keyframes ottFadeSlideIn {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ottPulseGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.3); }
      50%      { box-shadow: 0 0 18px 4px rgba(16,185,129,0.15); }
    }
    @keyframes ottShimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    .ott-hero-section:hover .ott-hero-overlay {
      background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.92) 55%, #ffffff 100%) !important;
    }
  `;
  document.head.appendChild(styleEl);
}

const AUTO_PLAY_INTERVAL = 5000; // 5 seconds per slide

const S = {
  /* ── OTT Hero Banner (White / Light Theme) ── */
  heroSection: {
    position: 'relative',
    borderRadius: '20px',
    marginBottom: '24px',
    overflow: 'hidden',
    background: '#ffffff',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
    border: '1px solid rgba(0,0,0,0.06)',
  },
  heroViewport: {
    position: 'relative',
    width: '100%',
    height: '340px',
    overflow: 'hidden',
  },
  heroSlide: (isActive, direction) => ({
    position: 'absolute',
    inset: 0,
    display: 'flex',
    opacity: isActive ? 1 : 0,
    transform: isActive ? 'scale(1)' : 'scale(1.08)',
    transition: 'opacity 0.8s cubic-bezier(0.4,0,0.2,1), transform 1.2s cubic-bezier(0.4,0,0.2,1)',
    pointerEvents: isActive ? 'auto' : 'none',
    zIndex: isActive ? 2 : 1,
  }),
  heroImageArea: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 6s ease-out',
  },
  heroEmojiPlaceholder: {
    fontSize: '6rem',
    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))',
    background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 50%, #ffffff 100%)',
    transition: 'background 0.4s ease',
    zIndex: 2,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '32px 36px',
    zIndex: 3,
    animation: 'ottFadeSlideIn 0.6s ease-out both',
  },
  heroRankBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: 800,
    padding: '4px 14px',
    borderRadius: '999px',
    marginBottom: '10px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
  },
  heroTitle: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: '#111827',
    lineHeight: 1.2,
    marginBottom: '6px',
    letterSpacing: '-0.02em',
  },
  heroMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  heroCategory: {
    fontSize: '0.82rem',
    color: '#6b7280',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  heroPrice: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#059669',
  },
  heroSalesBadge: {
    background: 'rgba(16,185,129,0.1)',
    color: '#059669',
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: '999px',
    border: '1px solid rgba(16,185,129,0.2)',
  },
  heroStockBadge: (inStock) => ({
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: '999px',
    background: inStock ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
    color: inStock ? '#059669' : '#dc2626',
    border: `1px solid ${inStock ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
  }),
  heroCTA: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 22px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.88rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
    animation: 'ottPulseGlow 2.5s infinite',
  },

  /* ── Bottom Bar: progress indicators + controls ── */
  heroBottomBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 28px',
    background: '#ffffff',
    borderTop: '1px solid rgba(0,0,0,0.05)',
  },
  heroProgressPill: (isActive, isCompleted) => ({
    flex: 1,
    height: '4px',
    borderRadius: '999px',
    background: isCompleted ? '#10b981' : 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.3s ease',
  }),
  heroProgressFill: (isActive, isPaused) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #10b981, #059669)',
    animation: isActive ? `ottProgressFill ${AUTO_PLAY_INTERVAL}ms linear forwards` : 'none',
    animationPlayState: isPaused ? 'paused' : 'running',
    width: isActive ? undefined : '0%',
  }),
  heroPlayPause: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.08)',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  heroNavBtn: (disabled) => ({
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: disabled ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.06)',
    border: `1px solid ${disabled ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.08)'}`,
    color: disabled ? '#d1d5db' : '#374151',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  }),
  heroTitleBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 28px 0 28px',
    background: '#ffffff',
  },
  heroTitleLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  heroTitleText: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#111827',
    letterSpacing: '-0.01em',
  },
  heroTrendBadge: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: '999px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  heroCounter: {
    fontSize: '0.8rem',
    color: '#9ca3af',
    fontWeight: 500,
  },
};

const CATEGORY_EMOJI = {
  starters: '',
  'main course': '',
  shakes: '',
  desserts: '',
  beverages: '',
};

const getCategoryEmoji = (cat) => {
  if (!cat) return '';
  const lower = cat.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '';
};

export default function ProductDisplay({ domain = 'food' }) {
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get('sellerId');
  const shopName = searchParams.get('shopName') || (sellerId ? 'Shop' : 'All Shops');
  const categoryParam = searchParams.get('category');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  // Filter and sort states
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('none');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedDietary, setSelectedDietary] = useState('All');

  // Product details modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVariant, setModalVariant] = useState(null);
  const [modalAddons, setModalAddons] = useState([]);
  const [modalQuantity, setModalQuantity] = useState(1);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      setShowFilterMenu(true);
    }
  }, [categoryParam]);
  
  useEffect(() => {
    if (sellerId) {
      fetchProducts();
    } else {
      (async () => {
        try {
          setLoading(true);
          const data = await productService.getAllProducts(domain);
          setProducts(data.products || []);
        } catch (error) {
          console.error('Failed to fetch all products', error);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [sellerId, domain]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getShopProducts(sellerId, domain);
      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to fetch shop products", error);
    } finally {
      setLoading(false);
    }
  };

  const uniqueCategories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products
    .filter(product => {
      if (product.domain && product.domain.toLowerCase() !== domain.toLowerCase()) {
        return false;
      }
      if (selectedCategory !== 'All' && product.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (inStockOnly && product.stock_count <= 0) {
        return false;
      }
      if (domain === 'food' && selectedDietary !== 'All' && product.dietary_tag !== selectedDietary) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') {
        return a.price - b.price;
      }
      if (sortBy === 'price-desc') {
        return b.price - a.price;
      }
      return 0;
    });

  // Trending products — highest selling in this shop
  const trendingProducts = [...filteredProducts]
    .sort((a, b) => (b.stock_count || 0) - (a.stock_count || 0))
    .slice(0, 10);

  // OTT Hero Banner state
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef(null);
  const slideKeyRef = useRef(0); // forces progress bar re-animation

  // Stable "sales" numbers per product (so they don't flicker on re-renders)
  const salesMapRef = useRef(new Map());
  const getSalesCount = (productId) => {
    if (!salesMapRef.current.has(productId)) {
      salesMapRef.current.set(productId, Math.floor(Math.random() * 40) + 10);
    }
    return salesMapRef.current.get(productId);
  };

  // Auto-advance slides (OTT behaviour)
  useEffect(() => {
    if (isPaused || trendingProducts.length <= 1) return;
    autoPlayRef.current = setTimeout(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % trendingProducts.length;
        slideKeyRef.current += 1;
        return next;
      });
    }, AUTO_PLAY_INTERVAL);
    return () => clearTimeout(autoPlayRef.current);
  }, [activeSlide, isPaused, trendingProducts.length]);

  const goToSlide = (idx) => {
    setActiveSlide(idx);
    slideKeyRef.current += 1;
    clearTimeout(autoPlayRef.current);
  };
  const heroNext = () => goToSlide((activeSlide + 1) % trendingProducts.length);
  const heroPrev = () => goToSlide((activeSlide - 1 + trendingProducts.length) % trendingProducts.length);
  const togglePause = () => setIsPaused((p) => !p);

  // Open details modal & initialize options
  const handleOpenDetails = (product) => {
    setSelectedProduct(product);
    setModalQuantity(1);
    
    if (product.variants && product.variants.length > 0) {
      setModalVariant(product.variants[0]);
    } else {
      setModalVariant(null);
    }
    
    setModalAddons([]);
  };

  const handleToggleAddon = (addon) => {
    setModalAddons(prev => {
      const exists = prev.find(a => a.name === addon.name);
      if (exists) {
        return prev.filter(a => a.name !== addon.name);
      }
      return [...prev, addon];
    });
  };

  const getModalTotalPrice = () => {
    if (!selectedProduct) return 0;
    let price = parseFloat(selectedProduct.price);
    
    if (modalVariant && modalVariant.price) {
      price = parseFloat(modalVariant.price);
    }
    
    const addonsPrice = modalAddons.reduce((sum, a) => sum + parseFloat(a.price || 0), 0);
    return (price + addonsPrice) * modalQuantity;
  };

  const handleAddCustomizedToCart = () => {
    if (!selectedProduct) return;
    
    const basePrice = modalVariant && modalVariant.price ? parseFloat(modalVariant.price) : parseFloat(selectedProduct.price);
    const addonsPrice = modalAddons.reduce((sum, a) => sum + parseFloat(a.price || 0), 0);
    const itemPrice = basePrice + addonsPrice;

    const customizedProduct = {
      ...selectedProduct,
      product_id: `${selectedProduct.product_id}${modalVariant ? `-${modalVariant.name}` : ''}${modalAddons.length > 0 ? `-${modalAddons.map(a => a.name).join('-')}` : ''}`,
      original_product_id: selectedProduct.product_id,
      name: `${selectedProduct.name}${modalVariant ? ` (${modalVariant.name})` : ''}${modalAddons.length > 0 ? ` + [${modalAddons.map(a => a.name).join(', ')}]` : ''}`,
      price: itemPrice,
      custom_details: {
        variant: modalVariant,
        addons: modalAddons
      }
    };

    for (let q = 0; q < modalQuantity; q++) {
      addToCart(customizedProduct, sellerId || selectedProduct.seller_id);
    }

    setSelectedProduct(null);
  };

  return (
    <div className="dashboard-page" id={`buyer-${domain}-products`}>
      <div className="page-header">
        <h1>{sellerId ? shopName : `Browse ${domain === 'food' ? 'Food & Restaurants' : 'Grocery Catalogue'}`}</h1>
        <p>{sellerId ? 'Order fresh selections directly from this outlet' : 'Explore choices across all shops'}</p>
        {!sellerId && (
          <Link to={`/buyer/${domain}/home`} style={{ display: 'inline-block', marginTop: '8px', padding: '8px 12px', background: '#10b981', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
             Browse Shops & Outlets
          </Link>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
           OTT-STYLE HERO BANNER — Trending Products
          ═══════════════════════════════════════════════ */}
      {sellerId && trendingProducts.length > 0 && (
        <div style={S.heroSection} className="ott-hero-section" id="trending-hero">
          {/* Title bar */}
          <div style={S.heroTitleBar}>
            <div style={S.heroTitleLeft}>
              <FiStar size={18} color="#10b981" />
              <span style={S.heroTitleText}>Trending at {shopName}</span>
              <span style={S.heroTrendBadge}> Top Sellers</span>
            </div>
            <span style={S.heroCounter}>{activeSlide + 1} / {trendingProducts.length}</span>
          </div>

          {/* Hero viewport */}
          <div style={S.heroViewport}>
            {trendingProducts.map((product, idx) => {
              const isActive = idx === activeSlide;
              const rank = idx + 1;
              const inStock = product.stock_count > 0;
              const sales = getSalesCount(product.product_id || idx);
              const hasOptions = (product.variants && product.variants.length > 0) || (product.addons && product.addons.length > 0);

              return (
                <div key={product.product_id || idx} style={S.heroSlide(isActive)}>
                  {/* Background image */}
                  <div style={S.heroImageArea}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{
                          ...S.heroImage,
                          transform: isActive ? 'scale(1.05)' : 'scale(1)',
                        }}
                      />
                    ) : (
                      <div style={S.heroEmojiPlaceholder}>
                        {getCategoryEmoji(product.category)}
                      </div>
                    )}
                  </div>

                  {/* Gradient overlay */}
                  <div style={S.heroOverlay} className="ott-hero-overlay" />

                  {/* Text content (bottom-aligned) */}
                  {isActive && (
                    <div style={S.heroContent} key={`content-${slideKeyRef.current}`}>
                      {rank <= 3 && (
                        <div style={S.heroRankBadge}>
                          <FiAward size={12} /> #{rank} Best Seller
                        </div>
                      )}
                      <div style={S.heroTitle}>{product.name}</div>
                      <div style={S.heroMeta}>
                        <span style={S.heroCategory}>
                          {getCategoryEmoji(product.category)} {product.category || 'Uncategorized'}
                        </span>
                        <span style={S.heroPrice}>₹{product.price}</span>
                        <span style={S.heroSalesBadge}>{sales}+ ordered today</span>
                        <span style={S.heroStockBadge(inStock)}>
                          {inStock ? `${product.stock_count} in stock` : 'Out of Stock'}
                        </span>
                      </div>
                      {inStock && (
                        <button
                          style={S.heroCTA}
                          onClick={(e) => {
                            e.stopPropagation();
                            hasOptions ? handleOpenDetails(product) : addToCart(product, sellerId || product.seller_id);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,185,129,0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.3)';
                          }}
                        >
                          <FiShoppingCart size={16} />
                          {hasOptions ? 'View Options' : 'Add to Cart'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom bar: progress pills + controls */}
          <div style={S.heroBottomBar}>
            <button
              style={S.heroNavBtn(false)}
              onClick={heroPrev}
              aria-label="Previous"
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; }}
            >
              <FiChevronLeft size={16} />
            </button>

            {trendingProducts.map((_, i) => (
              <div
                key={i}
                style={S.heroProgressPill(i === activeSlide, i < activeSlide)}
                onClick={() => goToSlide(i)}
              >
                {i === activeSlide && (
                  <div
                    key={`fill-${slideKeyRef.current}`}
                    style={S.heroProgressFill(true, isPaused)}
                  />
                )}
              </div>
            ))}


            <button
              style={S.heroNavBtn(false)}
              onClick={heroNext}
              aria-label="Next"
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; }}
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
      {/* ═══════════════════════════════════════════════
           SCROLLABLE PRODUCT INVENTORY TABLE
          ═══════════════════════════════════════════════ */}
      <div className="content-card">
        <div className="content-card-header">
          <h2> {sellerId ? 'Full Store Menu' : 'All Selections'}</h2>
          <button 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', 
              background: showFilterMenu ? '#d1fae5' : '#f3f4f6', 
              borderRadius: '8px', fontSize: '0.85rem', color: showFilterMenu ? '#059669' : '#374151', 
              fontWeight: 500, border: 'none', cursor: 'pointer' 
            }}
          >
            <FiFilter size={14} /> Filter & Sort {selectedCategory !== 'All' || sortBy !== 'none' || inStockOnly || selectedDietary !== 'All' ? '•' : ''}
          </button>
        </div>

        {showFilterMenu && (
          <div style={{
            padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb',
            marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: '#4b5563' }}>Category</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem', background: 'white' }}
              >
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: '#4b5563' }}>Sort By Price</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem', background: 'white' }}
              >
                <option value="none">None</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            {domain === 'food' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: '#4b5563' }}>Dietary Filter</label>
                <select 
                  value={selectedDietary} 
                  onChange={(e) => setSelectedDietary(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem', background: 'white' }}
                >
                  <option value="All">All Food Types</option>
                  <option value="veg"> Pure Veg</option>
                  <option value="egg"> Egg Only</option>
                  <option value="non-veg"> Non-Veg Only</option>
                </select>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '22px' }}>
              <input 
                type="checkbox" 
                id="instock-checkbox" 
                checked={inStockOnly} 
                onChange={(e) => setInStockOnly(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="instock-checkbox" style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', cursor: 'pointer' }}>In Stock Only</label>
            </div>

            <button 
              onClick={() => {
                setSelectedCategory('All');
                setSortBy('none');
                setInStockOnly(false);
                setSelectedDietary('All');
              }}
              style={{
                marginLeft: 'auto', padding: '8px 16px', background: '#e5e7eb', border: 'none',
                borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: '#4b5563'
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
        
        {loading ? (
          <p style={{ padding: '20px' }}>Loading products...</p>
        ) : (
          <div style={{ maxHeight: '480px', overflowY: 'auto', overflowX: 'auto' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, background: 'var(--color-white)', zIndex: 2 }}>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Specification</th>
                  <th>Price</th>
                  <th>Stock Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              {filteredProducts.length === 0 && (
                <tbody>
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                      No items match your filters.
                    </td>
                  </tr>
                </tbody>
              )}
              {(() => {
                const groupedProducts = filteredProducts.reduce((acc, product) => {
                  let groupKey = product.category || 'Other';
                  if (domain === 'food') {
                    const dietary = product.dietary_tag ? product.dietary_tag.toLowerCase() : '';
                    const isVeg = dietary === 'veg';
                    const isNonVeg = dietary === 'non-veg';
                    const cat = (product.category || '').toLowerCase();
                    
                    if (cat.includes('snack') || cat.includes('starter')) {
                        groupKey = isVeg ? 'Snacks (Veg)' : (isNonVeg ? 'Snacks (Non-Veg)' : 'Snacks');
                    } else if (cat.includes('food') || cat.includes('main course') || cat.includes('meal')) {
                        groupKey = isVeg ? 'Food (Veg)' : (isNonVeg ? 'Food (Non-Veg)' : 'Food');
                    } else {
                        groupKey = isVeg ? `${groupKey} (Veg)` : (isNonVeg ? `${groupKey} (Non-Veg)` : groupKey);
                    }
                  }
                  if (!acc[groupKey]) acc[groupKey] = [];
                  acc[groupKey].push(product);
                  return acc;
                }, {});

                return Object.entries(groupedProducts).map(([groupName, groupItems]) => (
                  <tbody key={groupName}>
                    <tr>
                      <td colSpan="6" style={{ background: '#f9fafb', fontWeight: 700, fontSize: '1.05rem', color: '#374151', padding: '12px 16px', borderTop: '2px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                        {groupName}
                      </td>
                    </tr>
                    {groupItems.map((product) => {
                      const inStock = product.stock_count > 0;
                      const hasOptions = (product.variants && product.variants.length > 0) || (product.addons && product.addons.length > 0);
                      const showSlashedMRP = domain === 'grocery' && product.mrp && parseFloat(product.mrp) > parseFloat(product.price);
                      return (
                        <tr key={product.product_id} style={{ cursor: 'pointer' }} onClick={() => handleOpenDetails(product)}>
                          <td style={{ fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '1.25rem' }}>{getCategoryEmoji(product.category)}</span>
                              <div>
                                {domain === 'grocery' && product.brand_name && (
                                  <span style={{ fontSize: '0.7rem', display: 'block', color: '#fbbf24', textTransform: 'uppercase' }}>{product.brand_name}</span>
                                )}
                                <span style={{ color: '#1f2937' }}>{product.name}</span>
                              </div>
                            </div>
                          </td>
                          <td>{product.category || 'General'}</td>
                          <td>
                            {domain === 'food' ? (
                              <span className={`status-badge ${product.dietary_tag === 'veg' ? 'active' : product.dietary_tag === 'non-veg' ? 'cancelled' : 'pending'}`}>
                                {product.dietary_tag ? product.dietary_tag.toUpperCase() : 'VEG'}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#4b5563' }}>{product.pack_size || 'N/A'}</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600, color: '#059669' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {showSlashedMRP && (
                                <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.75rem', fontWeight: 'normal' }}>MRP ₹{product.mrp}</span>
                              )}
                              <span>₹{product.price}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${inStock ? 'active' : 'cancelled'}`}>
                              {inStock ? `${product.stock_count} units` : 'Out of Stock'}
                            </span>
                          </td>
                          <td>
                            {inStock ? (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  hasOptions ? handleOpenDetails(product) : addToCart(product, sellerId || product.seller_id);
                                }} 
                                style={{
                                  padding: '8px 14px', background: '#10b981', border: 'none', cursor: 'pointer',
                                  color: 'white', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                              >
                                <FiShoppingCart size={12} />
                                {hasOptions ? 'Options' : 'Add'}
                              </button>
                            ) : (
                              <span style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', borderRadius: '6px', fontWeight: 600 }}>Unavailable</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                ));
              })()}
            </table>
          </div>
        )}
      </div>

      {/* DETAILS / CUSTOMIZATION MODAL */}
      {selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '30px', borderRadius: '16px', width: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.15)', color: '#f8fafc', position: 'relative' }}>
            
            <button 
              onClick={() => setSelectedProduct(null)} 
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <FiX size={24} />
            </button>

            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ width: '100%', height: '120px', background: '#1e293b', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '3rem' }}>{domain === 'food' ? '' : ''}</span>
                  )}
                </div>
                <div>
                  {domain === 'grocery' && selectedProduct.brand_name && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>{selectedProduct.brand_name}</span>
                  )}
                  <h2 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: '#f8fafc' }}>{selectedProduct.name}</h2>
                  <div style={{ color: '#34d399', fontWeight: 700, fontSize: '1.1rem' }}>
                    ₹{modalVariant ? modalVariant.price : selectedProduct.price}
                    {domain === 'grocery' && selectedProduct.mrp && parseFloat(selectedProduct.mrp) > parseFloat(selectedProduct.price) && (
                      <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.85rem', marginLeft: '8px', fontWeight: 'normal' }}>MRP ₹{selectedProduct.mrp}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '8px' }}>Category: {selectedProduct.category}</div>
                </div>
              </div>

              {selectedProduct.description && (
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(148, 163, 184, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Product Description</span>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.4', color: '#cbd5e1' }}>{selectedProduct.description}</p>
                </div>
              )}

              {/* Food Customizations */}
              {domain === 'food' && (
                <div>
                  {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Select Variant (Choose One)</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedProduct.variants.map((v, i) => (
                          <label key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.15)', cursor: 'pointer', color: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                              <input 
                                type="radio" 
                                name="food-variant" 
                                checked={modalVariant?.name === v.name}
                                onChange={() => setModalVariant(v)}
                                style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                              />
                              <strong>{v.name}</strong>
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>₹{v.price}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.addons && selectedProduct.addons.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Add-ons / Modifiers (Optional)</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedProduct.addons.map((a, i) => {
                          const isChecked = !!modalAddons.find(item => item.name === a.name);
                          return (
                            <label key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.15)', cursor: 'pointer', color: '#f8fafc' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => handleToggleAddon(a)}
                                  style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                                />
                                <span>{a.name}</span>
                              </div>
                              <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>+₹{a.price}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.8rem', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(148, 163, 184, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: '#cbd5e1' }}>
                    {selectedProduct.serves_how_many && <div> <strong>Serves:</strong> {selectedProduct.serves_how_many} Person(s)</div>}
                    {selectedProduct.spice_level && <div> <strong>Spice Level:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedProduct.spice_level}</span></div>}
                    {selectedProduct.allergen_info && <div style={{ gridColumn: 'span 2', marginTop: '5px' }}> <strong>Allergens:</strong> {selectedProduct.allergen_info}</div>}
                  </div>

                  {selectedProduct.is_cake && (
                    <div style={{ background: 'rgba(6, 78, 59, 0.25)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.8rem', color: '#34d399', marginBottom: '20px' }}>
                       <strong>Cake Info:</strong> Weight: {selectedProduct.cake_weight || '500g'} | {selectedProduct.cake_dietary === 'eggless' ? 'Eggless' : 'Contains Egg'}
                    </div>
                  )}

                  {selectedProduct.is_combo && selectedProduct.combo_items && (
                    <div style={{ background: 'rgba(30, 58, 138, 0.25)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '0.8rem', color: '#93c5fd', marginBottom: '20px' }}>
                       <strong>Bundled Items in Combo/Thali:</strong>
                      <ul style={{ paddingLeft: '20px', margin: '5px 0 0 0', color: '#93c5fd' }}>
                        {selectedProduct.combo_items.map((ci, idx) => (
                          <li key={idx}>{ci.name} (x{ci.qty})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Grocery Specs */}
              {domain === 'grocery' && (
                <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedProduct.nutritional_info && (
                    <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(148, 163, 184, 0.1)', padding: '12px', borderRadius: '8px' }}>
                      <strong> Nutritional Info (per 100g)</strong>
                      <p style={{ margin: '5px 0 0 0', color: '#cbd5e1' }}>{selectedProduct.nutritional_info}</p>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {selectedProduct.shelf_life && (
                      <div><strong> Expiry / Shelf Life:</strong><br/><span style={{ color: '#cbd5e1' }}>{selectedProduct.shelf_life}</span></div>
                    )}
                    {selectedProduct.storage_instructions && (
                      <div><strong> Storage Instructions:</strong><br/><span style={{ color: '#cbd5e1' }}>{selectedProduct.storage_instructions}</span></div>
                    )}
                  </div>

                  {selectedProduct.manufacturer_details && (
                    <div><strong> Manufacturer & Marketer:</strong><br/><span style={{ color: '#cbd5e1' }}>{selectedProduct.manufacturer_details}</span></div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '10px' }}>
                    {selectedProduct.fssai_printed && (
                      <div><strong> FSSAI No. on Pack:</strong><br/><span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{selectedProduct.fssai_printed}</span></div>
                    )}
                    {selectedProduct.barcode && (
                      <div><strong> EAN Barcode:</strong><br/><span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{selectedProduct.barcode}</span></div>
                    )}
                  </div>

                  {selectedProduct.return_policy && (
                    <div style={{ background: 'rgba(153, 27, 27, 0.15)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '10px', borderRadius: '8px', color: '#fca5a5', fontSize: '0.75rem', marginTop: '5px' }}>
                       <strong>Return Policy:</strong> {selectedProduct.return_policy}
                    </div>
                  )}

                  {selectedProduct.back_image_url && (
                    <div style={{ marginTop: '10px', border: '1px solid rgba(148, 163, 184, 0.15)', padding: '10px', borderRadius: '8px' }}>
                      <strong> Ingredients Pack Label</strong>
                      <div style={{ height: '120px', display: 'flex', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '6px', overflow: 'hidden', marginTop: '8px' }}>
                        <img src={selectedProduct.back_image_url} alt="Back Label" style={{ height: '100%', objectFit: 'contain' }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '20px', marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <button 
                    onClick={() => setModalQuantity(prev => Math.max(1, prev - 1))}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.2)', color: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <FiMinus />
                  </button>
                  <strong style={{ fontSize: '1.1rem', color: '#f8fafc' }}>{modalQuantity}</strong>
                  <button 
                    onClick={() => setModalQuantity(prev => prev + 1)}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.2)', color: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <FiPlus />
                  </button>
                </div>

                <button 
                  onClick={handleAddCustomizedToCart}
                  style={{
                    padding: '12px 25px', background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <FiShoppingCart /> Add to Cart (₹{getModalTotalPrice()})
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
