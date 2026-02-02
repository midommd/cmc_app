const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
  day: { type: String, required: true },
  period: { type: String, required: true },
  ambassadors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Slot', SlotSchema);