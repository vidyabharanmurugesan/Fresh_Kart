import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { FiMenu, FiX, FiBell, FiUser, FiLogOut, FiShoppingCart } from 'react-icons/fi';
import { MdFastfood, MdLocalGroceryStore } from 'react-icons/md';
import './Navbar.css';

export default function Navbar({ onToggleSidebar, onToggleCart }) {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isFoodActive = location.pathname.includes('/food');
  const isGroceryActive = location.pathname.includes('/grocery');

  const getBasePath = () => {
    if (!user) return '/';
    return `/${user.role}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const showTabs = user && user.role !== 'delivery';

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-left">
        <button className="navbar-menu-btn" onClick={onToggleSidebar} id="sidebar-toggle">
          <FiMenu size={22} />
        </button>
        <Link to={getBasePath()} className="navbar-brand">
          <img src="/logo.png" alt="FreshKart Logo" className="brand-logo-img" />
          <span className="brand-text">Fresh<span className="brand-highlight">Kart</span></span>
        </Link>
      </div>

      {showTabs && (
        <div className="navbar-tabs">
          {(!user || user.role !== 'seller' || user.shop_type?.toLowerCase() === 'food') && (
            <Link
              to={`${getBasePath()}/food/home`}
              className={`navbar-tab ${isFoodActive ? 'active' : ''}`}
              id="food-tab"
            >
              <MdFastfood size={20} />
              <span>Food</span>
            </Link>
          )}
          {(!user || user.role !== 'seller' || user.shop_type?.toLowerCase() === 'grocery') && (
            <Link
              to={`${getBasePath()}/grocery/home`}
              className={`navbar-tab ${isGroceryActive ? 'active' : ''}`}
              id="grocery-tab"
            >
              <MdLocalGroceryStore size={20} />
              <span>Grocery</span>
            </Link>
          )}
        </div>
      )}

      <div className="navbar-right">
        {user?.role === 'buyer' && (
          <button className="navbar-icon-btn" id="cart-btn" onClick={onToggleCart}>
            <FiShoppingCart size={20} />
            <span className="badge">{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
          </button>
        )}
        <button className="navbar-icon-btn" id="notifications-btn">
          <FiBell size={20} />
          <span className="badge">3</span>
        </button>
        <div className="navbar-profile-wrapper">
          <button
            className="navbar-profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            id="profile-menu-btn"
          >
            <div className="navbar-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="navbar-username">{user?.name || 'User'}</span>
          </button>
          {showProfileMenu && (
            <div className="navbar-dropdown animate-scaleIn">
              <div className="dropdown-header">
                <p className="dropdown-name">{user?.name}</p>
                <p className="dropdown-role">{user?.role}</p>
              </div>
              <div className="dropdown-divider" />
              <Link to={`${getBasePath()}/food/profile`} className="dropdown-item" onClick={() => setShowProfileMenu(false)}>
                <FiUser size={16} />
                <span>Profile</span>
              </Link>
              <button className="dropdown-item logout" onClick={handleLogout} id="logout-btn">
                <FiLogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
