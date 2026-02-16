const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ambassadeur', 'admin'], default: 'ambassadeur' },
  
  // Nouveaux champs pour le profil
  photo: { type: String, default: '' }, 
  branch: { type: String, default: '' },
  motivation: { type: String, default: '' },
  hobbies: { type: String, default: '' },
  whyCMC: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);