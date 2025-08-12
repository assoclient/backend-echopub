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

// Détails d'une campagne pour l'annonceur connecté avec ses publications
exports.getMyCampaignDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const advertiserId = req.user.id;
    
    const Campaign = require('../models/Campaign');
    const AmbassadorCampaign = require('../models/AmbassadorCampaign');
    
    // Vérifier que la campagne appartient à l'annonceur connecté
    const campaign = await Campaign.findOne({ _id: id, advertiser: advertiserId }).lean();
    if (!campaign) {
      return res.status(404).json({ message: 'Campagne non trouvée ou accès non autorisé' });
    }

    // Récupérer toutes les publications liées à cette campagne
    const publications = await AmbassadorCampaign.find({ campaign: id })
      .populate('ambassador', 'name phone email')
      .sort({ createdAt: -1 });

    // Calculer les stats globales
    let totalViews = 0;
    let totalClicks = 0;
    let totalPublications = 0;
    
    publications.forEach(pub => {
      totalViews += pub.views_count || 0;
      totalClicks += pub.clicks_count || 0;
      if (pub.status === 'approved' || pub.status === 'pending') {
        totalPublications++;
      }
    });

    // Formatage des publications avec les preuves
    const formattedPublications = publications.map(pub => ({
      _id: pub._id,
      ambassador_name: pub.ambassador?.name || 'Ambassadeur inconnu',
      ambassador_phone: pub.ambassador?.phone || '',
      ambassador_email: pub.ambassador?.email || '',
      views: pub.views_count || 0,
      clicks: pub.clicks_count || 0,
      proof1: pub.screenshot_url,
      proof2: pub.screenshot_url2,
      createdAt: pub.createdAt,
      status: pub.status,
      publication_url: pub.publication_url || ''
    }));

    res.json({
      campaign: {
        ...campaign,
        total_views: totalViews,
        total_clicks: totalClicks,
        total_publications: totalPublications
      },
      publications: formattedPublications
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des détails de la campagne:', err);
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
      if (!user || (user.role !== 'admin'&& user.role !== 'superadmin')) {
        return res.status(403).json({ message: 'Seul l\'administrateur peut activer la campagne.' });
      }
    }
    if (current === 'active' && (status === 'paused' || status === 'completed')) {
      // L'annonceur propriétaire ou l'admin peut mettre en pause ou terminer
      if (!user || (user.role !== 'advertiser' && user.role !== 'admin') || 
          (user.role === 'advertiser' && user.id.toString() !== campaign.advertiser.toString())) {
        return res.status(403).json({ message: 'Accès non autorisé pour modifier le statut de cette campagne.' });
      }
    }
    if (current === 'paused' && status === 'active') {
      // L'annonceur propriétaire ou l'admin peut réactiver
      if (!user || (user.role !== 'advertiser' && user.role !== 'admin') || 
          (user.role === 'advertiser' && user.id.toString() !== campaign.advertiser.toString())) {
        return res.status(403).json({ message: 'Accès non autorisé pour réactiver cette campagne.' });
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

// Récupérer les campagnes de l'annonceur connecté avec stats et pagination
exports.getMyCampaigns = async (req, res, next) => {
  try {
    const advertiserId = req.user.id; // ID de l'annonceur connecté
    if (!advertiserId) return res.status(401).json({ message: "Utilisateur non authentifié" });

    let { page = 1, pageSize = 10, search = '', status = '', sortBy = 'createdAt' } = req.query;
    page = Number(page);
    pageSize = Number(pageSize);

    // Construire la requête de base
    let query = { advertiser: advertiserId };
    
    // Ajouter le filtre de recherche
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Ajouter le filtre de statut
    if (status) {
      query.status = status;
    }

    // Compter le total
    const totalCount = await Campaign.countDocuments(query);
    
    // Construire la requête de tri
    let sortQuery = {};
    switch (sortBy) {
      case 'budget':
        sortQuery.budget = -1;
        break;
      case 'views':
        sortQuery.expected_views = -1;
        break;
      case 'clicks':
        sortQuery.expected_views = -1; // Fallback, sera remplacé par les stats
        break;
      default:
        sortQuery.createdAt = -1;
    }

    // Paginer les campagnes
    const campaigns = await Campaign.find(query)
      .sort(sortQuery)
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
        spent: s.totalSpent || 0,
        progress: c.expected_views > 0 ? Math.min(100, Math.round((s.totalViews || 0) / c.expected_views * 100)) : 0
      };
    });

    // Tri côté serveur si nécessaire
    if (sortBy === 'views' || sortBy === 'clicks') {
      result.sort((a, b) => {
        if (sortBy === 'views') return b.views - a.views;
        if (sortBy === 'clicks') return b.clicks - a.clicks;
        return 0;
      });
    }

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
    let campaign = await Campaign.findById(id); 
    const Settings = require('../models/Settings');
    const settings = await Settings.findOne()
    if (!campaign) return res.status(404).json({ message: 'Campagne non trouvée' });
    if(campaign.status !== 'draft') return res.status(400).json({ message: 'La campagne n\'est pas en état de brouillon' });
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
      media_url = `${baseUrl}${relPath}`;
      update.media_url = media_url;
    } 
    if(typeof update.target_location === 'string') {
      update.target_location = JSON.parse(update.target_location);
    }
    const expected_views = Math.floor(update.budget / settings.payment.cpv);
    campaign = await Campaign.findByIdAndUpdate(id, update, { new: true });
    campaign.expected_views = expected_views;
    await campaign.save();
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

// Liste paginée et recherche campagnes avec statistiques
exports.getAllCampaigns = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, search = '', advertiser = '', status = '', sortBy = 'createdAt' } = req.query;
    
    // Debug logging
    console.log('🔍 getAllCampaigns - Query params:', { page, pageSize, search, advertiser, status, sortBy });
    
    // Construire la requête MongoDB
    let query = {};
    
    // Filtre de recherche
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filtre par annonceur
    if (advertiser) {
      // Rechercher par nom d'annonceur (après population)
      // On va d'abord récupérer les campagnes puis filtrer côté serveur
    }
    
    // Filtre par statut
    if (status) {
      query.status = status;
    }
    
    console.log('🔍 getAllCampaigns - MongoDB query:', JSON.stringify(query, null, 2));
    
    const Campaign = require('../models/Campaign');
    const AmbassadorCampaign = require('../models/AmbassadorCampaign');
    
    // Compter le total avec les filtres de base
    const count = await Campaign.countDocuments(query);
    console.log('🔍 getAllCampaigns - Total count:', count);
    
    // Construire la requête de tri
    let sortQuery = {};
    switch (sortBy) {
      case 'budget':
        sortQuery.budget = -1;
        break;
      case 'views':
        sortQuery.expected_views = -1;
        break;
      case 'clicks':
        sortQuery.expected_views = -1;
        break;
      case 'advertiser':
        sortQuery.advertiser = 1;
        break;
      case 'createdAt':
      default:
        sortQuery.createdAt = -1;
    }
    
    // Ajouter le tri par statut en priorité
    sortQuery = { status: -1, ...sortQuery };
    
    const campaigns = await Campaign
      .find(query)
      .populate('advertiser', 'name')
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize))
      .sort(sortQuery)
      .lean();
    
    console.log('🔍 getAllCampaigns - Found campaigns:', campaigns.length);

    // Ajouter les statistiques et transactions pour chaque campagne
    let campaignsWithStats = await Promise.all(
      campaigns.map(async (campaign) => {
        const publications = await AmbassadorCampaign.find({ campaign: campaign._id });
        const totalViews = publications.reduce((sum, pub) => sum + (pub.views_count || 0), 0);
        const totalClicks = publications.reduce((sum, pub) => sum + (pub.clicks_count || 0), 0);
        const ambassadorCount = publications.length;

        // Récupérer la transaction associée à cette campagne
        const Transaction = require('../models/Transaction');
        const transaction = await Transaction.findOne({ 
          campaign: campaign._id, 
          type: 'deposit' 
        }).lean();

        return {
          ...campaign,
          advertiser: campaign.advertiser?.name || 'Annonceur inconnu',
          views: totalViews,
          clicks: totalClicks,
          ambassadorCount,
          transaction: transaction || null
        };
      })
    );

    // Appliquer le filtre par annonceur après population
    if (advertiser) {
      campaignsWithStats = campaignsWithStats.filter(campaign => 
        campaign.advertiser && campaign.advertiser.toLowerCase().includes(advertiser.toLowerCase())
      );
      console.log('🔍 getAllCampaigns - Après filtre annonceur:', campaignsWithStats.length);
    }

    // Debug logging pour la réponse
    console.log('🔍 getAllCampaigns - Response data:', {
      totalCount: count,
      page: Number(page),
      pageSize: campaignsWithStats.length,
      dataLength: campaignsWithStats.length,
      filtersApplied: { search, advertiser, status, sortBy }
    });

    // Retourner la réponse avec le bon statut
    return res.status(200).json({
      totalCount: count,
      page: Number(page),
      pageSize: campaignsWithStats.length,
      data: campaignsWithStats
    });
    
  } catch (err) {
    next(err);
  }
};


const Campaign = require('../models/Campaign');

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
     // Récupérer les paramètres de la plateforme pour les CPV
     const Settings = require('../models/Settings');
     const settings = await Settings.findOne() || await Settings.create({}); 
    data.expected_views = Math.floor(data.budget / settings.payment.cpv);
    const {
      title,
      description,
      target_link,
      target_location,
      start_date,
      end_date,
      budget,
      location_type,
      expected_views
    } = data;
    
    // Récupérer l'ID de l'annonceur depuis l'utilisateur connecté
    const advertiser = req.user.id;
    
   
    const cpv = settings.payment.cpv;
    const cpv_ambassador = settings.payment.cpv_ambassador;
        
    // Validation simple
    if (!title || !target_link || !target_location || !budget) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }
    
    const campaign = await Campaign.create({
      advertiser,
      title,
      description,
      media_url,
      target_link,
      location_type,
      target_location,
      cpv,
      cpv_ambassador,
      start_date,
      end_date,
      budget,
      expected_views,
      status: 'draft'
    });
    res.status(201).json({ message: 'Campagne créée', campaign });
  } catch (err) {
    next(err);
  }
};
