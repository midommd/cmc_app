const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const Slot = require('./models/Slot');
const History = require('./models/History'); // <--- AJOUT IMPORTANT
require('dotenv').config();

const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const periods = ['Matin', 'Aprèm'];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔥 MongoDB Connecté");

    // 1. NETTOYAGE COMPLET (C'est ici que ça se passe)
    console.log("🧹 Nettoyage de la base de données...");
    await User.deleteMany({});
    await Slot.deleteMany({});
    await History.deleteMany({}); // <--- SUPPRIME LES STATISTIQUES (Remet à 0)
    
    // 2. RECRÉATION DES UTILISATEURS
    console.log("👥 Création des utilisateurs...");
    // Lire le fichier JSON s'il existe, sinon créer des défauts
    let usersData = [];
    const jsonPath = path.join(__dirname, 'data', 'users.json');
    
    if (fs.existsSync(jsonPath)) {
      usersData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    } else {
        // Fallback si pas de JSON
        usersData.push({ nom: 'Admin', prenom: 'CMC', email: 'admin@cmc.ma', password: 'admin', role: 'admin' });
        for(let i=1; i<=10; i++) usersData.push({ nom: `Nom${i}`, prenom: `Prenom${i}`, email: `ambassadeur${i}@cmc.ma`, password: '123', role: 'ambassadeur' });
    }

    const usersToInsert = [];
    const salt = await bcrypt.genSalt(10);

    for (const user of usersData) {
      const hashedPassword = await bcrypt.hash(user.password, salt);
      usersToInsert.push({ ...user, password: hashedPassword });
    }

    await User.insertMany(usersToInsert);

    // 3. RECRÉATION DU CALENDRIER VIDE
    console.log("📅 Initialisation du calendrier...");
    for (let day of days) {
      for (let period of periods) {
        await Slot.create({ day, period, ambassadors: [] });
      }
    }

    console.log("✅ SUCCÈS : Base de données réinitialisée à ZÉRO !");
    process.exit();
  } catch (error) {
    console.error("❌ ERREUR :", error);
    process.exit(1);
  }
};

seedDB();