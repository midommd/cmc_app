import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Users, ArrowRight, Activity, Heart, ShieldCheck } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  // --- CALCUL AUTOMATIQUE DE L'ANNÉE SCOLAIRE ---
  const getAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); 


    const startYear = currentMonth < 8 ? currentYear - 1 : currentYear;
    const endYear = startYear + 1;
    
    return `${startYear}-${endYear}`;
  };

  const academicYear = getAcademicYear(); 

  // Animations
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  return (
    <div className="landing-container">
      
      {/* --- NAVBAR --- */}
      <nav className="navbar">
        <div className="logo">
          <div className="brand-text">
            <span className="brand-name">CMC Rabat</span>
            <span className="brand-sub">Ambassadeurs</span>
          </div>
        </div>
        <button className="login-btn-nav" onClick={() => navigate('/login')} title="Se connecter">
          <LogIn size={20} /> <span>Espace Membre</span>
        </button>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="hero-section">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* BADGE DYNAMIQUE */}
          <motion.span 
            className="badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            Programme {academicYear}
          </motion.span>
          
          <h1>Devenez le Visage de l'<span className="highlight">Excellence</span></h1>
          <p>
            Rejoignez l'élite étudiante de la Cité des Métiers et des Compétences. 
            Guidez, inspirez et valorisez votre parcours à travers des missions officielles.
          </p>
          
          <div className="hero-buttons">
            <button className="cta-btn" onClick={() => navigate('/login')}>
              Rejoindre le programme <ArrowRight size={20} />
            </button>
            <button className="secondary-btn" onClick={() => document.getElementById('roles').scrollIntoView({ behavior: 'smooth'})}>
              En savoir plus
            </button>
          </div>
        </motion.div>

        <motion.div 
          className="hero-visual"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <motion.img 
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
            alt="Ambassadeurs CMC" 
            className="hero-img"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </header>

      {/* --- RÔLES --- */}
      <section id="roles" className="roles-section">
        <motion.div 
          className="section-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <h2>Votre Impact à la CMC</h2>
          <p>Plus qu'un rôle, une véritable expérience professionnelle.</p>
        </motion.div>

        <motion.div 
          className="cards-grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div className="card card-blue" variants={fadeInUp}>
            <div className="icon-box"><Users size={30} /></div>
            <h3>Accueil & Orientation</h3>
            <p>Soyez le premier contact. Accueillez les délégations officielles et orientez les nouveaux stagiaires.</p>
          </motion.div>

          <motion.div className="card card-orange" variants={fadeInUp}>
            <div className="icon-box"><Activity size={30} /></div>
            <h3>Événementiel</h3>
            <p>Participez à l'organisation logistique des grands événements, forums et journées portes ouvertes.</p>
          </motion.div>

          <motion.div className="card card-purple" variants={fadeInUp}>
            <div className="icon-box"><ShieldCheck size={30} /></div>
            <h3>Représentation</h3>
            <p>Incarnez les valeurs de la CMC lors des visites externes et assurez le respect du règlement.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* --- STATS --- */}
      <section className="stats-section">
        <motion.div 
          className="stats-container"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="stat-item">
            <span className="number">12</span>
            <span className="label">Ambassadeurs</span>
          </div>
          <div className="divider"></div>
          <div className="stat-item">
            <span className="number">150+</span>
            <span className="label">Heures de Mission</span>
          </div>
          <div className="divider"></div>
          <div className="stat-item">
            <span className="number">100%</span>
            <span className="label">Engagement</span>
          </div>
        </motion.div>
      </section>

      {/* --- FOOTER DYNAMIQUE --- */}
      <footer className="footer">
        <p>© {academicYear} CMC Rabat - Plateforme Ambassadeurs | Développé avec <Heart size={14} fill="red" color="red"/> Mohammed ElMahdi Daifi Groupe DEVOWFS-205</p>
      </footer>
    </div>
  );
}