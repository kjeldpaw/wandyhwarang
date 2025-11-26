import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BELT_LEVELS } from '../constants/belts';
import '../styles/BeltForm.css';

function BeltForm({ userId, belts, onSave, onClose }) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    belt_level: '',
    awarded_date: new Date().toISOString().split('T')[0],
  });
  const [editingBelt, setEditingBelt] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      if (editingBelt) {
        // Update existing belt
        const response = await fetch(`/api/users/${userId}/belt/${editingBelt.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (!data.success) {
          setError(data.error || 'Failed to update belt');
          return;
        }
      } else {
        // Create new belt
        const response = await fetch(`/api/users/${userId}/belt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (!data.success) {
          setError(data.error || 'Failed to add belt');
          return;
        }
      }
      onSave();
      setFormData({
        belt_level: '',
        awarded_date: new Date().toISOString().split('T')[0],
      });
      setEditingBelt(null);
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (beltId) => {
    if (!window.confirm('Are you sure you want to delete this belt?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/belt/${beltId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!data.success) {
        setError(data.error || 'Failed to delete belt');
        return;
      }
      onSave();
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (belt) => {
    setEditingBelt(belt);
    setFormData({
      belt_level: belt.belt_level,
      awarded_date: belt.awarded_date?.split(' ')[0] || new Date().toISOString().split('T')[0],
    });
  };

  const handleCancel = () => {
    setEditingBelt(null);
    setFormData({
      belt_level: '',
      awarded_date: new Date().toISOString().split('T')[0],
    });
    setError('');
  };

  return (
    <div className="belt-section">
      <h3>Belt History</h3>

      <form className="belt-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="belt_level">Belt Level</label>
          <select
            id="belt_level"
            name="belt_level"
            value={formData.belt_level}
            onChange={handleChange}
            required
          >
            <option value="">Select a belt level</option>
            {BELT_LEVELS.map((belt) => (
              <option key={belt} value={belt}>
                {belt}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="awarded_date">Graduation Date</label>
          <input
            type="date"
            id="awarded_date"
            name="awarded_date"
            value={formData.awarded_date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : editingBelt ? 'Update Belt' : 'Add Belt'}
          </button>
          {editingBelt && (
            <button type="button" onClick={handleCancel} className="cancel-btn">
              Cancel
            </button>
          )}
          <button type="button" onClick={onClose} className="close-btn">
            Close
          </button>
        </div>
      </form>

      {belts && belts.length > 0 && (
        <div className="belt-list">
          <h4>Belts</h4>
          <table>
            <thead>
              <tr>
                <th>Belt Level</th>
                <th>Graduation Date</th>
                <th>Awarded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {belts.map((belt) => (
                <tr key={belt.id}>
                  <td>{belt.belt_level}</td>
                  <td>{belt.awarded_date?.split(' ')[0]}</td>
                  <td>{belt.awarded_by_name || '-'}</td>
                  <td className="actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(belt)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(belt.id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BeltForm;
