import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <Loader size="lg" text="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's own dashboard
    const defaultPaths = {
      buyer: '/buyer/food/home',
      seller: '/seller/food/home',
      admin: '/admin/food/home',
      delivery: '/delivery/home',
    };
    return <Navigate to={defaultPaths[user.role] || '/'} replace />;
  }

  return children;
}
