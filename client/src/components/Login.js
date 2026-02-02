import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
// AJOUTER Eye et EyeOff ici
import { User, Lock, ArrowRight, Loader, Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // NOUVEAU STATE POUR L'OEIL
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      toast.success(`Bienvenue ${res.data.user.prenom} !`);
      setTimeout(() => onLogin(res.data.token, res.data.user), 800);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Erreur de connexion");
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Toaster position="top-center" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.3 }}
        className="login-card"
      >
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', margin: 0, color: '#1e293b', fontWeight: '800' }}>CMC Rabat</h1>
          <p style={{ color: '#64748b', margin: '5px 0' }}>Portail Ambassadeurs - Administration</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Champ Email */}
          <div style={{ position: 'relative' }}>
            <User size={20} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '15px', transform: 'translateY(-50%)' }} />
            <input 
              type="email" 
              placeholder="Email institutionnel" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{ paddingLeft: '45px' }} 
              required 
            />
          </div>

          {/* Champ Mot de passe AVEC TOGGLE */}
          <div style={{ position: 'relative', marginTop: '10px' }}>
            <Lock size={20} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '15px', transform: 'translateY(-50%)' }} />
            
            <input 
              // ICI : On change le type dynamiquement
              type={showPassword ? "text" : "password"} 
              placeholder="Mot de passe" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              // Padding à droite aussi pour ne pas écrire sur l'œil
              style={{ paddingLeft: '45px', paddingRight: '45px' }} 
              required 
            />

            {/* L'ICÔNE OEIL (BOUTON CLIQUABLE) */}
            <button
              type="button" // Important pour ne pas soumettre le formulaire
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                top: '50%',
                right: '10px',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '5px',
                width: 'auto', // Override du style CSS global des boutons
                marginTop: 0   // Override
              }}
            >
              {showPassword ? <EyeOff size={20} color="#64748b" /> : <Eye size={20} color="#64748b" />}
            </button>
          </div>

          <button type="submit" disabled={loading} style={{marginTop: '20px'}}>
            {loading ? (
              <Loader className="animate-spin" size={20} style={{margin: '0 auto'}} />
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                Se connecter <ArrowRight size={20} />
              </span>
            )}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '0.8rem', color: '#94a3b8' }}>
          © {new Date().getFullYear()} Cité des Métiers et des Compétences
        </p>
      </motion.div>
    </div>
  );
}