const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const webpush = require('web-push');
require('dotenv').config();

const User = require('./models/User');
const Slot = require('./models/Slot');
const History = require('./models/History');
// --- IMPORT DU NOUVEAU MODÈLE ---
const Settings = require('./models/Settings'); 

const app = express();

// --- WEB PUSH SETUP (NOTIFICATIONS) ---
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    'mailto:test@cmc-connect.com',
    publicVapidKey,
    privateVapidKey
  );
} else {
  console.warn("⚠️ VAPID keys are missing from .env. Push notifications are disabled.");
}

// --- SOCKET.IO SETUP ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", process.env.RENDER_EXTERNAL_URL || "*"],
    methods: ["GET", "POST"]
  }
});

let users = [];

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  socket.on("sendMessage", async ({ senderId, receivers, text, conversationId, messageId, replyTo }) => {
    // 1. Envoi Socket temps réel
    receivers.forEach(receiverId => {
      const user = getUser(receiverId);
      if (user) {
        io.to(user.socketId).emit("getMessage", {
          senderId, text, conversationId, messageId, replyTo, createdAt: Date.now()
        });
      }
    });

    // 2. Envoi Notification Push
    try {
      if (publicVapidKey && privateVapidKey) {
        const sender = await User.findById(senderId);
        for (const receiverId of receivers) {
          const receiverUser = await User.findById(receiverId);
          if (receiverUser && receiverUser.subscription) {
            const payload = JSON.stringify({
              title: `Nouveau message de ${sender.prenom}`,
              body: text.length > 30 ? text.substring(0, 30) + '...' : text,
              url: process.env.RENDER_EXTERNAL_URL || "http://localhost:3000"
            });
            webpush.sendNotification(receiverUser.subscription, payload).catch(e => console.log("L'utilisateur a bloqué les notifs"));
          }
        }
      }
    } catch(err) { console.error("Push Error:", err); }
  });

  socket.on("markRead", ({ conversationId, readerId, receivers }) => {
    receivers.forEach(receiverId => {
      const user = getUser(receiverId);
      if (user) io.to(user.socketId).emit("messageRead", { conversationId, readerId });
    });
  });

  socket.on("editMessage", ({ messageId, text, receivers, conversationId }) => {
    receivers.forEach(receiverId => {
      const user = getUser(receiverId);
      if (user) io.to(user.socketId).emit("messageEdited", { messageId, text, conversationId });
    });
  });

  socket.on("deleteMessage", ({ messageId, receivers, conversationId }) => {
    receivers.forEach(receiverId => {
      const user = getUser(receiverId);
      if (user) io.to(user.socketId).emit("messageDeleted", { messageId, conversationId });
    });
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use('/api/', limiter);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token' });
  try { const decoded = jwt.verify(token, process.env.JWT_SECRET); req.user = decoded; next(); } 
  catch (e) { res.status(400).json({ msg: 'Invalid Token' }); }
};


// --- ROUTES NOTIFICATIONS ---
app.get('/api/vapid-public-key', (req, res) => {
  if (!publicVapidKey) return res.status(200).json({ publicKey: null });
  res.json({ publicKey: publicVapidKey });
});

app.post('/api/subscribe', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { subscription: req.body });
    res.status(201).json({});
  } catch (err) { res.status(500).json(err); }
});


// --- ROUTES AUTH & USERS ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Email not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user._id, nom: user.nom, prenom: user.prenom, role: user.role } });
  } catch (err) { res.status(500).send("Server Error"); }
});

app.use('/api/users', require('./routes/users'));
app.use('/api/chat', require('./routes/chat'));


// --- ROUTES SETTINGS (MODE RAMADAN) ---
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({ ramadanMode: false });
    res.json(settings);
  } catch (err) { res.status(500).send("Erreur Settings"); }
});

app.put('/api/settings/ramadan', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: "Denied" });
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings({ ramadanMode: false });
    
    settings.ramadanMode = req.body.ramadanMode;
    await settings.save();
    
    res.json(settings);
  } catch (err) { res.status(500).send("Erreur Update Settings"); }
});


// --- ROUTES SLOTS & STATS ---
app.get('/api/slots', auth, async (req, res) => {
  try { const slots = await Slot.find().populate('ambassadors', 'nom prenom photo'); res.json(slots); } catch (err) { res.status(500).send("Error"); }
});

app.post('/api/slots/toggle', auth, async (req, res) => {
  if (req.user.role === 'admin') return res.status(403).json({ msg: "Admin cannot book." });
  try {
    const { slotId } = req.body; const slot = await Slot.findById(slotId);
    if (!slot) return res.status(404).json({ msg: "Not found" });
    const index = slot.ambassadors.indexOf(req.user.id);
    if (index !== -1) slot.ambassadors.splice(index, 1);
    else { if (slot.ambassadors.length >= 3) return res.status(400).json({ msg: "Full" }); slot.ambassadors.push(req.user.id); }
    await slot.save(); res.json(slot);
  } catch (err) { res.status(500).send("Error"); }
});

app.get('/api/admin/stats', auth, async (req, res) => {
    if(req.user.role !== 'admin') return res.status(403).json({msg: "Denied"});
    try {
        const users = await User.find({ role: 'ambassadeur' }).select('-password');
        const history = await History.find(); const slots = await Slot.find();
        let counts = {}; history.forEach(h => counts[h.userId] = (counts[h.userId] || 0) + 1);
        slots.forEach(s => s.ambassadors.forEach(id => counts[id] = (counts[id] || 0) + 1));
        const stats = users.map(u => ({ id: u._id, nom: u.nom, prenom: u.prenom, email: u.email, total: counts[u._id] || 0 })).sort((a, b) => b.total - a.total);
        res.json({ total: Object.values(counts).reduce((a,b)=>a+b,0), stats });
    } catch (err) { res.status(500).send("Error"); }
});

app.post('/api/admin/export-reset', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: "Denied" });
  try {
    const slots = await Slot.find().populate('ambassadors', 'nom prenom email'); 
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Semaine'); 
    worksheet.columns = [{ header: 'Jour', key: 'd', width: 15 }, { header: 'Période', key: 'p', width: 15 }, { header: 'Nom', key: 'n', width: 30 }, { header: 'Email', key: 'e', width: 30 }];
    let historyBatch = []; 
    slots.forEach(s => {
      if (s.ambassadors && s.ambassadors.length > 0) {
        s.ambassadors.forEach(u => { 
          if (u) {
            worksheet.addRow({ d: s.day, p: s.period, n: `${u.nom} ${u.prenom}`, e: u.email }); 
            historyBatch.push({ userId: u._id, date: new Date() }); 
          }
        });
      }
    });
    if (historyBatch.length > 0) await History.insertMany(historyBatch); 
    await Slot.updateMany({}, { $set: { ambassadors: [] } });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); 
    res.setHeader("Content-Disposition", "attachment; filename=" + "Report.xlsx");
    await workbook.xlsx.write(res); res.end();
  } catch (err) { console.error(err); res.status(500).send("Erreur Export"); }
});


// --- SERVING REACT EN PRODUCTION ---
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get(/.*/, (req, res) => res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html')));
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));