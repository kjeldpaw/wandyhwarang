import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verify token on mount
  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = useCallback(async () => {
    try {
      const response = await api.post('/api/auth/verify', null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAdmin(response.data.admin);
      setError(null);
    } catch (err) {
      setAdmin(null);
      setToken(null);
      localStorage.removeItem('authToken');
      setError('Token verification failed');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
      });

      if (response.data.success) {
        const newToken = response.data.token;
        setToken(newToken);
        setAdmin(response.data.admin);
        localStorage.setItem('authToken', newToken);
        return { success: true };
      } else {
        const errorMsg = response.data.error || 'Login failed';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('authToken');
    setError(null);
  }, []);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/auth/register', {
        name,
        email,
        password,
      });

      if (response.data.success) {
        setError(null);
        return { success: true };
      } else {
        const errorMsg = response.data.error || 'Registration failed';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    admin,
    token,
    loading,
    error,
    isAuthenticated: !!token && !!admin,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
