const express = require('express');
const router = express.Router();


const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Seuls les admins peuvent voir tous les utilisateurs
router.get('/', auth, role('admin', 'superadmin'), userController.getAllUsers);
// Création d'utilisateur ouverte (inscription)
router.post('/', userController.createUser);
// Mise à jour d'utilisateur (admin ou l'utilisateur lui-même)
router.put('/:id', auth, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'superadmin' || req.user.id === req.params.id) return next();
  return res.status(403).json({ message: 'Accès refusé' });
}, userController.updateUser);
// Suppression d'utilisateur (admin uniquement)
router.delete('/:id', auth, role('admin', 'superadmin'), userController.deleteUser);

module.exports = router;
