import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/ForgotPasswordPage.css';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      if (response.data.success) {
        setSuccess(true);
        setEmail('');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <h1>Wandy Hwa Rang</h1>
        <p className="forgot-password-subtitle">Reset Your Password</p>

        {success ? (
          <div className="success-message">
            <h3>Check Your Email</h3>
            <p>We've sent a password reset link to your email. Please check your inbox and click the link to reset your password.</p>
            <p className="redirect-message">You will be redirected to login in 3 seconds...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="forgot-password-form">
            {error && <div className="error-message">{error}</div>}

            <p className="form-description">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                disabled={loading}
                required
                placeholder="your@example.com"
              />
            </div>

            <button type="submit" disabled={loading} className="forgot-password-button">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="forgot-password-footer">
          <button
            type="button"
            onClick={handleBackToLogin}
            className="back-to-login-button"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
