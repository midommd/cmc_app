const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User'); // Assure-toi que le nom du fichier correspond bien
// Ajoute l'import de ton modèle Club (ajuste le chemin si nécessaire)
const Club = require('./models/Club'); 

const cleanAll = async () => {
  try {
    console.log("⏳ Connexion à MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté ! Opération de sauvetage en cours...");

    // 1. Nettoyer uniquement les photos des utilisateurs (garde les noms, filières, etc.)
    const userResult = await User.updateMany(
      {}, 
      { $set: { photo: "" } } 
    );
    console.log(`✅ ${userResult.modifiedCount} profils utilisateurs ont été allégés.`);

    // 2. Vider la collection Clubs qui bloque le chargement (Pending)
    const clubResult = await Club.deleteMany({});
    console.log(`✅ ${clubResult.deletedCount} clubs corrompus supprimés avec succès.`);

    console.log("🎉 TERMINÉ ! Ton réseau est débouché. Relance ton serveur et ton site.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur :", err);
    process.exit(1);
  }
};

cleanAll();