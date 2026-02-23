const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'ambassadeur'], default: 'ambassadeur' },
  photo: { type: String, default: "" },
  branch: { type: String, default: "" },
  motivation: { type: String, default: "" },
  hobbies: { type: String, default: "" },
  whyCMC: { type: String, default: "" },
  subscription: { type: Object, default: null },
  linkedin: { type: String, default: "" }
});

module.exports = mongoose.model('User', UserSchema);