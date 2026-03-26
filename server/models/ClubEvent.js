const mongoose = require('mongoose');

const ClubEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  club: { type: String, required: true },
  sousClub: { type: String, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['session', 'tournoi', 'reunion', 'event_majeur'], default: 'session' },
  metrics: {
    presence: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 } // Spécifique Echecs/Foot
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('ClubEvent', ClubEventSchema);