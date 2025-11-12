import React, { useState } from 'react';
import UserForm from './components/UserForm';
import UserList from './components/UserList';
import './styles/App.css';

function App() {
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>Wandyhwarang</h1>
        <p className="subtitle">User Management System</p>
      </header>
      <main className="app-main">
        <div className="container">
          <UserForm
            user={selectedUser}
            onSave={handleSave}
            onCancel={handleCancel}
          />
          <UserList
            refreshTrigger={refreshKey}
            onEdit={handleEdit}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
