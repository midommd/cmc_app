import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Quote, Briefcase, Users, Trophy, ChevronRight, User as UserIcon, Heart, Linkedin, Star, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_CLUBS = [
  {
    id: 'sportif', name: 'Club Sportif', icon: '🏆', color: 'from-blue-500 to-cyan-500', bgIcon: '#e0f2fe',
    description: "L'élite sportive de la CMC. Esprit de compétition, santé et cohésion d'équipe.",
    president: { nom: 'El Fassi', prenom: 'Amine', filiere: 'Développement Digital', photo: 'https://i.pravatar.cc/150?img=11', msg: "Le sport forge le caractère et unit les talents." },
    staff: [
      { nom: 'Benali', prenom: 'Sara', role: 'Secrétaire Générale', photo: 'https://i.pravatar.cc/150?img=5' },
      { nom: 'Zouhair', prenom: 'Karim', role: 'Responsable Matériel', photo: 'https://i.pravatar.cc/150?img=12' },
      { nom: 'Moussaif', prenom: 'Leila', role: 'Trésorière', photo: 'https://i.pravatar.cc/150?img=9' },
      { nom: 'Taoufiq', prenom: 'Youssef', role: 'Coach', photo: 'https://i.pravatar.cc/150?img=13' },
      { nom: 'Naciri', prenom: 'Aya', role: 'Nutritionniste', photo: 'https://i.pravatar.cc/150?img=14' }
    ],
    subClubs: [
      { id: 'foot', name: 'Football Club', icon: '⚽', desc: 'Entraînements tactiques et tournois inter-écoles.', responsable: { nom: 'Hakimi', prenom: 'Yassine', filiere: 'Gestion', msg: "La gagne est dans notre ADN." } },
      { id: 'volley', name: 'Volleyball', icon: '🏐', desc: 'Esprit d\'équipe et smashs explosifs.', responsable: { nom: 'Malki', prenom: 'Ines', filiere: 'Marketing', msg: "On ne laisse tomber aucun ballon." } },
      { id: 'basket', name: 'Basketball Team', icon: '🏀', desc: 'Streetball et championnat régional.', responsable: { nom: 'Nadir', prenom: 'Kenza', filiere: 'IA', msg: "Viser le panier, atteindre l'excellence." } },
      { id: 'echecs', name: 'Club d\'Échecs', icon: '♟️', desc: 'Stratégie, concentration et tournois mentaux.', responsable: { nom: 'Mansouri', prenom: 'Adnane', filiere: 'Dev Digital', msg: "Un coup d'avance sur le futur." } }
    ]
  },
  {
    id: 'culturel', name: 'Club Culturel', icon: '🎭', color: 'from-purple-500 to-pink-500', bgIcon: '#fae8ff',
    description: "Le cœur artistique du campus. Théâtre, musique, littérature et événements.",
    president: { nom: 'Chraibi', prenom: 'Lina', filiere: 'Infographie', photo: 'https://i.pravatar.cc/150?img=47', msg: "L'art est le miroir de notre âme collective." },
    staff: [
      { nom: 'Zidane', prenom: 'Rania', role: 'Event Planner', photo: 'https://i.pravatar.cc/150?img=1' },
      { nom: 'Haddad', prenom: 'Sami', role: 'Régisseur Scène', photo: 'https://i.pravatar.cc/150?img=8' },
      { nom: 'Berrada', prenom: 'Ghita', role: 'Com\' Culturelle', photo: 'https://i.pravatar.cc/150?img=10' }
    ],
    subClubs: [
      { id: 'theatre', name: 'Troupe de Théâtre', icon: '🎬', desc: 'Improvisation et pièces classiques.', responsable: { nom: 'Amrani', prenom: 'H.', filiere: 'Marketing', msg: "Le monde est une scène." } },
      { id: 'musique', name: 'Music Hub', icon: '🎸', desc: 'Chant, instruments et orchestre CMC.', responsable: { nom: 'Lahlou', prenom: 'M.', filiere: 'Design', msg: "Jouons la mélodie du succès." } },
      { id: 'lecture', name: 'Cercle Littéraire', icon: '📖', desc: 'Débats, poésie et bibliothèque partagée.', responsable: { nom: 'Fahmi', prenom: 'A.', filiere: 'IA', msg: "Lire pour s'évader." } },
      { id: 'danse', name: 'Dance Academy', icon: '💃', desc: 'Modern Jazz, Hip-Hop et Salsa.', responsable: { nom: 'Kadiri', prenom: 'S.', filiere: 'Gestion', msg: "Exprimez-vous par le mouvement." } }
    ]
  },
  {
    id: 'innovation', name: 'Club Innovation', icon: '💡', color: 'from-orange-500 to-red-500', bgIcon: '#ffedd5',
    description: "Créativité digitale, design futuriste et création de contenu multimédia.",
    president: { nom: 'Ouazzani', prenom: 'Ayoub', filiere: 'Dev Multimédia', photo: 'https://i.pravatar.cc/150?img=68', msg: "Innover, c'est transformer l'impossible en digital." },
    staff: [
      { nom: 'Saoud', prenom: 'Ilyas', role: 'Creative Director', photo: 'https://i.pravatar.cc/150?img=3' },
      { nom: 'Filali', prenom: 'Noura', role: 'UX Consultant', photo: 'https://i.pravatar.cc/150?img=6' }
    ],
    subClubs: [
      { id: 'photo', name: 'Photographie', icon: '📸', desc: 'Capturez l\'instant parfait.', responsable: { nom: 'Alaoui', prenom: 'S.', filiere: 'Audiovisuel', msg: "L'œil du campus." } },
      { id: 'design', name: 'Design Photoshop', icon: '🎨', desc: 'Création graphique et retouche.', responsable: { nom: 'Tazi', prenom: 'M.', filiere: 'Design', msg: "Chaque pixel compte." } },
      { id: 'cgc', name: 'Content Creation', icon: '📱', desc: 'Vlogging, TikTok et réseaux.', responsable: { nom: 'Rami', prenom: 'H.', filiere: 'Marketing', msg: "Devenez le prochain influenceur." } },
      { id: '3d', name: 'Design 3D', icon: '🧊', desc: 'Modélisation et animation spatiale.', responsable: { nom: 'Berrada', prenom: 'Y.', filiere: '3D Art', msg: "Bâtissez des mondes virtuels." } }
    ]
  },
  {
    id: 'robotique', name: 'Club Robotique', icon: '🤖', color: 'from-indigo-500 to-blue-600', bgIcon: '#e0e7ff',
    description: "L'ingénierie de demain : électronique, drones et intelligence artificielle.",
    president: { nom: 'Mido', prenom: 'Dev', filiere: 'Génie Électrique', photo: 'https://i.pravatar.cc/150?img=14', msg: "Coder le futur, un circuit à la fois." },
    staff: [
      { nom: 'Tahiri', prenom: 'Hamza', role: 'Lab Manager', photo: 'https://i.pravatar.cc/150?img=50' },
      { nom: 'Idrissi', prenom: 'Omar', role: 'Chef de Projet AI', photo: 'https://i.pravatar.cc/150?img=33' }
    ],
    subClubs: []
  },
  {
    id: 'environnement', name: 'Club Environnement', icon: '🍀', color: 'from-emerald-500 to-green-500', bgIcon: '#d1fae5',
    description: "Agissons pour une CMC éco-responsable. Écologie et développement durable.",
    president: { nom: 'Mansour', prenom: 'Ilyas', filiere: 'QSE', photo: 'https://i.pravatar.cc/150?img=15', msg: "La terre ne nous appartient pas, nous l'empruntons." },
    staff: [
      { nom: 'Benani', prenom: 'Sami', role: 'Resp. Recyclage', photo: 'https://i.pravatar.cc/150?img=11' }
    ],
    subClubs: [
      { id: 'mains', name: 'Mains Vertes', icon: '🌱', desc: 'Jardinage urbain et reboisement du campus.', responsable: { nom: 'Tazi', prenom: 'Othmane', filiere: 'QSE', msg: "Faisons fleurir notre école." } }
    ]
  },
  {
    id: 'citoyennete', name: 'Club Citoyenneté', icon: '🤝', color: 'from-yellow-400 to-orange-500', bgIcon: '#fef3c7',
    description: "Bénévolat, actions caritatives et impact social positif.",
    president: { nom: 'Kabbaj', prenom: 'Salma', filiere: 'Gestion de PME', photo: 'https://i.pravatar.cc/150?img=26', msg: "Donner de son temps, c'est recevoir du bonheur." },
    staff: [
      { nom: 'Benchekroun', prenom: 'Y.', role: 'Resp. Social', photo: 'https://i.pravatar.cc/150?img=51' },
      { nom: 'Lahlou', prenom: 'R.', role: 'Coordination Dons', photo: 'https://i.pravatar.cc/150?img=25' }
    ],
    subClubs: []
  }
];

