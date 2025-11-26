import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BeltForm from './BeltForm';
import '../styles/UserForm.css';

function UserForm({ user, onSave, onCancel }) {
  const { token, admin } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    club_id: '',
    hwa_id: '',
    kukkiwon_id: '',
  });
  const [clubs, setClubs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBeltForm, setShowBeltForm] = useState(false);
  const [belts, setBelts] = useState([]);
  const [beltRefreshKey, setBeltRefreshKey] = useState(0);

  useEffect(() => {
    // Fetch clubs
    const fetchClubs = async () => {
      try {
        const response = await fetch('/api/clubs');
        const data = await response.json();
        if (data.success) {
          setClubs(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch clubs:', err);
      }
    };
    fetchClubs();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        address: user.address || '',
        phone: user.phone || '',
        club_id: user.club_id || '',
        hwa_id: user.hwa_id || '',
        kukkiwon_id: user.kukkiwon_id || '',
      });
      // Fetch belts for this user
      if (user.beltHistory) {
        setBelts(user.beltHistory);
      }
    } else {
      setBelts([]);
    }
  }, [user, beltRefreshKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (user) {
        await userAPI.update(user.id, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await userAPI.create(formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      onSave();
      setFormData({ name: '', email: '', address: '', phone: '', club_id: '', hwa_id: '', kukkiwon_id: '' });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'An error occurred';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <h2>{user ? 'Edit User' : 'Add New User'}</h2>
      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="address">Address</label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="club_id">Club</label>
        <select
          id="club_id"
          name="club_id"
          value={formData.club_id}
          onChange={handleChange}
        >
          <option value="">Select a club</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="hwa_id">HWA ID</label>
        <input
          type="text"
          id="hwa_id"
          name="hwa_id"
          value={formData.hwa_id}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="kukkiwon_id">Kukkiwon ID</label>
        <input
          type="text"
          id="kukkiwon_id"
          name="kukkiwon_id"
          value={formData.kukkiwon_id}
          onChange={handleChange}
        />
      </div>

      <div className="form-actions">
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="cancel-btn">
          Cancel
        </button>
        {user && (
          <button
            type="button"
            onClick={() => setShowBeltForm(!showBeltForm)}
            className="belt-btn"
          >
            {showBeltForm ? 'Hide Belts' : 'Manage Belts'}
          </button>
        )}
      </div>

      {user && showBeltForm && (
        <BeltForm
          userId={user.id}
          belts={belts}
          onSave={() => {
            setBeltRefreshKey(beltRefreshKey + 1);
            // Refetch user data to update belt history
            const fetchUser = async () => {
              try {
                const response = await fetch(`/api/users/${user.id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();
                if (data.success && data.data.beltHistory) {
                  setBelts(data.data.beltHistory);
                }
              } catch (err) {
                console.error('Failed to refresh user data:', err);
              }
            };
            fetchUser();
          }}
          onClose={() => setShowBeltForm(false)}
        />
      )}
    </form>
  );
}

export default UserForm;
