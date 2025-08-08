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
    const { page = 1, pageSize = 10, search = '', status = '' } = req.query;
    const Campaign = require('../models/Campaign');
    const User = require('../models/User');
    
    // Construire la requête de base
    let query = {};
    
    // Recherche par titre de campagne
    if (search) {
      const campaigns = await Campaign.find({ title: { $regex: search, $options: 'i' } }, '_id');
      const campaignIds = campaigns.map(c => c._id);
      if (campaignIds.length > 0) {
        query.campaign = { $in: campaignIds };
      } else {
        // Si aucune campagne trouvée, retourner un résultat vide
        return res.json({
          totalCount: 0,
          page: Number(page),
          pageSize: 0,
          data: []
        });
      }
    }
    
    // Filtrage par statut
    if (status) {
      query.status = status;
    }
    
    const count = await AmbassadorCampaign.countDocuments(query);
    const docs = await AmbassadorCampaign.find(query)
      .populate('campaign', 'title budget status')
      .populate('ambassador', 'name email')
      .sort({ createdAt: -1 }) // Les plus récentes en premier
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
