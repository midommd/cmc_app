import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import AmbassadorsPage from './components/AmbassadorsPage' // Assure-toi d'avoir créé ce fichier
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
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

  const handleUserUpdate = (newUser) => {
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  // --- RENDU AVEC ROUTEUR ---
  return (
    <Router>
      <div className="App">
        <Routes>
          
          {/* 1. ROUTE ACCUEIL (Landing Page) */}
          {/* Si déjà connecté, on envoie au Dashboard. Sinon, on montre la belle page d'accueil. */}
          <Route 
            path="/" 
            element={token ? <Navigate to="/dashboard" /> : <LandingPage />} 
          />

          {/* 2. ROUTE LOGIN */}
          {/* Si déjà connecté, inutile de se relogguer -> Dashboard. Sinon -> Login. */}
          <Route 
            path="/login" 
            element={token ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} 
          />

          {/* 3. ROUTE DASHBOARD (Protégée) */}
          {/* Si PAS connecté -> Redirection Login. Sinon -> Dashboard. */}
          <Route 
            path="/dashboard" 
            element={token ? (
              <Dashboard 
                token={token} 
                user={user} 
                onLogout={handleLogout} 
                onUpdateUser={handleUserUpdate}
              />
            ) : (
              <Navigate to="/login" />
            )} 
          />
          <Route path="/ambassadors" element={<AmbassadorsPage />} />

          {/* 4. ROUTE PAR DÉFAUT (Si l'utilisateur tape n'importe quoi) */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;