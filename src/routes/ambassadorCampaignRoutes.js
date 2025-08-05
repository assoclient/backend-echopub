const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const role = require('../middleware/role');

const ambassadorCampaignController = require('../controllers/ambassadorCampaignController');

// Seuls les ambassadeurs peuvent accéder à leurs campagnes
router.get('/', auth, role('ambassador'), ambassadorCampaignController.getAllAmbassadorCampaigns);
// Attribution d'une campagne à un ambassadeur
router.post('/', auth, role('ambassador'), ambassadorCampaignController.createAmbassadorCampaign);
// Mise à jour d'une attribution (ambassadeur ou admin)
router.put('/:id', auth, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'ambassador') return next();
  return res.status(403).json({ message: 'Accès refusé' });
}, ambassadorCampaignController.updateAmbassadorCampaign);
// Suppression d'une attribution (admin uniquement)
router.delete('/:id', auth, role('admin'), ambassadorCampaignController.deleteAmbassadorCampaign);

module.exports = router;
