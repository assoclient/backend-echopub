const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');

// Upload image ou vidéo (authentifié)
router.post('/', auth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier envoyé' });
  }
  res.status(201).json({
    message: 'Fichier uploadé',
    fileUrl: `/uploads/${req.file.filename}`
  });
});

// Upload d'une capture d'écran pour prouver la publication (ambassadeur)
const AmbassadorCampaign = require('../models/AmbassadorCampaign');
const Campaign = require('../models/Campaign');
const { verifyScreenshot } = require('../services/screenshotVerifier');
const imageHash = require('image-hash');

// Première capture (statut semi-validé)
router.post('/screenshot/:campaign', auth, upload.single('file'), async (req, res, next) => {
  try {
    const { campaign } = req.params;
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier envoyé' });
    }
    const userId = req.user.id || req.user._id;
    // Trouver la campagne
    const campaignDoc = await Campaign.findById(campaign);
    if (!campaignDoc) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }
    if(campaignDoc.expected_views == campaignDoc.number_views_assigned) {
      return res.status(400).json({ message: 'Le nombre d\'attributions pour cette campagne est atteint pour le moment!' });
    }
    const ambassador = await User.findById(userId);
    if(!ambassador) {
      return res.status(404).json({ message: 'Ambassadeur non trouvé' });
    }
    // Trouver ou créer l'attribution ambassadeur-campagne
    let ac = await AmbassadorCampaign.findOne({ 
      campaign: campaign, 
      ambassador: userId 
    }).populate('campaign', 'expected_views number_views_assigned');
    
    if (!ac) {
      // Créer une nouvelle attribution si elle n'existe pas
      ac = new AmbassadorCampaign({
        campaign: campaign,
        ambassador: userId,
        status: 'published'
      });
    }
    
    // Si une première capture existe déjà, refuser
    if (ac.status !== 'published') {
      return res.status(400).json({ 
        message: 'Première capture déjà envoyée. Utilisez /screenshot2 pour la seconde.',
        existingScreenshot: ac.screenshot_url
      });
    }
   
    // Analyse automatique (sans similarité visuelle)
    let report;
    try {
      report = await verifyScreenshot({ screenshotPath: req.file.path });
    } catch (verifyError) {
      console.error('Erreur lors de la vérification:', verifyError);
      // Continuer même si la vérification échoue
      report = {
        top_bar_contains: true,
        bottom_has_eyes_icon: true,
        image_contains_published_time: true,
        error: verifyError.message
      };
    }
    const path = require('path');
    const filePath = path.join('uploads', req.file.filename);
    const relPath = '/' + filePath.replace(/\\/g, '/');
    const baseUrl = process.env.MEDIA_BASE_URL || (req.protocol + '://' + req.get('host'));
    ac.screenshot_url = `${baseUrl}${relPath}`;
    console.log('Screenshot URL:', ac.screenshot_url);
    // Vérification plus souple - accepter si au moins un critère est rempli
    const isValid = report.top_bar_contains  || report.image_contains_published_time; // || report.bottom_has_eyes_icon
    
    if (!isValid && !report.error) {
       return res.status(400).json({
        message: 'Capture non conforme : vérifiez le statut, l\'icône de vues et le temps de publication.',
        report
      });
    }
    
    // Mettre à jour le statut
    ac.status = 'published';
    ac.target_views = ambassador.view_average < (campaignDoc.expected_views - campaignDoc.number_views_assigned) ? ambassador.view_average : (campaignDoc.expected_views - campaignDoc.number_views_assigned)
    await ac.save();
    
    res.status(201).json({
      message: 'Première capture uploadée avec succès',
      fileUrl: ac.screenshot_url,
      report,
      status: ac.status,
      ambassadorCampaign: {
        id: ac._id,
        campaign: ac.campaign,
        ambassador: ac.ambassador,
        status: ac.status,
        screenshot_url: ac.screenshot_url
      }
    });
  } catch (err) {
    console.error('Erreur lors de l\'upload:', err);
    res.status(500).json({ 
      message: 'Erreur serveur lors de l\'upload',
      error: err.message 
    });
  }
});

// Deuxième capture (18h après) et comparaison
const { analyzeScreenshotText } = require('../services/screenshotVerifier');
router.post('/screenshot2/:ambassadorCampaignId', auth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier envoyé' });
    }
    const { ambassadorCampaignId } = req.params;
    const ac = await AmbassadorCampaign.findById(ambassadorCampaignId);
    if (!ac) return res.status(404).json({ message: 'Attribution non trouvée' });
    if (!ac.screenshot_url) {
      return res.status(400).json({ message: 'Première capture manquante.' });
    }
    console.log('ac.createdAt', ac.createdAt);
    console.log('Date.now()', Date.now());
    console.log('ac.createdAt.getTime() + 24 * 60 * 60 * 1000', ac.createdAt.getTime() + 24 * 60 * 60 * 1000);
    console.log('Date.now() - ac.createdAt.getTime()', Date.now() - ac.createdAt.getTime());
    console.log('Date.now() - ac.createdAt.getTime() < 24 * 60 * 60 * 1000', Date.now() - ac.createdAt.getTime() < 24 * 60 * 60 * 1000);
    console.log('Date.now() - ac.createdAt.getTime() < 24 * 60 * 60 * 1000', Date.now() - ac.createdAt.getTime() < 24 * 60 * 60 * 1000);
    if((ac.createdAt.getTime() + 24 * 60 * 60 * 1000) < Date.now()) {
      return res.status(400).json({ message: 'La première capture a été envoyée il y a plus de 24 heures.' });
    }
    let report;
    try {
      report = await verifyScreenshot({ screenshotPath: req.file.path });
    } catch (verifyError) {
      console.error('Erreur lors de la vérification:', verifyError);
      // Continuer même si la vérification échoue
      report = {
        top_bar_contains: true,
        bottom_has_eyes_icon: true,
        image_contains_published_time: true,
        error: verifyError.message
      };
    }
    console.log('report', report);
    // Stocke la deuxième capture
    const path = require('path');
    const filePath = path.join('uploads', req.file.filename);
    const relPath = '/' + filePath.replace(/\\/g, '/');
    const baseUrl = process.env.MEDIA_BASE_URL || (req.protocol + '://' + req.get('host'));
    ac.screenshot_url2 = `${baseUrl}${relPath}`;
    ac.status = "submitted";
    ac.submittedAt = new Date();
    await ac.save();
    res.status(201).json({
      message: 'Deuxième capture uploadée',
      fileUrl: ac.screenshot_url2,
      status: ac.status,
      ambassadorCampaign: ac
    });
  } catch (err) {
    next(err);
  }
});


// Route statique pour obtenir un fichier uploadé
const path = require('path');
const User = require('../models/User');
router.get('/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../../uploads', req.params.filename);
  res.sendFile(filePath, err => {
    if (err) {
      res.status(404).json({ message: 'Fichier non trouvé' });
    }
  });
});

module.exports = router;
