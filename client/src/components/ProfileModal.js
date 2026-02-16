import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X, Save, Camera, User, Lock, Mail, Briefcase, Heart, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfileModal({ user, targetUser, token, onClose, onUpdateUser }) {
  // If 'targetUser' is present, it means Admin is managing someone else.
  const isAdminEditing = !!targetUser; 
  const initialData = isAdminEditing ? targetUser : user;

  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', password: '',
    branch: '', motivation: '', hobbies: '', whyCMC: '', photo: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nom: initialData.nom || '',
        prenom: initialData.prenom || '',
        email: initialData.email || '',
        password: '', // Always blank initially for security
        branch: initialData.branch || '',
        motivation: initialData.motivation || '',
        hobbies: initialData.hobbies || '',
        whyCMC: initialData.whyCMC || '',
        photo: initialData.photo || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { 
        toast.error("Image too large (Max 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, photo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (isAdminEditing) {
        // ADMIN Logic: Update Everything
        res = await axios.put(`/api/users/admin-update/${initialData._id}`, formData, {
          headers: { 'x-auth-token': token }
        });
        toast.success("Profile updated by Admin!");
      } else {
        // USER Logic: Update Basic Info Only
        res = await axios.put('/api/users/profile', formData, {
          headers: { 'x-auth-token': token }
        });
        toast.success("Personal info updated!");
      }
      
      onUpdateUser(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Error saving profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}><X size={24} /></button>
        
        <div style={styles.header}>
          <h2 style={styles.title}>{isAdminEditing ? `Editing: ${initialData.prenom}` : 'My Account'}</h2>
          <p style={styles.subtitle}>{isAdminEditing ? "Admin Control" : "Personal Information"}</p>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          
          {/* PHOTO: Only Admin can change it */}
          <div style={styles.photoSection}>
            <div style={styles.avatarWrapper}>
              {formData.photo ? <img src={formData.photo} style={styles.avatar} alt=""/> : <div style={styles.placeholder}>{formData.prenom?.[0]}</div>}
              {isAdminEditing && (
                <label style={styles.camBtn}>
                  <Camera size={16} color="white" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                </label>
              )}
            </div>
            {isAdminEditing && <p style={{fontSize:'0.75rem', color:'#94a3b8', marginTop:'5px'}}>Change Photo</p>}
          </div>

          <div style={styles.sectionTitle}>Identity</div>
          <div style={styles.grid}>
            <div style={styles.field}><label style={styles.label}><User size={14}/> First Name</label><input name="prenom" value={formData.prenom} onChange={handleChange} required style={styles.input} /></div>
            <div style={styles.field}><label style={styles.label}><User size={14}/> Last Name</label><input name="nom" value={formData.nom} onChange={handleChange} required style={styles.input} /></div>
          </div>
          <div style={styles.grid}>
            <div style={styles.field}><label style={styles.label}><Mail size={14}/> Email</label><input name="email" value={formData.email} onChange={handleChange} required style={styles.input} /></div>
            <div style={styles.field}><label style={styles.label}><Lock size={14}/> Password</label><input name="password" type="password" placeholder="Change (optional)" value={formData.password} onChange={handleChange} style={styles.input} /></div>
          </div>

          {/* EXTRA INFO: Only Admin sees this form */}
          {isAdminEditing ? (
            <>
              <div style={styles.sectionTitle}>Details (Admin Only)</div>
              <div style={styles.field}><label style={styles.label}><Briefcase size={14}/> Branch</label><input name="branch" value={formData.branch} onChange={handleChange} placeholder="Digital, ..." style={styles.input} /></div>
              <div style={styles.field}><label style={styles.label}><MessageCircle size={14}/> Quote</label><textarea name="whyCMC" value={formData.whyCMC} onChange={handleChange} style={styles.textarea} /></div>
              <div style={styles.field}><label style={styles.label}><Heart size={14}/> Hobbies</label><textarea name="hobbies" value={formData.hobbies} onChange={handleChange} style={styles.textarea} /></div>
            </>
          ) : (
             <div style={{background: '#f8fafc', padding:'10px', borderRadius:'8px', fontSize:'0.8rem', color:'#64748b', fontStyle:'italic'}}>
               Note: Contact Admin to update photo or branch details.
             </div>
          )}

          <button type="submit" style={styles.saveBtn} disabled={loading}>{loading ? 'Saving...' : <><Save size={18} /> Save</>}</button>
        </form>
      </motion.div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modal: { background: 'white', width: '95%', maxWidth: '550px', borderRadius: '20px', padding: '30px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' },
  closeBtn: { position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' },
  header: { textAlign: 'center', marginBottom: '20px' },
  title: { fontSize: '1.5rem', fontWeight: 'bold', margin: 0 },
  subtitle: { color: '#64748b', fontSize: '0.9rem' },
  photoSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' },
  avatarWrapper: { position: 'relative', width: '100px', height: '100px' },
  avatar: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid #e2e8f0' },
  placeholder: { width: '100%', height: '100%', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white' },
  camBtn: { position: 'absolute', bottom: 0, right: 0, background: '#2563eb', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid white' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  sectionTitle: { fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8', marginTop: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '5px' },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  textarea: { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '60px', fontFamily: 'inherit' },
  saveBtn: { padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }
};