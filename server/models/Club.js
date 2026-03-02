const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: '🏆' },
  bgIcon: { type: String, default: '#f8fafc' },
  description: { type: String, default: '' },
  
  president: {
    nom: { type: String, default: '' },
    prenom: { type: String, default: '' },
    filiere: { type: String, default: '' },
    photo: { type: String, default: '' }, 
    msg: { type: String, default: '' }
  },
  
  staff: [{
    nom: { type: String, default: '' },
    prenom: { type: String, default: '' },
    role: { type: String, default: '' },
    photo: { type: String, default: '' }
  }],
  
  subClubs: [{
    name: { type: String, default: '' },
    icon: { type: String, default: '⭐' },
    desc: { type: String, default: '' },
    responsable: {
      nom: { type: String, default: '' },
      prenom: { type: String, default: '' },
      filiere: { type: String, default: '' },
      photo: { type: String, default: '' },
      msg: { type: String, default: '' }
    }
  }]
});

module.exports = mongoose.model('Club', ClubSchema);