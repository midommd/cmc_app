import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
// J'ai ajouté 'Linkedin' dans les imports
import { X, Save, Camera, User, Lock, Mail, Briefcase, Heart, MessageCircle, Linkedin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfileModal({ user, targetUser, token, onClose, onUpdateUser }) {
  // Si 'targetUser' existe, c'est un Admin qui modifie quelqu'un d'autre.
  const isAdminEditing = !!targetUser; 
  const initialData = isAdminEditing ? targetUser : user;

  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', password: '',
    branch: '', motivation: '', hobbies: '', whyCMC: '', photo: '',
    linkedin: '' // AJOUT DU CHAMP LINKEDIN
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nom: initialData.nom || '',
        prenom: initialData.prenom || '',
        email: initialData.email || '',
        password: '', // Toujours vide pour la sécurité
        branch: initialData.branch || '',
        motivation: initialData.motivation || '',
        hobbies: initialData.hobbies || '',
        whyCMC: initialData.whyCMC || '',
        photo: initialData.photo || '',
        linkedin: initialData.linkedin || '' // CHARGEMENT DE LINKEDIN
      });
    }
  }, [initialData]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { 
        toast.error("Image trop lourde (Max 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        // Mise à jour immédiate de l'aperçu local
        setFormData(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (isAdminEditing) {
        // Logique ADMIN : Mise à jour complète via ID
        res = await axios.put(`/api/users/admin-update/${initialData._id}`, formData, {
          headers: { 'x-auth-token': token }
        });
        toast.success("Profil mis à jour par l'Admin !");
      } else {
        // Logique USER : Mise à jour du profil personnel
        // Note : On envoie tout le formData (y compris photo et linkedin)
        res = await axios.put('/api/users/profile', formData, {
          headers: { 'x-auth-token': token }
        });
        toast.success("Informations mises à jour !");
      }
      
      // CRUCIAL : On renvoie les nouvelles données (avec la nouvelle photo) au composant parent (Dashboard)
      // pour que l'avatar du header se mette à jour instantanément.
      onUpdateUser(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Erreur sauvegarde profil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}><X size={24} /></button>
        
        <div style={styles.header}>
          <h2 style={styles.title}>{isAdminEditing ? `Édition : ${initialData.prenom}` : 'Mon Compte'}</h2>
          <p style={styles.subtitle}>{isAdminEditing ? "Contrôle Admin" : "Informations Personnelles"}</p>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          
          {/* PHOTO SECTION */}
          <div style={styles.photoSection}>
            <div style={styles.avatarWrapper}>
              {formData.photo ? (
                <img src={formData.photo} style={styles.avatar} alt="Profil"/>
              ) : (
                <div style={styles.placeholder}>{formData.prenom?.[0]}</div>
              )}
              
              {/* MODIFICATION : J'ai enlevé la condition isAdminEditing pour que l'utilisateur puisse changer sa photo */}
              <label style={styles.camBtn}>
                <Camera size={16} color="white" />
                <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
              </label>
            </div>
            <p style={{fontSize:'0.75rem', color:'#94a3b8', marginTop:'5px'}}>Changer la photo</p>
          </div>

          <div style={styles.sectionTitle}>Identité</div>
          <div style={styles.grid}>
            <div style={styles.field}><label style={styles.label}><User size={14}/> Prénom</label><input name="prenom" value={formData.prenom} onChange={handleChange} required style={styles.input} /></div>
            <div style={styles.field}><label style={styles.label}><User size={14}/> Nom</label><input name="nom" value={formData.nom} onChange={handleChange} required style={styles.input} /></div>
          </div>
          
          <div style={styles.grid}>
            <div style={styles.field}><label style={styles.label}><Mail size={14}/> Email</label><input name="email" value={formData.email} onChange={handleChange} required style={styles.input} /></div>
            <div style={styles.field}><label style={styles.label}><Lock size={14}/> Mot de passe</label><input name="password" type="password" placeholder="Changer (optionnel)" value={formData.password} onChange={handleChange} style={styles.input} /></div>
          </div>

          {/* AJOUT DU CHAMP LINKEDIN ICI */}
          <div style={styles.field}>
            <label style={styles.label}><Linkedin size={14} color="#0a66c2"/> LinkedIn (URL)</label>
            <input name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..." style={styles.input} />
          </div>

          {/* EXTRA INFO : Visible pour Admin ou User (selon ton besoin, j'ai laissé ouvert pour que l'user puisse modifier ses infos) */}
          <div style={styles.sectionTitle}>Détails Complémentaires</div>
          {isAdminEditing ? (
             <div style={styles.field}><label style={styles.label}><Briefcase size={14}/> Filière (Admin)</label><input name="branch" value={formData.branch} onChange={handleChange} style={styles.input} /></div>
          ) : null}
          
          <div style={styles.field}><label style={styles.label}><MessageCircle size={14}/> Citation / Motivation</label><textarea name="whyCMC" value={formData.whyCMC} onChange={handleChange} style={styles.textarea} /></div>
          <div style={styles.field}><label style={styles.label}><Heart size={14}/> Hobbies</label><textarea name="hobbies" value={formData.hobbies} onChange={handleChange} style={styles.textarea} /></div>

          <button type="submit" style={styles.saveBtn} disabled={loading}>{loading ? 'Sauvegarde...' : <><Save size={18} /> Enregistrer</>}</button>
        </form>
      </motion.div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modal: { background: 'white', width: '95%', maxWidth: '550px', borderRadius: '20px', padding: '30px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
  closeBtn: { position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
  header: { textAlign: 'center', marginBottom: '20px' },
  title: { fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#1e293b' },
  subtitle: { color: '#64748b', fontSize: '0.9rem' },
  photoSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' },
  avatarWrapper: { position: 'relative', width: '100px', height: '100px' },
  avatar: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  placeholder: { width: '100%', height: '100%', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', fontWeight: 'bold', border: '4px solid #e2e8f0' },
  camBtn: { position: 'absolute', bottom: 0, right: 0, background: '#2563eb', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'transform 0.2s' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  sectionTitle: { fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginTop: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '5px', letterSpacing: '0.05em' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', transition: 'border-color 0.2s', outline: 'none' },
  textarea: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'vertical' },
  saveBtn: { padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '15px', transition: 'background-color 0.2s' }
};