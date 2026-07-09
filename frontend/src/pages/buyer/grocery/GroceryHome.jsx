import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStar, FiSearch } from 'react-icons/fi';
import { authService } from '../../../services/authService';
import { productService } from '../../../services/productService';
import '../../../styles/dashboard.css';

const categories = ['🥛 Dairy', '🍎 Fruits', '🥦 Vegetables', '🍚 Grains', '🧴 Personal Care', '🧹 Cleaning', '🍫 Snacks', ' Beverages'];

export default function GroceryHome() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const sellers = await authService.getSellers();
        const prodData = await productService.getAllProducts('grocery');
        const groceryProducts = prodData.products || [];

        // Find unique seller IDs from grocery products
        const grocerySellerIds = new Set(groceryProducts.map(p => p.seller_id.toString()));

        // Just mock some ratings and emojis for UI purposes
        const processed = sellers
          .filter(s => grocerySellerIds.has(s.id.toString()))
          .map(s => ({
            ...s,
            rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1),
            emoji: ''
          }));
        setShops(processed);
      } catch (error) {
        console.error("Failed to fetch shops", error);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  const handleShopClick = (sellerId, shopName) => {
    navigate(`/buyer/grocery/products?sellerId=${sellerId}&shopName=${encodeURIComponent(shopName)}`);
  };

  const filteredShops = shops.filter(shop => 
    shop.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    shop.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedShops = [...filteredShops].sort((a, b) => {
    if (sortBy === 'rating') {
      return parseFloat(b.rating) - parseFloat(a.rating);
    }
    if (sortBy === 'name') {
      const nameA = a.shop_name || a.name || '';
      const nameB = b.shop_name || b.name || '';
      return nameA.localeCompare(nameB);
    }
    return 0;
  });

  return (
    <div className="dashboard-page" id="buyer-grocery-home">
      <div className="page-header">
        <h1>Grocery Store </h1>
        <p>Order fresh groceries from nearby stores</p>
      </div>

      {/* Search */}
      <div className="content-card" style={{ padding: '16px' }}>
        <div style={{ position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groceries, stores..." 
            style={{
              width: '100%', padding: '14px 16px 14px 44px', background: '#f3f4f6',
              borderRadius: '12px', fontSize: '0.9rem', border: '1px solid #e5e7eb', color: '#111827',
            }} 
          />
        </div>
      </div>

      {/* Categories */}
      <div className="content-card">
        <div className="content-card-header"><h2>Categories</h2></div>
        <div className="search-list">
          {categories.map((cat, i) => (
            <span 
              className="search-tag" 
              key={i} 
              onClick={() => {
                // Strip emoji and space
                const cleanCat = cat.split(' ').slice(1).join(' ').trim();
                navigate(`/buyer/grocery/products?category=${encodeURIComponent(cleanCat)}`);
              }}
              style={{ fontSize: '0.9rem', padding: '10px 18px', cursor: 'pointer' }}
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Shops by Rating */}
      <div className="content-card">
        <div className="content-card-header">
          <h2> Grocery Shops Near You</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sort By:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <option value="default">Default</option>
              <option value="rating">Rating (High to Low)</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <p style={{ padding: '20px' }}>Loading shops...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {sortedShops.length === 0 && <p>No shops found.</p>}
            {sortedShops.map((shop, i) => (
              <div onClick={() => handleShopClick(shop.id, shop.shop_name || shop.name)} className="shop-card" key={i} style={{ minWidth: 'auto', cursor: 'pointer' }}>
                <div className="shop-card-img" style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', height: '100px' }}>
                  <span style={{ fontSize: '2.5rem' }}>{shop.emoji}</span>
                </div>
                <div className="shop-card-body">
                  <h4>{shop.shop_name || shop.name}</h4>
                  <p>Seller ID: {shop.id}</p>
                  <div className="shop-rating">
                    <FiStar size={12} /> {shop.rating}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
