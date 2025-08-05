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
router.post('/screenshot/:ambassadorCampaignId', auth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier envoyé' });
    }
    const { ambassadorCampaignId } = req.params;
    const ac = await AmbassadorCampaign.findById(ambassadorCampaignId).populate('campaign');
    if (!ac) return res.status(404).json({ message: 'Attribution non trouvée' });
    // Si une première capture existe déjà, refuser
    if (ac.screenshot_url) {
      return res.status(400).json({ message: 'Première capture déjà envoyée. Utilisez /screenshot2 pour la seconde.' });
    }
    // Analyse automatique (sans similarité visuelle)
    const report = await verifyScreenshot({ screenshotPath: req.file.path });
    ac.screenshot_url = `/uploads/${req.file.filename}`;
    ac.status = (report.top_bar_contains && report.bottom_has_eyes_icon && report.image_contains_published_time) ? 'semi-validated' : 'pending';
    await ac.save();
    res.status(201).json({
      message: 'Première capture uploadée',
      fileUrl: ac.screenshot_url,
      report,
      status: ac.status,
      ambassadorCampaign: ac
    });
  } catch (err) {
    next(err);
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
    // Stocke la deuxième capture
    ac.screenshot_url2 = `/uploads/${req.file.filename}`;
    // Compare les deux captures (hash perceptuel)
    const getHash = (file) => new Promise((resolve, reject) => {
      imageHash.hash(file, 8, 'hex', (err, hash) => {
        if (err) reject(err); else resolve(hash);
      });
    });
    const hash1 = await getHash(`uploads/${ac.screenshot_url.replace('/uploads/', '')}`);
    const hash2 = await getHash(req.file.path);
    // OCR pour extraire le nombre de vues sur chaque capture
    const ocr1 = await analyzeScreenshotText(`uploads/${ac.screenshot_url.replace('/uploads/', '')}`);
    const ocr2 = await analyzeScreenshotText(req.file.path);
    // Extraction du nombre de vues (ex: "12 vues" ou "vu par 34")
    const extractViews = txt => {
      const match = txt.match(/([0-9]{1,4})\s*(vues|vu par)/i);
      return match ? parseInt(match[1], 10) : null;
    };
    const views1 = extractViews(ocr1);
    const views2 = extractViews(ocr2);
    // Met à jour le nombre de vues de la deuxième capture
    if (views2 !== null) {
      ac.views_count = views2;
      // Met à jour le montant gagné (CPV)
      // On suppose que la campagne est toujours liée à ac.campaign
      const campaign = await require('../models/Campaign').findById(ac.campaign);
      if (campaign && campaign.cpv) {
        ac.amount_earned = Math.round(views2 * campaign.cpv * 0.75); // 75% pour l'ambassadeur
      }
    }
    // Score de similarité simple (distance de Hamming)
    const hamming = (a, b) => a.split('').reduce((acc, c, i) => acc + (c !== b[i] ? 1 : 0), 0);
    const hashDistance = hamming(hash1, hash2);
    // Logique de validation
    let status = 'manual_review';
    if (hashDistance <= 10 && (views2 === null || views1 === null || views2 >= views1)) {
      status = 'validated';
      // Créditer la balance de l'ambassadeur si la campagne est validée
      const User = require('../models/User');
      const ambassador = await User.findById(ac.ambassador);
      if (ambassador) {
        ambassador.balance += ac.amount_earned || 0;
        //await ambassador.save();
      }
    }
    ac.status = status;
    await ac.save();
    res.status(201).json({
      message: 'Deuxième capture uploadée',
      fileUrl: ac.screenshot_url2,
      hash1,
      hash2,
      hashDistance,
      views1,
      views2,
      status: ac.status,
      ambassadorCampaign: ac
    });
  } catch (err) {
    next(err);
  }
});


// Route statique pour obtenir un fichier uploadé
const path = require('path');
router.get('/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../../uploads', req.params.filename);
  res.sendFile(filePath, err => {
    if (err) {
      res.status(404).json({ message: 'Fichier non trouvé' });
    }
  });
});

module.exports = router;
