import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User API calls
export const userAPI = {
  getAll: () => {
    const token = localStorage.getItem('authToken');
    return api.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getById: (id) => {
    const token = localStorage.getItem('authToken');
    return api.get(`/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  create: (data) => {
    const token = localStorage.getItem('authToken');
    return api.post('/api/users', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  update: (id, data) => {
    const token = localStorage.getItem('authToken');
    return api.put(`/api/users/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  delete: (id) => {
    const token = localStorage.getItem('authToken');
    return api.delete(`/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default api;
