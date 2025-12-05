import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/LoginPage.css';

function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: 'admin@example.com',
    password: '',
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!formData.email || !formData.password) {
      setLocalError('Email and password are required');
      return;
    }

    const result = await login(formData.email, formData.password);
    if (result.success) {
      onLoginSuccess();
    } else {
      setLocalError(result.error || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Wandy Hwa Rang</h1>
        <p className="login-subtitle">Admin Login</p>

        <form onSubmit={handleSubmit} className="login-form">
          {(error || localError) && (
            <div className="error-message">{error || localError}</div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="forgot-password-link">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="link-button"
            >
              Forgot Password?
            </button>
          </div>
        </form>

        <div className="login-footer">
          <p>Don't have an account?</p>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="register-link-button"
          >
            Register Here
          </button>
        </div>

        <div className="login-info">
          <p>Demo Credentials:</p>
          <p>Email: <strong>admin@example.com</strong></p>
          <p>Password: <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
