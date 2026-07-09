import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiShoppingCart, FiFilter, FiInfo, FiX, FiCheck, FiPlus, FiMinus, FiTag } from 'react-icons/fi';
import { productService } from '../../../services/productService';
import { useCart } from '../../../context/CartContext';
import '../../../styles/dashboard.css';

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
  const [selectedDietary, setSelectedDietary] = useState('All'); // All, veg, egg, non-veg (for food)

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
      // Basic domain check
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

  // Open details modal & initialize options
  const handleOpenDetails = (product) => {
    setSelectedProduct(product);
    setModalQuantity(1);
    
    // Initialize variant (select first variant if exists)
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

  // Calculate customized product price inside modal
  const getModalTotalPrice = () => {
    if (!selectedProduct) return 0;
    let price = parseFloat(selectedProduct.price);
    
    // Add variant difference if applicable
    if (modalVariant && modalVariant.price) {
      price = parseFloat(modalVariant.price);
    }
    
    // Add addons prices
    const addonsPrice = modalAddons.reduce((sum, a) => sum + parseFloat(a.price || 0), 0);
    return (price + addonsPrice) * modalQuantity;
  };

  // Add customized item to shopping cart
  const handleAddCustomizedToCart = () => {
    if (!selectedProduct) return;
    
    // Compute customized pricing
    const basePrice = modalVariant && modalVariant.price ? parseFloat(modalVariant.price) : parseFloat(selectedProduct.price);
    const addonsPrice = modalAddons.reduce((sum, a) => sum + parseFloat(a.price || 0), 0);
    const itemPrice = basePrice + addonsPrice;

    // Create customized product descriptor
    const customizedProduct = {
      ...selectedProduct,
      // Unique product_id so different variants/addons are treated as separate rows in cart
      product_id: `${selectedProduct.product_id}${modalVariant ? `-${modalVariant.name}` : ''}${modalAddons.length > 0 ? `-${modalAddons.map(a => a.name).join('-')}` : ''}`,
      original_product_id: selectedProduct.product_id,
      name: `${selectedProduct.name}${modalVariant ? ` (${modalVariant.name})` : ''}${modalAddons.length > 0 ? ` + [${modalAddons.map(a => a.name).join(', ')}]` : ''}`,
      price: itemPrice,
      custom_details: {
        variant: modalVariant,
        addons: modalAddons
      }
    };

    // Add to cart with quantity multiplier
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
            🏪 Browse Shops & Outlets
          </Link>
        )}
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h2>All Selections</h2>
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
                  <option value="veg">🟢 Pure Veg</option>
                  <option value="egg">🥚 Egg Only</option>
                  <option value="non-veg">🔴 Non-Veg Only</option>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {filteredProducts.length === 0 && <p style={{ gridColumn: 'span 4', textAlign: 'center', padding: '40px', color: '#6b7280' }}>No products match your filters.</p>}
            {filteredProducts.map((product) => {
              const inStock = product.stock_count > 0;
              const hasOptions = (product.variants && product.variants.length > 0) || (product.addons && product.addons.length > 0);
              const showSlashedMRP = domain === 'grocery' && product.mrp && parseFloat(product.mrp) > parseFloat(product.price);
              
              return (
                <div 
                  className="shop-card" 
                  key={product.product_id} 
                  style={{ minWidth: 'auto', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
                >
                  {/* Dietary badge for Food */}
                  {domain === 'food' && product.dietary_tag && (
                    <div style={{
                      position: 'absolute', top: '10px', left: '10px', zIndex: 10, padding: '4px 8px', borderRadius: '6px',
                      background: product.dietary_tag === 'veg' ? '#ecfdf5' : product.dietary_tag === 'egg' ? '#fffbeb' : '#fef2f2',
                      color: product.dietary_tag === 'veg' ? '#047857' : product.dietary_tag === 'egg' ? '#b45309' : '#b91c1c',
                      fontSize: '0.7rem', fontWeight: 700, border: '1px solid currentColor'
                    }}>
                      {product.dietary_tag === 'veg' ? '🟢 VEG' : product.dietary_tag === 'egg' ? '🥚 EGG' : '🔴 NON-VEG'}
                    </div>
                  )}

                  {/* Pack Size badge for Grocery */}
                  {domain === 'grocery' && product.pack_size && (
                    <div style={{
                      position: 'absolute', top: '10px', left: '10px', zIndex: 10, padding: '3px 8px', borderRadius: '6px',
                      background: 'rgba(31, 41, 55, 0.85)', color: 'white', fontSize: '0.7rem', fontWeight: 600
                    }}>
                      {product.pack_size}
                    </div>
                  )}

                  <div className="shop-card-img" style={{ background: '#f3f4f6', height: '150px', cursor: 'pointer' }} onClick={() => handleOpenDetails(product)}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '3rem' }}>{domain === 'food' ? '🍔' : '📦'}</span>
                    )}
                  </div>

                  <div className="shop-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '15px' }}>
                    <div style={{ flex: 1 }}>
                      {domain === 'grocery' && product.brand_name && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{product.brand_name}</span>
                      )}
                      <h4 style={{ margin: '4px 0', fontSize: '0.95rem', color: '#1f2937' }}>{product.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '2px 0' }}>Category: {product.category}</p>
                      
                      {domain === 'food' && product.serves_how_many && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>👥 Serves: {product.serves_how_many}</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid #f3f4f6', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {showSlashedMRP && (
                          <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.75rem' }}>MRP ₹{product.mrp}</span>
                        )}
                        <span style={{ fontWeight: 700, color: '#059669', fontSize: '1rem' }}>₹{product.price}</span>
                      </div>

                      {inStock ? (
                        <button 
                          onClick={() => hasOptions ? handleOpenDetails(product) : addToCart(product, sellerId || product.seller_id)} 
                          style={{
                            padding: '8px 14px', background: '#10b981', border: 'none', cursor: 'pointer',
                            color: 'white', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <FiShoppingCart size={12} />
                          {hasOptions ? 'Options' : 'Add'}
                        </button>
                      ) : (
                        <span style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', borderRadius: '6px', fontWeight: 600 }}>Out of Stock</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

            {/* Modal Body */}
            <div>
              {/* Product Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ width: '100%', height: '120px', background: '#1e293b', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '3rem' }}>{domain === 'food' ? '🍔' : '📦'}</span>
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

              {/* Description */}
              {selectedProduct.description && (
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(148, 163, 184, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Product Description</span>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.4', color: '#cbd5e1' }}>{selectedProduct.description}</p>
                </div>
              )}

              {/* ===================== FOOD CUSTOMIZATIONS ===================== */}
              {domain === 'food' && (
                <div>
                  {/* Variants (e.g. Size Half/Full) */}
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

                  {/* Add-ons */}
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

                  {/* Food details: spice level, serves how many */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.8rem', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(148, 163, 184, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: '#cbd5e1' }}>
                    {selectedProduct.serves_how_many && <div>👥 <strong>Serves:</strong> {selectedProduct.serves_how_many} Person(s)</div>}
                    {selectedProduct.spice_level && <div>🌶️ <strong>Spice Level:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedProduct.spice_level}</span></div>}
                    {selectedProduct.allergen_info && <div style={{ gridColumn: 'span 2', marginTop: '5px' }}>⚠️ <strong>Allergens:</strong> {selectedProduct.allergen_info}</div>}
                  </div>

                  {/* Cakes Details */}
                  {selectedProduct.is_cake && (
                    <div style={{ background: 'rgba(6, 78, 59, 0.25)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.8rem', color: '#34d399', marginBottom: '20px' }}>
                      🎂 <strong>Cake Info:</strong> Weight: {selectedProduct.cake_weight || '500g'} | {selectedProduct.cake_dietary === 'eggless' ? 'Eggless' : 'Contains Egg'}
                    </div>
                  )}

                  {/* Combos Details */}
                  {selectedProduct.is_combo && selectedProduct.combo_items && (
                    <div style={{ background: 'rgba(30, 58, 138, 0.25)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '0.8rem', color: '#93c5fd', marginBottom: '20px' }}>
                      🍱 <strong>Bundled Items in Combo/Thali:</strong>
                      <ul style={{ paddingLeft: '20px', margin: '5px 0 0 0', color: '#93c5fd' }}>
                        {selectedProduct.combo_items.map((ci, idx) => (
                          <li key={idx}>{ci.name} (x{ci.qty})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}


              {/* ===================== GROCERY SPECIFICATIONS ===================== */}
              {domain === 'grocery' && (
                <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {selectedProduct.nutritional_info && (
                    <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(148, 163, 184, 0.1)', padding: '12px', borderRadius: '8px' }}>
                      <strong>📊 Nutritional Info (per 100g)</strong>
                      <p style={{ margin: '5px 0 0 0', color: '#cbd5e1' }}>{selectedProduct.nutritional_info}</p>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {selectedProduct.shelf_life && (
                      <div><strong>⏳ Expiry / Shelf Life:</strong><br/><span style={{ color: '#cbd5e1' }}>{selectedProduct.shelf_life}</span></div>
                    )}
                    {selectedProduct.storage_instructions && (
                      <div><strong>🌡️ Storage Instructions:</strong><br/><span style={{ color: '#cbd5e1' }}>{selectedProduct.storage_instructions}</span></div>
                    )}
                  </div>

                  {selectedProduct.manufacturer_details && (
                    <div><strong>🏢 Manufacturer & Marketer:</strong><br/><span style={{ color: '#cbd5e1' }}>{selectedProduct.manufacturer_details}</span></div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '10px' }}>
                    {selectedProduct.fssai_printed && (
                      <div><strong>📜 FSSAI No. on Pack:</strong><br/><span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{selectedProduct.fssai_printed}</span></div>
                    )}
                    {selectedProduct.barcode && (
                      <div><strong>🏷️ EAN Barcode:</strong><br/><span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{selectedProduct.barcode}</span></div>
                    )}
                  </div>

                  {selectedProduct.return_policy && (
                    <div style={{ background: 'rgba(153, 27, 27, 0.15)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '10px', borderRadius: '8px', color: '#fca5a5', fontSize: '0.75rem', marginTop: '5px' }}>
                      🔄 <strong>Return Policy:</strong> {selectedProduct.return_policy}
                    </div>
                  )}

                  {/* Back package image showing ingredients */}
                  {selectedProduct.back_image_url && (
                    <div style={{ marginTop: '10px', border: '1px solid rgba(148, 163, 184, 0.15)', padding: '10px', borderRadius: '8px' }}>
                      <strong>🔍 Ingredients Pack Label</strong>
                      <div style={{ height: '120px', display: 'flex', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '6px', overflow: 'hidden', marginTop: '8px' }}>
                        <img src={selectedProduct.back_image_url} alt="Back Label" style={{ height: '100%', objectFit: 'contain' }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity Selector & Add Action */}
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
