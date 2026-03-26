import React, { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function GlobalLanguageSwitcher({ setAppLanguage }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
    { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
    { code: 'ar', name: 'العربية', flag: '🇲🇦', dir: 'rtl' }
  ];

  const currentLangCode = i18n.language || 'fr';
  const activeLang = languages.find(l => l.code === currentLangCode) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (lang) => {
    // NOUVEAU : Sauvegarde dans le navigateur pour résister au F5 (Refresh)
    localStorage.setItem('appLanguage', lang.code);
    
    i18n.changeLanguage(lang.code); 
    document.documentElement.dir = lang.dir; 
    document.documentElement.lang = lang.code;
    
    if (setAppLanguage) setAppLanguage(lang.code); 
    setIsOpen(false);
  };

  useEffect(() => {
    document.documentElement.dir = activeLang.dir;
    document.documentElement.lang = activeLang.code;
  }, [activeLang]);

  return (
    <div style={styles.wrapper} ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} style={styles.button}>
        <Globe size={18} color="#2563eb" />
        <span style={styles.activeText}>{activeLang.flag} <span className="hide-mobile">{activeLang.name}</span></span>
        <ChevronDown size={16} color="#64748b" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          {languages.map((lang) => (
            <div 
              key={lang.code} 
              onClick={() => changeLanguage(lang)}
              style={{
                ...styles.menuItem, 
                background: currentLangCode === lang.code ? '#eff6ff' : 'transparent'
              }}
            >
              <span style={styles.itemText}>{lang.flag} {lang.name}</span>
              {currentLangCode === lang.code && <Check size={16} color="#2563eb" />}
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative', display: 'inline-block', fontFamily: 'system-ui' },
  button: { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '10px 16px', borderRadius: '30px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'all 0.2s' },
  activeText: { fontWeight: '600', color: '#1e293b' },
  dropdown: { position: 'absolute', top: '115%', right: 0, width: '150px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '8px', zIndex: 10000 },
  menuItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.2s' },
  itemText: { fontSize: '0.9rem', fontWeight: '600', color: '#334155' }
};