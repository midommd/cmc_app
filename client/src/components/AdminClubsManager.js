import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // <-- IMPORT DE LA TRADUCTION

export default function AdminClubsManager() {
  const { t } = useTranslation(); // <-- INITIALISATION
  
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', password: '', role: 'membre', club: 'Sportif', sousClub: '' });

  const fetchEvents = () => {
    axios.get('http://localhost:5000/api/clubs/events')
      .then(res => setEvents(res.data)).catch(err => console.error(err));
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/clubs/add-member', formData);
      alert(t('member_added_success')); // <-- TRADUCTION
      setFormData({ nom: '', prenom: '', email: '', password: '', role: 'membre', club: 'Sportif', sousClub: '' });
    } catch (err) { alert(t('member_add_error')); } // <-- TRADUCTION
  };

  // <-- TRADUCTION DES MOIS
  const months = [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')];

  return (
    <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* FORMULAIRE D'AJOUT */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: '#0f172a' }}>
          <UserPlus size={20} color="#2563eb" /> {t('role_club_management')} {/* <-- TRADUCTION */}
        </h3>
        <form onSubmit={handleAddMember} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <input placeholder={t('placeholder_lastname')} required style={inputStyle} value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} />
          <input placeholder={t('placeholder_firstname')} required style={inputStyle} value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} />
          <input type="email" placeholder={t('placeholder_email')} required style={inputStyle} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input type="password" placeholder={t('placeholder_password')} required style={inputStyle} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          
          <select style={inputStyle} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
            <option value="membre">{t('role_simple_member')}</option>
            <option value="responsable">{t('role_subclub_leader')}</option>
            <option value="president">{t('role_pole_president')}</option>
          </select>

          <select style={inputStyle} value={formData.club} onChange={e => setFormData({...formData, club: e.target.value})}>
            <option value="Sportif">{t('pole_sports')}</option>
            <option value="Culturel">{t('pole_cultural')}</option>
            <option value="Innovation">{t('pole_innovation')}</option>
          </select>

          <input placeholder={t('placeholder_subclub')} style={inputStyle} required={formData.role !== 'president'} value={formData.sousClub} onChange={e => setFormData({...formData, sousClub: e.target.value})} />
          <button type="submit" style={{ ...inputStyle, background: '#0f172a', color: 'white', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>{t('create_access_btn')}</button>
        </form>
      </div>

      {/* CALENDRIER ANNUEL */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: '#0f172a' }}>
          <Calendar size={20} color="#8b5cf6" /> {t('master_planning')} {/* <-- TRADUCTION */}
        </h3>
        <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px' }}>
          {months.map((month, index) => {
            const mEvents = events.filter(e => new Date(e.date).getMonth() === index);
            return (
              <div key={index} style={{ flex: '0 0 200px', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ textAlign: 'center', margin: '0 0 15px 0', color: '#64748b', textTransform: 'uppercase' }}>{month}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {mEvents.length === 0 ? <span style={{fontSize: '0.8rem', color: '#cbd5e1', textAlign: 'center'}}>{t('no_events')}</span> : 
                    mEvents.map(evt => (
                      <div key={evt._id} style={{ background: 'white', padding: '10px', borderRadius: '8px', borderLeft: `4px solid ${evt.club === 'Sportif' ? '#3b82f6' : '#ec4899'}`, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#2563eb' }}>{new Date(evt.date).getDate()} {month}</span>
                        <p style={{ margin: '5px 0', fontSize: '0.9rem', fontWeight: 'bold', color: '#0f172a' }}>{evt.title}</p>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{evt.sousClub}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', width: '100%', boxSizing: 'border-box' };