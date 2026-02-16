const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: { type: String },
  sender: { type: String },
  text: { type: String },
  // --- NOUVEAUX CHAMPS ---
  readBy: { type: Array, default: [] }, // Liste des IDs qui ont vu le message
  isEdited: { type: Boolean, default: false }, // Modifié ?
  deletedFor: { type: Array, default: [] }, // Supprimé pour certains (Delete for me)
  isDeletedForAll: { type: Boolean, default: false } // Supprimé pour tous (Message supprimé)
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);