import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import '../styles/ConfirmRegistrationPage.css';

function ConfirmRegistrationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="confirm-registration-container">
        <div className="confirm-registration-box">
          <h1>Invalid Request</h1>
          <p>No confirmation token provided. Please check the link in your email.</p>
          <button
            onClick={() => navigate('/register')}
            className="action-button"
          >
            Back to Registration
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

    if (!formData.name || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
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
      const response = await api.post('/api/auth/confirm-registration', {
        token,
        name: formData.name,
        password: formData.password,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to confirm registration');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="confirm-registration-container">
      <div className="confirm-registration-box">
        <h1>Wandy Hwa Rang</h1>
        <p className="confirm-registration-subtitle">Complete Your Registration</p>

        {success ? (
          <div className="success-message">
            <h3>Registration Complete!</h3>
            <p>Your account has been created successfully. You can now login with your email and password.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="confirm-registration-form">
            {error && <div className="error-message">{error}</div>}

            <p className="form-description">
              Enter your name and set a password to complete your registration.
            </p>

            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
                placeholder="Your full name"
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
                placeholder="Enter your password"
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
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
            </div>

            <button type="submit" disabled={loading} className="confirm-registration-button">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div className="confirm-registration-footer">
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

export default ConfirmRegistrationPage;
