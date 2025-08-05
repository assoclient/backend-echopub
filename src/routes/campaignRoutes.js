const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

// ...existing routes...

 
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split('.').pop();
    const base = file.fieldname + '-' + Date.now();
    cb(null, base + '.' + ext);
  }
});
const upload = multer({ storage });

const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Tous les utilisateurs authentifiés peuvent voir les campagnes
router.get('/', auth, campaignController.getAllCampaigns);
// Seuls les annonceurs peuvent créer une campagne
router.post('/', auth, role('advertiser'),upload.single('media'), campaignController.createCampaign);
// Mise à jour d'une campagne (annonceur propriétaire ou admin)
router.put('/:id', auth,upload.single('media'), (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'advertiser') return next();
  return res.status(403).json({ message: 'Accès refusé' });
}, campaignController.updateCampaign);
// Suppression d'une campagne (admin uniquement)
router.delete('/:id', auth, role('admin','advertiser'), campaignController.deleteCampaign);
router.get('/:id', auth, role('admin','advertiser'), campaignController.getCampaignDetails);

// Récupérer les campagnes d'un annonceur avec stats et pagination
router.get('/advertiser/campaigns/:advertiserId', auth, role('advertiser'), campaignController.getAdvertiserCampaigns);
// Récupérer les campagnes d'un annonceur avec stats et pagination
router.post('/changestatus/:id', auth, campaignController.changeCampaignStatus);

module.exports = router;
