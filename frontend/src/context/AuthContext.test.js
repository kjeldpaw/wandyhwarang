import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import '@testing-library/jest-dom';

// Mock axios
jest.mock('../services/api');

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  let api;
  beforeEach(() => {
    api = require('../services/api').default;
  });

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  describe('login function', () => {
    test('successful login returns success with token', async () => {
      api.post.mockResolvedValueOnce({
        data: {
          success: true,
          token: 'test-token-12345',
          admin: {
            id: 1,
            email: 'admin@example.com',
            name: 'Admin User'
          }
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('admin@example.com', 'admin123');
      });

      expect(loginResult.success).toBe(true);
      expect(result.current.token).toBe('test-token-12345');
      expect(result.current.admin).toEqual({
        id: 1,
        email: 'admin@example.com',
        name: 'Admin User'
      });
      expect(localStorage.getItem('authToken')).toBe('test-token-12345');
    });

    test('failed login returns success false with error message', async () => {
      api.post.mockRejectedValueOnce({
        response: {
          data: {
            error: 'Invalid credentials'
          }
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('admin@example.com', 'wrongpassword');
      });

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe('Invalid credentials');
      expect(result.current.token).toBeNull();
      expect(result.current.admin).toBeNull();
    });

    test('login without response data returns error', async () => {
      api.post.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('admin@example.com', 'admin123');
      });

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe('Login failed');
    });

    test('sets loading state during login', async () => {
      api.post.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          data: {
            success: true,
            token: 'test-token',
            admin: { id: 1, email: 'admin@example.com', name: 'Admin' }
          }
        }), 100))
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially loading should be true (from useEffect)
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        result.current.login('admin@example.com', 'admin123');
      });

      // After login completes, loading should be false
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    test('sets error message on failed login', async () => {
      api.post.mockRejectedValueOnce({
        response: {
          data: {
            error: 'Email not found'
          }
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('nonexistent@example.com', 'password');
      });

      expect(result.current.error).toBe('Email not found');
    });
  });

  describe('logout function', () => {
    test('clears authentication state', async () => {
      // First login
      api.post.mockResolvedValueOnce({
        data: {
          success: true,
          token: 'test-token',
          admin: { id: 1, email: 'admin@example.com', name: 'Admin' }
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('admin@example.com', 'admin123');
      });

      expect(result.current.token).toBe('test-token');
      expect(result.current.admin).not.toBeNull();

      // Now logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.admin).toBeNull();
      expect(result.current.error).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });

  describe('register function', () => {
    test('successful registration returns success', async () => {
      api.post.mockResolvedValueOnce({
        data: {
          success: true
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let registerResult;
      await act(async () => {
        registerResult = await result.current.register(
          'New User',
          'newuser@example.com',
          'password123'
        );
      });

      expect(registerResult.success).toBe(true);
    });

    test('failed registration returns error message', async () => {
      api.post.mockRejectedValueOnce({
        response: {
          data: {
            error: 'Email already exists'
          }
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let registerResult;
      await act(async () => {
        registerResult = await result.current.register(
          'Duplicate User',
          'existing@example.com',
          'password123'
        );
      });

      expect(registerResult.success).toBe(false);
      expect(registerResult.error).toBe('Email already exists');
    });

    test('registration without response data returns error', async () => {
      api.post.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      let registerResult;
      await act(async () => {
        registerResult = await result.current.register(
          'User',
          'user@example.com',
          'password'
        );
      });

      expect(registerResult.success).toBe(false);
      expect(registerResult.error).toBe('Registration failed');
    });
  });

  describe('isAuthenticated derived state', () => {
    test('returns true when token and admin exist', async () => {
      api.post.mockResolvedValueOnce({
        data: {
          success: true,
          token: 'test-token',
          admin: { id: 1, email: 'admin@example.com', name: 'Admin' }
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('admin@example.com', 'admin123');
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    test('returns false when no token or admin', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
    });

    test('returns false after logout', async () => {
      api.post.mockResolvedValueOnce({
        data: {
          success: true,
          token: 'test-token',
          admin: { id: 1, email: 'admin@example.com', name: 'Admin' }
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('admin@example.com', 'admin123');
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('API calls', () => {
    test('login sends correct request to API', async () => {
      api.post.mockResolvedValueOnce({
        data: {
          success: true,
          token: 'test-token',
          admin: { id: 1, email: 'admin@example.com', name: 'Admin' }
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
    });

    test('register sends correct request to API', async () => {
      api.post.mockResolvedValueOnce({
        data: {
          success: true
        }
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register('Test User', 'test@example.com', 'password123');
      });

      expect(api.post).toHaveBeenCalledWith('/api/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });
});
