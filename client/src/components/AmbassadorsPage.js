import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Quote, Sparkles, Briefcase, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AmbassadorsPage() {
  const navigate = useNavigate();
  const [ambassadors, setAmbassadors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAmbassadors = async () => {
      try {
        const res = await axios.get('/api/users/ambassadors');
        
        // --- THE FILTER ---
        // Only show users who have ALL fields filled (Photo, Branch, Quote, Hobbies)
        const validAmbassadors = res.data.filter(user => 
          user.photo && user.photo.length > 100 && 
          user.branch && user.branch.trim() !== "" &&
          user.whyCMC && user.whyCMC.trim() !== "" &&
          user.hobbies && user.hobbies.trim() !== ""
        );

        setAmbassadors(validAmbassadors);
      } catch (err) {
        console.error("Error loading ambassadors", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAmbassadors();
  }, []);

  // Animations
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50 } }
  };

  return (
    <div style={styles.page}>
      {/* Decorative Background */}
      <div style={styles.blob1}></div>
      <div style={styles.blob2}></div>

      {/* Nav */}
      <nav style={styles.nav}>
        <button onClick={() => navigate('/')} style={styles.backBtn}>
          <ArrowLeft size={20} /> Retour à l'accueil
        </button>
      </nav>

      <div style={styles.content}>
        <header style={styles.header}>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            style={styles.title}
          >
            Rencontrez nos <span style={styles.highlight}>Ambassadeurs</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.3 }}
            style={styles.subtitle}
          >
            Découvrez les visages qui font vivre la communauté CMC Rabat.
          </motion.p>
        </header>

        {loading ? (
          <div style={styles.loader}>Chargement des profils...</div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" style={styles.grid}>
            
            {ambassadors.length === 0 && (
              <div style={{textAlign:'center', width:'100%', gridColumn:'1/-1', color:'#64748b'}}>
                Aucun ambassadeur n'a encore complété son profil public.
              </div>
            )}

            {ambassadors.map((amb) => (
              <motion.div key={amb._id} variants={item} style={styles.card} whileHover={{ y: -10 }}>
                
                {/* Photo Header */}
                <div style={styles.cardHeader}>
                  <div style={styles.imageContainer}>
                    <img src={amb.photo} alt={amb.prenom} style={styles.image} />
                  </div>
                  <div style={styles.branchBadge}>
                    <Briefcase size={12} style={{marginRight:'4px'}}/> {amb.branch}
                  </div>
                </div>

                {/* Content */}
                <div style={styles.cardBody}>
                  <h3 style={styles.name}>{amb.prenom} {amb.nom}</h3>
                  
                  {/* Quote Section */}
                  <div style={styles.quoteContainer}>
                    <Quote size={20} style={styles.quoteIcon} />
                    <p style={styles.quoteText}>{amb.whyCMC}</p>
                  </div>

                  <div style={styles.divider}></div>

                  {/* Hobbies */}
                  <div style={styles.hobbiesContainer}>
                    <div style={styles.hobbyLabel}><Heart size={14} color="#e11d48"/> Passions :</div>
                    <p style={styles.hobbiesText}>{amb.hobbies}</p>
                  </div>
                </div>

              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// --- CSS-in-JS STYLES ---
const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    position: 'relative',
    overflowX: 'hidden',
    fontFamily: "'Inter', sans-serif"
  },
  blob1: {
    position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw',
    background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, rgba(0,0,0,0) 70%)',
    borderRadius: '50%', zIndex: 0, pointerEvents: 'none'
  },
  blob2: {
    position: 'absolute', bottom: '-10%', right: '-10%', width: '60vw', height: '60vw',
    background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(0,0,0,0) 70%)',
    borderRadius: '50%', zIndex: 0, pointerEvents: 'none'
  },
  nav: { padding: '20px 40px', position: 'relative', zIndex: 10 },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: '8px', background: 'white',
    border: '1px solid #e2e8f0', padding: '10px 24px', borderRadius: '30px',
    cursor: 'pointer', fontWeight: '600', color: '#475569',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.3s'
  },
  content: { position: 'relative', zIndex: 2, paddingBottom: '80px' },
  header: { textAlign: 'center', padding: '40px 20px 60px' },
  title: { fontSize: '3rem', fontWeight: '900', color: '#0f172a', marginBottom: '10px', letterSpacing: '-1px' },
  highlight: { color: '#2563eb', background: 'linear-gradient(120deg, #dbeafe 0%, #dbeafe 100%)', backgroundRepeat: 'no-repeat', backgroundSize: '100% 30%', backgroundPosition: '0 90%' },
  subtitle: { fontSize: '1.1rem', color: '#64748b' },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '30px', maxWidth: '1200px', margin: '0 auto', padding: '0 20px'
  },
  loader: { textAlign: 'center', fontSize: '1.2rem', color: '#94a3b8', marginTop: '50px' },
  
  // Card Styles
  card: {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    overflow: 'visible', // Allows image to pop out if needed
    border: '1px solid rgba(255,255,255,0.5)',
    boxShadow: '0 20px 40px -5px rgba(0,0,0,0.05)',
    display: 'flex', flexDirection: 'column'
  },
  cardHeader: {
    height: '100px',
    background: 'linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%)',
    borderRadius: '24px 24px 0 0',
    position: 'relative',
    marginBottom: '60px' // Space for the photo
  },
  imageContainer: {
    width: '120px', height: '120px',
    borderRadius: '50%',
    border: '4px solid white',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    position: 'absolute',
    bottom: '-60px', left: '50%', transform: 'translateX(-50%)',
    overflow: 'hidden',
    backgroundColor: 'white'
  },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  branchBadge: {
    position: 'absolute', top: '15px', right: '15px',
    background: 'rgba(255,255,255,0.9)', color: '#2563eb',
    padding: '6px 12px', borderRadius: '20px',
    fontSize: '0.75rem', fontWeight: '800',
    display: 'flex', alignItems: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
  },
  cardBody: { padding: '0 30px 30px', textAlign: 'center' },
  name: { fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '20px' },
  quoteContainer: {
    position: 'relative', background: '#f8fafc', padding: '20px', borderRadius: '16px',
    border: '1px solid #f1f5f9', marginBottom: '20px'
  },
  quoteIcon: { position: 'absolute', top: '-10px', left: '20px', color: '#2563eb', background: 'white', padding: '0 5px' },
  quoteText: { fontStyle: 'italic', color: '#475569', fontSize: '0.95rem', lineHeight: '1.6' },
  divider: { height: '1px', background: '#e2e8f0', width: '60%', margin: '0 auto 20px' },
  hobbiesContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' },
  hobbyLabel: { fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' },
  hobbiesText: { color: '#334155', fontWeight: '600', fontSize: '0.95rem' }
};