import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Shield, Users, CheckCircle, XCircle, Download, Calendar } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import ProfileModal from './ProfileModal';

export default function Dashboard({ token, user, onLogout, onUpdateUser }) {
  const [slots, setSlots] = useState([]);
  const [stats, setStats] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

  // --- 1. CHARGEMENT DES DONNÉES ---
  const refreshData = async () => {
    try {
      const res = await axios.get('/api/slots', { headers: { 'x-auth-token': token } });
      setSlots(res.data);

      if (user.role === 'admin') {
        const statsRes = await axios.get('/api/admin/stats', { headers: { 'x-auth-token': token } });
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur de connexion au serveur");
    }
  };

  useEffect(() => { refreshData(); }, []);

  // --- 2. ACTION : S'INSCRIRE / ANNULER ---
  const handleToggle = async (slotId) => {
    try {
      await axios.post('/api/slots/toggle', { slotId }, { headers: { 'x-auth-token': token } });
      toast.success("Mise à jour réussie");
      refreshData();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Erreur");
    }
  };

  // --- 3. ACTION ADMIN : EXPORT & RESET ---
  const handleExportReset = async () => {
    const confirm = window.confirm(
      "⚠️ ACTION ADMINISTRATIVE\n\n1. Télécharger le rapport Excel.\n2. Archiver les données.\n3. VIDER le planning pour la semaine prochaine.\n\nConfirmer ?"
    );

    if (confirm) {
      const loadToast = toast.loading("Traitement en cours...");
      try {
        const response = await axios.post(
          '/api/admin/export-reset',
          {},
          {
            headers: { 'x-auth-token': token },
            responseType: 'blob'
          }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
        link.setAttribute('download', `CMC_Planning_Semaine_${dateStr}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();

        toast.dismiss(loadToast);
        toast.success("Semaine clôturée avec succès !");
        refreshData();

      } catch (err) {
        console.error(err);
        toast.dismiss(loadToast);
        toast.error("Erreur lors de l'export");
      }
    }
  };

  const getSlot = (day, periodSearch) => {
    return slots.find(s => s.day === day && s.period.toLowerCase().includes(periodSearch.toLowerCase()));
  };

  return (
    <div className="dashboard-container">
      <Toaster position="top-right" />

      {/* --- HEADER --- */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: user.role === 'admin' ? '#ef4444' : '#2563eb', color: 'white', padding: '10px', borderRadius: '10px' }}>
            {user.role === 'admin' ? <Shield size={24} /> : <Users size={24} />}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Espace {user.role === 'admin' ? 'Administration' : 'Ambassadeur'}</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Bonjour, {user.prenom} {user.nom}</p>
          </div>
        </div>

        {/* Boutons Profil et Déconnexion */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowProfile(true)}
            className="action-btn"
            style={{ width: 'auto', background: 'white', border: '1px solid #cbd5e1', color: '#475569' }}
          >
            <Users size={18} /> Mon Profil
          </button>

          <button onClick={onLogout} className="action-btn" style={{ width: 'auto', background: '#fee2e2', color: '#991b1b' }}>
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </motion.div>

      {/* --- MODAL PROFIL (Si ouvert) --- */}
      {showProfile && (
        <ProfileModal
          user={user}
          token={token}
          onClose={() => setShowProfile(false)}
          onUpdateUser={onUpdateUser}
        />
      )}

      {/* --- SECTION ADMIN (STATS) --- */}
      {user.role === 'admin' && stats && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="stats-grid">

          <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={16} /> Total Missions
              </h3>
              <p style={{ fontSize: '3rem', margin: '10px 0', fontWeight: 'bold', color: '#2563eb', textAlign: 'center' }}>
                {stats.total}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>Historique + Semaine en cours</p>
            </div>

            <button
              onClick={handleExportReset}
              style={{
                marginTop: '20px',
                background: '#e11d48', color: 'white', border: 'none',
                padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%',
                boxShadow: '0 4px 6px rgba(225, 29, 72, 0.2)'
              }}
            >
              <Download size={18} /> Clôturer Semaine
            </button>
          </div>

          <div className="stat-card" style={{ gridColumn: 'span 2', overflow: 'hidden', padding: 0 }}>
            <div style={{ padding: '15px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, color: '#475569', fontSize: '1rem' }}>Performance des Ambassadeurs</h3>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                  <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem', borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '10px 15px' }}>#</th>
                    <th style={{ padding: '10px' }}>Ambassadeur</th>
                    <th style={{ padding: '10px' }}>Email</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Missions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.stats.map((amb, index) => (
                    <tr key={amb.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 15px', fontWeight: 'bold', color: index < 3 ? '#d97706' : '#64748b' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: index === 0 ? '#fcd34d' : '#e2e8f0',
                            color: index === 0 ? '#92400e' : '#475569',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold'
                          }}>
                            {amb.prenom[0]}{amb.nom[0]}
                          </div>
                          <span style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                            {amb.prenom} {amb.nom}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px', color: '#64748b', fontSize: '0.8rem' }}>{amb.email}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span style={{
                          background: amb.total > 0 ? '#dcfce7' : '#f1f5f9',
                          color: amb.total > 0 ? '#166534' : '#94a3b8',
                          padding: '2px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem'
                        }}>
                          {amb.total}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* --- CALENDRIER --- */}
      <div className="grid-week">
        {days.map((day, i) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="day-column"
          >
            <div className="day-header">{day}</div>

            {['Matin', 'Apr'].map(periodCode => {
              const slot = getSlot(day, periodCode);

              if (!slot) return <div key={periodCode} className="slot-card" style={{ opacity: 0.5 }}>Chargement...</div>;

              const isFull = slot.ambassadors.length >= 3;
              const isRegistered = slot.ambassadors.some(a => a._id === user.id);
              const displayPeriod = periodCode === 'Matin' ? '09:00 - 12:30' : '13:30 - 16:30';

              return (
                <div key={slot._id} className={`slot-card ${isFull ? 'full' : ''} ${isRegistered ? 'active' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>{displayPeriod}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', background: isFull ? '#fee2e2' : '#dcfce7', color: isFull ? '#991b1b' : '#166534' }}>
                      {slot.ambassadors.length}/3
                    </span>
                  </div>

                  <div className="avatars" style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '35px', marginBottom:'15px' }}>
                    <AnimatePresence>
                      {slot.ambassadors.map(amb => (
                        <motion.div
                          key={amb._id}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'rgba(255,255,255,0.6)',
                            padding: '6px',
                            borderRadius: '8px',
                            border: '1px solid rgba(0,0,0,0.05)'
                          }}
                        >
                          <div className="avatar-circle" style={{ width: '28px', height: '28px', fontSize: '0.75rem', margin: 0 }}>
                            {amb.prenom[0]}{amb.nom[0]}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>
                              {amb.prenom} {amb.nom}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {slot.ambassadors.length === 0 && <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontStyle: 'italic', textAlign: 'center' }}>Aucun inscrit</span>}
                  </div>

                  {user.role === 'ambassadeur' ? (
                    (!isFull || isRegistered) ? (
                      <button
                        onClick={() => handleToggle(slot._id)}
                        className={`action-btn ${isRegistered ? 'btn-leave' : 'btn-join'}`}
                      >
                        {isRegistered ? <><XCircle size={16} /> Annuler</> : <><CheckCircle size={16} /> S'inscrire</>}
                      </button>
                    ) : (
                      <button className="action-btn btn-full" disabled>COMPLET</button>
                    )
                  ) : (
                    <div style={{
                      marginTop: 'auto', padding: '6px', background: 'rgba(0,0,0,0.03)', color: '#94a3b8',
                      fontSize: '0.70rem', textAlign: 'center', borderRadius: '4px', fontStyle: 'italic'
                    }}>
                      Admin Mode
                    </div>
                  )}

                </div>
              );
            })}
          </motion.div>
        ))}
      </div>
    </div>
  );
}