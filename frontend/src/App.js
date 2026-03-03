import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import UserForm from './components/UserForm';
import UserList from './components/UserList';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreateUserPage from './pages/CreateUserPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ConfirmRegistrationPage from './pages/ConfirmRegistrationPage';
import './styles/App.css';

function App() {
  const navigate = useNavigate();
  const { isAuthenticated, admin, logout, loading } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSave = () => {
    setSelectedUser(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
  };

  const handleCancel = () => {
    setSelectedUser(null);
  };

  const handleLogout = () => {
    logout();
  };

  const canCreateUser = admin?.role === 'admin' || admin?.role === 'master';

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLoginSuccess={() => navigate('/')} />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/create-user" element={<CreateUserPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/confirm-registration" element={<ConfirmRegistrationPage />} />
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <div className="app">
              <header className="app-header">
                <div className="header-content">
                  <div className="header-title">
                    <h1>Wandy Hwa Rang</h1>
                    <p className="subtitle">User Management System</p>
                  </div>
                  <div className="header-user">
                    {canCreateUser && (
                      <button 
                        onClick={() => navigate('/create-user')} 
                        className="create-user-btn"
                        style={{ marginRight: '10px' }}
                      >
                        Create User
                      </button>
                    )}
                    <span className="admin-name">Hello, {admin?.name}!</span>
                    <button onClick={handleLogout} className="logout-btn">
                      Logout
                    </button>
                  </div>
                </div>
              </header>
              <main className="app-main">
                <div className="container">
                  {selectedUser && (
                    <UserForm
                      user={selectedUser}
                      onSave={handleSave}
                      onCancel={handleCancel}
                    />
                  )}
                  <UserList
                    refreshTrigger={refreshKey}
                    onEdit={handleEdit}
                  />
                </div>
              </main>
            </div>
          ) : (
            <LoginPage onLoginSuccess={() => {}} />
          )
        }
      />
    </Routes>
  );
}

export default App;
