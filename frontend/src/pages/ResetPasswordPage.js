import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import '../styles/ResetPasswordPage.css';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-box">
          <h1>Invalid Request</h1>
          <p>No reset token provided. Please request a new password reset.</p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="action-button"
          >
            Request Password Reset
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.password || !formData.confirmPassword) {
      setError('Both password fields are required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/reset-password', {
        token,
        password: formData.password,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-box">
        <h1>Wandy Hwa Rang</h1>
        <p className="reset-password-subtitle">Create New Password</p>

        {success ? (
          <div className="success-message">
            <h3>Password Reset Successful</h3>
            <p>Your password has been reset successfully. You will be redirected to login shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="reset-password-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
                placeholder="Enter your new password"
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                required
                placeholder="Confirm your new password"
                autoComplete="new-password"
              />
            </div>

            <button type="submit" disabled={loading} className="reset-password-button">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="reset-password-footer">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="back-to-login-button"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
