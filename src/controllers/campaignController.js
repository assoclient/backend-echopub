// Détails d'une campagne avec stats globales et liste des publications
exports.getCampaignDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Campaign = require('../models/Campaign');
    const Publication = require('../models/AmbassadorCampaign');
    const campaign = await Campaign.findById(id).lean();
    if (!campaign) return res.status(404).json({ message: 'Campagne non trouvée' });

    // Récupérer toutes les publications liées à cette campagne
    const publications = await Publication.find({ campaign: id }).populate('ambassador', 'name');

    // Calculer les stats globales
    let totalViews = 0;
    let totalClicks = 0;
    publications.forEach(pub => {
      totalViews += pub.views_count || 0;
      totalClicks += pub.clicks_count || 0;
    });

    // Formatage des preuves (captures)
    const pubs = publications.map(pub => ({
      _id: pub._id,
      ambassador_name: pub.ambassador.name,
      views: pub.views_count || 0,
      clicks: pub.clicks_count || 0,
      proof1: pub.screenshot_url,
      proof2: pub.screenshot_url2,
      createdAt: pub.createdAt,
      status: pub.status
    }));

    res.json({
      campaign: {
        ...campaign,
        views: totalViews,
        clicks: totalClicks
      },
      publications: pubs
    });
  } catch (err) {
    next(err);
  }
};
const { logCampaignActivity, ACTIVITY_TYPES } = require('../utils/activityLogger');

// Changement de statut d'une campagne avec validation des transitions
exports.changeCampaignStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    // On suppose que req.user existe et contient le rôle et l'id
    //console.log('User:', req.user);
    
    const user = req.user;
    if (!status) return res.status(400).json({ message: 'Nouveau statut requis' });
    const campaign = await Campaign.findById(id);
    if (!campaign) return res.status(404).json({ message: 'Campagne non trouvée' });
    const current = campaign.status;
    const allowed = {
      draft: ['submitted'],
      submitted: ['active'],
      active: ['paused', 'completed'],
      paused: ['active', 'completed'],
    };
    if (!allowed[current] || !allowed[current].includes(status)) {
      return res.status(400).json({ message: `Transition non autorisée: ${current} => ${status}` });
    }
    // Vérification des rôles pour chaque transition
    if (current === 'draft' && status === 'submitted') {
      // Seul l'annonceur propriétaire peut soumettre
      if (!user || user.role !== 'advertiser' || user.id.toString() !== campaign.advertiser.toString()) {
        return res.status(403).json({ message: 'Seul l\'annonceur peut soumettre cette campagne.' });
      }
    }
    if (current === 'submitted' && status === 'active') {
      // Seul l'admin peut activer
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Seul l\'administrateur peut activer la campagne.' });
      }
    }
    if (current === 'active' && (status === 'paused' || status === 'completed')) {
      // Seul l'annonceur propriétaire peut mettre en pause ou terminer
      if (!user || user.role !== 'advertiser' || user.id.toString() !== campaign.advertiser.toString()) {
        return res.status(403).json({ message: 'Seul l\'annonceur peut modifier le statut de cette campagne.' });
      }
    }
    if (current === 'paused' && status === 'active') {
      // Seul l'annonceur propriétaire peut réactiver
      if (!user || user.role !== 'advertiser' || user.id.toString() !== campaign.advertiser.toString()) {
        return res.status(403).json({ message: 'Seul l\'annonceur peut réactiver cette campagne.' });
      }
    }
    if (current === 'paused' && status === 'completed') {
      // Seul l'annonceur propriétaire peut terminer
      if (!user || user.role !== 'advertiser' || user.id.toString() !== campaign.advertiser.toString()) {
        return res.status(403).json({ message: 'Seul l\'annonceur peut terminer cette campagne.' });
      }
    }
    
    campaign.status = status;
    await campaign.save();
    
    // Logger l'activité selon le nouveau statut
    let activityType = null;
    switch (status) {
      case 'active':
        activityType = ACTIVITY_TYPES.CAMPAIGN_APPROVED;
        break;
      case 'paused':
        activityType = ACTIVITY_TYPES.CAMPAIGN_PAUSED;
        break;
      case 'completed':
        activityType = ACTIVITY_TYPES.CAMPAIGN_COMPLETED;
        break;
    }
    
    if (activityType) {
      await logCampaignActivity(activityType, campaign, user, {
        previousStatus: current,
        newStatus: status,
        changedBy: user?.name || 'Système'
      });
    }
    
    res.json({ message: `Statut changé en ${status}`, campaign });
  } catch (err) {
    next(err);
  }
};
// Récupérer les campagnes d'un annonceur avec stats (vues validées, publications, budget dépensé validé) + pagination
exports.getAdvertiserCampaigns = async (req, res, next) => {
  try {
    const advertiserId =  req.params.advertiserId;
    if (!advertiserId) return res.status(400).json({ message: "ID annonceur manquant" });

    let { page = 1, pageSize = 10 } = req.query;
    page = Number(page);
    pageSize = Number(pageSize);

    // Compter le total
    const totalCount = await Campaign.countDocuments({ advertiser: advertiserId });
    // Paginer les campagnes
    const campaigns = await Campaign.find({ advertiser: advertiserId })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const campaignIds = campaigns.map(c => c._id);
    const Publication = require('../models/AmbassadorCampaign');
    const stats = await Publication.aggregate([
      { $match: { campaign: { $in: campaignIds }, status: 'validated' } },
      { $group: {
          _id: "$campaign",
          totalViews: { $sum: "$views_count" },
          totalClick: { $sum: "$clicks_count" },
          totalPublications: { $sum: 1 },
          totalSpent: { $sum: "$amount_earned" }
        }
      }
    ]);
    const statsMap = {};
    stats.forEach(s => {
      statsMap[s._id.toString()] = s;
    });
    const result = campaigns.map(c => {
      const s = statsMap[c._id.toString()] || {};
      return {
        ...c,
        views: s.totalViews || 0,
        clicks: s.totalClick || 0,
        publications: s.totalPublications || 0,
        spent: s.totalSpent || 0
      };
    });
    res.json({
      totalCount,
      page,
      pageSize: result.length,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
// Mise à jour d'une campagne (supporte upload de média)
exports.updateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    let update = { ...req.body };

    // Si multipart, le client peut envoyer un champ 'data' JSON et un fichier 'media'
    if (req.is('multipart/form-data') && req.body.data) {
      
      update = JSON.parse(req.body.data);
      if(typeof update.target_location === 'string') {
        update.target_location = JSON.parse(update.target_location);
      }
    }
    // On ne permet pas de changer l'annonceur
    delete update.advertiser;
    // Gestion du média
    let media_url = update.media_url;
    if (req.file) {
      const path = require('path');
      const filePath = path.join('uploads', req.file.filename);
      const relPath = '/' + filePath.replace(/\\/g, '/');
      const baseUrl = process.env.MEDIA_BASE_URL || (req.protocol + '://' + req.get('host'));
      const ext = path.extname(req.file.originalname);
      media_url = `${baseUrl}${relPath}`;
      update.media_url = media_url;
    }
    if(typeof update.target_location === 'string') {
        update.target_location = JSON.parse(update.target_location);
      }
    const campaign = await Campaign.findByIdAndUpdate(id, update, { new: true });
    if (!campaign) return res.status(404).json({ message: 'Campagne non trouvée' });
    res.json({ message: 'Campagne modifiée', campaign });
  } catch (err) {
    next(err);
  }
};

// Suppression d'une campagne
exports.deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findByIdAndDelete(id);
    if (!campaign) return res.status(404).json({ message: 'Campagne non trouvée' });
    res.json({ message: 'Campagne supprimée' });
  } catch (err) {
    next(err);
  }
};
// Contrôleur Campaign

