import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { io } from "socket.io-client";
import { Send, Users, ArrowLeft, X, Trash2, Smile, MoreVertical, Edit2, EyeOff, Copy, Reply, Search, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useTranslation } from 'react-i18next'; // <-- NOUVEAU

// --- FONCTION FORMATAGE DERNIÈRE CONNEXION (Adaptée avec t) ---
const formatLastSeen = (dateString, t) => {
  if (!dateString) return t('offline');
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 2) return t('offline_just_now');
  if (diffMins < 60) return t('offline_mins_ago', { count: diffMins });
  if (diffHours < 24) return t('offline_hours_ago', { count: diffHours });
  if (diffDays === 1) return t('offline_yesterday');
  return t('offline_date', { date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) });
};

// --- FONCTION FORMATAGE DATE POUR SÉPARATEURS (Adaptée avec t) ---
const formatDateSeparator = (dateString, t) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return t('today');
  if (date.toDateString() === yesterday.toDateString()) return t('yesterday');
  
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

// --- MESSAGE BUBBLE AVEC SWIPE & MENU FIXE ---
const MessageBubble = React.memo(({ message, isOwn, senderInfo, isGroup, onAction, onReply, t }) => { // <-- t ajouté en prop
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const controls = useAnimation(); 

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 50) { 
      onReply(message);
    }
    controls.start({ x: 0 }); 
  };

  return (
    <div className="message-row" style={{marginBottom:'15px', position:'relative', overflowX:'clip', padding:'0 10px'}}>
      <motion.div 
        drag="x" 
        dragConstraints={{ left: 0, right: 100 }} 
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{
          display:'flex', 
          flexDirection: isOwn ? 'row-reverse' : 'row', 
          alignItems: 'flex-end', 
          gap:'8px',
          touchAction: 'pan-y' 
        }}
      >
        {!isOwn && (
          <div style={{flexShrink: 0, paddingBottom: '4px'}}>
             {senderInfo.photo ? 
              <img src={senderInfo.photo} style={bubbleStyles.msgAvatar} alt=""/> : 
              <div style={bubbleStyles.msgAvatarPlaceholder}>{senderInfo.prenom?.[0]}</div>
             }
          </div>
        )}
        
        <div style={{position:'relative', maxWidth:'80%', display:'flex', flexDirection:'column'}} ref={menuRef}>
          
          <div 
            style={isOwn ? bubbleStyles.messageOwn : bubbleStyles.messageOther}
            onContextMenu={(e) => { e.preventDefault(); if(!message.isDeletedForAll) setShowMenu(!showMenu); }}
          >
            {isGroup && !isOwn && <div style={{fontSize:'0.7rem', fontWeight:'bold', color:'#2563eb', marginBottom:'2px'}}>{senderInfo.prenom}</div>}
            
            {message.replyTo && !message.isDeletedForAll && (
              <div style={{
                backgroundColor: isOwn ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)',
                borderLeft: `3px solid ${isOwn ? 'rgba(255,255,255,0.7)' : '#2563eb'}`,
                padding: '6px 10px',
                borderRadius: '6px',
                marginBottom: '8px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <span style={{fontSize: '0.75rem', fontWeight: 'bold', color: isOwn ? 'white' : '#2563eb', opacity: 0.9}}>
                  {message.replyTo.senderName}
                </span>
                <span style={{fontSize: '0.8rem', color: isOwn ? 'rgba(255,255,255,0.9)' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%'}}>
                  {message.replyTo.text}
                </span>
              </div>
            )}

            {message.isDeletedForAll ? (
              <span style={{fontStyle:'italic', opacity:0.6, display:'flex', alignItems:'center', gap:'5px', color: isOwn ? 'rgba(255,255,255,0.7)' : '#64748b'}}>
                <EyeOff size={14}/> {t('message_deleted_tag')}
              </span>
            ) : (
              <span style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.4'}}>{message.text}</span>
            )}

            <div style={{
              fontSize:'0.65rem', opacity:0.7, marginTop:'4px', 
              textAlign:'right', display:'flex', justifyContent:'flex-end', gap:'4px', alignItems:'center'
            }}>
              {message.isEdited && !message.isDeletedForAll && <span>{t('edited_tag')}</span>}
              {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>

          {!message.isDeletedForAll && (
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="dots-trigger"
              style={{
                position: 'absolute', 
                top: '50%', 
                [isOwn ? 'left' : 'right']: '-25px', 
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', opacity: showMenu ? 1 : 0, transition: 'opacity 0.2s', color: '#94a3b8',
                zIndex: 10
              }}
            >
              <MoreVertical size={16} />
            </button>
          )}

          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  position: 'absolute', 
                  top: '100%', 
                  [isOwn ? 'right' : 'left']: 0, 
                  marginTop: '5px',
                  background: 'white', 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)', 
                  borderRadius: '12px', 
                  zIndex: 100, 
                  overflow: 'hidden', 
                  minWidth: '160px',
                  border: '1px solid #f1f5f9'
                }}
              >
                <button onClick={() => {onReply(message); setShowMenu(false)}} style={bubbleStyles.menuItem}><Reply size={14} color="#2563eb"/> {t('action_reply')}</button>
                {isOwn && (
                  <>
                    <button onClick={() => {onAction('edit', message); setShowMenu(false)}} style={bubbleStyles.menuItem}><Edit2 size={14} color="#2563eb"/> {t('action_edit')}</button>
                    <button onClick={() => {onAction('deleteAll', message); setShowMenu(false)}} style={bubbleStyles.menuItem}><Users size={14} color="#ef4444"/> {t('action_delete_all')}</button>
                  </>
                )}
                <button onClick={() => {onAction('deleteMe', message); setShowMenu(false)}} style={bubbleStyles.menuItem}><Trash2 size={14} color="#ef4444"/> {t('action_delete_me')}</button>
                <button onClick={() => {navigator.clipboard.writeText(message.text); setShowMenu(false)}} style={bubbleStyles.menuItem}><Copy size={14} color="#64748b"/> {t('action_copy')}</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
});

