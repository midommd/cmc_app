import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X, Save, Camera, User, Lock, Mail, Briefcase, Heart, MessageCircle, Linkedin } from 'lucide-react';
import { motion } from 'framer-motion';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

export default function ProfileModal({ user, targetUser, token, onClose, onUpdateUser }) {
  // Si targetUser existe, c'est l'Admin. Sinon, c'est l'utilisateur lui-même.
  const isAdminEditing = !!targetUser; 
  const initialData = isAdminEditing ? targetUser : user;

  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', password: '', branch: '', motivation: '', hobbies: '', whyCMC: '', photo: '', linkedin: '',
    role: 'ambassadeur', isAmbassadeur: true, isClubLeader: false
  });
  const [loading, setLoading] = useState(false);

  // STATES DU RECADREUR
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  useEffect(() => {
    // 1. On charge les données de base
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        password: '', // On garde toujours le mot de passe vide à l'affichage
      }));
    }

    // 2. SI C'EST L'UTILISATEUR : On va chercher ses données complètes (Photo, LinkedIn, Citation...)
    const fetchFullProfile = async () => {
      if (!isAdminEditing && initialData) {
        try {
          // On essaie de récupérer le profil complet via la liste des ambassadeurs
          const res = await axios.get('/api/users/ambassadors');
          const myId = initialData._id || initialData.id;
          const myFullProfile = res.data.find(u => u._id === myId);
          
          if (myFullProfile) {
            setFormData(prev => ({
              ...prev,
              ...myFullProfile,
              password: '' // Toujours vide
            }));
          }
        } catch (err) {
          console.error("Erreur de chargement du profil complet", err);
        }
      }
    };

    fetchFullProfile();
  }, [initialData, isAdminEditing]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- UPLOAD CLOUDINARY AVEC RECADRAGE (Réservé à l'Admin) ---
  const handleFileSelect = (e) => {
    if (!isAdminEditing) return; // Sécurité supplémentaire
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5000000) return toast.error("L'image est trop lourde (Max 5MB)");

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setImageSrc(reader.result);
      setIsCropping(true);
    };
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropAndUpload = async () => {
    const loadToast = toast.loading("Upload de la photo en HD...");
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const data = new FormData();
      data.append("file", croppedImageBlob);
      data.append("upload_preset", "cmc_preset");
      data.append("cloud_name", "dddxjro92");

      const res = await axios.post("https://api.cloudinary.com/v1_1/dddxjro92/image/upload", data);
      
      toast.dismiss(loadToast);
      toast.success("Photo uploadée et cadrée !");
      setFormData(prev => ({ ...prev, photo: res.data.secure_url }));
      
      setIsCropping(false);
      setImageSrc(null);
      setZoom(1);
    } catch (err) {
      console.error(err);
      toast.dismiss(loadToast);
      toast.error("Erreur lors de l'upload");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.password || payload.password.trim() === '') {
        delete payload.password; // Ne pas écraser le mdp s'il est vide
      }

      let res;
      if (isAdminEditing) {
        res = await axios.put(`/api/users/admin-update/${initialData._id}`, payload, { headers: { 'x-auth-token': token } });
        toast.success("Profil mis à jour par l'Admin !");
      } else {
        res = await axios.put('/api/users/profile', payload, { headers: { 'x-auth-token': token } });
        toast.success("Informations mises à jour !");
      }
      onUpdateUser(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Erreur sauvegarde profil");
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.overlay}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}><X size={24} /></button>
        
        <div style={styles.header}>
          <h2 style={styles.title}>{isAdminEditing ? `Édition : ${formData.prenom}` : 'Mon Compte'}</h2>
          <p style={styles.subtitle}>{isAdminEditing ? "Contrôle Admin" : "Informations Personnelles"}</p>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          
          {/* PHOTO SECTION */}
          <div style={styles.photoSection}>
            <div style={styles.avatarWrapper}>
              {formData.photo ? <img src={formData.photo} style={styles.avatar} alt="Profil"/> : <div style={styles.placeholder}>{formData.prenom?.[0]}</div>}
              
              {/* L'icône de l'appareil photo ne s'affiche QUE pour l'Admin */}
              {isAdminEditing && (
                <label style={styles.camBtn}>
                  <Camera size={16} color="white" />
                  <input type="file" accept="image/*" onChange={handleFileSelect} hidden />
                </label>
              )}
            </div>
            <p style={{fontSize:'0.75rem', color:'#94a3b8', marginTop:'5px'}}>
              {isAdminEditing ? "Cliquer pour recadrer une photo" : "Photo gérée par l'administration"}
            </p>
          </div>

          <div style={styles.sectionTitle}>Identité</div>
          <div style={styles.grid}>
            <div style={styles.field}><label style={styles.label}><User size={14}/> Prénom</label><input name="prenom" value={formData.prenom} onChange={handleChange} required style={styles.input} /></div>
            <div style={styles.field}><label style={styles.label}><User size={14}/> Nom</label><input name="nom" value={formData.nom} onChange={handleChange} required style={styles.input} /></div>
          </div>
          
          <div style={styles.grid}>
            <div style={styles.field}><label style={styles.label}><Mail size={14}/> Email</label><input name="email" value={formData.email} onChange={handleChange} required style={styles.input} /></div>
            <div style={styles.field}><label style={styles.label}><Lock size={14}/> Mot de passe</label><input name="password" type="password" placeholder="Laisser vide pour ne pas changer" value={formData.password} onChange={handleChange} style={styles.input} /></div>
          </div>

          {/* LINKEDIN - Modifiable par l'utilisateur */}
          <div style={styles.field}>
            <label style={styles.label}><Linkedin size={14} color="#0a66c2"/> LinkedIn (URL)</label>
            <input name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..." style={styles.input} />
          </div>

          <div style={styles.sectionTitle}>Détails Complémentaires</div>
          
          {/* FILIÈRE - Modifiable par l'utilisateur ET l'admin */}
          <div style={styles.field}>
            <label style={styles.label}><Briefcase size={14}/> Filière</label>
            <input name="branch" value={formData.branch} onChange={handleChange} placeholder="Ex: Développement Digital" style={styles.input} />
          </div>
          
          {/* CITATION & HOBBIES - Bloqués si ce n'est pas l'Admin */}
          <div style={styles.field}>
            <label style={styles.label}><MessageCircle size={14}/> Citation / Motivation</label>
            <textarea 
              name="whyCMC" 
              value={formData.whyCMC} 
              onChange={handleChange} 
              disabled={!isAdminEditing} 
              style={{...styles.textarea, opacity: !isAdminEditing ? 0.6 : 1, cursor: !isAdminEditing ? 'not-allowed' : 'text'}} 
            />
          </div>
          
          <div style={styles.field}>
            <label style={styles.label}><Heart size={14}/> Hobbies</label>
            <textarea 
              name="hobbies" 
              value={formData.hobbies} 
              onChange={handleChange} 
              disabled={!isAdminEditing} 
              style={{...styles.textarea, opacity: !isAdminEditing ? 0.6 : 1, cursor: !isAdminEditing ? 'not-allowed' : 'text'}} 
            />
          </div>

          <button type="submit" style={styles.saveBtn} disabled={loading}>{loading ? 'Sauvegarde...' : <><Save size={18} /> Enregistrer le profil</>}</button>
        </form>
      </motion.div>

      {/* MODALE DE RECADRAGE */}
      {isCropping && (
        <div style={{...styles.overlay, zIndex: 3000}}>
          <div style={{background: 'white', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <h3 style={{fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '15px'}}>Ajuster la photo</h3>
            <div style={{position: 'relative', width: '100%', height: '300px', background: '#333', borderRadius: '12px', overflow: 'hidden', marginBottom: '15px'}}>
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} style={{width: '100%', marginBottom: '20px'}} />
            <div style={{display: 'flex', gap: '10px', width: '100%'}}>
              <button onClick={() => { setIsCropping(false); setImageSrc(null); setZoom(1); }} style={{flex: 1, padding: '10px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}}>Annuler</button>
              <button onClick={handleCropAndUpload} style={{flex: 1, padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}}>Valider & Cadrer</button>
            </div>
          </div>
        </div>
      )}
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