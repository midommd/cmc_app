import React, { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function GlobalLanguageSwitcher({ setAppLanguage }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // NOUVEAU: Plus d'emojis buggés sur Windows. On utilise des noms courts pour mobile.
  const languages = [
    { code: 'fr', name: 'Français', short: 'FR', dir: 'ltr' },
    { code: 'en', name: 'English', short: 'EN', dir: 'ltr' },
    { code: 'ar', name: 'العربية', short: 'AR', dir: 'rtl' }
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
    <div className="lang-switcher-wrapper" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="lang-switcher-btn hover-scale">
        <Globe size={18} color="#2563eb" className="globe-icon" />
        <span className="lang-text-desktop">{activeLang.name}</span>
        <span className="lang-text-mobile">{activeLang.short}</span>
        <ChevronDown size={16} color="#64748b" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
      </button>

      {isOpen && (
        <div className="lang-dropdown">
          {languages.map((lang) => (
            <div 
              key={lang.code} 
              onClick={() => changeLanguage(lang)}
              className="lang-menu-item"
              style={{ background: currentLangCode === lang.code ? '#eff6ff' : 'transparent' }}
            >
              <span className="lang-item-text">{lang.name}</span>
              {currentLangCode === lang.code && <Check size={16} color="#2563eb" />}
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        .lang-switcher-wrapper { position: relative; display: inline-block; font-family: system-ui; }
        .lang-switcher-btn { display: flex; align-items: center; gap: 8px; background: #fff; padding: 10px 16px; border-radius: 30px; border: 1px solid #e2e8f0; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transition: all 0.2s; }
        .lang-text-desktop { font-weight: 600; color: #1e293b; }
        .lang-text-mobile { display: none; font-weight: 600; color: #1e293b; }
        .lang-dropdown { position: absolute; top: 115%; right: 0; width: 140px; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); padding: 8px; z-index: 10000; }
        .lang-menu-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 10px; cursor: pointer; transition: background 0.2s; }
        .lang-item-text { font-size: 0.9rem; font-weight: 600; color: #334155; }
        
        /* CSS RESPONSIVE INTÉGRÉ AU COMPOSANT */
        @media (max-width: 768px) {
          .lang-switcher-btn { padding: 8px 12px; gap: 5px; }
          .lang-text-desktop { display: none; }
          .lang-text-mobile { display: inline; font-size: 0.85rem; }
          .globe-icon { width: 16px; height: 16px; }
        }
      `}</style>
    </div>
  );
}