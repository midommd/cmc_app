import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  // On garde l'user en state pour qu'il se mette à jour instantanément
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (tk, usr) => {
    localStorage.setItem('token', tk);
    localStorage.setItem('user', JSON.stringify(usr));
    setToken(tk);
    setUser(usr);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // NOUVEAU : Fonction pour mettre à jour l'utilisateur localement après modification
  const handleUserUpdate = (newUser) => {
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  return (
    <div className="App">
      {!token ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard 
          token={token} 
          user={user} 
          onLogout={handleLogout} 
          onUpdateUser={handleUserUpdate} // On passe la fonction au Dashboard
        />
      )}
    </div>
  );
}

export default App;