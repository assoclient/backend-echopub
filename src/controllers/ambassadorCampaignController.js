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
    
    // Filtre par statut
    if (status) {
      query.status = status;
    }
    
    // Recherche sur le titre de la campagne liée ou nom d'ambassadeur
    let campaignIds = [];
    let ambassadorIds = [];
    
    if (search) {
      // Recherche par titre de campagne
      const campaigns = await Campaign.find({ title: { $regex: search, $options: 'i' } }, '_id');
      campaignIds = campaigns.map(c => c._id);
      
      // Recherche par nom d'ambassadeur
      const ambassadors = await User.find({ 
        name: { $regex: search, $options: 'i' },
        role: 'ambassador'
      }, '_id');
      ambassadorIds = ambassadors.map(a => a._id);
      
      // Combiner les recherches
      if (campaignIds.length > 0 || ambassadorIds.length > 0) {
        query.$or = [];
        if (campaignIds.length > 0) {
          query.$or.push({ campaign: { $in: campaignIds } });
        }
        if (ambassadorIds.length > 0) {
          query.$or.push({ ambassador: { $in: ambassadorIds } });
        }
      }
    }
    
    const count = await AmbassadorCampaign.countDocuments(query);
    const docs = await AmbassadorCampaign.find(query)
      .populate('campaign', 'title description budget')
      .populate('ambassador', 'name email phone')
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

// Valider une publication d'ambassadeur
exports.validatePublication = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const publication = await AmbassadorCampaign.findById(id)
      .populate('ambassador', 'name')
      .populate('campaign', 'title');
    
    if (!publication) {
      return res.status(404).json({
        success: false,
        message: 'Publication non trouvée'
      });
    }
    
    // Vérifier si la publication est déjà validée
    if (publication.status === 'validated') {
      return res.status(400).json({
        success: false,
        message: 'Cette publication est déjà validée'
      });
    }
    
    // Vérifier que les deux preuves sont fournies
    if (!publication.screenshot_url || !publication.screenshot_url2) {
      return res.status(400).json({
        success: false,
        message: 'Les deux preuves (captures) doivent être fournies pour valider la publication'
      });
    }
    
    // Mettre à jour le statut
    publication.status = 'validated';
    publication.validatedAt = new Date();
    publication.validatedBy = req.user.id;
    
    await publication.save();
    
    // Logger l'activité si le service existe
    try {
      const { logPublicationActivity } = require('../utils/activityLogger');
      await logPublicationActivity('PUBLICATION_VALIDATED', publication, req.user, {
        ambassadorName: publication.ambassador?.name || 'Ambassadeur inconnu',
        campaignTitle: publication.campaign?.title || 'Campagne inconnue'
      });
    } catch (error) {
      console.log('Service de logging non disponible:', error.message);
    }
    
    res.json({
      success: true,
      message: 'Publication validée avec succès',
      data: publication
    });
    
  } catch (error) {
    console.error('Erreur lors de la validation de la publication:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation de la publication',
      error: error.message
    });
  }
};
