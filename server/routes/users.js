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

// 2. LISTE COMPLÈTE (Pour le Chat : Admins + Ambassadeurs)
router.get('/all', auth, async (req, res) => {
  try {
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

// 5. ADMIN : MODIFICATION TOTALE
router.put('/admin-update/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Accès refusé' });

    const { nom, prenom, email, password, branch, motivation, hobbies, whyCMC, photo, linkedin } = req.body;
    
    const updateFields = { nom, prenom, email, branch, motivation, hobbies, whyCMC, photo, linkedin };

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

// 6. USER : MODIFICATION PROFIL
router.put('/profile', auth, async (req, res) => {
  try {
    const { nom, prenom, email, password, photo, branch, motivation, hobbies, whyCMC, linkedin } = req.body;
    
    const updateFields = {};
    // Utilisation de !== undefined pour forcer la prise en compte du champ LinkedIn (même vide)
    if (nom !== undefined) updateFields.nom = nom;
    if (prenom !== undefined) updateFields.prenom = prenom;
    if (email !== undefined) updateFields.email = email;
    if (photo !== undefined) updateFields.photo = photo;
    if (branch !== undefined) updateFields.branch = branch;
    if (motivation !== undefined) updateFields.motivation = motivation;
    if (hobbies !== undefined) updateFields.hobbies = hobbies;
    if (whyCMC !== undefined) updateFields.whyCMC = whyCMC;
    if (linkedin !== undefined) updateFields.linkedin = linkedin; // LA CORRECTION EST ICI

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
  } catch (err) { 
    console.error(err);
    res.status(500).send('Erreur Serveur'); 
  }
});

module.exports = router;