import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage'; // Gardé normal pour un affichage immédiat
import './App.css';
const Login = lazy(() => import('./components/Login'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const AmbassadorsPage = lazy(() => import('./components/AmbassadorsPage'));

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

  const FallbackLoader = () => (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#3b82f6', fontWeight: 'bold' }}>
      Chargement...
    </div>
  );

  return (
    <Router>
      <div className="App">
        {/* Suspense est obligatoire pour dire à React quoi afficher pendant qu'il "Lazy load" une page */}
        <Suspense fallback={<FallbackLoader />}>
          <Routes>
            
            {/* 1. ROUTE ACCUEIL (Landing Page) */}
            <Route 
              path="/" 
              element={token ? <Navigate to="/dashboard" /> : <LandingPage />} 
            />

            {/* 2. ROUTE LOGIN */}
            <Route 
              path="/login" 
              element={token ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} 
            />

            {/* 3. ROUTE DASHBOARD (Protégée) */}
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

            {/* 4. ROUTE PAR DÉFAUT */}
            <Route path="*" element={<Navigate to="/" />} />

          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;