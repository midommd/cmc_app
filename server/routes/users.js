const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const User = require('../models/User');

// 1. LISTE PUBLIQUE (Ambassadeurs uniquement - Pour la page d'accueil)
router.get('/ambassadors', async (req, res) => {
  try {
    const users = await User.find({ role: 'ambassadeur' }).select('-password').sort({ nom: 1 });
    res.json(users);
  } catch (err) { res.status(500).send('Erreur Serveur'); }
});

// 2. LISTE COMPLÈTE (Pour le Chat : Admins + Ambassadeurs) --- NOUVEAU ---
router.get('/all', auth, async (req, res) => {
  try {
    // On récupère ID, Nom, Prénom, Photo, Role de TOUT le monde
    const users = await User.find().select('_id nom prenom photo role').sort({ nom: 1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur Serveur');
  }
});

// 3. ADMIN : AJOUTER
router.post('/add', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Accès refusé' });

    const { nom, prenom, email, password, role, branch } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'Email déjà pris' });

    user = new User({ nom, prenom, email, password, role: role || 'ambassadeur', branch });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    res.json(user);
  } catch (err) { res.status(500).send('Erreur Serveur'); }
});

// 4. ADMIN : SUPPRIMER
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Accès refusé' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Utilisateur supprimé' });
  } catch (err) { res.status(500).send('Erreur Serveur'); }
});

// 5. ADMIN : MODIFICATION TOTALE (Photo, infos, etc.)
router.put('/admin-update/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Accès refusé' });

    const { nom, prenom, email, password, branch, motivation, hobbies, whyCMC, photo } = req.body;
    
    // Admin peut tout changer
    const updateFields = { nom, prenom, email, branch, motivation, hobbies, whyCMC, photo };

    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur Serveur Update Admin');
  }
});

// 6. USER : MODIFICATION RESTREINTE (Identité uniquement)
router.put('/profile', auth, async (req, res) => {
  try {
    const { nom, prenom, email, password } = req.body;
    
    // User ne change que ça
    const updateFields = { nom, prenom, email };

    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) { res.status(500).send('Erreur Serveur'); }
});

module.exports = router;