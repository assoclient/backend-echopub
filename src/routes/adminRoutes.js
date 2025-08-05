const express = require('express');
const router = express.Router();


const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Seuls les superadmins peuvent voir tous les admins
router.get('/', auth, role('superadmin'), adminController.getAllAdmins);
// Création d'un admin (superadmin uniquement)
router.post('/', auth, role('superadmin'), adminController.createAdmin);
// Mise à jour d'un admin (superadmin uniquement)
router.put('/:id', auth, role('superadmin'), adminController.updateAdmin);
// Suppression d'un admin (superadmin uniquement)
router.delete('/:id', auth, role('superadmin'), adminController.deleteAdmin);
// Connexion admin
router.post('/login', adminController.loginAdmin);

module.exports = router;
