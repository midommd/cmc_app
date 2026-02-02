const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'ambassadeur'], default: 'ambassadeur' }
});

module.exports = mongoose.model('User', UserSchema);