export default function AmbassadorsPage() {
  const navigate = useNavigate();
  const [view, setView] = useState('ambassadeurs'); 
  const [ambassadors, setAmbassadors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clubsData, setClubsData] = useState(DEFAULT_CLUBS);
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resUsers = await axios.get('/api/users/ambassadors');
        const validAmbassadors = resUsers.data.filter(user => 
          user.isAmbassadeur !== false && user.photo && user.photo.startsWith('http')
        );
        setAmbassadors(validAmbassadors);

        const resClubs = await axios.get('/api/clubs', { timeout: 3000 });
        if (resClubs.data && resClubs.data.length > 0) {
          setClubsData(resClubs.data);
        } else {
          setClubsData(DEFAULT_CLUBS);
        }
      } catch (err) {
        console.error("Le backend met trop de temps ou erreur, chargement des clubs par défaut.");
        setClubsData(DEFAULT_CLUBS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ANIMATIONS FRAMER MOTION (Uniquement pour l'apparition, pas de whileHover)
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } } };

  const PersonCard = ({ title, person, isMain }) => (
    <div style={{ background: isMain ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'white', borderRadius: '20px', padding: '25px', color: isMain ? 'white' : '#1e293b', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: isMain ? 'none' : '1px solid #e2e8f0', display: 'flex', gap: '20px', alignItems: 'center' }}>
      <img src={person?.photo || `https://ui-avatars.com/api/?name=${person?.prenom}+${person?.nom}&background=random`} alt="" style={{ width: '90px', height: '90px', borderRadius: '50%', border: isMain ? '3px solid #3b82f6' : '3px solid #e2e8f0', objectFit: 'cover' }} />
      <div>
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: isMain ? '#60a5fa' : '#3b82f6' }}>{title}</span>
        <h3 style={{ margin: '5px 0', fontSize: '1.4rem', fontWeight: '800' }}>{person?.prenom} {person?.nom}</h3>
        <span style={{ fontSize: '0.85rem', color: isMain ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}><UserIcon size={14}/> {person?.filiere}</span>
        {person?.msg && <p style={{ margin: '10px 0 0 0', fontSize: '0.95rem', fontStyle: 'italic', borderLeft: isMain ? '3px solid #3b82f6' : '3px solid #cbd5e1', paddingLeft: '10px' }}>"{person.msg}"</p>}
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <nav style={styles.nav}><button onClick={() => navigate('/')} style={styles.backBtn}><ArrowLeft size={20} /> Retour</button></nav>

      <div style={styles.content}>
        <header style={styles.header}>
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={styles.title}>
            Notre <span style={styles.highlight}>Communauté</span>
          </motion.h1>
          <div style={styles.toggleContainer}>
            <button onClick={() => setView('ambassadeurs')} style={{ ...styles.toggleBtn, background: view === 'ambassadeurs' ? '#2563eb' : 'transparent', color: view === 'ambassadeurs' ? 'white' : '#64748b' }}><Users size={18} /> Ambassadeurs</button>
            <button onClick={() => { setView('clubs'); setSelectedClub(null); }} style={{ ...styles.toggleBtn, background: view === 'clubs' ? '#2563eb' : 'transparent', color: view === 'clubs' ? 'white' : '#64748b' }}><Trophy size={18} /> Clubs </button>
          </div>
        </header>

        {loading ? <div style={styles.loader}>Chargement de la communauté...</div> : (
          <AnimatePresence mode="wait">
            
            {view === 'ambassadeurs' && (
              <motion.div key="ambs" variants={container} initial="hidden" animate="show" exit={{opacity:0}} style={styles.grid}>
                {ambassadors.length === 0 && <p style={{gridColumn: '1/-1', textAlign: 'center', color: '#64748b'}}>Aucun ambassadeur avec photo pour le moment.</p>}
                {ambassadors.map((amb) => (
                  <motion.div key={amb._id} variants={item} className="ambassador-card" style={styles.card}>
                    <div style={styles.cardHeader}>
                      <div style={styles.branchBadge}><Briefcase size={12} style={{marginRight:'4px'}}/> {amb.branch || 'Filière'}</div>
                      <div style={styles.imageContainer}><img src={amb.photo} alt={amb.prenom} style={styles.image} /></div>
                    </div>
                    <div style={styles.cardBody}>
                      <h3 style={styles.name}>{amb.prenom} {amb.nom}</h3>
                      {amb.linkedin && <a href={amb.linkedin} target="_blank" rel="noopener noreferrer" className="linkedin-link" style={styles.linkedinBtn}><Linkedin size={14} /> Profil LinkedIn</a>}
                      <div style={styles.quoteContainer}>
                        <Quote size={16} style={styles.quoteIcon} />
                        <p style={styles.quoteText}>{amb.whyCMC || "Enthousiaste pour cette nouvelle aventure à la CMC !"}</p>
                      </div>
                      {amb.hobbies && (
                        <div style={styles.hobbiesContainer}>
                           <div style={styles.hobbyLabel}><Heart size={14} color="#e11d48"/> Passions :</div>
                           <p style={styles.hobbiesText}>{amb.hobbies}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {view === 'clubs' && (
              <motion.div key="clubs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{opacity:0}}>
                
                {/* --- GRILLE DE TOUS LES CLUBS --- */}
                {!selectedClub && (
                  <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
                    {clubsData.map(club => (
                      <motion.div 
                        key={club.id || club._id} 
                        variants={item} 
                        className="club-main-card"
                        onClick={() => { setSelectedClub(club); setSelectedSub(null); window.scrollTo({top: 0, behavior: 'smooth'}); }} 
                        style={styles.clubMainCard}
                      >
                        <div style={{...styles.clubIconBox, background: club.bgIcon}}><span style={{fontSize:'2.5rem'}}>{club.icon}</span></div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b', marginBottom: '10px' }}>{club.name}</h2>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '20px' }}>{club.description}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#94a3b8' }}>{(club.subClubs?.length || 0) + (club.staff?.length || 0)} Membres clés</span>
                          <ChevronRight size={20} color="#3b82f6" className="chevron-icon" />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* --- VUE DÉTAILLÉE DU CLUB SÉLECTIONNÉ --- */}
                {selectedClub && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{maxWidth:'1200px', margin:'0 auto', padding:'0 20px'}}>
                    
                    <button onClick={() => setSelectedClub(null)} className="return-btn" style={styles.returnBtn}><ArrowLeft size={16}/> Retour aux Clubs</button>

                    <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                      
                      {/* COLONNE GAUCHE : Président & Staff */}
                      <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: `linear-gradient(135deg, ${selectedClub.bgIcon}, white)`, padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                          <h2 style={{ fontSize: '2rem', fontWeight: '900', margin: '0 0 10px 0', color: '#1e293b' }}>{selectedClub.icon} {selectedClub.name}</h2>
                          <p style={{ color: '#475569' }}>{selectedClub.description}</p>
                        </div>
                        
                        <AnimatePresence mode="wait">
                          <motion.div key={selectedSub ? selectedSub.id || selectedSub._id : 'president'} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            
                            {selectedSub ? (
                              <PersonCard title={`Responsable ${selectedSub.name}`} person={selectedSub.responsable} isMain={false} />
                            ) : (
                              <PersonCard title="Président(e) du Club" person={selectedClub.president} isMain={true} />
                            )}

                            {/* SCROLL DU STAFF */}
                            {((selectedSub && selectedSub.staff?.length > 0) || (!selectedSub && selectedClub.staff?.length > 0)) && (
                              <div style={{marginTop: '25px', background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #f1f5f9'}}>
                                <h4 style={{fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px'}}><Star size={16}/> Membres du Staff</h4>
                                
                                <motion.div 
                                  className="staff-scroll-container"
                                  variants={container} 
                                  initial="hidden" 
                                  animate="show" 
                                  style={{display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', overflowX: 'hidden', paddingRight: '10px'}}
                                >
                                  {(selectedSub ? selectedSub.staff : selectedClub.staff).map((member, i, arr) => (
                                    <motion.div 
                                      key={i} 
                                      variants={item}
                                      className="staff-member-card"
                                      style={{display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 15px', borderRadius: '12px', borderBottom: i !== arr.length -1 ? '1px dashed #e2e8f0' : 'none', cursor: 'default'}}
                                    >
                                      <img src={member.photo || `https://ui-avatars.com/api/?name=${member.prenom}+${member.nom}`} alt="" style={{width:'45px', height:'45px', borderRadius:'50%', objectFit:'cover'}} />
                                      <div>
                                        <p style={{margin:0, fontWeight:'bold', color:'#1e293b'}}>{member.prenom} {member.nom}</p>
                                        <p style={{margin:0, fontSize:'0.8rem', color:'#64748b'}}>{member.role}</p>
                                      </div>
                                    </motion.div>
                                  ))}
                                </motion.div>
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* COLONNE DROITE : Grille des Sous-Clubs */}
                      <div style={{ flex: '1 1 500px' }}>
                        {selectedClub.subClubs?.length > 0 && (
                          <>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1e293b', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              Sous-Clubs et Activités
                              {selectedSub && <button onClick={() => setSelectedSub(null)} className="return-btn-small">Voir le Président</button>}
                            </h3>
                            
                            <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                              {selectedClub.subClubs?.map(sub => {
                                const isSelected = selectedSub?.id === sub.id || selectedSub?._id === sub._id;
                                return (
                                  <motion.div 
                                    variants={item}
                                    key={sub.id || sub._id} 
                                    onClick={() => setSelectedSub(sub)} 
                                    className={`sub-club-card ${isSelected ? 'selected' : ''}`}
                                    style={{ background: isSelected ? '#eff6ff' : 'white', border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0', padding: '20px', borderRadius: '16px', cursor: 'pointer', boxShadow: isSelected ? '0 10px 25px rgba(59,130,246,0.15)' : 'none' }}
                                  >
                                    <div style={{ fontSize: '2rem', marginBottom:'10px' }}>{sub.icon}</div>
                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: isSelected ? '#1d4ed8' : '#1e293b', transition: '0.2s' }}>{sub.name}</h4>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>{sub.desc}</p>
                                  </motion.div>
                                );
                              })}
                            </motion.div>
                          </>
                        )}
                      </div>

                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <button 
        style={{
          ...styles.scrollTopBtn, 
          opacity: showScrollTop ? 1 : 0, 
          pointerEvents: showScrollTop ? 'auto' : 'none', 
          transform: showScrollTop ? 'translateY(0)' : 'translateY(20px)'
        }} 
        onClick={scrollToTop}
        title="Retour en haut"
      >
        <ArrowUp size={24} />
      </button>

      {/* TOUTES LES ANIMATIONS DE HOVER SONT GÉRÉES EN CSS PUR ICI POUR ZÉRO LAG */}
      <style>{`
        /* Hover Staff Scroll (Fluide) */
        .staff-member-card { transition: all 0.3s ease; }
        .staff-member-card:hover { transform: translateX(8px); background-color: #f8fafc; }

        /* Hover Sous-Clubs (Fluide) */
        .sub-club-card { transition: all 0.3s ease; }
        .sub-club-card:not(.selected):hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important; border-color: #cbd5e1 !important; }

        /* Hover Clubs Principaux (Fluide) */
        .club-main-card { transition: all 0.3s ease; }
        .club-main-card:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.08) !important; }
        .club-main-card:hover .chevron-icon { transform: translateX(5px); }
        .chevron-icon { transition: transform 0.3s ease; }

        /* Hover Ambassadeurs (Fluide) */
        .ambassador-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .ambassador-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.08) !important; }
        .linkedin-link:hover { background-color: #dbeafe !important; }

        /* Boutons */
        .return-btn:hover { background-color: #f1f5f9 !important; }
        .return-btn-small { font-size: 0.8rem; background: #f1f5f9; border: none; padding: 6px 12px; border-radius: 20px; cursor: pointer; color: #475569; font-weight: bold; transition: all 0.2s; }
        .return-btn-small:hover { background: #e2e8f0; color: #1e293b; }

        /* Scrollbar Personnalisée pour le Staff */
        .staff-scroll-container::-webkit-scrollbar { width: 6px; }
        .staff-scroll-container::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .staff-scroll-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .staff-scroll-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}

// --- STYLES SANS TRANSITIONS CONFLICTUELLES ---
const styles = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" },
  nav: { padding: '20px 40px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #e2e8f0', padding: '10px 24px', borderRadius: '30px', cursor: 'pointer', fontWeight: '600', color: '#475569', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'all 0.2s' },
  content: { paddingBottom: '80px' },
  header: { textAlign: 'center', padding: '10px 20px 40px' },
  title: { fontSize: '3rem', fontWeight: '900', color: '#0f172a', marginBottom: '15px' },
  highlight: { color: '#2563eb' },
  toggleContainer: { display: 'inline-flex', background: 'white', padding: '6px', borderRadius: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border:'1px solid #e2e8f0' },
  toggleBtn: { padding: '10px 25px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.3s, color 0.3s' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
  loader: { textAlign: 'center', fontSize: '1.2rem', color: '#94a3b8', marginTop: '50px' },
  card: { background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' },
  cardHeader: { height: '110px', background: '#eff6ff', borderRadius: '24px 24px 0 0', position: 'relative', marginBottom: '60px' },
  imageContainer: { width: '110px', height: '110px', borderRadius: '50%', border: '4px solid white', position: 'absolute', bottom: '-55px', left: '50%', transform: 'translateX(-50%)', overflow: 'hidden', backgroundColor: 'white' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  branchBadge: { position: 'absolute', top: '15px', right: '15px', background: 'white', color: '#2563eb', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  cardBody: { padding: '0 30px 30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  name: { fontSize: '1.4rem', fontWeight: '800', color: '#1e293b', marginBottom: '15px' },
  linkedinBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#0077b5', padding: '6px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none', marginBottom: '20px', border: '1px solid #dbeafe' },
  quoteContainer: { position: 'relative', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', width: '100%' },
  quoteIcon: { position: 'absolute', top: '-10px', left: '20px', color: '#2563eb', background: 'white', padding: '0 5px' },
  quoteText: { fontStyle: 'italic', color: '#475569', fontSize: '0.9rem', lineHeight: '1.6', margin:0 },
  hobbiesContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', width: '100%', marginTop: '15px' },
  hobbyLabel: { fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' },
  hobbiesText: { color: '#334155', fontWeight: '600', fontSize: '0.9rem', margin: 0 },
  clubMainCard: { background: 'white', borderRadius: '24px', padding: '30px', cursor: 'pointer', border: '1px solid #f1f5f9' }, 
  clubIconBox: { width: '80px', height: '80px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' },
  returnBtn: { background: 'white', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)' },
  scrollTopBtn: { position: 'fixed', bottom: '30px', right: '30px', background: '#2563eb', color: 'white', width: '50px', height: '50px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(37,99,235,0.4)', cursor: 'pointer', zIndex: 1000, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }
};