const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Récupérer tous les paramètres
router.get('/', auth, settingsController.getSettings);

// Mettre à jour les paramètres généraux
router.put('/general', auth, role('admin', 'superadmin'), settingsController.updateGeneralSettings);

// Mettre à jour les paramètres de paiement
router.put('/payment', auth, role('admin', 'superadmin'), settingsController.updatePaymentSettings);

// Mettre à jour les paramètres de sécurité
router.put('/security', auth, role('admin', 'superadmin'), settingsController.updateSecuritySettings);

// Mettre à jour les paramètres de notification
router.put('/notification', auth, role('admin', 'superadmin'), settingsController.updateNotificationSettings);

// Mettre à jour les paramètres de maintenance
router.put('/maintenance', auth, role('admin', 'superadmin'), settingsController.updateMaintenanceSettings);

// Réinitialiser tous les paramètres
router.post('/reset', auth, role('superadmin'), settingsController.resetSettings);

module.exports = router; 