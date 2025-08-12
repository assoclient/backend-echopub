const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Récupérer les statistiques du dashboard (admin seulement)
router.get('/stats', auth, role('admin', 'superadmin'), dashboardController.getDashboardStats);

// Récupérer les statistiques du dashboard pour un annonceur
router.get('/advertiser-stats', auth, role('advertiser'), dashboardController.getAdvertiserDashboardStats);

// Récupérer les statistiques des gains pour un ambassadeur
router.get('/ambassador-gains', auth, role('ambassador'), dashboardController.getAmbassadorGainsStats);

// Récupérer les transactions paginées d'un ambassadeur
router.get('/ambassador-transactions', auth, role('ambassador'), dashboardController.getAmbassadorTransactions);

// Récupérer le profil d'un ambassadeur
router.get('/ambassador-profile', auth, role('ambassador'), dashboardController.getAmbassadorProfile);

// Récupérer les rapports détaillés (admin seulement)
router.get('/reports', auth, role('admin', 'superadmin'), dashboardController.getDetailedReports);

// Marquer une activité comme lue
router.put('/activities/:activityId/read', auth, role('admin', 'superadmin'), dashboardController.markActivityAsRead);

// Marquer toutes les activités comme lues
router.put('/activities/read-all', auth, role('admin', 'superadmin'), dashboardController.markAllActivitiesAsRead);

module.exports = router; 