import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import CartSidebar from '../../components/buyer/CartSidebar';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="dashboard-layout" id="dashboard-layout">
      <Navbar 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        onToggleCart={() => setCartOpen(!cartOpen)}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
