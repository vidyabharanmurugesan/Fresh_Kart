import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../pages/layouts/DashboardLayout';

// Auth Pages
import LandingPage from '../pages/auth/LandingPage';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';

// Buyer Pages
import FoodHome from '../pages/buyer/food/FoodHome';
import FoodProducts from '../pages/buyer/food/ProductDisplay';
import FoodTracking from '../pages/buyer/food/OrderTracking';
import FoodHelp from '../pages/buyer/food/Help';
import BuyerFoodProfile from '../pages/buyer/food/Profile';
import GroceryHome from '../pages/buyer/grocery/GroceryHome';
import GroceryProducts from '../pages/buyer/grocery/GroceryProducts';
import GroceryTracking from '../pages/buyer/grocery/OrderTracking';
import GroceryHelp from '../pages/buyer/grocery/Help';
import BuyerGroceryProfile from '../pages/buyer/grocery/Profile';
import InvoicePage from '../pages/buyer/InvoicePage';
import InvoicesList from '../pages/buyer/InvoicesList';

// Seller Pages
import SellerFoodDashboard from '../pages/seller/food/Dashboard';
import SellerFoodProducts from '../pages/seller/food/ProductSelling';
import SellerFoodSales from '../pages/seller/food/OverallSelling';
import SellerFoodCustomers from '../pages/seller/food/CustomerDetails';
import SellerFoodProfile from '../pages/seller/food/Profile';
import SellerGroceryDashboard from '../pages/seller/grocery/Dashboard';
import SellerGroceryProducts from '../pages/seller/grocery/ProductSelling';
import SellerGrocerySales from '../pages/seller/grocery/OverallSelling';
import SellerGroceryCustomers from '../pages/seller/grocery/CustomerDetails';
import SellerGroceryProfile from '../pages/seller/grocery/Profile';

// Admin Pages
import AdminFoodDashboard from '../pages/admin/food/Dashboard';
import AdminFoodSellers from '../pages/admin/food/SellerDetails';
import AdminFoodBuyers from '../pages/admin/food/BuyerDetails';
import AdminFoodDeliveryPartners from '../pages/admin/food/DeliveryPartnerDetails';
import AdminFoodBills from '../pages/admin/food/BillsStorage';
import AdminFoodProfile from '../pages/admin/food/Profile';
import AdminGroceryDashboard from '../pages/admin/grocery/Dashboard';
import AdminGrocerySellers from '../pages/admin/grocery/SellerDetails';
import AdminGroceryBuyers from '../pages/admin/grocery/BuyerDetails';
import AdminGroceryDeliveryPartners from '../pages/admin/grocery/DeliveryPartnerDetails';
import AdminGroceryBills from '../pages/admin/grocery/BillsStorage';
import AdminGroceryProfile from '../pages/admin/grocery/Profile';
import AdminFoodSupport from '../pages/admin/food/Support';
import AdminGrocerySupport from '../pages/admin/grocery/Support';
import AdminFoodCoupons from '../pages/admin/food/Coupons';
import AdminGroceryCoupons from '../pages/admin/grocery/Coupons';

// Delivery Pages
import DeliveryDashboard from '../pages/delivery/Dashboard';
import DeliveryIncoming from '../pages/delivery/IncomingOrders';
import DeliveryActive from '../pages/delivery/ActiveDelivery';
import DeliveryEarnings from '../pages/delivery/Earnings';
import DeliveryHistory from '../pages/delivery/TripHistory';
import DeliveryProfile from '../pages/delivery/Profile';

import Loader from '../components/common/Loader';

function SellerRouteGuard({ children, requiredDomain }) {
  const { user } = useAuth();
  if (!user || user.role !== 'seller') {
    return <Navigate to="/login" replace />;
  }
  const shopType = (user.shop_type || 'food').toLowerCase();
  if (shopType !== requiredDomain) {
    return <Navigate to={`/seller/${shopType}/home`} replace />;
  }
  return children;
}

function SellerIndexRedirect() {
  const { user } = useAuth();
  const shopType = (user?.shop_type || 'food').toLowerCase();
  return <Navigate to={`${shopType}/home`} replace />;
}

