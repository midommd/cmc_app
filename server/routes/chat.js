const router = require('express').Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// 1. Create Conversation
router.post('/conversation', async (req, res) => {
  if (req.body.isGroup) {
    const newConversation = new Conversation({
      members: req.body.members,
      isGroup: true,
      name: req.body.name,
      admin: req.body.admin
    });
    try {
      const savedConversation = await newConversation.save();
      res.status(200).json(savedConversation);
    } catch (err) { res.status(500).json(err); }
  } else {
    const existing = await Conversation.findOne({
      members: { $all: [req.body.senderId, req.body.receiverId] },
      isGroup: false
    });
    if (existing) return res.status(200).json(existing);

    const newConversation = new Conversation({
      members: [req.body.senderId, req.body.receiverId],
    });
    try {
      const savedConversation = await newConversation.save();
      res.status(200).json(savedConversation);
    } catch (err) { res.status(500).json(err); }
  }
});

// 2. Get User Conversations
router.get('/conversation/:userId', async (req, res) => {
  try {
    const conversation = await Conversation.find({
      members: { $in: [req.params.userId] },
    }).sort({ updatedAt: -1 });
    res.status(200).json(conversation);
  } catch (err) { res.status(500).json(err); }
});

// 3. Find specific conversation
router.get('/find/:conversationId', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    res.status(200).json(conversation);
  } catch (err) { res.status(500).json(err); }
});

// 4. Add Message
router.post('/message', async (req, res) => {
  const newMessage = new Message(req.body);
  try {
    const savedMessage = await newMessage.save();
    await Conversation.findByIdAndUpdate(req.body.conversationId, { updatedAt: Date.now() });
    res.status(200).json(savedMessage);
  } catch (err) { res.status(500).json(err); }
});

// 5. Get Messages
router.get('/message/:conversationId', async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    })
    .sort({ createdAt: 1 })
    .limit(100); 
    res.status(200).json(messages);
  } catch (err) { res.status(500).json(err); }
});

// --- MISSING ROUTES FIXED HERE ---

// 6. Mark Read
router.put('/message/read/:conversationId', async (req, res) => {
  try {
    const { userId } = req.body;
    await Message.updateMany(
      { conversationId: req.params.conversationId, readBy: { $ne: userId } },
      { $push: { readBy: userId } }
    );
    res.status(200).json("Read updated");
  } catch (err) { res.status(500).json(err); }
});

// 7. EDIT MESSAGE (This fixes the 404)
router.put('/message/edit/:id', async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json("Not found");
    
    // Check 15 min limit
    const diff = (Date.now() - new Date(msg.createdAt).getTime()) / 1000 / 60;
    if (diff > 15) return res.status(400).json("Too late to edit");

    msg.text = req.body.text;
    msg.isEdited = true;
    await msg.save();
    res.status(200).json(msg);
  } catch (err) { 
    console.log(err);
    res.status(500).json(err); 
  }
});

// 8. DELETE MESSAGE (This fixes the 404)
router.put('/message/delete/:id', async (req, res) => {
  try {
    const { userId, type } = req.body; // 'me' or 'all'
    const msg = await Message.findById(req.params.id);
    
    if (type === 'all') {
      msg.isDeletedForAll = true;
      msg.text = "Message deleted";
    } else {
      msg.deletedFor.push(userId);
    }
    await msg.save();
    res.status(200).json(msg);
  } catch (err) { res.status(500).json(err); }
});

// 9. DELETE CONVERSATION
router.delete('/conversation/:conversationId', async (req, res) => {
  try {
    await Conversation.findByIdAndDelete(req.params.conversationId);
    await Message.deleteMany({ conversationId: req.params.conversationId });
    res.status(200).json("Deleted");
  } catch (err) { res.status(500).json(err); }
});

module.exports = router;