const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const helmet = require('helmet');               // SÉCURITÉ
const rateLimit = require('express-rate-limit');// SÉCURITÉ
const path = require('path');                   // DÉPLOIEMENT
require('dotenv').config();

// Imports des Modèles
const User = require('./models/User');
const Slot = require('./models/Slot');
const History = require('./models/History'); 

const app = express();

// --- 1. CONFIGURATION SÉCURITÉ & MIDDLEWARE ---
app.use(helmet()); // Protège les en-têtes HTTP
app.use(cors());   // Gère les accès Cross-Origin
app.use(express.json());

// Limiteur de requêtes (Anti-Force Brute)
// Max 150 requêtes par 15 minutes par IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 150, 
  message: "Trop de requêtes, veuillez réessayer plus tard."
});
app.use('/api/', limiter); // Applique la limite seulement aux routes API

// --- 2. CONNEXION BASE DE DONNÉES ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connecté'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

// --- 3. MIDDLEWARE D'AUTHENTIFICATION ---
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'Accès refusé' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(400).json({ msg: 'Token invalide' });
  }
};

// ==========================================
//                 ROUTES API
// ==========================================

// A. LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Email inconnu' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Mot de passe incorrect' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user._id, nom: user.nom, prenom: user.prenom, role: user.role } });
  } catch (err) {
    res.status(500).send("Erreur serveur");
  }
});

// B. MISE À JOUR PROFIL (Email & Mot de passe)
app.put('/api/auth/update', auth, async (req, res) => {
  const { email, password, nom, prenom } = req.body;
  
  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "Utilisateur non trouvé" });

    // Vérifier unicité Email
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ msg: "Cet email est déjà utilisé." });
      user.email = email;
    }

    // Mise à jour mot de passe
    if (password && password.length > 0) {
      if (password.length < 6) return res.status(400).json({ msg: "Mot de passe trop court (min 6)." });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;

    await user.save();

    res.json({ 
      id: user._id, 
      nom: user.nom, 
      prenom: user.prenom, 
      email: user.email, 
      role: user.role 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur mise à jour");
  }
});

// C. PLANNING (Lecture)
app.get('/api/slots', auth, async (req, res) => {
  try {
    const slots = await Slot.find().populate('ambassadors', 'nom prenom');
    res.json(slots);
  } catch (err) {
    res.status(500).send("Erreur serveur");
  }
});

// D. RÉSERVER / ANNULER (Ambassadeur seulement)
app.post('/api/slots/toggle', auth, async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ msg: "L'administrateur ne prend pas de créneaux." });
  }

  const { slotId } = req.body;
  const userId = req.user.id;
  
  try {
    const slot = await Slot.findById(slotId);
    if (!slot) return res.status(404).json({ msg: "Introuvable" });

    const index = slot.ambassadors.indexOf(userId);
    if (index !== -1) {
      slot.ambassadors.splice(index, 1);
    } else {
      if (slot.ambassadors.length >= 3) return res.status(400).json({ msg: "Créneau COMPLET" });
      slot.ambassadors.push(userId);
    }
    await slot.save();
    res.json(slot);
  } catch (err) {
    res.status(500).send("Erreur serveur");
  }
});

// E. STATISTIQUES ADMIN (Détaillées)
app.get('/api/admin/stats', auth, async (req, res) => {
    if(req.user.role !== 'admin') return res.status(403).json({msg: "Interdit"});
    
    try {
        const allAmbassadors = await User.find({ role: 'ambassadeur' }).select('-password');
        const allHistory = await History.find();
        const currentSlots = await Slot.find();

        let counts = {}; 

        allHistory.forEach(h => {
            const uid = h.userId.toString();
            counts[uid] = (counts[uid] || 0) + 1;
        });

        currentSlots.forEach(slot => {
            slot.ambassadors.forEach(uid => {
                const idStr = uid.toString();
                counts[idStr] = (counts[idStr] || 0) + 1;
            });
        });

        const detailedStats = allAmbassadors.map(user => {
            return {
                id: user._id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                total: counts[user._id.toString()] || 0
            };
        });

        detailedStats.sort((a, b) => b.total - a.total);
        const totalMissions = Object.values(counts).reduce((a, b) => a + b, 0);

        res.json({ total: totalMissions, stats: detailedStats });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur stats");
    }
});

// F. EXPORT EXCEL + ARCHIVE + RESET
app.post('/api/admin/export-reset', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: "Interdit" });

  try {
    const slots = await Slot.find().populate('ambassadors', 'nom prenom email');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Semaine CMC');
    worksheet.columns = [
      { header: 'Jour', key: 'day', width: 15 },
      { header: 'Période', key: 'period', width: 25 },
      { header: 'Nom', key: 'nom', width: 20 },
      { header: 'Prénom', key: 'prenom', width: 20 },
      { header: 'Email', key: 'email', width: 30 }
    ];

    const historyEntries = [];
    slots.forEach(slot => {
      slot.ambassadors.forEach(user => {
        worksheet.addRow({
          day: slot.day,
          period: slot.period,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email
        });
        historyEntries.push({ userId: user._id, date: new Date() });
      });
    });

    worksheet.getRow(1).font = { bold: true };

    if (historyEntries.length > 0) {
      await History.insertMany(historyEntries);
    }

    await Slot.updateMany({}, { $set: { ambassadors: [] } });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Planning_Archive.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur export");
  }
});

// ==========================================
//           DÉPLOIEMENT PRODUCTION
// ==========================================

// Sert les fichiers React statiques si en mode Production
if (process.env.NODE_ENV === 'production') {
  // Indique le dossier où React a été "buildé"
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Toute route inconnue renvoie vers l'app React (Single Page App)
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur sécurisé prêt sur port ${PORT}`));