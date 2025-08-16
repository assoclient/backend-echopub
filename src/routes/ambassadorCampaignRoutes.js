const express = require('express');
const router = express.Router();
const ambassadorCampaignController = require('../controllers/ambassadorCampaignController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Récupérer toutes les publications des ambassadeurs (admin seulement)
router.get('/', auth, role('admin', 'superadmin'), ambassadorCampaignController.getAllAmbassadorCampaigns);

// Créer une attribution ambassadeur-campagne
router.post('/', auth, role('admin', 'superadmin'), ambassadorCampaignController.createAmbassadorCampaign);

// Mettre à jour une attribution ambassadeur-campagne
router.put('/:id', auth, role('admin', 'superadmin'), ambassadorCampaignController.updateAmbassadorCampaign);

// Supprimer une attribution ambassadeur-campagne
router.delete('/:id', auth, role('admin', 'superadmin'), ambassadorCampaignController.deleteAmbassadorCampaign);

// Valider une publication d'ambassadeur (admin seulement)
router.put('/:id/validate', auth, role('admin', 'superadmin'), ambassadorCampaignController.validatePublication);

router.get('/add-click/:sortLinkId/:ambassador',ambassadorCampaignController.updatClicksCount)

module.exports = router;
