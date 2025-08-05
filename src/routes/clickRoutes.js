const express = require('express');
const router = express.Router();
const AmbassadorCampaign = require('../models/AmbassadorCampaign');
const ClickEvent = require('../models/ClickEvent');

// Route de tracking des clics
router.get('/track/:ambassadorCampaignId', async (req, res, next) => {
  try {
    const { ambassadorCampaignId } = req.params;
    const ac = await AmbassadorCampaign.findById(ambassadorCampaignId).populate('campaign');
    if (!ac || !ac.campaign) return res.status(404).json({ message: 'Lien invalide' });
    // Enregistre l'événement de clic
    await ClickEvent.create({
      ambassadorCampaign: ac._id,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      referer: req.headers['referer'] || '',
      // geo: ... (ajouter la géolocalisation si besoin)
    });
    // Incrémente le nombre de clics
    ac.clicks_count = (ac.clicks_count || 0) + 1;
    // Met à jour le montant gagné (CPV + CPC)
    const cpv = ac.campaign.cpv || 0;
    const cpc = ac.campaign.cpc || 0;
    const views = ac.views_count || 0;
    const clicks = ac.clicks_count || 0;
    const newAmount = Math.round((views * cpv + clicks * cpc) * 0.75); // 75% pour l'ambassadeur
    // Créditer la différence sur la balance de l'ambassadeur
    const User = require('../models/User');
    const ambassador = await User.findById(ac.ambassador);
    if (ambassador) {
      const diff = newAmount - (ac.amount_earned || 0);
      ambassador.balance += diff;
      await ambassador.save();
    }
    ac.amount_earned = newAmount;
    await ac.save();
    // Redirige vers la page du promoteur
    const redirectUrl = ac.campaign.target_url || ac.campaign.url || 'https://faneko.cm';
    res.redirect(302, redirectUrl);
  } catch (err) {
    next(err);
  }
});

// (Optionnel) Route pour obtenir les stats de clics d'une campagne ambassadeur
router.get('/stats/:ambassadorCampaignId', async (req, res, next) => {
  try {
    const { ambassadorCampaignId } = req.params;
    const clicks = await ClickEvent.find({ ambassadorCampaign: ambassadorCampaignId }).sort({ timestamp: -1 });
    res.json({ count: clicks.length, clicks });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
