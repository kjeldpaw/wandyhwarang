import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserForm from '../components/UserForm';
import '../styles/App.css';

function CreateUserPage() {
  const navigate = useNavigate();

  const handleSave = () => {
    navigate('/');
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Wandy Hwa Rang</h1>
            <p className="subtitle">Create New User</p>
          </div>
          <div className="header-user">
            <button onClick={() => navigate('/')} className="back-btn">
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">
        <div className="container">
          <UserForm
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}

export default CreateUserPage;
