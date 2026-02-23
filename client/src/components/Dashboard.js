import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
// AJOUT DE Moon POUR LE RAMADAN
import { LogOut, Shield, Users, Download, Calendar, Settings, MessageSquare, User, CheckCircle, XCircle, Moon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import ProfileModal from './ProfileModal';
import AdminUserManagement from './AdminUserManagement';
import ChatSystem from './ChatSystem';

export default function Dashboard({ token, user, onLogout, onUpdateUser }) {
  const [slots, setSlots] = useState([]);
  const [stats, setStats] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [currentView, setCurrentView] = useState('planning');
  
  // --- ÉTAT DU MODE RAMADAN ---
  const [ramadanMode, setRamadanMode] = useState(false);
  
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

  // --- CHARGEMENT DES DONNÉES ---
  const refreshData = useCallback(async () => {
    try {
      const res = await axios.get('/api/slots', { headers: { 'x-auth-token': token } });
      setSlots(res.data);

      if (user.role === 'admin') {
        const statsRes = await axios.get('/api/admin/stats', { headers: { 'x-auth-token': token } });
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur connexion serveur");
    }
  }, [token, user.role]);

  // --- CHARGEMENT DES SETTINGS (RAMADAN) ---
  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get('/api/settings');
      setRamadanMode(res.data.ramadanMode);
    } catch (err) { 
      console.error("Erreur chargement settings", err); 
    }
  }, []);

  useEffect(() => { 
    refreshData(); 
    fetchSettings();
  }, [refreshData, fetchSettings]);

  // --- ACTIONS ---
  const handleToggle = async (slotId) => {
    try {
      await axios.post('/api/slots/toggle', { slotId }, { headers: { 'x-auth-token': token } });
      await refreshData();
      toast.success("Mise à jour réussie");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Erreur");
    }
  };

  const handleExportReset = async () => {
    if(!window.confirm("⚠️ Attention : Cela va archiver la semaine et vider le planning. Continuer ?")) return;
    const loadToast = toast.loading("Traitement en cours...");
    try {
      const response = await axios.post('/api/admin/export-reset', {}, {
        headers: { 'x-auth-token': token },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CMC_Planning_${new Date().toLocaleDateString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      toast.dismiss(loadToast);
      toast.success("Semaine clôturée !");
      refreshData();
    } catch (err) {
      toast.dismiss(loadToast);
      toast.error("Erreur export");
    }
  };

  // --- TOGGLE RAMADAN (ADMIN) ---
  const toggleRamadanMode = async () => {
    const newMode = !ramadanMode;
    setRamadanMode(newMode); // Update UI immédiatement
    try {
      await axios.put('/api/settings/ramadan', { ramadanMode: newMode }, {
        headers: { 'x-auth-token': token }
      });
      toast.success(newMode ? "🌙 Mode Ramadan Activé" : "☀️ Mode normal rétabli");
    } catch (err) {
      setRamadanMode(!newMode); // Revert en cas d'erreur
      toast.error("Erreur de sauvegarde du mode");
    }
  };

  const getSlot = (day, periodSearch) => slots.find(s => s.day === day && s.period.toLowerCase().includes(periodSearch.toLowerCase()));

  // --- NAVIGATION ITEM ---
  const NavItem = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => setCurrentView(id)}
      style={{
        ...styles.navItem,
        color: currentView === id ? '#2563eb' : '#94a3b8',
        background: currentView === id ? '#eff6ff' : 'transparent',
      }}
    >
      <Icon size={20} />
      <span className="nav-label" style={styles.navLabel}>{label}</span>
      {currentView === id && <motion.div layoutId="bubble" style={styles.activeBubble} />}
    </button>
  );

  return (
    <div style={styles.pageContainer}>
      <Toaster position="top-center" />

      {/* --- HEADER DESKTOP --- */}
      <header className="desktop-only" style={styles.desktopHeader}>
        <div style={styles.logoSection}>
          <div style={styles.logoBadge}>{user.role === 'admin' ? <Shield color="white" size={20}/> : <Users color="white" size={20}/>}</div>
          <div>
            <h1 style={{fontSize:'1.1rem', fontWeight:'800', margin:0, color:'#1e293b'}}>CMC Connect</h1>
            <span style={{fontSize:'0.8rem', color:'#64748b'}}>Bonjour, {user.prenom}</span>
          </div>
        </div>

        <nav style={styles.desktopNav}>
          <NavItem id="planning" icon={Calendar} label="Planning" />
          <NavItem id="chat" icon={MessageSquare} label="Messages" />
          {user.role === 'admin' && <NavItem id="admin" icon={Settings} label="Admin" />}
        </nav>

        <div style={{display:'flex', gap:'10px'}}>
          <button onClick={() => setShowProfile(true)} style={styles.iconBtn}><User size={20}/></button>
          <button onClick={onLogout} style={{...styles.iconBtn, color:'#ef4444', background:'#fef2f2'}}><LogOut size={20}/></button>
        </div>
      </header>

      {/* --- HEADER MOBILE --- */}
      <header className="mobile-only" style={styles.mobileHeader}>
        <span style={{fontWeight:'800', fontSize:'1.2rem', color:'#1e293b'}}>CMC Connect</span>
        <button onClick={() => setShowProfile(true)} style={styles.mobileProfileBtn}>
           {user.prenom ? user.prenom[0] : 'U'}
        </button>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main style={styles.mainContent}>
        <AnimatePresence mode="wait">
          
          {/* VIEW: PLANNING */}
          {currentView === 'planning' && (
            <motion.div key="planning" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}}>
              
              {/* Stats (Admin) */}
              {user.role === 'admin' && stats && (
                <div style={styles.statsContainer}>
                  <div style={styles.statCardMain}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                      <div>
                        <p style={{margin:0, color:'rgba(255,255,255,0.8)', fontSize:'0.85rem'}}>Missions Totales</p>
                        <h2 style={{margin:'5px 0', color:'white', fontSize:'2.2rem'}}>{stats.total}</h2>
                      </div>
                      <div style={{background:'rgba(255,255,255,0.2)', padding:'8px', borderRadius:'10px'}}><Calendar color="white"/></div>
                    </div>
                    
                    {/* CONTROLES ADMIN (Export + Ramadan) */}
                    <div style={{display:'flex', gap:'10px', marginTop:'20px', flexWrap:'wrap'}}>
                      <button onClick={handleExportReset} style={styles.exportBtn}>
                        <Download size={16}/> Clôturer Semaine
                      </button>
                      
                      <div style={styles.ramadanToggleContainer}>
                        <Moon size={16} color={ramadanMode ? "#fbbf24" : "rgba(255,255,255,0.7)"} />
                        <span style={{fontSize:'0.85rem', fontWeight:'600'}}>Ramadan</span>
                        <button onClick={toggleRamadanMode} style={{...styles.toggleBtn, background: ramadanMode ? '#fbbf24' : 'rgba(255,255,255,0.3)'}}>
                          <div style={{...styles.toggleCircle, left: ramadanMode ? '22px' : '2px'}}></div>
                        </button>
                      </div>
                    </div>

                  </div>
                  
                  <div style={styles.statCardList}>
                    <h3 style={{margin:'0 0 10px 0', fontSize:'0.9rem', color:'#475569', fontWeight:'bold'}}>Top Ambassadeurs</h3>
                    <div style={{overflowY:'auto', maxHeight:'120px'}}>
                      {stats.stats.map((s, i) => (
                        <div key={i} style={styles.leaderRow}>
                          <span style={{fontWeight:'600', color:'#64748b', fontSize:'0.8rem'}}>#{i+1}</span>
                          <span style={{flex:1, marginLeft:'10px', fontSize:'0.85rem', fontWeight:'500'}}>{s.prenom} {s.nom}</span>
                          <span style={styles.badge}>{s.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* GRID PLANNING */}
              <div style={styles.gridContainer}>
                {days.map((day) => (
                  <div key={day} style={styles.dayColumn}>
                    <div style={styles.dayHeader}>
                      <span style={{fontWeight:'800', color:'#94a3b8', textTransform:'uppercase', fontSize:'0.75rem', letterSpacing:'1px'}}>{day}</span>
                    </div>
                    <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                      {['Matin', 'Apr'].map(period => {
                        const slot = getSlot(day, period);
                        if (!slot) return <div key={period} style={styles.skeletonSlot}></div>;
                        
                        const isFull = slot.ambassadors.length >= 3;
                        const isRegistered = slot.ambassadors.some(a => (a._id === user.id) || (a._id === user._id));
                        
                        return (
                          <div key={slot._id} style={{
                            ...styles.slotCard,
                            borderLeft: isRegistered ? '4px solid #2563eb' : isFull ? '4px solid #ef4444' : '4px solid #10b981'
                          }}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                              <span style={{fontSize:'0.8rem', fontWeight:'700', color:'#334155'}}>
                                {/* GESTION DYNAMIQUE DE L'HEURE SELON LE MODE RAMADAN */}
                                {period === 'Matin' 
                                  ? (ramadanMode ? '09:00 - 12:00' : '09:00 - 12:30') 
                                  : (ramadanMode ? '12:00 - 15:00' : '13:30 - 16:30')
                                }
                              </span>
                              <span style={{
                                fontSize:'0.7rem', padding:'2px 8px', borderRadius:'12px', fontWeight:'700',
                                background: isFull ? '#fee2e2' : '#d1fae5', color: isFull ? '#b91c1c' : '#047857'
                              }}>
                                {slot.ambassadors.length}/3
                              </span>
                            </div>

                            {/* Liste des inscrits */}
                            <div style={{display:'flex', flexDirection:'column', gap:'8px', marginBottom:'15px', minHeight:'30px'}}>
                              {slot.ambassadors.length === 0 && <span style={{fontSize:'0.75rem', color:'#cbd5e1', fontStyle:'italic'}}>Aucun inscrit</span>}
                              
                              {slot.ambassadors.map((amb) => (
                                <div key={amb._id} style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'0.8rem', color:'#334155', fontWeight:'500'}}>
                                  {amb.photo ? (
                                    <img src={amb.photo} style={{width:'22px', height:'22px', borderRadius:'50%', objectFit:'cover', border:'1px solid #e2e8f0'}} alt=""/>
                                  ) : (
                                    <div style={{width:'22px', height:'22px', borderRadius:'50%', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:'bold', color:'#64748b'}}>
                                      {amb.prenom?.[0]}
                                    </div>
                                  )}
                                  <span>{amb.prenom} {amb.nom}</span>
                                </div>
                              ))}
                            </div>

                            {/* BOUTON D'ACTION */}
                            {user.role === 'ambassadeur' && (!isFull || isRegistered) && (
                              <button 
                                onClick={() => handleToggle(slot._id)}
                                style={{
                                  ...styles.actionBtn,
                                  background: isRegistered ? '#fee2e2' : '#eff6ff',
                                  color: isRegistered ? '#ef4444' : '#2563eb',
                                  border: isRegistered ? '1px solid #fecaca' : '1px solid #dbeafe'
                                }}
                              >
                                {isRegistered ? (
                                  <><XCircle size={14} style={{marginRight:'5px'}}/> Annuler</>
                                ) : (
                                  <><CheckCircle size={14} style={{marginRight:'5px'}}/> Rejoindre</>
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* VIEW: CHAT */}
          {currentView === 'chat' && (
            <motion.div key="chat" initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0}} style={{height:'100%'}}>
              <ChatSystem user={user} token={token} />
            </motion.div>
          )}

          {/* VIEW: ADMIN */}
          {currentView === 'admin' && user.role === 'admin' && (
            <motion.div key="admin" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0}}>
              <AdminUserManagement token={token} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- BOTTOM NAV (MOBILE) --- */}
      <nav className="mobile-only" style={styles.bottomNav}>
        <button onClick={() => setCurrentView('planning')} style={styles.bottomNavBtn}>
          <Calendar size={24} color={currentView === 'planning' ? '#2563eb' : '#94a3b8'} />
        </button>
        <button onClick={() => setCurrentView('chat')} style={styles.bottomNavBtn}>
          <MessageSquare size={24} color={currentView === 'chat' ? '#2563eb' : '#94a3b8'} />
        </button>
        {user.role === 'admin' && (
          <button onClick={() => setCurrentView('admin')} style={styles.bottomNavBtn}>
            <Settings size={24} color={currentView === 'admin' ? '#2563eb' : '#94a3b8'} />
          </button>
        )}
        <button onClick={onLogout} style={styles.bottomNavBtn}>
          <LogOut size={24} color="#ef4444" />
        </button>
      </nav>

      {showProfile && <ProfileModal user={user} token={token} onClose={() => setShowProfile(false)} onUpdateUser={onUpdateUser} />}

      <style>{`
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
          .nav-label { display: none; }
        }
        @media (min-width: 769px) {
          .desktop-only { display: flex !important; }
          .mobile-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// --- STYLES ---
const styles = {
  pageContainer: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif", paddingBottom: '90px' },
  
  // Header Desktop
  desktopHeader: { position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', padding: '15px 40px', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)' },
  logoSection: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoBadge: { background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(37,99,235,0.3)' },
  desktopNav: { display: 'flex', background: 'white', padding: '5px', borderRadius: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', gap: '5px', border:'1px solid #f1f5f9' },
  navItem: { position: 'relative', padding: '10px 20px', borderRadius: '25px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', transition: '0.3s' },
  iconBtn: { width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: '0.2s' },
  
  // Header Mobile
  mobileHeader: { position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '15px 20px', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', boxShadow:'0 2px 5px rgba(0,0,0,0.02)' },
  mobileProfileBtn: { width: '35px', height: '35px', borderRadius: '50%', background: '#2563eb', color: 'white', border: 'none', fontWeight: 'bold', display:'flex', alignItems:'center', justifyContent:'center' },

  // Content
  mainContent: { maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' },
  
  // Stats
  statsContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' },
  statCardMain: { background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', borderRadius: '20px', padding: '25px', color: 'white', boxShadow: '0 10px 25px -5px rgba(37,99,235,0.4)', position: 'relative', overflow: 'hidden' },
  exportBtn: { background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 15px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', backdropFilter: 'blur(5px)', fontWeight:'600', transition:'0.2s' },
  ramadanToggleContainer: { background: 'rgba(0,0,0,0.15)', padding: '8px 15px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid rgba(255,255,255,0.1)' },
  toggleBtn: { width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' },
  toggleCircle: { width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
  
  statCardList: { background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' },
  leaderRow: { display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' },
  badge: { background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' },

  // Grid Planning
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
  dayColumn: { display: 'flex', flexDirection: 'column', gap: '15px' },
  dayHeader: { textAlign: 'center', paddingBottom: '10px', borderBottom: '2px solid #e2e8f0', marginBottom: '10px' },
  
  // Slot Card
  slotCard: { background: 'white', borderRadius: '16px', padding: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', transition: '0.2s', position: 'relative' },
  skeletonSlot: { height: '120px', background: '#e2e8f0', borderRadius: '16px', opacity: 0.5 },
  
  actionBtn: { width: '100%', padding: '10px', borderRadius: '10px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', transition: '0.2s', display:'flex', alignItems:'center', justifyContent:'center' },

  // Bottom Nav
  bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', padding: '12px 30px', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)', borderRadius: '20px 20px 0 0', zIndex: 100 },
  bottomNavBtn: { background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer' }
};