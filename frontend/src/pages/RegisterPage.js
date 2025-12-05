import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/RegisterPage.css';

function RegisterPage() {
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
      const response = await api.post('/api/auth/register', { email });
      if (response.data.success) {
        setSuccess(true);
        setEmail('');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.data.error || 'Failed to register');
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
    <div className="register-container">
      <div className="register-box">
        <h1>Wandy Hwa Rang</h1>
        <p className="register-subtitle">Create Your Account</p>

        {success ? (
          <div className="success-message">
            <h3>Registration Email Sent</h3>
            <p>We've sent a confirmation email to your address. Please check your inbox and click the link to complete your registration.</p>
            <p className="redirect-message">You will be redirected to login in 3 seconds...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="register-form">
            {error && <div className="error-message">{error}</div>}

            <p className="form-description">
              Enter your email address and we'll send you a link to confirm and set up your account.
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

            <button type="submit" disabled={loading} className="register-button">
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}

        <div className="register-footer">
          <p>Already have an account?</p>
          <button
            type="button"
            onClick={handleBackToLogin}
            className="login-link-button"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
