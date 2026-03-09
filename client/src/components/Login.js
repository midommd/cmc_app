import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react'; 
import toast, { Toaster } from 'react-hot-toast';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { email, password } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', formData);
      toast.success('Connexion réussie !');
      onLogin(res.data.token, res.data.user);
    } catch (err) {
      console.error(err);
      const errors = err.response?.data?.errors;
      if (errors) {
        errors.forEach(error => toast.error(error.msg));
      } else {
        toast.error(err.response?.data?.msg || 'Erreur de connexion');
      }
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <Toaster position="top-right" />
      
      <div style={styles.card}>
        
        {/* --- BOUTON RETOUR --- */}
        <button 
          onClick={() => navigate('/')} 
          style={styles.backBtn}
          title="Retour à l'accueil"
          className="hover-scale" 
        >
          <ArrowLeft size={20} /> Retour
        </button>

        <div style={styles.header}>
          <div style={styles.iconCircle}>
            <LogIn size={28} color="#2563eb" />
          </div>
          <h2 style={styles.title}>Espace Ambassadeur & Clubs</h2>
          <p style={styles.subtitle}>Connectez-vous pour gérer vos missions et clubs</p>
        </div>

        <form onSubmit={onSubmit} style={styles.form}>
          {/* CHAMP EMAIL */}
          <div style={styles.inputGroup}>
            <Mail size={18} style={styles.inputIcon} />
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="Email académique"
              required
              style={styles.input}
            />
          </div>

          {/* CHAMP MOT DE PASSE  */}
          <div style={styles.inputGroup}>
            <Lock size={18} style={styles.inputIcon} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Mot de passe"
              required
              style={{ ...styles.input, paddingRight: '45px' }}
            />
            {/* BOUTON OEIL */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
              title={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
            </button>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
          
          <div style={{marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px'}}>
            <p style={{marginBottom: '10px', color: '#64748b', fontSize: '0.9rem', textAlign: 'center'}}>
              Curieux de nous connaître ?
            </p>
            <button 
              type="button" 
              onClick={() => navigate('/ambassadors')} // Remplacé href par navigate pour éviter de recharger toute l'app React
              style={styles.secondaryBtn}
            >
              ✨ Voir la Communauté (Ambassadeurs & Clubs)
            </button>
          </div>
        </form>
        
        <div style={styles.footer}>
          <p style={{fontSize: '0.8rem', color: '#94a3b8'}}>
            Problème de connexion ? Contactez le Responsable d'application ou envoyez un email en <a href="mailto:mohammedelmahdidaifi@gmail.com" style={{color: '#2563eb', textDecoration: 'none', fontWeight: 'bold'}}>cliquant ici</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at top left, #eff6ff, #ffffff)', 
    padding: '20px',
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '24px',
    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1), 0 10px 15px -5px rgba(0,0,0,0.04)', 
    width: '100%',
    maxWidth: '420px',
    position: 'relative', 
  },
  backBtn: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#64748b',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'color 0.2s',
  },
  header: {
    textAlign: 'center',
    marginBottom: '35px',
    marginTop: '20px',
  },
  iconCircle: {
    width: '64px',
    height: '64px',
    background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', 
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    boxShadow: '0 4px 10px rgba(37,99,235,0.1)',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '0.95rem',
    margin: 0,
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: '#94a3b8',
    pointerEvents: 'none', 
  },
  input: {
    width: '100%',
    padding: '14px 14px 14px 48px',
    borderRadius: '14px',
    border: '1.5px solid #e2e8f0',
    fontSize: '1rem',
    color: '#1e293b',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#f8fafc', 
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s',
  },
  button: {
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: 'white',
    padding: '14px',
    borderRadius: '14px',
    border: 'none',
    fontSize: '1.05rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
    marginTop: '10px',
  },
  secondaryBtn: {
    width: '100%', 
    padding: '14px', 
    background: 'white', 
    border: '1.5px solid #e2e8f0', 
    color: '#3b82f6', 
    borderRadius: '14px', 
    fontWeight: '700', 
    cursor: 'pointer',
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  footer: {
    marginTop: '30px',
    textAlign: 'center',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '20px',
  }
};