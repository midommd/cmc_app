const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  ramadanMode: { type: Boolean, default: false }
});

module.exports = mongoose.model('Settings', SettingsSchema);