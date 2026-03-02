const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
// const auth = require('../middleware/auth'); // Optionnel: à utiliser si tu veux protéger la route

// 1. OBTENIR TOUS LES CLUBS (Public)
router.get('/', async (req, res) => {
  try {
    const clubs = await Club.find();
    res.json(clubs);
  } catch (err) { res.status(500).send('Erreur Serveur'); }
});

// 2. CRÉER UN CLUB (Admin)
router.post('/', async (req, res) => {
  try {
    const newClub = new Club(req.body);
    const club = await newClub.save();
    res.json(club);
  } catch (err) { res.status(500).send('Erreur Serveur'); }
});

// 3. METTRE À JOUR UN CLUB (Admin)
router.put('/:id', async (req, res) => {
  try {
    const club = await Club.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(club);
  } catch (err) { res.status(500).send('Erreur Serveur'); }
});

// 4. SUPPRIMER UN CLUB (Admin)
router.delete('/:id', async (req, res) => {
  try {
    await Club.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Club supprimé' });
  } catch (err) { res.status(500).send('Erreur Serveur'); }
});

module.exports = router;