// --- INDICATEUR DE FRAPPE ANIMÉ ---
const TypingIndicator = () => (
  <div style={{ display: 'flex', gap: '4px', padding: '12px 16px', background: '#f1f5f9', borderRadius: '18px', width: 'fit-content', alignItems: 'center', marginBottom: '15px', marginLeft: '45px' }}>
    <motion.div animate={{y: [0, -5, 0]}} transition={{duration: 0.6, repeat: Infinity, delay: 0}} style={{width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%'}} />
    <motion.div animate={{y: [0, -5, 0]}} transition={{duration: 0.6, repeat: Infinity, delay: 0.2}} style={{width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%'}} />
    <motion.div animate={{y: [0, -5, 0]}} transition={{duration: 0.6, repeat: Infinity, delay: 0.4}} style={{width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%'}} />
  </div>
);

const bubbleStyles = {
  msgAvatar: { width:'32px', height:'32px', borderRadius:'50%', objectFit:'cover', border: '1px solid #e2e8f0' },
  msgAvatarPlaceholder: { width:'32px', height:'32px', borderRadius:'50%', background:'#cbd5e1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:'bold', color:'white' },
  messageOwn: { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', padding: '10px 14px', borderRadius: '18px 18px 4px 18px', boxShadow:'0 4px 10px rgba(37,99,235,0.2)', wordBreak: 'break-word', fontSize:'0.95rem', minWidth:'80px' },
  messageOther: { background: 'white', border:'1px solid #e2e8f0', color: '#1e293b', padding: '10px 14px', borderRadius: '18px 18px 18px 4px', boxShadow:'0 4px 10px rgba(0,0,0,0.03)', wordBreak: 'break-word', fontSize:'0.95rem', minWidth:'80px' },
  menuItem: { display:'flex', alignItems:'center', gap:'12px', width:'100%', padding:'12px 16px', textAlign:'left', background:'white', border:'none', cursor:'pointer', fontSize:'0.9rem', borderBottom:'1px solid #f8fafc', color:'#334155', transition: 'background 0.2s', fontWeight:'500' }
};

export default function ChatSystem({ user, token }) {
  const { t } = useTranslation(); // <-- NOUVEAU
  const currentUserId = user.id || user._id;

  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  
  // --- SAUVEGARDE EN MÉMOIRE POUR NE JAMAIS RIEN PERDRE AU CHANGEMENT D'ONGLET ---
  const [lastMessages, setLastMessages] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('chatLastMsgs')) || {}; } catch(e) { return {}; }
  });
  const [unreadMap, setUnreadMap] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('chatUnread')) || {}; } catch(e) { return {}; }
  });

  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null); 
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  // --- ÉTATS UX AVANCÉS ---
  const [searchTerm, setSearchTerm] = useState("");
  const [typingUsers, setTypingUsers] = useState({}); 
  const [onlineUsers, setOnlineUsers] = useState([]); 
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [unreadScrollCount, setUnreadScrollCount] = useState(0);

  const socket = useRef();
  const scrollRef = useRef();
  const chatBoxRef = useRef();
  const currentChatRef = useRef(currentChat);
  const conversationsRef = useRef(conversations);
  const inputRef = useRef(null); 
  const isScrolledUpRef = useRef(isScrolledUp);
  let typingTimeout = useRef(null);

  // Sauvegarde automatique des messages non lus et aperçus dans le navigateur
  useEffect(() => { sessionStorage.setItem('chatLastMsgs', JSON.stringify(lastMessages)); }, [lastMessages]);
  useEffect(() => { sessionStorage.setItem('chatUnread', JSON.stringify(unreadMap)); }, [unreadMap]);

  useEffect(() => { currentChatRef.current = currentChat; }, [currentChat]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { isScrolledUpRef.current = isScrolledUp; }, [isScrolledUp]);

  // --- FONCTIONS PUSH NOTIF ---
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function registerPush(token) {
    try {
      const baseURL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
      const resKey = await axios.get(`${baseURL}/api/vapid-public-key`);
      const publicVapidKey = resKey.data.publicKey;
      if (!publicVapidKey) return; 
      
      if ('serviceWorker' in navigator) {
        const register = await navigator.serviceWorker.register('/worker.js', { scope: '/' });
        let activeServiceWorker = register.active;
        if (!activeServiceWorker) {
            await new Promise((resolve) => {
                register.addEventListener('updatefound', () => {
                    const newWorker = register.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'activated') resolve();
                    });
                });
            });
        }
        let subscription = await register.pushManager.getSubscription();
        if (!subscription) {
            subscription = await register.pushManager.subscribe({
                userVisibleOnly: true, 
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });
        }
        await axios.post(`${baseURL}/api/subscribe`, subscription, { 
          headers: { 'content-type': 'application/json', 'x-auth-token': token } 
        });
      }
    } catch (err) { console.error('Push Error:', err); }
  }

  useEffect(() => { if (token) registerPush(token); }, [token]);

  // --- SOCKET.IO ---
  useEffect(() => {
    const SERVER_URL = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:5000';
    socket.current = io(SERVER_URL);
    
    socket.current.on("getUsers", (users) => {
      const activeIds = users.map(u => u.userId || u);
      setOnlineUsers(activeIds);
    });

    socket.current.on("getMessage", async (data) => {
      setLastMessages(prev => ({ ...prev, [data.conversationId]: data.text }));
      
      if (currentChatRef.current?._id === data.conversationId) {
        setMessages((prev) => [...prev, {
          _id: data.messageId, sender: data.senderId, text: data.text, createdAt: data.createdAt,
          conversationId: data.conversationId, readBy: [], deletedFor: [], isDeletedForAll: false,
          replyTo: data.replyTo 
        }]);

        setTypingUsers(prev => ({ ...prev, [data.conversationId]: false }));

        if (isScrolledUpRef.current && data.senderId !== currentUserId) {
          setUnreadScrollCount(prev => prev + 1);
        } else {
          setTimeout(() => scrollToBottom(), 100);
        }

        const receivers = currentChatRef.current.members.filter(m => String(m) !== String(currentUserId));
        socket.current.emit("markRead", { conversationId: data.conversationId, readerId: currentUserId, receivers });
        await axios.put(`/api/chat/message/read/${data.conversationId}`, { userId: currentUserId });
      } else {
        setUnreadMap(prev => ({ ...prev, [data.conversationId]: (prev[data.conversationId] || 0) + 1 }));
      }

      const currentConvs = conversationsRef.current;
      const existingConvIndex = currentConvs.findIndex(c => c._id === data.conversationId);
      if (existingConvIndex !== -1) {
        const updatedConv = { ...currentConvs[existingConvIndex], updatedAt: Date.now() };
        const newConvs = [...currentConvs];
        newConvs.splice(existingConvIndex, 1);
        newConvs.unshift(updatedConv);
        setConversations(newConvs);
      } else {
        try {
          const res = await axios.get("/api/chat/find/" + data.conversationId);
          setConversations(prev => [res.data, ...prev]);
          setUnreadMap(prev => ({ ...prev, [data.conversationId]: 1 }));
        } catch(err) { console.error(err); }
      }
    });

    socket.current.on("messageEdited", (data) => {
      if (currentChatRef.current?._id === data.conversationId) {
        setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, text: data.text, isEdited: true } : m));
      }
      setLastMessages(prev => ({ ...prev, [data.conversationId]: data.text }));
    });

    socket.current.on("messageDeleted", (data) => {
      if (currentChatRef.current?._id === data.conversationId) {
        setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, isDeletedForAll: true, text: "Message supprimé" } : m)); // Le 't' sera appliqué à l'affichage
      }
      setLastMessages(prev => ({ ...prev, [data.conversationId]: "Message supprimé" }));
    });

    // Écoute du typing
    socket.current.on("typing", ({ conversationId, senderId }) => {
      if (senderId !== currentUserId) {
        setTypingUsers(prev => ({ ...prev, [conversationId]: true }));
      }
    });

    socket.current.on("stopTyping", ({ conversationId, senderId }) => {
      if (senderId !== currentUserId) {
        setTypingUsers(prev => ({ ...prev, [conversationId]: false }));
      }
    });

    socket.current.emit("addUser", currentUserId);
    return () => { socket.current.disconnect(); }
  }, [currentUserId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUserId) return;
      try {
        const [resConv, resUsers] = await Promise.all([
          axios.get("/api/chat/conversation/" + currentUserId),
          axios.get("/api/users/all", { headers: { 'x-auth-token': token } })
        ]);
        setConversations(resConv.data);
        setAllUsers(resUsers.data);
      } catch (err) { console.error("Erreur chargement données:", err); }
    };
    fetchData();
  }, [currentUserId, token]);

  // --- LE RÉCUPÉRATEUR SILENCIEUX DE MESSAGES ---
  useEffect(() => {
    if (conversations.length === 0) return;
    conversations.forEach(async (c) => {
      if (!lastMessages[c._id] && !c.lastMessage && !c.latestMessage) {
        try {
          const res = await axios.get(`/api/chat/message/${c._id}`);
          if (res.data && res.data.length > 0) {
            const text = res.data[res.data.length - 1].text;
            setLastMessages(prev => {
              if (prev[c._id]) return prev; 
              return { ...prev, [c._id]: text };
            });
          } else {
            setLastMessages(prev => ({ ...prev, [c._id]: t('new_conversation') })); 
          }
        } catch(err) {}
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, t]);

  useEffect(() => {
    const getMessages = async () => {
      if(currentChat) {
        try {
          const res = await axios.get("/api/chat/message/" + currentChat._id);
          setMessages(res.data);
          setShowEmoji(false);
          setEditingMessage(null);
          setReplyingTo(null);
          setIsScrolledUp(false);
          setUnreadScrollCount(0);
          
          // Supprimer le badge de non-lus
          setUnreadMap(prev => { const newMap = { ...prev }; delete newMap[currentChat._id]; return newMap; });
          await axios.put(`/api/chat/message/read/${currentChat._id}`, { userId: currentUserId });
          
          // Mettre à jour le dernier message vu si on a chargé l'historique
          if (res.data.length > 0) {
            setLastMessages(prev => ({ ...prev, [currentChat._id]: res.data[res.data.length - 1].text }));
          }

          setTimeout(() => scrollToBottom(), 100);
        } catch (err) { console.log(err); }
      }
    };
    getMessages();
  }, [currentChat, currentUserId]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsScrolledUp(false);
    setUnreadScrollCount(0);
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isUp = scrollHeight - scrollTop - clientHeight > 100;
    setIsScrolledUp(isUp);
    if (!isUp) setUnreadScrollCount(0);
  };

  // --- GESTION INPUT & TYPING ---
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (currentChat) {
      const receivers = currentChat.members.filter(m => String(m) !== String(currentUserId));
      const receiverId = receivers[0]; 
      
      socket.current.emit("typing", { conversationId: currentChat._id, senderId: currentUserId, receiverId, receivers });
      
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.current.emit("stopTyping", { conversationId: currentChat._id, senderId: currentUserId, receiverId, receivers });
      }, 2500);
    }
  };

  const handleEmojiClick = (emojiObject) => setNewMessage(prev => prev + emojiObject.emoji);

  const getSenderInfo = useCallback((senderId) => {
    return allUsers.find(u => u._id === senderId) || { prenom: '...', photo: null };
  }, [allUsers]);

  const handleSubmit = async (e) => {
    if(e) e.preventDefault();
    if(!newMessage.trim()) return;

    const receivers = currentChat.members.filter(m => String(m) !== String(currentUserId));
    const receiverId = receivers[0];
    socket.current.emit("stopTyping", { conversationId: currentChat._id, senderId: currentUserId, receiverId, receivers });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    if (editingMessage) {
        try {
            const res = await axios.put(`/api/chat/message/edit/${editingMessage._id}`, { text: newMessage });
            setMessages(prev => prev.map(m => m._id === editingMessage._id ? res.data : m));
            socket.current.emit("editMessage", { messageId: editingMessage._id, text: newMessage, receivers, conversationId: currentChat._id });
            setLastMessages(prev => ({ ...prev, [currentChat._id]: newMessage }));
            setEditingMessage(null);
            setNewMessage("");
            toast.success(t('toast_edited'));
        } catch(err) { toast.error(t('toast_error')); }
        return;
    }

    let replyPayload = null;
    if (replyingTo) {
      const replyUser = getSenderInfo(replyingTo.sender);
      replyPayload = {
        id: replyingTo._id,
        text: replyingTo.text,
        senderName: replyUser ? `${replyUser.prenom} ${replyUser.nom}` : "Utilisateur"
      };
    }

    const messagePayload = { 
        sender: currentUserId, 
        text: newMessage, 
        conversationId: currentChat._id,
        replyTo: replyPayload 
    };

    try {
      const res = await axios.post("/api/chat/message", messagePayload);
      setMessages([...messages, res.data]);
      setNewMessage("");
      setShowEmoji(false);
      setReplyingTo(null); 
      setLastMessages(prev => ({ ...prev, [currentChat._id]: newMessage }));
      setTimeout(() => scrollToBottom(), 50);
      
      socket.current.emit("sendMessage", { 
        senderId: currentUserId, receivers, text: newMessage, 
        conversationId: currentChat._id, messageId: res.data._id,
        replyTo: replyPayload 
      });

      const otherConvs = conversations.filter(c => c._id !== currentChat._id);
      setConversations([{ ...currentChat, updatedAt: Date.now() }, ...otherConvs]);
    } catch (err) { console.log(err); }
  };

  const handleMessageAction = async (action, msg) => {
    if (action === 'deleteMe') {
        setMessages(prev => prev.filter(m => m._id !== msg._id));
        await axios.put(`/api/chat/message/delete/${msg._id}`, { userId: currentUserId, type: 'me' });
    }
    if (action === 'deleteAll') {
        const receivers = currentChat.members.filter(m => String(m) !== String(currentUserId));
        socket.current.emit("deleteMessage", { messageId: msg._id, receivers, conversationId: currentChat._id });
        setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, isDeletedForAll: true, text: t('message_deleted_tag') } : m));
        setLastMessages(prev => ({ ...prev, [currentChat._id]: t('message_deleted_tag') }));
        await axios.put(`/api/chat/message/delete/${msg._id}`, { userId: currentUserId, type: 'all' });
    }
    if (action === 'edit') {
        const diff = (Date.now() - new Date(msg.createdAt).getTime()) / 1000 / 60;
        if (diff > 15) { toast.error(t('toast_too_late_edit')); return; }
        setEditingMessage(msg);
        setNewMessage(msg.text);
        inputRef.current?.focus();
    }
  };

  const handleReply = (msg) => {
    setReplyingTo(msg);
    setEditingMessage(null);
    inputRef.current?.focus();
  };

  const startOneOnOne = async (targetId) => {
    const existing = conversations.find(c => !c.isGroup && c.members.some(m => String(m) === String(targetId)));
    if (existing) { setCurrentChat(existing); return; } 
    try {
      const res = await axios.post("/api/chat/conversation", { senderId: currentUserId, receiverId: targetId });
      const alreadyInList = conversations.find(c => c._id === res.data._id);
      if (!alreadyInList) setConversations(prev => [res.data, ...prev]);
      setCurrentChat(res.data);
    } catch(err) { console.log(err); }
  };

  const handleCreateGroup = async () => {
    if(!groupName || selectedMembers.length < 2) { toast.error(t('toast_group_req')); return; }
    const members = [currentUserId, ...selectedMembers];
    try {
      const res = await axios.post("/api/chat/conversation", { isGroup: true, name: groupName, admin: currentUserId, members });
      setConversations(prev => [res.data, ...prev]);
      setShowGroupModal(false); setGroupName(""); setSelectedMembers([]);
      toast.success(t('toast_group_created'));
    } catch(err) { toast.error(t('toast_create_error')); }
  };

  const handleDeleteChat = async () => {
    if(!currentChat || !window.confirm(t('confirm_delete_chat'))) return;
    try {
      await axios.delete(`/api/chat/conversation/${currentChat._id}`);
      setConversations(prev => prev.filter(c => c._id !== currentChat._id));
      setCurrentChat(null);
      toast.success(t('toast_deleted'));
    } catch (err) { toast.error(t('toast_error')); }
  };

  const toggleMemberSelection = (id) => {
    if(selectedMembers.includes(id)) setSelectedMembers(selectedMembers.filter(m => m !== id));
    else setSelectedMembers([...selectedMembers, id]);
  };

  const getChatInfo = useCallback((c) => {
    if (c.isGroup) return { name: c.name, photo: null, isGroup: true, id: c._id };
    const friendId = c.members.find((m) => String(m) !== String(currentUserId));
    const friend = allUsers.find((u) => u._id === friendId);
    if (!friend) return { name: "...", photo: null, isGroup: false, id: null };
    return { 
      name: `${friend.prenom} ${friend.nom}`, 
      photo: friend.photo, 
      isGroup: false, 
      id: friend._id,
      lastActive: friend.lastActive || friend.updatedAt 
    };
  }, [allUsers, currentUserId]);

  const quickContactsList = useMemo(() => {
    return allUsers.filter(u => u._id !== currentUserId).map(u => (
      <div key={u._id} onClick={() => startOneOnOne(u._id)} style={styles.quickContact} title={`${u.prenom} ${u.nom}`}>
          {u.photo ? <img src={u.photo} style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} alt=""/> : u.prenom[0]}
          {onlineUsers.includes(u._id) && <div style={styles.onlineBadgeSmall}></div>}
      </div>
    ));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUsers, currentUserId, onlineUsers]);

  const filteredConversations = conversations.filter(c => 
    getChatInfo(c).name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentChatInfo = currentChat ? getChatInfo(currentChat) : null;
  const isCurrentChatOnline = currentChatInfo && onlineUsers.includes(currentChatInfo.id);

  return (
    <div className="chat-container" style={styles.chatContainer}>
      
      {/* SIDEBAR */}
      <div className={`chat-menu ${currentChat ? 'mobile-hidden' : ''}`} style={styles.chatMenu}>
        
        <div style={styles.sidebarHeader}>
          <h3 style={{margin:0, fontSize: '1.4rem', fontWeight: '800', color: '#0f172a'}}>{t('messages_title')}</h3>
          {user.role === 'admin' && (
            <button onClick={() => setShowGroupModal(true)} style={styles.groupBtn} title={t('new_group_title')}><Users size={18}/></button>
          )}
        </div>

        {/* BARRE DE RECHERCHE */}
        <div style={{padding: '10px 15px'}}>
          <div style={{display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '12px', padding: '8px 12px'}}>
            <Search size={16} color="#94a3b8" style={{marginRight: '8px'}} />
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem'}}
            />
          </div>
        </div>

        <div style={{overflowY:'auto', flex:1, paddingRight: '5px'}} className="custom-scrollbar">
            {filteredConversations.length === 0 && <p style={{textAlign:'center', color:'#94a3b8', fontSize:'0.9rem', marginTop:'20px'}}>{t('no_results')}</p>}
            {filteredConversations.map((c) => {
              const info = getChatInfo(c);
              
              // Affichage parfait de l'aperçu du message
              let previewText = lastMessages[c._id] || c.lastMessage?.text || c.lastMessage || c.latestMessage?.text || t('new_conversation');
              if (previewText === "Message supprimé" || previewText === "Deleted message" || previewText === "تم حذف الرسالة") {
                 previewText = t('message_deleted_tag');
              }
              const unreadCount = unreadMap[c._id] || c.unreadCount || 0;
              const isOnline = onlineUsers.includes(info.id);

              return (
                <div key={c._id} onClick={() => setCurrentChat(c)} className="conversation-item" style={{...styles.conversation, background: currentChat?._id === c._id ? '#eef2ff' : 'transparent', borderLeft: currentChat?._id === c._id ? '4px solid #2563eb' : '4px solid transparent'}}>
                    <div style={{position:'relative'}}>
                        {info.photo ? <img src={info.photo} style={styles.avatar} alt=""/> : 
                        <div style={styles.avatarPlaceholder}>{info.isGroup ? <Users size={18}/> : info.name[0]}</div>
                        }
                        {!info.isGroup && isOnline && <div style={styles.onlineBadge}></div>}
                        {unreadCount > 0 && <div style={styles.unreadDot}>{unreadCount}</div>}
                    </div>
                    <div style={{flex:1, overflow:'hidden'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2px'}}>
                          <div style={{fontWeight: unreadCount > 0 ? '700' : '600', fontSize:'0.95rem', color: '#1e293b'}}>{info.name}</div>
                        </div>
                        <div style={{
                            fontSize:'0.8rem', color: unreadCount > 0 || typingUsers[c._id] ? '#3b82f6' : '#64748b', 
                            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight: unreadCount > 0 ? '600' : 'normal'
                        }}>
                            {typingUsers[c._id] ? <span style={{fontStyle:'italic'}}>{t('typing')}</span> : previewText}
                        </div>
                    </div>
                </div>
              );
            })}
        </div>
        
        <div style={{padding:'15px', borderTop:'1px solid #f1f5f9', background: '#fafafa'}}>
            <small style={{color:'#64748b', fontWeight:'700', textTransform:'uppercase', fontSize:'0.7rem', display:'block', marginBottom:'10px', letterSpacing:'0.5px'}}>{t('start_chatting')}</small>
            <div style={{display:'flex', gap:'12px', overflowX:'auto', paddingBottom:'5px'}} className="custom-scrollbar-x">
                {quickContactsList}
            </div>
        </div>
      </div>

      {/* CHAT BOX */}
      <div className={`chat-box ${!currentChat ? 'mobile-hidden' : ''}`} style={styles.chatBox}>
        {currentChat ? (
          <>
            <div style={styles.chatHeader}>
                <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                  <button onClick={() => setCurrentChat(null)} style={styles.backBtn}><ArrowLeft size={20}/></button>
                  
                  <div style={{position: 'relative'}}>
                    {currentChatInfo.photo ? 
                      <img src={currentChatInfo.photo} style={{width:'42px', height:'42px', borderRadius:'50%', objectFit:'cover', border:'2px solid #eff6ff'}} alt=""/> 
                      : <div style={{width:'42px', height:'42px', borderRadius:'50%', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontWeight:'bold'}}>{currentChatInfo.isGroup ? <Users size={20}/> : currentChatInfo.name[0]}</div>
                    }
                    {!currentChatInfo.isGroup && isCurrentChatOnline && <div style={styles.onlineBadge}></div>}
                  </div>

                  <div>
                    <span style={{fontWeight:'800', fontSize:'1.1rem', color:'#0f172a', display:'block'}}>{currentChatInfo.name}</span>
                    
                    <span style={{fontSize:'0.75rem', fontWeight: '500', color: typingUsers[currentChat._id] ? '#2563eb' : isCurrentChatOnline ? '#10b981' : '#94a3b8'}}>
                      {currentChat.isGroup 
                        ? `${currentChat.members.length} ${t('members_count')}` 
                        : typingUsers[currentChat._id]
                          ? t('typing')
                          : isCurrentChatOnline
                            ? t('online')
                            : formatLastSeen(currentChatInfo.lastActive, t)
                      }
                    </span>
                  </div>
                </div>
                <button onClick={handleDeleteChat} style={styles.deleteChatBtn} title="Supprimer la conversation"><Trash2 size={18} color="#ef4444" /></button>
            </div>
            
            <div style={styles.chatBoxTop} onScroll={handleScroll} ref={chatBoxRef}>
              
              {(() => {
                let lastDate = null;
                return messages.filter(m => !(m.deletedFor || []).includes(currentUserId)).map((m, i) => {
                  const currentDate = new Date(m.createdAt).toDateString();
                  const showDate = currentDate !== lastDate;
                  lastDate = currentDate;

                  return (
                    <React.Fragment key={m._id || i}>
                      {showDate && (
                        <div style={{display:'flex', justifyContent:'center', margin:'20px 0'}}>
                          <span style={{background:'rgba(0,0,0,0.05)', color:'#64748b', fontSize:'0.75rem', fontWeight:'bold', padding:'6px 12px', borderRadius:'20px', textTransform:'capitalize'}}>
                            {formatDateSeparator(m.createdAt, t)}
                          </span>
                        </div>
                      )}
                      
                      <MessageBubble 
                        message={m} isOwn={m.sender === currentUserId} senderInfo={getSenderInfo(m.sender)} 
                        isGroup={currentChat.isGroup} onAction={handleMessageAction} onReply={handleReply} t={t}
                      />
                    </React.Fragment>
                  );
                });
              })()}

              {typingUsers[currentChat._id] && <TypingIndicator />}
              <div ref={scrollRef}></div>
            </div>
            
            <AnimatePresence>
              {unreadScrollCount > 0 && (
                <motion.button 
                  initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 20}}
                  onClick={scrollToBottom}
                  style={{position:'absolute', bottom:'85px', right:'20px', background:'#2563eb', color:'white', border:'none', padding:'10px 15px', borderRadius:'25px', display:'flex', alignItems:'center', gap:'8px', fontWeight:'bold', fontSize:'0.85rem', boxShadow:'0 4px 15px rgba(37,99,235,0.4)', cursor:'pointer', zIndex:50}}
                >
                  <ChevronDown size={16} /> {unreadScrollCount} {t('new_messages_count')}
                </motion.button>
              )}
            </AnimatePresence>

            <div style={{...styles.chatBoxBottom, flexDirection:'column', alignItems:'stretch', padding:'0'}}>
              
              {replyingTo && (
                <motion.div 
                  initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}}
                  style={{background:'#f8fafc', padding:'10px 15px', borderLeft:'4px solid #2563eb', display:'flex', justifyContent:'space-between', alignItems:'center', margin:'10px 10px 0 10px', borderRadius:'8px'}}
                >
                  <div style={{fontSize:'0.85rem', color:'#334155', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'90%'}}>
                    <strong style={{color:'#2563eb', display:'block', fontSize:'0.75rem', marginBottom:'2px'}}>{t('replying_to')}</strong>
                    {replyingTo.text}
                  </div>
                  <button onClick={() => setReplyingTo(null)} style={{background:'none', border:'none', cursor:'pointer', color:'#94a3b8'}}><X size={18}/></button>
                </motion.div>
              )}

              <div style={{display:'flex', alignItems:'center', gap:'10px', padding:'15px', width:'100%'}}>
                {showEmoji && (
                  <div style={styles.emojiPickerContainer}>
                    <EmojiPicker onEmojiClick={handleEmojiClick} width={320} height={400} theme="light" />
                  </div>
                )}
                <button onClick={() => setShowEmoji(!showEmoji)} style={{...styles.iconBtn, color: showEmoji ? '#2563eb' : '#94a3b8'}}>
                  <Smile size={26}/>
                </button>
                <input 
                  ref={inputRef}
                  style={styles.chatInput} 
                  placeholder={editingMessage ? t('edit_message_placeholder') : t('type_message_placeholder')} 
                  onChange={handleInputChange} value={newMessage}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)} onFocus={() => setShowEmoji(false)} 
                />
                {editingMessage && <button onClick={() => { setEditingMessage(null); setNewMessage(""); }} style={{...styles.iconBtn, color:'#ef4444'}}><X size={24}/></button>}
                <button style={{...styles.chatSubmit, background: newMessage.trim() || editingMessage ? '#2563eb' : '#cbd5e1'}} onClick={handleSubmit} disabled={!newMessage.trim() && !editingMessage}>
                  {editingMessage ? <Edit2 size={18}/> : <Send size={20} style={{marginLeft:'2px'}}/>}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={styles.noChat}>
            <div style={{width:'80px', height:'80px', borderRadius:'50%', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'20px'}}>
              <Users size={40} color="#2563eb" />
            </div>
            <h3 style={{color:'#1e293b', fontSize:'1.5rem', margin:'0 0 10px 0'}}>{t('welcome_chat')}</h3>
            <p style={{color:'#64748b', margin:0}}>{t('select_conversation_prompt')}</p>
          </div>
        )}
      </div>

      {showGroupModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
              <h3>{t('new_group_modal_title')}</h3>
              <button onClick={() => setShowGroupModal(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X size={20}/></button>
            </div>
            <input style={styles.modalInput} placeholder={t('group_name_placeholder')} value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            <div style={{maxHeight:'200px', overflowY:'auto', margin:'15px 0', border:'1px solid #eee', borderRadius:'8px'}}>
              {allUsers.filter(u => u._id !== currentUserId).map(u => (
                <div key={u._id} onClick={() => toggleMemberSelection(u._id)} style={{padding:'10px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', background: selectedMembers.includes(u._id) ? '#eff6ff' : 'white'}}>
                  <div style={{width:'20px', height:'20px', borderRadius:'50%', border:'1px solid #ccc', background: selectedMembers.includes(u._id) ? '#2563eb' : 'white'}}></div>
                  {u.photo ? <img src={u.photo} style={{width:'30px', height:'30px', borderRadius:'50%', objectFit:'cover'}} alt=""/> : <b>{u.prenom[0]}</b>}
                  <span>{u.prenom} {u.nom}</span>
                </div>
              ))}
            </div>
            <button onClick={handleCreateGroup} style={styles.createBtn}>{t('create_group_btn')}</button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .chat-container { height: 88vh !important; border-radius: 0 !important; border: none !important; }
          .mobile-hidden { display: none !important; }
          .chat-menu { width: 100% !important; border-right: none !important; }
          .chat-box { width: 100% !important; }
        }
        @media (min-width: 769px) {
          .backBtn { display: none !important; }
        }
        .dots-trigger:hover { opacity: 1 !important; color: #334155 !important; }
        .message-row:hover .dots-trigger { opacity: 0.8; } 
        .conversation-item:hover { background-color: #f8fafc !important; }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        .custom-scrollbar-x::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar-x::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-x::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}

const styles = {
  chatContainer: { display: 'flex', height: '80vh', background: 'white', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', overflow: 'hidden', border:'1px solid #e2e8f0', maxWidth: '1400px', margin: '0 auto' },
  chatMenu: { flex: '1', borderRight: '1px solid #e2e8f0', display:'flex', flexDirection:'column', minWidth:'320px', maxWidth:'400px', background: 'white' },
  chatBox: { flex: '2.5', display: 'flex', flexDirection: 'column', position: 'relative', background: '#f8fafc' },
  sidebarHeader: { padding:'20px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  conversation: { display: 'flex', alignItems: 'center', padding: '15px 20px', cursor: 'pointer', gap: '15px', transition: 'background-color 0.2s', borderBottom:'1px solid #f8fafc' },
  avatar: { width: '50px', height: '50px', borderRadius: '50%', objectFit:'cover', border:'1px solid #e2e8f0', flexShrink: 0 },
  avatarPlaceholder: { width: '50px', height: '50px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color:'#2563eb', fontWeight:'bold', flexShrink: 0, fontSize: '1.2rem' },
  unreadDot: { position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '22px', height: '22px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', fontWeight:'bold', boxShadow:'0 2px 5px rgba(239, 68, 68, 0.4)', zIndex: 5 },
  onlineBadge: { position: 'absolute', bottom: '0px', right: '0px', width: '14px', height: '14px', background: '#10b981', border: '2.5px solid white', borderRadius: '50%', zIndex: 5 },
  onlineBadgeSmall: { position: 'absolute', bottom: '0px', right: '0px', width: '12px', height: '12px', background: '#10b981', border: '2px solid white', borderRadius: '50%', zIndex: 5 },
  chatBoxTop: { flex: '1', padding: '20px', overflowY: 'auto', background: '#f8fafc', position: 'relative' },
  chatBoxBottom: { padding: '15px', display: 'flex', alignItems: 'center', background: 'white', borderTop: '1px solid #e2e8f0', position: 'relative', gap:'10px' },
  chatInput: { width: '100%', padding: '14px 20px', borderRadius: '30px', border: '1px solid #e2e8f0', height: '50px', outline: 'none', fontFamily:'inherit', background:'#f1f5f9', fontSize: '0.95rem', transition: 'border-color 0.2s' },
  chatSubmit: { width: '48px', height: '48px', borderRadius: '50%', border: 'none', color: 'white', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition: 'background-color 0.2s' },
  iconBtn: { background:'none', border:'none', cursor:'pointer', padding:'8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' },
  emojiPickerContainer: { position: 'absolute', bottom: '80px', left: '15px', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', borderRadius: '8px' },
  noChat: { flex: 1, display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', background: 'white' },
  chatHeader: { padding:'15px 25px', borderBottom:'1px solid #e2e8f0', background:'white', display:'flex', alignItems:'center', justifyContent:'space-between', height:'75px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', zIndex: 10 },
  quickContact: { width:'50px', height:'50px', borderRadius:'50%', background:'white', color:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'1rem', cursor:'pointer', flexShrink:0, border:'2px solid #e2e8f0', boxShadow:'0 2px 5px rgba(0,0,0,0.02)', transition: 'transform 0.2s', position: 'relative' },
  backBtn: { background:'none', border:'none', cursor:'pointer', padding:'8px', display:'block', color: '#64748b' }, 
  groupBtn: { background: '#eff6ff', color: '#2563eb', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', transition: 'background-color 0.2s' },
  deleteChatBtn: { background: '#fef2f2', border: 'none', borderRadius: '12px', padding: '10px', cursor: 'pointer', transition: 'background-color 0.2s' },
  modalOverlay: { position: 'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 },
  modalContent: { background: 'white', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '450px', boxShadow: '0 25px 50px rgba(0,0,0,0.15)' },
  modalInput: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px', fontSize: '1rem', outline: 'none' },
  createBtn: { width: '100%', padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }
};