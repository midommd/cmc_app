const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now }, // Date de l'archivage (fin de semaine)
  semaine: { type: String } // Optionnel, pour plus tard
});

module.exports = mongoose.model('History', HistorySchema);