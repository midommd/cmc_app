const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  members: { type: Array, required: true },
  isGroup: { type: Boolean, default: false },
  name: { type: String, default: "" }, // Group Name
  admin: { type: String, default: "" } // Admin ID who created it
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);