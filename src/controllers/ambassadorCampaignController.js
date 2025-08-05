// Mise à jour d'une attribution ambassadeur-campagne
exports.updateAmbassadorCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };
    const ac = await AmbassadorCampaign.findByIdAndUpdate(id, update, { new: true });
    if (!ac) return res.status(404).json({ message: 'Attribution non trouvée' });
    res.json({ message: 'Attribution modifiée', ambassadorCampaign: ac });
  } catch (err) {
    next(err);
  }
};

// Suppression d'une attribution ambassadeur-campagne
exports.deleteAmbassadorCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ac = await AmbassadorCampaign.findByIdAndDelete(id);
    if (!ac) return res.status(404).json({ message: 'Attribution non trouvée' });
    res.json({ message: 'Attribution supprimée' });
  } catch (err) {
    next(err);
  }
};
// Contrôleur AmbassadorCampaign

// Liste paginée et recherche campagnes ambassadeur (par titre campagne)

const AmbassadorCampaign = require('../models/AmbassadorCampaign');

exports.getAllAmbassadorCampaigns = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const Campaign = require('../models/Campaign');
    // On recherche sur le titre de la campagne liée
    let campaignIds = [];
    if (search) {
      const campaigns = await Campaign.find({ title: { $regex: search, $options: 'i' } }, '_id');
      campaignIds = campaigns.map(c => c._id);
    }
    const query = search && campaignIds.length > 0
      ? { campaign: { $in: campaignIds } }
      : {};
    const count = await AmbassadorCampaign.countDocuments(query);
    const docs = await AmbassadorCampaign.find(query)
      .populate('campaign')
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize));
    res.json({
      totalCount: count,
      page: Number(page),
      pageSize: docs.length,
      data: docs
    });
  } catch (err) {
    next(err);
  }
};

// Création d'une attribution campagne ambassadeur
exports.createAmbassadorCampaign = async (req, res, next) => {
  try {
    const { ambassador, campaign, status, screenshot_url, views_count, clicks_count, amount_earned } = req.body;
    if (!ambassador || !campaign) {
      return res.status(400).json({ message: 'Ambassadeur et campagne requis' });
    }
    const exists = await AmbassadorCampaign.findOne({ ambassador, campaign });
    if (exists) {
      return res.status(400).json({ message: 'Déjà attribué à cette campagne' });
    }
    const ac = await AmbassadorCampaign.create({
      ambassador,
      campaign,
      status: status || 'pending',
      screenshot_url,
      views_count,
      clicks_count,
      amount_earned
    });
    res.status(201).json({ message: 'Attribution créée', ambassadorCampaign: ac });
  } catch (err) {
    next(err);
  }
};
