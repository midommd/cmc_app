import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, User, ChevronRight, MessageSquare } from 'lucide-react';

export default function CmcAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Bonjour. Je suis l'assistant IA de la CMC RSK. Comment puis-je vous aider aujourd'hui ?", isBot: true }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestions = [
    "Les 79 filières ?",
    "Rôle des Ambassadeurs ?",
    "Services du COP ?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToProcess) => {
    const userText = textToProcess || input;
    if (!userText.trim()) return;

    setMessages(prev => [...prev, { text: userText, isBot: false }]);
    setInput("");
    setIsTyping(true);

    try {
      const baseURL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
      const res = await axios.post(`${baseURL}/api/bot/ask`, { message: userText });
      
      setMessages(prev => [...prev, { text: res.data.reply, isBot: true }]);
    } catch (err) {
      console.error("Erreur Nova AI:", err);
      setMessages(prev => [...prev, { text: "Le service est temporairement indisponible. Veuillez réessayer.", isBot: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* ================= BOUTON FLOTTANT CLASSIQUE & PRO (À GAUCHE) ================= */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05, y: -3 }}
            style={styles.floatingBtn}
            onClick={() => setIsOpen(true)}
          >
            <MessageSquare size={24} color="white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ================= INTERFACE CHAT CLAIRE & INTÉGRÉE (À GAUCHE) ================= */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={styles.overlay}
            />
            
            <motion.div
              initial={{ y: '20px', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '20px', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={styles.chatbotPanel}
            >
              {/* HEADER ÉPURÉ */}
              <div style={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={styles.botIconWrapper}>
                    <Sparkles size={20} color="#2563eb" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>Assistant CMC</h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                      <span style={styles.onlineDot}></span> En ligne
                    </span>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} style={styles.closeBtn}><X size={20} /></button>
              </div>

              {/* ZONE DES MESSAGES */}
              <div style={styles.messagesContainer} className="ia-scrollbar">
                {messages.map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    key={idx} 
                    style={{ display: 'flex', flexDirection: msg.isBot ? 'row' : 'row-reverse', gap: '10px', marginBottom: '20px' }}
                  >
                    <div style={msg.isBot ? styles.botAvatar : styles.userAvatar}>
                      {msg.isBot ? <Sparkles size={16} color="#2563eb" /> : <User size={16} color="#475569" />}
                    </div>
                    <div style={msg.isBot ? styles.botBubble : styles.userBubble}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                
                {/* INDICATEUR DE FRAPPE (STYLE CLAIR) */}
                {isTyping && (
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <div style={styles.botAvatar}><Sparkles size={16} color="#2563eb" /></div>
                    <div style={{...styles.botBubble, display: 'flex', gap: '4px', alignItems: 'center', padding: '12px 16px'}}>
                      <motion.div animate={{y:[0,-4,0]}} transition={{repeat:Infinity, duration:0.6}} style={styles.typingDot}/>
                      <motion.div animate={{y:[0,-4,0]}} transition={{repeat:Infinity, duration:0.6, delay:0.2}} style={styles.typingDot}/>
                      <motion.div animate={{y:[0,-4,0]}} transition={{repeat:Infinity, duration:0.6, delay:0.4}} style={styles.typingDot}/>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ZONE DE SAISIE ET SUGGESTIONS */}
              <div style={styles.inputArea}>
                <div style={styles.suggestionsContainer} className="ia-scrollbar-x">
                  {suggestions.map((sug, i) => (
                    <button key={i} onClick={() => handleSend(sug)} disabled={isTyping} style={{...styles.suggestionBadge, opacity: isTyping ? 0.5 : 1}}>
                      {sug} <ChevronRight size={14} color="#2563eb" />
                    </button>
                  ))}
                </div>

                <div style={styles.inputBox}>
                  <input 
                    style={styles.input}
                    placeholder="Posez votre question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isTyping}
                  />
                  <button onClick={() => handleSend()} style={{...styles.sendBtn, opacity: input.trim() ? 1 : 0.5}} disabled={!input.trim() || isTyping}>
                    <Send size={18} style={{marginLeft: '2px'}} color="white" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        /* Scrollbars discrètes adaptées au thème clair */
        .ia-scrollbar::-webkit-scrollbar { width: 6px; }
        .ia-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .ia-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .ia-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .ia-scrollbar-x::-webkit-scrollbar { height: 0px; }
      `}</style>
    </>
  );
}

const styles = {
  // Bouton flottant placé EN BAS À GAUCHE
  floatingBtn: { position: 'fixed', bottom: '30px', left: '30px', width: '60px', height: '60px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 9999, boxShadow: '0 10px 25px rgba(37,99,235,0.3)', border: 'none' },
  
  // Overlay très léger
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.1)', zIndex: 9998 },
  
  // Panneau principal : Placé EN BAS À GAUCHE
  chatbotPanel: { position: 'fixed', bottom: '20px', left: '20px', width: 'calc(100% - 40px)', maxWidth: '380px', height: '600px', maxHeight: '85vh', background: '#ffffff', borderRadius: '20px', display: 'flex', flexDirection: 'column', zIndex: 10000, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' },
  
  // Header
  header: { background: '#ffffff', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' },
  botIconWrapper: { width: '38px', height: '38px', background: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' },
  onlineDot: { width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' },
  closeBtn: { background: 'transparent', border: 'none', color: '#94a3b8', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', transition: 'background 0.2s' },
  
  // Zone de Chat
  messagesContainer: { flex: 1, padding: '20px', overflowY: 'auto', background: '#fafafa' },
  botAvatar: { width: '30px', height: '30px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #bfdbfe' },
  userAvatar: { width: '30px', height: '30px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e2e8f0' },
  
  // Bulles : Gris clair pour le bot, Bleu officiel pour l'utilisateur
  botBubble: { background: '#ffffff', color: '#334155', padding: '12px 16px', borderRadius: '4px 16px 16px 16px', fontSize: '0.95rem', lineHeight: '1.5', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' },
  userBubble: { background: '#2563eb', color: '#ffffff', padding: '12px 16px', borderRadius: '16px 4px 16px 16px', fontSize: '0.95rem', lineHeight: '1.5', boxShadow: '0 4px 10px rgba(37,99,235,0.2)' },
  typingDot: { width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%' },
  
  // Zone de saisie
  inputArea: { padding: '15px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0' },
  suggestionsContainer: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px' },
  suggestionBadge: { whiteSpace: 'nowrap', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', transition: 'all 0.2s ease' },
  
  inputBox: { display: 'flex', background: '#f1f5f9', borderRadius: '20px', padding: '6px', border: '1px solid transparent' },
  input: { flex: 1, background: 'transparent', border: 'none', color: '#0f172a', padding: '8px 15px', outline: 'none', fontSize: '0.95rem' },
  sendBtn: { background: '#2563eb', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }
};