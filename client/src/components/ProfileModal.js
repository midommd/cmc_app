import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Lock, Mail, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ProfileModal({ user, token, onClose, onUpdateUser }) {
  const [formData, setFormData] = useState({
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        '/api/auth/update', 
        formData, 
        { headers: { 'x-auth-token': token } }
      );
      
      onUpdateUser(res.data); 
      toast.success("Profil mis à jour avec succès !");
      onClose(); 
    } catch (err) {
      toast.error(err.response?.data?.msg || "Erreur lors de la mise à jour");
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center',
      backdropFilter: 'blur(5px)' 
    }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        style={{ background: 'white', padding: '2rem', borderRadius: '15px', width: '90%', maxWidth: '400px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
      >
        <button onClick={onClose} style={{position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer'}}>
          <X size={24} color="#64748b" />
        </button>

        <h2 style={{marginTop: 0, display:'flex', alignItems:'center', gap:'10px', color:'#1e293b'}}>
          <UserIcon size={24} color="#2563eb" /> Mon Profil
        </h2>

        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
          
          <div style={{display:'flex', gap:'10px'}}>
            <input 
              type="text" value={formData.nom} placeholder="Nom"
              onChange={e => setFormData({...formData, nom: e.target.value})}
              style={inputStyle} required 
            />
            <input 
              type="text" value={formData.prenom} placeholder="Prénom"
              onChange={e => setFormData({...formData, prenom: e.target.value})}
              style={inputStyle} required 
            />
          </div>

          <div style={{position:'relative'}}>
            <Mail size={18} color="#94a3b8" style={{position:'absolute', top:'12px', left:'10px'}}/>
            <input 
              type="email" value={formData.email} placeholder="Email"
              onChange={e => setFormData({...formData, email: e.target.value})}
              style={{...inputStyle, paddingLeft:'35px'}} required 
            />
          </div>

          <div style={{position:'relative'}}>
            <Lock size={18} color="#94a3b8" style={{position:'absolute', top:'12px', left:'10px'}}/>
            
            <input 
              type={showPassword ? "text" : "password"}
              value={formData.password} 
              placeholder="Nouveau mot de passe"
              onChange={e => setFormData({...formData, password: e.target.value})}
              style={{...inputStyle, paddingLeft:'35px', paddingRight: '40px'}} 
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', top: '8px', right: '10px',
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px'
              }}
            >
              {showPassword ? <EyeOff size={18} color="#94a3b8"/> : <Eye size={18} color="#94a3b8"/>}
            </button>
          </div>

          <button type="submit" style={{
            background: '#2563eb', color: 'white', padding: '12px', border: 'none', borderRadius: '8px',
            fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop:'10px'
          }}>
            <Save size={18} /> Enregistrer
          </button>

        </form>
      </motion.div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0',
  fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none'
};