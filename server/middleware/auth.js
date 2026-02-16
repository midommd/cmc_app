const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
  // 1. Récupérer le token du header
  const token = req.header('x-auth-token');

  // 2. Si pas de token, on rejette
  if (!token) {
    return res.status(401).json({ msg: 'Pas de token, autorisation refusée' });
  }

  // 3. Vérifier le token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // IMPORTANT : On attache l'utilisateur à la requête pour que les routes le voient
    req.user = decoded; 
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token non valide' });
  }
};