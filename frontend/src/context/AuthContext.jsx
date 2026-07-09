import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('freshkart_token'));
  const [loading, setLoading] = useState(true);

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const startTime = Date.now();
      if (token) {
        try {
          const response = await authService.getMe(token);
          setUser(response.user);
        } catch (err) {
          console.error('Session expired:', err);
          localStorage.removeItem('freshkart_token');
          setToken(null);
          setUser(null);
        }
      }
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 2000 - elapsed);
      setTimeout(() => {
        setLoading(false);
      }, delay);
    };
    loadUser();
  }, [token]);

  const login = useCallback(async (email, password) => {
    const response = await authService.login(email, password);
    localStorage.setItem('freshkart_token', response.token);
    setToken(response.token);
    setUser(response.user);
    return response;
  }, []);

  const signup = useCallback(async (userData) => {
    const response = await authService.signup(userData);
    localStorage.setItem('freshkart_token', response.token);
    setToken(response.token);
    setUser(response.user);
    return response;
  }, []);

  const googleLogin = useCallback(async (authData) => {
    const response = await authService.googleAuth(authData);
    localStorage.setItem('freshkart_token', response.token);
    setToken(response.token);
    setUser(response.user);
    return response;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('freshkart_token');
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    const response = await authService.updateProfile(profileData);
    setUser(response.user);
    return response;
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    googleLogin,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
