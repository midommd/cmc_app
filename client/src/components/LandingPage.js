import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  LogIn, Users, ArrowRight, ShieldCheck, Heart, 
  MapPin, CalendarDays, Award, Briefcase, GraduationCap, ChevronRight 
} from 'lucide-react';
import cmcImg from '../assets/img/cmc.jpeg';

// --- COMPOSANT COMPTEUR ANIMÉ ---
const Counter = ({ value, suffix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    let start = null;
    const duration = 2; 
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / (duration * 1000), 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{count}{suffix}</span>;
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [ambassadorsCount, setAmbassadorsCount] = useState(0);

  const academicYear = (() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startYear = now.getMonth() < 8 ? currentYear - 1 : currentYear;
    return `${startYear}-${startYear + 1}`;
  })();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/users/ambassadors');
        const count = res.data.filter(u => u.isAmbassadeur !== false).length;
        setAmbassadorsCount(count);
      } catch (err) {
        console.error("Erreur stats", err);
      }
    };
    fetchStats();
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  // --- ACTIONS DES BOUTONS ---
  const handleCommunityClick = (e) => {
    e.preventDefault();
    navigate('/ambassadors'); 
  };
  
  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div className="landing-wrapper">
      {/* BACKGROUND MESH GRADIENT */}
      <div className="mesh-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo-group" onClick={() => window.scrollTo(0,0)}>
            <div className="logo-icon"><Award size={20} color="white" /></div>
            <div className="logo-text">
              <span className="brand-name">CMC Rabat</span>
              <span className="brand-sub">Ambassadeurs</span>
            </div>
          </div>
          <button className="nav-login-btn hover-scale" onClick={handleLoginClick}>
            <LogIn size={18} /> <span className="hide-mobile">Espace Membre</span>
          </button>
        </div>
      </nav>

      <main className="main-content">
        
        {/* === SECTION 1 : HERO === */}
        <section className="hero-layout">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="hero-text-col">
            
            <motion.div variants={fadeInUp}>
              <span className="badge-text">✨ Programme d'Excellence {academicYear}</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="hero-title">
              Devenez l'image de <br/>
              <span className="text-gradient">votre campus.</span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="hero-subtitle">
              Le réseau très sélectif des talents de la Cité des Métiers et des Compétences. 
              Représentez l'établissement, développez votre leadership et boostez votre carrière.
            </motion.p>

            <motion.div variants={fadeInUp} className="cta-group">
              <button className="primary-cta hover-scale" onClick={handleLoginClick}>
                Accéder au portail <ArrowRight size={20} />
              </button>
              <button className="secondary-cta hover-scale" onClick={handleCommunityClick}>
                Voir les Ambassadeurs
              </button>
            </motion.div>

            <motion.div variants={fadeInUp} className="stats-group">
              <div className="stat-chip">
                <Users size={18} color="#3b82f6" />
                <span className="stat-text"><b><Counter value={ambassadorsCount > 0 ? ambassadorsCount : 25} /></b> Ambassadeurs Actifs</span>
              </div>
              <div className="stat-chip">
                <ShieldCheck size={18} color="#10b981" />
                <span className="stat-text"><b>100%</b> Engagés</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="hero-img-col">
            <div className="image-glow"></div>
            <img src={cmcImg} alt="Campus CMC" className="hero-image" />
          </motion.div>
        </section>

        {/* === SECTION 2 : POURQUOI NOUS REJOINDRE === */}
        <section className="section-padding">
          <div className="section-header">
            <h2 className="section-title">Un tremplin pour votre <span style={{color: '#3b82f6'}}>carrière</span></h2>
            <p className="section-subtitle">Être ambassadeur, c'est se forger un profil professionnel unique.</p>
          </div>
          
          <div className="benefits-grid">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="benefit-card">
              <div className="benefit-icon icon-blue"><Briefcase size={28}/></div>
              <h3 className="benefit-title">Soft Skills</h3>
              <p className="benefit-text">Améliorez votre prise de parole, votre gestion des imprévus et votre relationnel sur le terrain.</p>
            </motion.div>
            
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="benefit-card">
              <div className="benefit-icon icon-orange"><Users size={28}/></div>
              <h3 className="benefit-title">Réseau Privilégié</h3>
              <p className="benefit-text">Construisez votre carnet d'adresses en échangeant avec les officiels et formateurs.</p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="benefit-card">
              <div className="benefit-icon icon-green"><GraduationCap size={28}/></div>
              <h3 className="benefit-title">Certificat de Mérite</h3>
              <p className="benefit-text">Obtenez une reconnaissance officielle qui fera la différence sur votre CV.</p>
            </motion.div>
          </div>
        </section>

        {/* === SECTION 3 : BENTO GRID === */}
        <section className="section-padding" style={{paddingBottom: '100px'}}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp} className="section-header">
            <h2 className="section-title">Votre rôle sur le campus</h2>
            <p className="section-subtitle">Des responsabilités à forte valeur ajoutée.</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="bento-grid">
            
            <motion.div variants={fadeInUp} className="bento-card bento-span-2 bento-white">
              <div className="bento-icon"><MapPin size={24} /></div>
              <h3 className="bento-title">Accueil des délégations</h3>
              <p className="bento-text">Devenez l'hôte de marque de la CMC. Guidez les visiteurs VIP, orientez les nouveaux inscrits et représentez l'hospitalité de notre institution lors des événements.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="bento-card bento-dark">
              <div className="bento-icon dark-icon"><CalendarDays size={24} /></div>
              <h3 className="bento-title" style={{color: 'white'}}>Organisation VIP</h3>
              <p className="bento-text" style={{color: '#94a3b8'}}>Assurez le bon déroulement logistique des forums, séminaires et remises de diplômes.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="bento-card bento-blue">
              <div className="bento-icon"><ShieldCheck size={24} /></div>
              <h3 className="bento-title">Maintien de l'ordre</h3>
              <p className="bento-text">Veillez au respect du règlement intérieur et véhiculez une image disciplinée.</p>
            </motion.div>

            <motion.div variants={fadeInUp} className="bento-card bento-span-2 bento-flex">
              <div style={{ flex: 1 }}>
                <h3 className="bento-title">Curieux de voir qui compose notre réseau ?</h3>
                <p className="bento-text" style={{marginBottom: '20px'}}>Parcourez notre galerie interactive pour découvrir les profils, les filières et les citations des ambassadeurs qui font la fierté de la CMC Rabat.</p>
                <button className="link-btn hover-scale" onClick={handleCommunityClick}>
                  Explorer les profils Ambassadeurs <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>

          </motion.div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Award size={20} color="#3b82f6" />
            <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1e293b' }}>CMC Rabat</span>
          </div>
          <p className="footer-text">
            © {academicYear} Programme Ambassadeurs. Interface conçue et développée par <br/>
            <span style={{ color: '#1e293b', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop:'5px' }}>
              Mohammed ElMahdi Daifi <Heart size={14} color="#ef4444" fill="#ef4444" /> DEVOWFS-205
            </span>
          </p>
        </div>
      </footer>

      {/* ================= CSS RESPONSIVE & LAYOUT ================= */}
      <style>{`
        * { box-sizing: border-box; }
        
        .landing-wrapper { min-height: 100vh; background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; overflow-x: hidden; position: relative; }
        
        button { position: relative; z-index: 50; }
        .hover-scale { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; }
        .hover-scale:hover { transform: translateY(-3px); }

        .mesh-background { position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden; z-index: 0; pointer-events: none; }
        .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.8; width: 80vw; height: 80vw; max-width: 800px; }

        .navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 15px 20px; display: flex; justify-content: center; }
        .nav-container { width: 100%; max-width: 1200px; display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); padding: 10px 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.6); box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
        .logo-group { display: flex; align-items: center; gap: 12px; cursor: pointer; z-index: 50; position: relative; }
        .logo-icon { background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 8px; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(37,99,235,0.3); }
        .logo-text { display: flex; flex-direction: column; }
        .brand-name { font-size: 1.1rem; font-weight: 900; color: #0f172a; line-height: 1.2; }
        .brand-sub { font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
        .nav-login-btn { display: flex; align-items: center; gap: 8px; background: #1e293b; color: white; border: none; padding: 10px 20px; border-radius: 16px; font-weight: 600; font-size: 0.9rem; box-shadow: 0 4px 12px rgba(15,23,42,0.15); }

        .main-content { position: relative; z-index: 10; padding-top: 100px; }
        .section-padding { padding: 80px 20px; max-width: 1200px; margin: 0 auto; }
        .section-header { text-align: center; margin-bottom: 50px; }
        .section-title { font-size: clamp(2rem, 4vw, 2.5rem); font-weight: 900; color: #0f172a; margin: 0 0 10px 0; letter-spacing: -0.5px; }
        .section-subtitle { font-size: 1.1rem; color: #64748b; margin: 0; }

        .hero-layout { display: flex; align-items: center; gap: 40px; max-width: 1200px; margin: 0 auto; padding: 40px 20px 80px; min-height: 75vh; }
        .hero-text-col { flex: 1; display: flex; flex-direction: column; gap: 22px; }
        .hero-img-col { flex: 1; position: relative; display: flex; justify-content: center; align-items: center; }

        .badge-text { display: inline-block; background: rgba(59,130,246,0.1); color: #2563eb; padding: 8px 16px; border-radius: 30px; font-size: 0.85rem; font-weight: 800; border: 1px solid rgba(59,130,246,0.2); }
        .hero-title { font-size: clamp(2.5rem, 5vw, 4.5rem); font-weight: 900; color: #0f172a; line-height: 1.1; margin: 0; letter-spacing: -1px; }
        .text-gradient { background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-subtitle { font-size: 1.1rem; color: #475569; line-height: 1.6; margin: 0; max-width: 90%; }
        
        .cta-group { display: flex; gap: 15px; flex-wrap: wrap; margin-top: 5px; }
        .primary-cta { display: flex; align-items: center; gap: 10px; background: #2563eb; color: white; border: none; padding: 14px 28px; border-radius: 14px; font-size: 1rem; font-weight: 700; box-shadow: 0 10px 25px -5px rgba(37,99,235,0.4); }
        .primary-cta:hover { box-shadow: 0 15px 30px -5px rgba(37,99,235,0.6); }
        .secondary-cta { background: white; color: #1e293b; border: 1px solid #cbd5e1; padding: 14px 28px; border-radius: 14px; font-size: 1rem; font-weight: 700; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        
        .stats-group { display: flex; gap: 15px; margin-top: 15px; flex-wrap: wrap; }
        .stat-chip { display: flex; align-items: center; gap: 10px; background: white; padding: 10px 16px; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
        .stat-text { font-size: 0.85rem; color: #475569; }

        .image-glow { position: absolute; top: 5%; left: 5%; right: 5%; bottom: 10%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); filter: blur(50px); opacity: 0.25; border-radius: 30px; z-index: -1; }
        .hero-image { width: 100%; max-width: 500px; height: auto; border-radius: 30px; border: 6px solid white; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15); object-fit: cover; }

        /* Benefits Grid */
        .benefits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .benefit-card { background: white; padding: 40px 30px; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.03); text-align: center; display: flex; flex-direction: column; align-items: center; }
        .benefit-icon { width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .icon-blue { background: #eff6ff; color: #3b82f6; }
        .icon-orange { background: #fef3c7; color: #d97706; }
        .icon-green { background: #ecfdf5; color: #10b981; }
        .benefit-title { font-size: 1.2rem; font-weight: 800; color: #1e293b; margin: 0 0 10px 0; }
        .benefit-text { font-size: 0.95rem; color: #64748b; line-height: 1.6; margin: 0; }

        /* Bento Grid */
        .bento-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; grid-auto-rows: minmax(220px, auto); }
        .bento-card { border-radius: 24px; padding: 40px; border: 1px solid #f1f5f9; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
        .bento-white { background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); }
        .bento-dark { background: #1e293b; color: white; }
        .bento-blue { background: #eff6ff; }
        .bento-span-2 { grid-column: span 2; }
        .bento-flex { flex-direction: row; align-items: center; justify-content: space-between; gap: 20px; background: white; }
        
        .bento-icon { width: 45px; height: 45px; border-radius: 12px; background: #eff6ff; color: #3b82f6; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; }
        .dark-icon { background: rgba(255,255,255,0.1); color: white; }
        
        .bento-title { font-size: 1.3rem; font-weight: 800; color: #1e293b; margin: 0 0 10px 0; }
        .bento-text { font-size: 0.95rem; color: #64748b; line-height: 1.6; margin: 0; }
        .link-btn { background: transparent; border: none; color: #3b82f6; font-weight: bold; font-size: 1.05rem; display: flex; align-items: center; gap: 5px; padding: 0; }
        .link-btn:hover { opacity: 0.8; gap: 10px; }

        /* Footer */
        .footer { border-top: 1px solid #e2e8f0; padding: 40px 20px; background: white; }
        .footer-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
        .footer-brand { display: flex; align-items: center; gap: 10px; }
        .footer-text { text-align: right; font-size: 0.85rem; color: #64748b; margin: 0; line-height: 1.6; }

        /* MEDIA QUERIES (Correction absolue du Layout sur Mobile) */
        @media (max-width: 992px) {
          .hero-layout { flex-direction: column; text-align: center; padding-top: 20px; gap: 50px; }
          .hero-subtitle { margin: 0 auto; }
          .cta-group { justify-content: center; width: 100%; }
          .stats-group { justify-content: center; width: 100%; }
          .bento-span-2 { grid-column: span 1; }
        }

        @media (max-width: 768px) {
          .hide-mobile { display: none; }
          .hero-title { font-size: 2.2rem; }
          .hero-subtitle { font-size: 1rem; }
          .section-title { font-size: 1.8rem; }
          .section-subtitle { font-size: 1rem; padding: 0 10px;}
          .bento-flex { flex-direction: column; text-align: left; align-items: flex-start; }
          .benefits-grid { grid-template-columns: 1fr; }
          .bento-grid { grid-template-columns: 1fr; }
          .nav-login-btn { padding: 8px 15px; border-radius: 12px; }
          .bento-card { padding: 25px; }
          .footer-content { flex-direction: column; text-align: center; justify-content: center; }
          .footer-text { text-align: center; }
        }
      `}</style>
    </div>
  );
}