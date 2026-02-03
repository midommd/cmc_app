import React, { useState } from 'react';
import axios from 'axios'; // Ou ton instance axios configurée
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail, ArrowLeft } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Login({ onLogin }) {
  const navigate = useNavigate(); // <-- Permet de naviguer
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const { email, password } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      // Note: Si tu as configuré un proxy, '/api/auth/login' suffit.
      // Sinon utilise l'URL complète.
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
        >
          <ArrowLeft size={20} /> Retour
        </button>

        <div style={styles.header}>
          <div style={styles.iconCircle}>
            <LogIn size={28} color="#2563eb" />
          </div>
          <h2 style={styles.title}>Espace Ambassadeur</h2>
          <p style={styles.subtitle}>Connectez-vous pour gérer vos missions</p>
        </div>

        <form onSubmit={onSubmit} style={styles.form}>
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

          <div style={styles.inputGroup}>
            <Lock size={18} style={styles.inputIcon} />
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Mot de passe"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        
        <div style={styles.footer}>
          <p style={{fontSize: '0.8rem', color: '#94a3b8'}}>
            Problème de connexion ? Contactez le Club IT.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at top left, #eff6ff, #ffffff)', // Même fond que la Landing Page
    padding: '20px',
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '24px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    position: 'relative', // Pour positionner le bouton retour
  },
  backBtn: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    color: '#64748b',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'color 0.2s',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    marginTop: '20px',
  },
  iconCircle: {
    width: '60px',
    height: '60px',
    background: '#dbeafe',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 10px 0',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '0.95rem',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
  },
  input: {
    width: '100%',
    padding: '12px 12px 12px 45px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    background: '#2563eb',
    color: 'white',
    padding: '12px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  footer: {
    marginTop: '30px',
    textAlign: 'center',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '20px',
  }
};