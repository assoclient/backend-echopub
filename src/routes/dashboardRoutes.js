const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Récupérer les statistiques du dashboard (admin seulement)
router.get('/stats', auth, role('admin', 'superadmin'), dashboardController.getDashboardStats);

// Marquer une activité comme lue
router.put('/activities/:activityId/read', auth, role('admin', 'superadmin'), dashboardController.markActivityAsRead);

// Marquer toutes les activités comme lues
router.put('/activities/read-all', auth, role('admin', 'superadmin'), dashboardController.markAllActivitiesAsRead);

module.exports = router; 