export default function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <Loader size="lg" text="Loading FreshKart..." />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public Routes ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ── Buyer Routes ── */}
        <Route path="/buyer" element={<ProtectedRoute allowedRoles={['buyer']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="food/home" replace />} />
          <Route path="food/home" element={<FoodHome />} />
          <Route path="food/products" element={<FoodProducts />} />
          <Route path="food/tracking" element={<FoodTracking />} />
          <Route path="food/help" element={<FoodHelp />} />
          <Route path="food/invoice/:orderId" element={<InvoicePage />} />
          <Route path="food/invoices" element={<InvoicesList domain="food" />} />
          <Route path="food/profile" element={<BuyerFoodProfile />} />
          <Route path="grocery/home" element={<GroceryHome />} />
          <Route path="grocery/products" element={<GroceryProducts />} />
          <Route path="grocery/tracking" element={<GroceryTracking />} />
          <Route path="grocery/help" element={<GroceryHelp />} />
          <Route path="grocery/invoice/:orderId" element={<InvoicePage />} />
          <Route path="grocery/invoices" element={<InvoicesList domain="grocery" />} />
          <Route path="grocery/profile" element={<BuyerGroceryProfile />} />
        </Route>

        {/* ── Seller Routes ── */}
        <Route path="/seller" element={<ProtectedRoute allowedRoles={['seller']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<SellerIndexRedirect />} />
          <Route path="food/home" element={<SellerRouteGuard requiredDomain="food"><SellerFoodDashboard /></SellerRouteGuard>} />
          <Route path="food/products" element={<SellerRouteGuard requiredDomain="food"><SellerFoodProducts /></SellerRouteGuard>} />
          <Route path="food/sales" element={<SellerRouteGuard requiredDomain="food"><SellerFoodSales /></SellerRouteGuard>} />
          <Route path="food/customers" element={<SellerRouteGuard requiredDomain="food"><SellerFoodCustomers /></SellerRouteGuard>} />
          <Route path="food/profile" element={<SellerRouteGuard requiredDomain="food"><SellerFoodProfile /></SellerRouteGuard>} />
          <Route path="grocery/home" element={<SellerRouteGuard requiredDomain="grocery"><SellerGroceryDashboard /></SellerRouteGuard>} />
          <Route path="grocery/products" element={<SellerRouteGuard requiredDomain="grocery"><SellerGroceryProducts /></SellerRouteGuard>} />
          <Route path="grocery/sales" element={<SellerRouteGuard requiredDomain="grocery"><SellerGrocerySales /></SellerRouteGuard>} />
          <Route path="grocery/customers" element={<SellerRouteGuard requiredDomain="grocery"><SellerGroceryCustomers /></SellerRouteGuard>} />
          <Route path="grocery/profile" element={<SellerRouteGuard requiredDomain="grocery"><SellerGroceryProfile /></SellerRouteGuard>} />
        </Route>

        {/* ── Admin Routes ── */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="food/home" replace />} />
          <Route path="food/home" element={<AdminFoodDashboard />} />
          <Route path="food/sellers" element={<AdminFoodSellers />} />
          <Route path="food/buyers" element={<AdminFoodBuyers />} />
          <Route path="food/delivery-partners" element={<AdminFoodDeliveryPartners />} />
           <Route path="food/bills" element={<AdminFoodBills />} />
          <Route path="food/coupons" element={<AdminFoodCoupons />} />
          <Route path="food/support" element={<AdminFoodSupport />} />
          <Route path="food/profile" element={<AdminFoodProfile />} />
          <Route path="grocery/home" element={<AdminGroceryDashboard />} />
          <Route path="grocery/sellers" element={<AdminGrocerySellers />} />
          <Route path="grocery/buyers" element={<AdminGroceryBuyers />} />
          <Route path="grocery/delivery-partners" element={<AdminGroceryDeliveryPartners />} />
          <Route path="grocery/bills" element={<AdminGroceryBills />} />
          <Route path="grocery/coupons" element={<AdminGroceryCoupons />} />
          <Route path="grocery/support" element={<AdminGrocerySupport />} />
          <Route path="grocery/profile" element={<AdminGroceryProfile />} />
        </Route>

        {/* ── Delivery Routes ── */}
        <Route path="/delivery" element={<ProtectedRoute allowedRoles={['delivery']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<DeliveryDashboard />} />
          <Route path="incoming" element={<DeliveryIncoming />} />
          <Route path="active" element={<DeliveryActive />} />
          <Route path="earnings" element={<DeliveryEarnings />} />
          <Route path="history" element={<DeliveryHistory />} />
          <Route path="profile" element={<DeliveryProfile />} />
        </Route>

        {/* ── Catch All ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
