import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome, FiShoppingBag, FiTruck, FiHelpCircle, FiUser, FiPackage,
  FiBarChart2, FiUsers, FiDollarSign, FiClock, FiMapPin, FiLayers, FiFileText, FiTag
} from 'react-icons/fi';
import './Sidebar.css';

const menuConfig = {
  buyer: {
    food: [
      { path: 'home', label: 'Home', icon: FiHome },
      { path: 'tracking', label: 'Incoming Orders', icon: FiPackage },
      { path: 'invoices', label: 'Order Invoices', icon: FiFileText },
      { path: 'help', label: 'Help & Support', icon: FiHelpCircle },
      { path: 'profile', label: 'Profile', icon: FiUser },
    ],
    grocery: [
      { path: 'home', label: 'Home', icon: FiHome },
      { path: 'tracking', label: 'Incoming Orders', icon: FiPackage },
      { path: 'invoices', label: 'Order Invoices', icon: FiFileText },
      { path: 'help', label: 'Help & Support', icon: FiHelpCircle },
      { path: 'profile', label: 'Profile', icon: FiUser },
    ],
  },
  seller: {
    food: [
      { path: 'home', label: 'Dashboard', icon: FiHome },
      { path: 'products', label: 'Product Selling', icon: FiPackage },
      { path: 'sales', label: 'Overall Selling', icon: FiBarChart2 },
      { path: 'customers', label: 'Customers', icon: FiUsers },
      { path: 'profile', label: 'Profile', icon: FiUser },
    ],
    grocery: [
      { path: 'home', label: 'Dashboard', icon: FiHome },
      { path: 'products', label: 'Product Selling', icon: FiPackage },
      { path: 'sales', label: 'Overall Selling', icon: FiBarChart2 },
      { path: 'customers', label: 'Customers', icon: FiUsers },
      { path: 'profile', label: 'Profile', icon: FiUser },
    ],
  },
  admin: {
    food: [
      { path: 'home', label: 'Dashboard', icon: FiHome },
      { path: 'sellers', label: 'Seller Details', icon: FiUsers },
      { path: 'buyers', label: 'Buyer Details', icon: FiUsers },
      { path: 'delivery-partners', label: 'Delivery Person Details', icon: FiTruck },
      { path: 'bills', label: 'Bills Storage', icon: FiDollarSign },
      { path: 'coupons', label: 'Offers & Coupons', icon: FiTag },
      { path: 'support', label: 'Support Chat', icon: FiHelpCircle },
      { path: 'profile', label: 'Profile', icon: FiUser },
    ],
    grocery: [
      { path: 'home', label: 'Dashboard', icon: FiHome },
      { path: 'sellers', label: 'Seller Details', icon: FiUsers },
      { path: 'buyers', label: 'Buyer Details', icon: FiUsers },
      { path: 'delivery-partners', label: 'Delivery Person Details', icon: FiTruck },
      { path: 'bills', label: 'Bills Storage', icon: FiDollarSign },
      { path: 'coupons', label: 'Offers & Coupons', icon: FiTag },
      { path: 'support', label: 'Support Chat', icon: FiHelpCircle },
      { path: 'profile', label: 'Profile', icon: FiUser },
    ],
  },
  delivery: {
    main: [
      { path: 'home', label: 'Dashboard', icon: FiHome },
      { path: 'incoming', label: 'Incoming Orders', icon: FiPackage },
      { path: 'active', label: 'Active Delivery', icon: FiMapPin },
      { path: 'earnings', label: 'Earnings', icon: FiDollarSign },
      { path: 'history', label: 'Trip History', icon: FiClock },
      { path: 'profile', label: 'Profile', icon: FiUser },
    ],
  },
};

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const role = user.role;
  let category = 'main';
  if (role !== 'delivery') {
    category = location.pathname.includes('/grocery') ? 'grocery' : 'food';
  }

  const items = menuConfig[role]?.[category] || [];
  const basePath = role === 'delivery'
    ? `/${role}`
    : `/${role}/${category}`;

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="main-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">
              {user?.role === 'seller' && user?.shop_logo ? (
                <img 
                  src={user.shop_logo.startsWith('http') ? user.shop_logo : `${import.meta.env.VITE_API_BASE_URL || ''}${user.shop_logo.startsWith('/') ? '' : '/'}${user.shop_logo}`} 
                  alt="Shop Logo" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                user.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div className="sidebar-user-info">
              <h4>{user.name}</h4>
              <span className="sidebar-role-badge">{role}</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {role !== 'delivery' && (
            <div className="sidebar-section-label">
              {category === 'food' ? ' Food Section' : ' Grocery Section'}
            </div>
          )}
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={`${basePath}/${item.path}`}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              id={`sidebar-${item.path}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>FreshKart v1.0</p>
        </div>
      </aside>
    </>
  );
}
