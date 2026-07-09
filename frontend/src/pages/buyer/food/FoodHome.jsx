import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { FiShoppingBag, FiTruck, FiStar, FiSearch } from 'react-icons/fi';
import { authService } from '../../../services/authService';
import '../../../styles/dashboard.css';

const topSearches = ['Biryani', 'Pizza', 'Burger', 'Noodles', 'Dosa', 'Fried Rice', 'Pasta', 'Shawarma', 'Momos', 'Ice Cream'];

export default function FoodHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [foodShops, setFoodShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const sellers = await authService.getSellers();
      
      const isShakeShop = (shopName) => {
        const keywords = ['shake', 'juice', 'beverage', 'drink', 'smoothie', 'tea', 'coffee', 'cafe', 'blend', 'soda', 'bar', 'juices', 'shakes', 'smoothies'];
        return keywords.some(keyword => shopName.toLowerCase().includes(keyword));
      };

      if (sellers && sellers.length > 0) {
        const processed = sellers
          .filter(s => s.role === 'seller' && (s.shop_type || 'food').toLowerCase() === 'food')
          .map(s => ({
            ...s,
            rating: (Math.random() * (5 - 3.8) + 3.8).toFixed(1),
            emoji: isShakeShop(s.shop_name || s.name || '') ? '🥤' : '🍔'
          }));

        setFoodShops(processed);
      } else {
        setFoodShops([]);
      }
    } catch (error) {
      console.error('Failed to fetch food sellers:', error);
      setFoodShops([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShopClick = (sellerId, shopName) => {
    navigate(`/buyer/food/products?sellerId=${sellerId}&shopName=${encodeURIComponent(shopName)}`);
  };

  const filteredFoodShops = foodShops.filter(shop => 
    (shop.shop_name || shop.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );



  return (
    <div className="dashboard-page" id="buyer-food-home">
      <div className="page-header">
        <h1>Hey {user?.name} 👋</h1>
        <p>What would you like to eat today?</p>
      </div>

      {/* Search Bar */}
      <div className="content-card" style={{ padding: 'var(--space-4)' }}>
        <div className="input-group" style={{ position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: '16px', color: '#9ca3af', fontSize: '1.1rem' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for food, restaurants..."
            style={{
              width: '100%', padding: '14px 16px 14px 44px', background: '#f3f4f6',
              borderRadius: '12px', fontSize: '0.9rem', border: '1px solid #e5e7eb',
              color: '#111827',
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginTop: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-icon green"><FiShoppingBag /></div>
          <div className="stat-card-info"><h3>12</h3><p>Total Orders</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon orange"><FiTruck /></div>
          <div className="stat-card-info"><h3>2</h3><p>Active Deliveries</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon purple"><FiStar /></div>
          <div className="stat-card-info"><h3>150+</h3><p>Restaurants Nearby</p></div>
        </div>
      </div>

      {/* Food Row */}
      <div className="content-card">
        <div className="content-card-header">
          <h2>🍔 Popular Food Shops</h2>
        </div>
        {loading ? (
          <p style={{ padding: '20px' }}>Loading shops...</p>
        ) : (
          <div className="scroll-row">
            {filteredFoodShops.length === 0 && (
              <p style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No live restaurants available nearby. Register a seller account to get started!
              </p>
            )}
            {filteredFoodShops.map((shop, i) => (
              <div 
                className="shop-card" 
                key={shop.id || i}
                onClick={() => handleShopClick(shop.id, shop.shop_name || shop.name)}
                style={{ cursor: 'pointer' }}
              >
                <div className="shop-card-img">{shop.emoji}</div>
                <div className="shop-card-body">
                  <h4>{shop.shop_name || shop.name}</h4>
                  <div className="shop-rating">
                    <FiStar size={12} /> {shop.rating}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Searches */}
      <div className="content-card">
        <div className="content-card-header">
          <h2>🔥 Top Searches</h2>
        </div>
        <div className="search-list">
          {topSearches.map((item, i) => (
            <span 
              className="search-tag" 
              key={i}
              onClick={() => setSearchQuery(item)}
              style={{ cursor: 'pointer' }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
