import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, UserPlus, Mail, Briefcase, Lock, User, RefreshCw, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import ProfileModal from './ProfileModal';

export default function AdminUserManagement({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // This state determines if the modal opens. If not null, modal is open.
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', password: 'cmc2025', branch: '', role: 'ambassadeur'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users/ambassadors');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAdd = async (e) => {
    e.preventDefault();
    const loadToast = toast.loading("Création...");
    try {
      await axios.post('/api/users/add', formData, { headers: { 'x-auth-token': token } });
      toast.dismiss(loadToast);
      toast.success("Utilisateur ajouté !");
      setFormData({ nom: '', prenom: '', email: '', password: 'cmc2025', branch: '', role: 'ambassadeur' });
      fetchUsers();
    } catch (err) {
      toast.dismiss(loadToast);
      toast.error(err.response?.data?.msg || "Erreur ajout");
    }
  };

  const handleDelete = async (id, name) => {
    if(!window.confirm(`Supprimer ${name} ?`)) return;
    try {
      await axios.delete(`/api/users/${id}`, { headers: { 'x-auth-token': token } });
      toast.success("Supprimé");
      fetchUsers();
    } catch (err) {
      toast.error("Erreur suppression");
    }
  };

  return (
    <div style={styles.container}>
      
      {/* C'est ici que la magie opère : Le modal s'ouvre si editingUser existe */}
      {editingUser && (
        <ProfileModal 
          targetUser={editingUser} 
          token={token}
          onClose={() => setEditingUser(null)}
          onUpdateUser={() => { fetchUsers(); setEditingUser(null); }}
        />
      )}

      {/* Formulaire d'ajout rapide (Texte seulement pour aller vite) */}
      <div style={styles.addSection}>
        <h3 style={styles.title}><UserPlus size={22} /> Ajouter un Ambassadeur</h3>
        <form onSubmit={handleAdd} style={styles.formGrid}>
          <div style={styles.inputGroup}><User size={16} style={styles.icon}/><input name="prenom" placeholder="Prénom" value={formData.prenom} onChange={onChange} required style={styles.input} /></div>
          <div style={styles.inputGroup}><User size={16} style={styles.icon}/><input name="nom" placeholder="Nom" value={formData.nom} onChange={onChange} required style={styles.input} /></div>
          <div style={styles.inputGroup}><Mail size={16} style={styles.icon}/><input name="email" placeholder="Email" value={formData.email} onChange={onChange} required style={styles.input} /></div>
          <div style={styles.inputGroup}><Briefcase size={16} style={styles.icon}/><input name="branch" placeholder="Filière" value={formData.branch} onChange={onChange} style={styles.input} /></div>
          <div style={styles.inputGroup}><Lock size={16} style={styles.icon}/><input name="password" placeholder="Mot de passe" value={formData.password} onChange={onChange} required style={styles.input} /></div>
          <button type="submit" style={styles.addBtn}>Ajouter</button>
        </form>
      </div>

      {/* Liste des utilisateurs */}
      <div style={styles.listSection}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <h3 style={styles.title}>Gestion des Profils ({users.length})</h3>
          <button onClick={fetchUsers} style={styles.refreshBtn}><RefreshCw size={18} className={loading ? 'spin' : ''}/></button>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Identité</th>
                <th>Contact</th>
                <th>Filière</th>
                <th style={{textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px'}}>
                      {u.photo ? <img src={u.photo} alt="" style={{width:'30px', height:'30px', borderRadius:'50%', objectFit:'cover'}}/> : <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem'}}>{u.prenom[0]}</div>}
                      {u.prenom} {u.nom}
                    </div>
                  </td>
                  <td style={{color: '#64748b'}}>{u.email}</td>
                  <td><span style={styles.tag}>{u.branch || '-'}</span></td>
                  <td style={{textAlign: 'center'}}>
                    <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                      <button onClick={() => setEditingUser(u)} style={styles.editBtn}>
                        <Edit size={16} /> Éditer
                      </button>
                      <button onClick={() => handleDelete(u._id, u.prenom)} style={styles.deleteBtn}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '30px' },
  addSection: { background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
  listSection: { background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
  title: { fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' },
  inputGroup: { position: 'relative' },
  icon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
  input: { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' },
  addBtn: { height: '42px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' },
  refreshBtn: { background: 'transparent', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#64748b' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' },
  tag: { background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', color: '#475569', fontWeight: '500' },
  deleteBtn: { background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' },
  editBtn: { background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', fontSize: '0.8rem' }
};