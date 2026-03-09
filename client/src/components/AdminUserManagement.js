import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, UserPlus, Mail, Briefcase, Lock, User, RefreshCw, Edit, Users, Trophy, PlusCircle, Save, Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ProfileModal from './ProfileModal';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

export default function AdminUserManagement({ token }) {
  const [activeTab, setActiveTab] = useState('ambassadeurs');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', password: 'cmc2025', branch: '', role: 'ambassadeur', isAmbassadeur: true, isClubLeader: false });
  
  // STATES POUR LE RECADRAGE
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [tempCallback, setTempCallback] = useState(null);

  const [clubs, setClubs] = useState([]);
  const [editingClub, setEditingClub] = useState(null); 

  const fetchData = async () => {
    setLoading(true);
    try {
      const resUsers = await axios.get('/api/users/ambassadors');
      setUsers(resUsers.data);
      const resClubs = await axios.get('/api/clubs');
      setClubs(resClubs.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddUser = async (e) => {
    e.preventDefault();
    const loadToast = toast.loading("Création...");
    try {
      await axios.post('/api/users/add', formData, { headers: { 'x-auth-token': token } });
      toast.dismiss(loadToast); toast.success("Utilisateur ajouté !");
      setFormData({ nom: '', prenom: '', email: '', password: 'cmc2025', branch: '', role: 'ambassadeur', isAmbassadeur: true, isClubLeader: false });
      fetchData();
    } catch (err) { toast.dismiss(loadToast); toast.error("Erreur"); }
  };

  const handleDeleteUser = async (id) => {
    if(!window.confirm("Supprimer ?")) return;
    try { await axios.delete(`/api/users/${id}`, { headers: { 'x-auth-token': token } }); toast.success("Supprimé"); fetchData(); } catch(e) {}
  };

  const handleCreateClub = async () => {
    try {
      const newClub = { name: "Nouveau Club", icon: "⭐", bgIcon: "#e2e8f0", description: "", president: {}, staff: [], subClubs: [] };
      const res = await axios.post('/api/clubs', newClub, { headers: { 'x-auth-token': token } });
      setClubs([...clubs, res.data]);
      setEditingClub(res.data);
      toast.success("Club créé, à vous de l'éditer !");
    } catch (err) { toast.error("Erreur de création"); }
  };

  const handleSaveClub = async () => {
    const load = toast.loading("Sauvegarde en cours...");
    try {
      const res = await axios.put(`/api/clubs/${editingClub._id}`, editingClub, { headers: { 'x-auth-token': token } });
      setClubs(clubs.map(c => c._id === res.data._id ? res.data : c));
      toast.dismiss(load); toast.success("Club sauvegardé !");
      setEditingClub(null);
    } catch (err) { toast.dismiss(load); toast.error("Erreur de sauvegarde"); }
  };

  const handleDeleteClub = async (id) => {
    if(!window.confirm("Supprimer définitivement ce Club ?")) return;
    try {
      await axios.delete(`/api/clubs/${id}`, { headers: { 'x-auth-token': token } });
      setClubs(clubs.filter(c => c._id !== id));
      toast.success("Club supprimé");
    } catch (err) { toast.error("Erreur"); }
  };

  // --- UPLOAD CLOUDINARY AVEC RECADRAGE ---
  const handleFileSelect = (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5000000) return toast.error("L'image est trop lourde (Max 5MB)");

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setImageSrc(reader.result);
      setTempCallback(() => callback);
      setIsCropping(true);
    };
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropAndUpload = async () => {
    const loadToast = toast.loading("Upload de l'image en HD...");
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      const data = new FormData();
      data.append("file", croppedImageBlob);
      data.append("upload_preset", "cmc_preset");
      data.append("cloud_name", "dddxjro92");

      const res = await axios.post("https://api.cloudinary.com/v1_1/dddxjro92/image/upload", data);
      
      toast.dismiss(loadToast);
      toast.success("Image HD sauvegardée !");
      
      tempCallback(res.data.secure_url); 
      setIsCropping(false);
      setImageSrc(null);
      setZoom(1);
    } catch (err) {
      console.error(err);
      toast.dismiss(loadToast);
      toast.error("Erreur lors de l'envoi");
    }
  };

  const PhotoUpload = ({ photo, onUpload, label }) => (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px'}}>
      <div style={{width: '70px', height: '70px', borderRadius: '50%', background: '#e2e8f0', position: 'relative', overflow: 'hidden', border: '2px solid #cbd5e1'}}>
        {photo ? <img src={photo} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <User size={30} color="#94a3b8" style={{margin: '18px'}} />}
        <label style={{position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', padding: '4px', cursor: 'pointer'}}>
          <Camera size={14} color="white" />
          <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, onUpload)} hidden />
        </label>
      </div>
      <span style={{fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold'}}>{label}</span>
    </div>
  );

  return (
    <div style={styles.container}>
      {editingUser && <ProfileModal targetUser={editingUser} token={token} onClose={() => setEditingUser(null)} onUpdateUser={() => { fetchData(); setEditingUser(null); }} />}

      <div style={styles.tabMenu}>
        <button onClick={() => {setActiveTab('ambassadeurs'); setEditingClub(null);}} style={{...styles.tabBtn, borderBottom: activeTab === 'ambassadeurs' ? '3px solid #2563eb' : '3px solid transparent', color: activeTab === 'ambassadeurs' ? '#2563eb' : '#64748b'}}><Users size={18} /> Gestion Ambassadeurs</button>
        <button onClick={() => setActiveTab('clubs')} style={{...styles.tabBtn, borderBottom: activeTab === 'clubs' ? '3px solid #10b981' : '3px solid transparent', color: activeTab === 'clubs' ? '#10b981' : '#64748b'}}><Trophy size={18} /> CMC Clubs (Base de données)</button>
      </div>

      {activeTab === 'ambassadeurs' && !editingClub && (
        <div style={styles.contentWrapper}>
          <div style={styles.addSection}>
            <h3 style={styles.title}><UserPlus size={22} /> Ajouter un Utilisateur</h3>
            <form onSubmit={handleAddUser}>
              <div style={styles.formGrid}>
                <div style={styles.inputGroup}><User size={16} style={styles.icon}/><input name="prenom" placeholder="Prénom" value={formData.prenom} onChange={onChange} required style={styles.input} /></div>
                <div style={styles.inputGroup}><User size={16} style={styles.icon}/><input name="nom" placeholder="Nom" value={formData.nom} onChange={onChange} required style={styles.input} /></div>
                <div style={styles.inputGroup}><Mail size={16} style={styles.icon}/><input name="email" placeholder="Email" value={formData.email} onChange={onChange} required style={styles.input} /></div>
                <div style={styles.inputGroup}><Briefcase size={16} style={styles.icon}/><input name="branch" placeholder="Filière" value={formData.branch} onChange={onChange} style={styles.input} /></div>
                <div style={styles.inputGroup}><Lock size={16} style={styles.icon}/><input name="password" placeholder="Mot de passe" value={formData.password} onChange={onChange} required style={styles.input} /></div>
                <button type="submit" style={styles.addBtn}>Ajouter</button>
              </div>
            </form>
          </div>

          <div style={styles.listSection}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3 style={styles.title}>Gestion des Profils ({users.length})</h3>
              <button onClick={fetchData} style={styles.refreshBtn}><RefreshCw size={18} className={loading ? 'spin' : ''}/></button>
            </div>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead><tr><th>Identité</th><th>Login</th><th>Filière & Accès</th><th style={{textAlign: 'center'}}>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td><div style={{fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px'}}>{u.photo && u.photo.length > 20 ? <img src={u.photo} alt="" style={{width:'30px', height:'30px', borderRadius:'50%', objectFit:'cover'}}/> : <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem'}}>{u.prenom[0]}</div>}{u.prenom} {u.nom}</div></td>
                      <td style={{color: '#64748b'}}>{u.email}</td>
                      <td><div style={{display: 'flex', flexDirection:'column', gap:'5px', alignItems:'flex-start'}}><span style={styles.tag}>{u.branch || '-'}</span><div style={{display:'flex', gap:'5px'}}>{u.role === 'admin' && <span style={{...styles.tinyBadge, background:'#fef2f2', color:'#ef4444'}}>Admin</span>}{u.isAmbassadeur && <span style={{...styles.tinyBadge, background:'#eff6ff', color:'#2563eb'}}>Ambas.</span>}{u.isClubLeader && <span style={{...styles.tinyBadge, background:'#ecfdf5', color:'#10b981'}}>Club</span>}</div></div></td>
                      <td style={{textAlign: 'center'}}><div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}><button onClick={() => setEditingUser(u)} style={styles.editBtn}><Edit size={16} /> Éditer</button><button onClick={() => handleDeleteUser(u._id)} style={styles.deleteBtn}><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'clubs' && !editingClub && (
        <div style={styles.contentWrapper}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 style={{margin: 0, color: '#1e293b'}}>Clubs de la BDD</h2>
            <button onClick={handleCreateClub} style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'}}><PlusCircle size={18} /> Créer un Club</button>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
            {clubs.map(club => (
              <div key={club._id} style={{background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px'}}>
                  <div style={{fontSize: '2rem', background: club.bgIcon, width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{club.icon}</div>
                  <div><h3 style={{margin: '0 0 5px 0', fontSize: '1.2rem'}}>{club.name}</h3><span style={{fontSize: '0.8rem', color: '#64748b'}}>{club.subClubs.length} Sous-Clubs • {club.staff.length} Staff</span></div>
                </div>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button onClick={() => setEditingClub(club)} style={{flex: 1, ...styles.editBtn, background: '#f8fafc', color: '#1e293b', border: '1px solid #cbd5e1', justifyContent: 'center'}}><Edit size={16}/> Configurer</button>
                  <button onClick={() => handleDeleteClub(club._id)} style={styles.deleteBtn}><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
            {clubs.length === 0 && <p style={{color: '#94a3b8', fontStyle: 'italic', gridColumn: '1/-1'}}>Aucun Club dans la base de données. Créez-en un !</p>}
          </div>
        </div>
      )}

      {editingClub && (
        <div style={{background: 'white', borderRadius: '20px', padding: '30px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px'}}>
            <h2 style={{margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px'}}><Edit size={24} color="#2563eb"/> CMC Club : {editingClub.name}</h2>
            <div style={{display: 'flex', gap: '10px'}}>
              <button onClick={() => setEditingClub(null)} style={{background: 'transparent', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold'}}>Annuler</button>
              <button onClick={handleSaveClub} style={{background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'}}><Save size={18}/> Enregistrer dans BDD</button>
            </div>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px'}}>
            <div>
              <h3 style={styles.CMCSectionTitle}>1. Identité du Club</h3>
              <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                <input type="text" value={editingClub.icon} onChange={(e) => setEditingClub({...editingClub, icon: e.target.value})} title="Emoji" style={{...styles.CMCInput, width: '60px', textAlign: 'center', fontSize: '1.5rem'}} />
                <input type="text" value={editingClub.name} onChange={(e) => setEditingClub({...editingClub, name: e.target.value})} placeholder="Nom du Club" style={{...styles.CMCInput, flex: 1, fontWeight: 'bold'}} />
                <input type="color" value={editingClub.bgIcon} onChange={(e) => setEditingClub({...editingClub, bgIcon: e.target.value})} style={{width: '50px', height: '45px', border: 'none', borderRadius: '8px', cursor: 'pointer'}} title="Couleur de fond" />
              </div>
              <textarea value={editingClub.description} onChange={(e) => setEditingClub({...editingClub, description: e.target.value})} placeholder="Description du Club" style={{...styles.CMCInput, width: '100%', minHeight: '80px', marginBottom: '30px'}} />

              <h3 style={styles.CMCSectionTitle}>2. Profil du Président</h3>
              <div style={{background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '20px', alignItems: 'flex-start'}}>
                <PhotoUpload photo={editingClub.president?.photo} label="Photo" onUpload={(url) => setEditingClub({...editingClub, president: {...editingClub.president, photo: url}})} />
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <input type="text" value={editingClub.president?.prenom || ''} onChange={(e) => setEditingClub({...editingClub, president: {...editingClub.president, prenom: e.target.value}})} placeholder="Prénom" style={styles.CMCInput} />
                    <input type="text" value={editingClub.president?.nom || ''} onChange={(e) => setEditingClub({...editingClub, president: {...editingClub.president, nom: e.target.value}})} placeholder="Nom" style={styles.CMCInput} />
                  </div>
                  <input type="text" value={editingClub.president?.filiere || ''} onChange={(e) => setEditingClub({...editingClub, president: {...editingClub.president, filiere: e.target.value}})} placeholder="Filière" style={styles.CMCInput} />
                  <textarea value={editingClub.president?.msg || ''} onChange={(e) => setEditingClub({...editingClub, president: {...editingClub.president, msg: e.target.value}})} placeholder="Message d'accueil (Citation)" style={{...styles.CMCInput, minHeight: '60px'}} />
                </div>
              </div>
            </div>

            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <h3 style={{...styles.CMCSectionTitle, margin: 0}}>3. Staff du Club</h3>
                <button onClick={() => setEditingClub({...editingClub, staff: [...editingClub.staff, {nom:'', prenom:'', role:'', photo:''}]})} style={styles.smallAddBtn}>+ Ajouter Staff</button>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px'}}>
                {editingClub.staff.map((member, i) => (
                  <div key={i} style={{display: 'flex', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                    <PhotoUpload photo={member.photo} label="Photo" onUpload={(url) => { const nS = [...editingClub.staff]; nS[i].photo = url; setEditingClub({...editingClub, staff: nS}); }} />
                    <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '5px'}}>
                      <div style={{display: 'flex', gap: '5px'}}>
                        <input type="text" value={member.prenom} onChange={(e) => { const nS = [...editingClub.staff]; nS[i].prenom = e.target.value; setEditingClub({...editingClub, staff: nS}); }} placeholder="Prénom" style={styles.CMCInputSmall} />
                        <input type="text" value={member.nom} onChange={(e) => { const nS = [...editingClub.staff]; nS[i].nom = e.target.value; setEditingClub({...editingClub, staff: nS}); }} placeholder="Nom" style={styles.CMCInputSmall} />
                      </div>
                      <input type="text" value={member.role} onChange={(e) => { const nS = [...editingClub.staff]; nS[i].role = e.target.value; setEditingClub({...editingClub, staff: nS}); }} placeholder="Rôle (ex: Trésorier)" style={styles.CMCInputSmall} />
                    </div>
                    <button onClick={() => { const nS = editingClub.staff.filter((_, idx) => idx !== i); setEditingClub({...editingClub, staff: nS}); }} style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer'}}><X size={18}/></button>
                  </div>
                ))}
                {editingClub.staff.length === 0 && <p style={{fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic'}}>Aucun staff ajouté.</p>}
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <h3 style={{...styles.CMCSectionTitle, margin: 0}}>4. Sous-Clubs / Activités</h3>
                <button onClick={() => setEditingClub({...editingClub, subClubs: [...editingClub.subClubs, {name:'', icon:'⭐', desc:'', responsable:{}}]})} style={styles.smallAddBtn}>+ Ajouter Sous-club</button>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                {editingClub.subClubs.map((sub, i) => (
                  <div key={i} style={{background: '#f8fafc', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0', position: 'relative'}}>
                    <button onClick={() => { const nSC = editingClub.subClubs.filter((_, idx) => idx !== i); setEditingClub({...editingClub, subClubs: nSC}); }} style={{position: 'absolute', top: '10px', right: '10px', background: '#fef2f2', border: 'none', color: '#ef4444', borderRadius: '50%', padding: '5px', cursor: 'pointer'}}><X size={14}/></button>
                    
                    <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                       <input type="text" value={sub.icon} onChange={(e) => { const nSC = [...editingClub.subClubs]; nSC[i].icon = e.target.value; setEditingClub({...editingClub, subClubs: nSC}); }} style={{...styles.CMCInputSmall, width: '40px', textAlign: 'center'}} title="Emoji"/>
                       <input type="text" value={sub.name} onChange={(e) => { const nSC = [...editingClub.subClubs]; nSC[i].name = e.target.value; setEditingClub({...editingClub, subClubs: nSC}); }} placeholder="Nom du sous-club" style={{...styles.CMCInputSmall, flex: 1, fontWeight: 'bold'}}/>
                    </div>
                    <input type="text" value={sub.desc} onChange={(e) => { const nSC = [...editingClub.subClubs]; nSC[i].desc = e.target.value; setEditingClub({...editingClub, subClubs: nSC}); }} placeholder="Description" style={{...styles.CMCInputSmall, width: '100%', marginBottom: '10px'}}/>
                    
                    <div style={{borderTop: '1px dashed #cbd5e1', paddingTop: '10px', display: 'flex', gap: '10px', alignItems: 'center'}}>
                      <PhotoUpload photo={sub.responsable?.photo} label="Resp." onUpload={(url) => { const nSC = [...editingClub.subClubs]; if(!nSC[i].responsable) nSC[i].responsable = {}; nSC[i].responsable.photo = url; setEditingClub({...editingClub, subClubs: nSC}); }} />
                      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '5px'}}>
                        <input type="text" value={sub.responsable?.prenom || ''} onChange={(e) => { const nSC = [...editingClub.subClubs]; if(!nSC[i].responsable) nSC[i].responsable = {}; nSC[i].responsable.prenom = e.target.value; setEditingClub({...editingClub, subClubs: nSC}); }} placeholder="Prénom Responsable" style={styles.CMCInputSmall}/>
                        <input type="text" value={sub.responsable?.nom || ''} onChange={(e) => { const nSC = [...editingClub.subClubs]; if(!nSC[i].responsable) nSC[i].responsable = {}; nSC[i].responsable.nom = e.target.value; setEditingClub({...editingClub, subClubs: nSC}); }} placeholder="Nom Responsable" style={styles.CMCInputSmall}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FENÊTRE DE RECADRAGE --- */}
      {isCropping && (
        <div style={styles.modalOverlay}>
          <div style={styles.cropModalContainer}>
            <h3 style={{fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '15px'}}>Ajuster la photo</h3>
            <div style={{position: 'relative', width: '100%', height: '300px', background: '#333', borderRadius: '12px', overflow: 'hidden', marginBottom: '15px'}}>
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} style={{width: '100%', marginBottom: '20px'}} />
            <div style={{display: 'flex', gap: '10px', width: '100%'}}>
              <button onClick={() => { setIsCropping(false); setImageSrc(null); setZoom(1); }} style={{flex: 1, padding: '10px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}}>Annuler</button>
              <button onClick={handleCropAndUpload} style={{flex: 1, padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}}>Valider & Envoyer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  contentWrapper: { display: 'flex', flexDirection: 'column', gap: '20px' },
  tabMenu: { display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '10px' },
  tabBtn: { background: 'transparent', border: 'none', padding: '15px 25px', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' },
  addSection: { background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
  listSection: { background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
  title: { fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' },
  inputGroup: { position: 'relative' },
  icon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
  input: { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' },
  addBtn: { height: '42px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', padding:'0 20px' },
  checkboxContainer: { display: 'flex', alignItems: 'center', gap: '20px', marginTop: '20px', background: '#f8fafc', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: '#334155', fontWeight:'500' },
  tinyBadge: { fontSize:'0.65rem', padding:'2px 6px', borderRadius:'8px', fontWeight:'bold' },
  refreshBtn: { background: 'transparent', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#64748b' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' },
  tag: { background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', color: '#475569', fontWeight: '500' },
  deleteBtn: { background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' },
  editBtn: { background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', fontSize: '0.8rem' },
  
  CMCSectionTitle: { fontSize: '1rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px', borderBottom: '2px solid #e2e8f0', paddingBottom: '5px' },
  CMCInput: { padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
  CMCInputSmall: { padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  smallAddBtn: { background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '5px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cropModalContainer: { background: 'white', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '450px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }
};