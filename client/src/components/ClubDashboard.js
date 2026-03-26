import React, { useState } from 'react';
import axios from 'axios';
import { Trophy, Users, Clock, PlusSquare, ShieldCheck } from 'lucide-react';

export default function ClubDashboard({ user }) {
  // Les états pour la création d'une session/événement
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [attendance, setAttendance] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0); // Spécifique Echecs/Sport
  
  // Différencier Président vs Responsable
  const isPresident = user.role === 'president';
  const sousClubName = user.sousClub || 'Général';

  const handleSubmitSession = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/clubs/events', {
        title: sessionTitle,
        club: user.club,
        sousClub: isPresident ? "Événement Pôle" : user.sousClub,
        date: sessionDate,
        type: isPresident ? 'grand_evenement' : 'session_normale',
        metrics: { attendance, gamesPlayed }
      }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
      
      alert("Session enregistrée avec succès ! L'Admin peut maintenant la voir sur son planning annuel.");
      setSessionTitle(""); setSessionDate(""); setAttendance(0); setGamesPlayed(0);
    } catch (err) { alert("Erreur serveur"); }
  };

  return (
    <div style={styles.dashboard}>
      <div style={styles.headerInfo}>
        <div>
          <h1 style={styles.mainTitle}>
            {isPresident ? `Direction : Pôle ${user.club}` : `Tableau de bord : ${user.sousClub}`}
          </h1>
          <p style={styles.subtitle}>
            {isPresident 
              ? "Supervisez vos sous-clubs et planifiez les grands événements du pôle." 
              : "Gérez vos sessions hebdomadaires et remplissez vos rapports."}
          </p>
        </div>
        <div style={styles.roleBadge}>
          <ShieldCheck size={20} /> {isPresident ? 'Président' : 'Responsable'}
        </div>
      </div>

      <div style={styles.grid}>
        
        {/* WIDGET : AJOUTER UNE SESSION / ÉVÉNEMENT */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}><PlusSquare size={18} /> {isPresident ? 'Planifier un Tournoi/Gala' : 'Rapport de Session'}</h3>
          <form onSubmit={handleSubmitSession} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <input type="text" placeholder="Titre (ex: Entraînement Semaine 4)" style={styles.input} required value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} />
            <input type="datetime-local" style={styles.input} required value={sessionDate} onChange={e => setSessionDate(e.target.value)} />
            
            <div style={{display: 'flex', gap: '10px'}}>
              <div style={{flex: 1}}>
                <label style={styles.label}>Présents :</label>
                <input type="number" style={styles.input} value={attendance} onChange={e => setAttendance(e.target.value)} />
              </div>
              
              {/* MAGIE : Si c'est le responsable Echecs ou Foot, on demande les parties jouées */}
              {(!isPresident && (sousClubName.toLowerCase().includes('echec') || sousClubName.toLowerCase().includes('foot'))) && (
                <div style={{flex: 1}}>
                  <label style={styles.label}>Parties/Matchs joués :</label>
                  <input type="number" style={styles.input} value={gamesPlayed} onChange={e => setGamesPlayed(e.target.value)} />
                </div>
              )}
            </div>
            
            <button type="submit" style={styles.submitBtn}>
              {isPresident ? 'Envoyer au calendrier Admin' : 'Valider la session'}
            </button>
          </form>
        </div>

        {/* WIDGET : VUE D'ENSEMBLE (Statistiques) */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}><Trophy size={18} /> Statistiques Globales</h3>
          {isPresident ? (
            <div style={styles.statsGrid}>
              <div style={styles.statBox}><h3>5</h3><span>Sous-Clubs actifs</span></div>
              <div style={styles.statBox}><h3>142</h3><span>Membres dans le pôle</span></div>
              <div style={styles.statBox}><h3>3</h3><span>Grands Événements</span></div>
            </div>
          ) : (
            <div style={styles.statsGrid}>
              <div style={styles.statBox}><h3>24</h3><span>Membres Inscrits</span></div>
              <div style={styles.statBox}><h3>12</h3><span>Sessions réalisées</span></div>
              {sousClubName.toLowerCase().includes('echec') && (
                <div style={styles.statBox}><h3>84</h3><span>Échecs et Mats !</span></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  dashboard: { padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' },
  headerInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '30px', borderRadius: '20px', color: 'white' },
  mainTitle: { margin: 0, fontSize: '2rem', fontWeight: '900' },
  subtitle: { margin: '5px 0 0 0', opacity: 0.8 },
  roleBadge: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px' },
  card: { background: 'white', padding: '25px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
  cardTitle: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, marginBottom: '20px', color: '#0f172a', fontSize: '1.2rem' },
  input: { width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', boxSizing: 'border-box', outline: 'none' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' },
  submitBtn: { width: '100%', padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  statBox: { background: '#f1f5f9', padding: '20px', borderRadius: '15px', textAlign: 'center', border: '1px solid #e2e8f0' }
};