// Liste paginée et recherche campagnes
exports.getAllCampaigns = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      : {};
    const count = await require('../models/Campaign').countDocuments(query);
    const docs = await require('../models/Campaign')
      .find(query)
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


const Campaign = require('../models/Campaign');

const path = require('path');
const fs = require('fs');

exports.createCampaign = async (req, res, next) => {
  try {
    let data = req.body;
    // Si multipart, le client peut envoyer un champ 'data' JSON et un fichier 'media'
    if (req.is('multipart/form-data') && req.body.data) {
      data = JSON.parse(req.body.data);
      console.log('Data:', data);
      
    }
    let media_url = data.media_url;
    if (req.file) {
      // Stockage du fichier et génération de l'URL d'accès complet
        const path = require('path');
      const filePath = path.join('uploads', req.file.filename);
      const relPath = '/' + filePath.replace(/\\/g, '/');
      const baseUrl = process.env.MEDIA_BASE_URL || (req.protocol + '://' + req.get('host'));
      const ext = path.extname(req.file.originalname);
      media_url = `${baseUrl}${relPath}`;
     
    }

    const {
      advertiser,
      title,
      description,
      target_link,
      target_location,
      cpv,
      cpc,
      start_date,
      end_date,
      budget,
      location_type
    } = data;
        
    // Validation simple
    if (!advertiser || !title || !target_link || !target_location || (!cpv && !cpc) || !budget) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }
    if (cpv && cpv < 10) {
      return res.status(400).json({ message: 'CPV minimum 10 FCFA' });
    }
    if (cpc && cpc < 20) {
      return res.status(400).json({ message: 'CPC minimum 20 FCFA' });
    }
  /*   if (!['city', 'region', 'radius'].includes(target_location.type)) {
      return res.status(400).json({ message: 'Type de ciblage invalide' });
    } */
    const campaign = await Campaign.create({
      advertiser,
      title,
      description,
      media_url,
      target_link,
      location_type,
      target_location,
      cpv,
      cpc,
      start_date,
      end_date,
      budget,
      status: 'draft'
    });
    res.status(201).json({ message: 'Campagne créée', campaign });
  } catch (err) {
    next(err);
  }
};
