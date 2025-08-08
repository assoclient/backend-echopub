const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    // Pour compatibilité avec le middleware de rôle, s'assurer que req.user.role existe
    if (!req.user.role) {
          console.log('Erreur de vérification du token:', req.user);
      return res.status(403).json({ message: 'Rôle utilisateur manquant dans le token' });
    }
    next();
  } catch (err) {
    console.log(err);
    
    res.status(403).json({ message: 'Token invalide' });
  }
};
