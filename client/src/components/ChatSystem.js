import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { io } from "socket.io-client";
import { Send, User, Users, ArrowLeft, X, Trash2, Smile, MoreVertical, Edit2, EyeOff, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';

const MessageBubble = React.memo(({ message, isOwn, senderInfo, isGroup, onAction }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
      className="message-row"
      style={{
        display:'flex', 
        flexDirection: isOwn ? 'row-reverse' : 'row', 
        marginBottom:'8px', 
        alignItems: 'flex-end', 
        gap:'8px',
        padding: '0 10px'
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
      
      <div style={{position:'relative', maxWidth:'75%'}} ref={menuRef}>
        <div 
          style={isOwn ? bubbleStyles.messageOwn : bubbleStyles.messageOther}
          onContextMenu={(e) => { e.preventDefault(); if(!message.isDeletedForAll) setShowMenu(!showMenu); }}
        >
          {isGroup && !isOwn && <div style={{fontSize:'0.7rem', fontWeight:'bold', color:'#2563eb', marginBottom:'2px'}}>{senderInfo.prenom}</div>}
          
          {message.isDeletedForAll ? (
            <span style={{fontStyle:'italic', opacity:0.6, display:'flex', alignItems:'center', gap:'5px', color: isOwn ? 'rgba(255,255,255,0.7)' : '#64748b'}}>
              <EyeOff size={14}/> Message supprimé
            </span>
          ) : (
            <span style={{whiteSpace: 'pre-wrap'}}>{message.text}</span>
          )}

          <div style={{
            fontSize:'0.65rem', opacity:0.7, marginTop:'4px', 
            textAlign:'right', display:'flex', justifyContent:'flex-end', gap:'4px', alignItems:'center'
          }}>
            {message.isEdited && !message.isDeletedForAll && <span>(modifié)</span>}
            {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>

        {!message.isDeletedForAll && (
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="dots-trigger"
            style={{
              position: 'absolute', top: '50%', [isOwn ? 'left' : 'right']: '-25px', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', opacity: showMenu ? 1 : 0, transition: 'opacity 0.2s', color: '#94a3b8'
            }}
          >
            <MoreVertical size={16} />
          </button>
        )}

        <AnimatePresence>
          {showMenu && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, x: isOwn ? -10 : 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                position: 'absolute', top: 0, [isOwn ? 'right' : 'left']: '100%', margin: '0 8px',
                background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', borderRadius: '12px', zIndex: 100, 
                overflow: 'hidden', minWidth: '160px', border: '1px solid #f1f5f9'
              }}
            >
              {isOwn && (
                <>
                  <button onClick={() => {onAction('edit', message); setShowMenu(false)}} style={bubbleStyles.menuItem}><Edit2 size={14} color="#2563eb"/> Modifier</button>
                  <button onClick={() => {onAction('deleteAll', message); setShowMenu(false)}} style={bubbleStyles.menuItem}><Users size={14} color="#ef4444"/> Suppr. pour tous</button>
                </>
              )}
              <button onClick={() => {onAction('deleteMe', message); setShowMenu(false)}} style={bubbleStyles.menuItem}><Trash2 size={14} color="#ef4444"/> Suppr. pour moi</button>
              <button onClick={() => {navigator.clipboard.writeText(message.text); setShowMenu(false)}} style={bubbleStyles.menuItem}><Copy size={14} color="#64748b"/> Copier</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

const bubbleStyles = {
  msgAvatar: { width:'28px', height:'28px', borderRadius:'50%', objectFit:'cover' },
  msgAvatarPlaceholder: { width:'28px', height:'28px', borderRadius:'50%', background:'#cbd5e1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:'bold', color:'white' },
  messageOwn: { background: '#2563eb', color: 'white', padding: '8px 14px', borderRadius: '18px 18px 4px 18px', boxShadow:'0 2px 5px rgba(37,99,235,0.2)', wordBreak: 'break-word', fontSize:'0.95rem', minWidth:'80px' },
  messageOther: { background: 'white', border:'1px solid #e2e8f0', color: '#1e293b', padding: '8px 14px', borderRadius: '18px 18px 18px 4px', boxShadow:'0 2px 5px rgba(0,0,0,0.03)', wordBreak: 'break-word', fontSize:'0.95rem', minWidth:'80px' },
  menuItem: { display:'flex', alignItems:'center', gap:'10px', width:'100%', padding:'10px 14px', textAlign:'left', background:'white', border:'none', cursor:'pointer', fontSize:'0.85rem', borderBottom:'1px solid #f8fafc', color:'#334155', transition: '0.2s', fontWeight:'500' }
};

export default function ChatSystem({ user, token }) {
  const currentUserId = user.id || user._id;

  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  
  const [unreadMap, setUnreadMap] = useState({}); 
  const [lastMessages, setLastMessages] = useState({}); 

  const [editingMessage, setEditingMessage] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  const socket = useRef();
  const scrollRef = useRef();
  const currentChatRef = useRef(currentChat);
  const conversationsRef = useRef(conversations);

  useEffect(() => { currentChatRef.current = currentChat; }, [currentChat]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  // --- SOCKET CORRIGÉ POUR LA PRODUCTION ---
  useEffect(() => {
    // 1. DÉTECTION AUTOMATIQUE DU SERVEUR
    // Si on est en production (build), on utilise "/" (le site actuel)
    // Si on est en dev, on utilise "http://localhost:5000"
    const SERVER_URL = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:5000';

    socket.current = io(SERVER_URL);
    
    socket.current.on("getMessage", async (data) => {
      setLastMessages(prev => ({ ...prev, [data.conversationId]: data.text }));

      if (currentChatRef.current?._id === data.conversationId) {
        setMessages((prev) => [...prev, {
          _id: data.messageId, 
          sender: data.senderId,
          text: data.text,
          createdAt: data.createdAt,
          conversationId: data.conversationId,
          readBy: [], deletedFor: [], isDeletedForAll: false
        }]);
        
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
        setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, isDeletedForAll: true, text: "Message supprimé" } : m));
      }
      setLastMessages(prev => ({ ...prev, [data.conversationId]: "Message supprimé" }));
    });

    socket.current.emit("addUser", currentUserId);
    return () => { socket.current.disconnect(); }
  }, [currentUserId]); 

  // --- DATA LOADING ---
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

  // --- OPEN CHAT ---
  useEffect(() => {
    const getMessages = async () => {
      if(currentChat) {
        try {
          const res = await axios.get("/api/chat/message/" + currentChat._id);
          setMessages(res.data);
          setShowEmoji(false);
          setEditingMessage(null);
          
          setUnreadMap(prev => { const newMap = { ...prev }; delete newMap[currentChat._id]; return newMap; });
          await axios.put(`/api/chat/message/read/${currentChat._id}`, { userId: currentUserId });
          
        } catch (err) { console.log(err); }
      }
    };
    getMessages();
  }, [currentChat, currentUserId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  // --- ACTIONS ---
  const handleEmojiClick = (emojiObject) => setNewMessage(prev => prev + emojiObject.emoji);

  const handleSubmit = async (e) => {
    if(e) e.preventDefault();
    if(!newMessage.trim()) return;

    const receivers = currentChat.members.filter(m => String(m) !== String(currentUserId));

    if (editingMessage) {
        try {
            const res = await axios.put(`/api/chat/message/edit/${editingMessage._id}`, { text: newMessage });
            setMessages(prev => prev.map(m => m._id === editingMessage._id ? res.data : m));
            socket.current.emit("editMessage", { messageId: editingMessage._id, text: newMessage, receivers, conversationId: currentChat._id });
            setLastMessages(prev => ({ ...prev, [currentChat._id]: newMessage }));
            setEditingMessage(null);
            setNewMessage("");
            toast.success("Modifié");
        } catch(err) { toast.error("Erreur"); }
        return;
    }

    const messagePayload = { sender: currentUserId, text: newMessage, conversationId: currentChat._id };
    try {
      const res = await axios.post("/api/chat/message", messagePayload);
      setMessages([...messages, res.data]);
      setNewMessage("");
      setShowEmoji(false);
      setLastMessages(prev => ({ ...prev, [currentChat._id]: newMessage }));
      
      socket.current.emit("sendMessage", { 
        senderId: currentUserId, receivers, text: newMessage, 
        conversationId: currentChat._id, messageId: res.data._id 
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
        setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, isDeletedForAll: true, text: "Message supprimé" } : m));
        setLastMessages(prev => ({ ...prev, [currentChat._id]: "Message supprimé" }));
        await axios.put(`/api/chat/message/delete/${msg._id}`, { userId: currentUserId, type: 'all' });
    }
    if (action === 'edit') {
        const diff = (Date.now() - new Date(msg.createdAt).getTime()) / 1000 / 60;
        if (diff > 15) { toast.error("Trop tard pour modifier (>15min)"); return; }
        setEditingMessage(msg);
        setNewMessage(msg.text);
    }
  };

  const startOneOnOne = async (targetId) => {
    const existing = conversations.find(c => !c.isGroup && c.members.some(m => String(m) === String(targetId)));
    if (existing) {
      setCurrentChat(existing);
      return; 
    } 
    
    try {
      const res = await axios.post("/api/chat/conversation", { senderId: currentUserId, receiverId: targetId });
      const alreadyInList = conversations.find(c => c._id === res.data._id);
      if (!alreadyInList) setConversations(prev => [res.data, ...prev]);
      setCurrentChat(res.data);
    } catch(err) { console.log(err); }
  };

  const handleCreateGroup = async () => {
    if(!groupName || selectedMembers.length < 2) { toast.error("Nom et 2 membres min requis"); return; }
    const members = [currentUserId, ...selectedMembers];
    try {
      const res = await axios.post("/api/chat/conversation", { isGroup: true, name: groupName, admin: currentUserId, members });
      setConversations(prev => [res.data, ...prev]);
      setShowGroupModal(false); setGroupName(""); setSelectedMembers([]);
      toast.success("Groupe créé !");
    } catch(err) { toast.error("Erreur création"); }
  };

  const handleDeleteChat = async () => {
    if(!currentChat || !window.confirm("Supprimer cette conversation ?")) return;
    try {
      await axios.delete(`/api/chat/conversation/${currentChat._id}`);
      setConversations(prev => prev.filter(c => c._id !== currentChat._id));
      setCurrentChat(null);
      toast.success("Supprimé");
    } catch (err) { toast.error("Erreur"); }
  };

  const toggleMemberSelection = (id) => {
    if(selectedMembers.includes(id)) setSelectedMembers(selectedMembers.filter(m => m !== id));
    else setSelectedMembers([...selectedMembers, id]);
  };

  const getChatInfo = useCallback((c) => {
    if (c.isGroup) return { name: c.name, photo: null, isGroup: true };
    const friendId = c.members.find((m) => String(m) !== String(currentUserId));
    const friend = allUsers.find((u) => u._id === friendId);
    if (!friend) return { name: "Chargement...", photo: null, isGroup: false };
    return { name: `${friend.prenom} ${friend.nom}`, photo: friend.photo, isGroup: false };
  }, [allUsers, currentUserId]);

  const getSenderInfo = useCallback((senderId) => {
    return allUsers.find(u => u._id === senderId) || { prenom: '...', photo: null };
  }, [allUsers]);

  const quickContactsList = useMemo(() => {
    return allUsers.filter(u => u._id !== currentUserId).map(u => (
      <div key={u._id} onClick={() => startOneOnOne(u._id)} style={styles.quickContact} title={`${u.prenom} ${u.nom}`}>
          {u.photo ? <img src={u.photo} style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} alt=""/> : u.prenom[0]}
      </div>
    ));
  }, [allUsers, currentUserId, conversations]);

  return (
    <div className="chat-container" style={styles.chatContainer}>
      
      {/* SIDEBAR */}
      <div className={`chat-menu ${currentChat ? 'mobile-hidden' : ''}`} style={styles.chatMenu}>
        <div style={styles.sidebarHeader}>
          <h3 style={{margin:0}}>Discussions</h3>
          {user.role === 'admin' && (
            <button onClick={() => setShowGroupModal(true)} style={styles.groupBtn}><Users size={18}/></button>
          )}
        </div>

        <div style={{overflowY:'auto', flex:1}}>
            {conversations.map((c) => {
              const info = getChatInfo(c);
              const unread = unreadMap[c._id] || 0;
              const preview = lastMessages[c._id] || "Cliquez pour voir";

              return (
                <div key={c._id} onClick={() => setCurrentChat(c)} style={{...styles.conversation, background: currentChat?._id === c._id ? '#eef2ff' : 'transparent'}}>
                    <div style={{position:'relative'}}>
                        {info.photo ? <img src={info.photo} style={styles.avatar} alt=""/> : 
                        <div style={styles.avatarPlaceholder}>{info.isGroup ? <Users size={18}/> : info.name[0]}</div>
                        }
                        {unread > 0 && <div style={styles.unreadDot}>{unread}</div>}
                    </div>
                    <div style={{flex:1, overflow:'hidden'}}>
                        <div style={{fontWeight: unread > 0 ? 'bold' : '500', fontSize:'0.9rem', color: '#1e293b'}}>{info.name}</div>
                        <div style={{
                            fontSize:'0.75rem', color: unread > 0 ? '#334155' : '#94a3b8', 
                            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight: unread > 0 ? '600' : 'normal'
                        }}>
                            {preview}
                        </div>
                    </div>
                </div>
              );
            })}
        </div>
        
        <div style={{padding:'10px', borderTop:'1px solid #f1f5f9'}}>
            <small style={{color:'#94a3b8', fontWeight:'bold', display:'block', marginBottom:'5px'}}>Nouveau message :</small>
            <div style={{display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'5px'}}>
                {quickContactsList}
            </div>
        </div>
      </div>

      {/* CHAT BOX */}
      <div className={`chat-box ${!currentChat ? 'mobile-hidden' : ''}`} style={styles.chatBox}>
        {currentChat ? (
          <>
            <div style={styles.chatHeader}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <button onClick={() => setCurrentChat(null)} style={styles.backBtn}><ArrowLeft size={20}/></button>
                  {getChatInfo(currentChat).photo ? 
                    <img src={getChatInfo(currentChat).photo} style={{width:'32px', height:'32px', borderRadius:'50%'}} alt=""/> 
                    : null
                  }
                  <span style={{fontWeight:'bold', fontSize:'1.1rem'}}>{getChatInfo(currentChat).name}</span>
                </div>
                <button onClick={handleDeleteChat} style={styles.deleteChatBtn}><Trash2 size={18} color="#ef4444" /></button>
            </div>
            
            <div style={styles.chatBoxTop}>
              {messages.filter(m => !(m.deletedFor || []).includes(currentUserId)).map((m, i) => (
                <MessageBubble 
                  key={i} message={m} isOwn={m.sender === currentUserId} senderInfo={getSenderInfo(m.sender)} 
                  isGroup={currentChat.isGroup} onAction={handleMessageAction}
                />
              ))}
              <div ref={scrollRef}></div>
            </div>
            
            <div style={styles.chatBoxBottom}>
              {showEmoji && (
                <div style={styles.emojiPickerContainer}>
                  <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} />
                </div>
              )}
              <button onClick={() => setShowEmoji(!showEmoji)} style={{...styles.iconBtn, color: showEmoji ? '#2563eb' : '#94a3b8'}}>
                <Smile size={24}/>
              </button>
              <input 
                style={styles.chatInput} 
                placeholder={editingMessage ? "Modifier..." : "Écrivez un message..."} 
                onChange={(e) => setNewMessage(e.target.value)} value={newMessage}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)} onFocus={() => setShowEmoji(false)} 
              />
              {editingMessage && <button onClick={() => { setEditingMessage(null); setNewMessage(""); }} style={{...styles.iconBtn, color:'red'}}><X size={20}/></button>}
              <button style={styles.chatSubmit} onClick={handleSubmit}>{editingMessage ? <Edit2 size={18}/> : <Send size={20}/>}</button>
            </div>
          </>
        ) : (
          <div style={styles.noChat}>
            <div style={{fontSize:'4rem', marginBottom:'10px'}}>💬</div>
            <p style={{color:'#94a3b8'}}>Sélectionnez une conversation</p>
          </div>
        )}
      </div>

      {/* MODAL GROUPE */}
      {showGroupModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
              <h3>Nouveau Groupe</h3>
              <button onClick={() => setShowGroupModal(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X size={20}/></button>
            </div>
            <input style={styles.modalInput} placeholder="Nom du groupe..." value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            <div style={{maxHeight:'200px', overflowY:'auto', margin:'15px 0', border:'1px solid #eee', borderRadius:'8px'}}>
              {allUsers.filter(u => u._id !== currentUserId).map(u => (
                <div key={u._id} onClick={() => toggleMemberSelection(u._id)} style={{padding:'10px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', background: selectedMembers.includes(u._id) ? '#eff6ff' : 'white'}}>
                  <div style={{width:'20px', height:'20px', borderRadius:'50%', border:'1px solid #ccc', background: selectedMembers.includes(u._id) ? '#2563eb' : 'white'}}></div>
                  {u.photo ? <img src={u.photo} style={{width:'30px', height:'30px', borderRadius:'50%', objectFit:'cover'}} alt=""/> : <b>{u.prenom[0]}</b>}
                  <span>{u.prenom} {u.nom}</span>
                </div>
              ))}
            </div>
            <button onClick={handleCreateGroup} style={styles.createBtn}>Créer le groupe</button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .chat-container { height: 85vh !important; }
          .mobile-hidden { display: none !important; }
          .chat-menu { width: 100% !important; border-right: none !important; }
          .chat-box { width: 100% !important; }
        }
        @media (min-width: 769px) {
          .backBtn { display: none !important; }
        }
        .dots-trigger:hover { opacity: 1 !important; color: #334155 !important; }
        .message-row:hover .dots-trigger { opacity: 0.5; } 
      `}</style>
    </div>
  );
}

const styles = {
  chatContainer: { display: 'flex', height: '75vh', background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden', border:'1px solid #f1f5f9' },
  chatMenu: { flex: '1', borderRight: '1px solid #f1f5f9', display:'flex', flexDirection:'column', minWidth:'280px' },
  chatBox: { flex: '2.5', display: 'flex', flexDirection: 'column', position: 'relative', background: '#ffffff' },
  sidebarHeader: { padding:'15px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' },
  conversation: { display: 'flex', alignItems: 'center', padding: '12px 15px', cursor: 'pointer', gap: '12px', transition: '0.2s', borderBottom:'1px solid #f8fafc' },
  avatar: { width: '45px', height: '45px', borderRadius: '50%', objectFit:'cover', border:'1px solid #e2e8f0', flexShrink: 0 },
  avatarPlaceholder: { width: '45px', height: '45px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color:'#64748b', fontWeight:'bold', flexShrink: 0 },
  unreadDot: { position: 'absolute', top: 0, right: 0, background: '#ef4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', fontWeight:'bold', boxShadow:'0 2px 4px rgba(239, 68, 68, 0.4)' },
  chatBoxTop: { flex: '1', padding: '20px', overflowY: 'scroll', background: '#f8fafc' },
  chatBoxBottom: { padding: '15px', display: 'flex', alignItems: 'center', background: 'white', borderTop: '1px solid #f1f5f9', position: 'relative', gap:'10px' },
  chatInput: { width: '100%', padding: '12px 20px', borderRadius: '25px', border: '1px solid #cbd5e1', resize: 'none', height: '45px', outline: 'none', fontFamily:'inherit', background:'#f8fafc' },
  chatSubmit: { width: '45px', height: '45px', borderRadius: '50%', border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  iconBtn: { background:'none', border:'none', cursor:'pointer', padding:'5px' },
  emojiPickerContainer: { position: 'absolute', bottom: '70px', left: '10px', zIndex: 100 },
  noChat: { flex: 1, display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center' },
  chatHeader: { padding:'10px 15px', borderBottom:'1px solid #f1f5f9', background:'white', display:'flex', alignItems:'center', justifyContent:'space-between', height:'60px' },
  quickContact: { width:'45px', height:'45px', borderRadius:'50%', background:'#dbeafe', color:'#1e40af', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'0.9rem', cursor:'pointer', flexShrink:0, border:'2px solid white', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' },
  backBtn: { background:'none', border:'none', cursor:'pointer', padding:'5px', display:'block' }, 
  groupBtn: { background: '#eff6ff', color: '#2563eb', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
  deleteChatBtn: { background: '#fef2f2', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 },
  modalContent: { background: 'white', padding: '25px', borderRadius: '16px', width: '90%', maxWidth: '400px' },
  modalInput: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px' },
  createBtn: { width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }
};