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
const Transaction = require('../models/Transaction');
const User = require('../models/User');

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
async function calculateAverageViews(ambassador) {
  const allPublications = await AmbassadorCampaign.find({ ambassador: ambassador._id,status: 'validated' });
  const totalViews = allPublications.reduce((sum, pub) => sum + (pub.views_count || 0), 0);
  const totalPublications = allPublications.length;
  const averageViews = totalViews / totalPublications || 0;
  const Ambassador = await User.findById(ambassador._id);
  Ambassador.view_average = averageViews;
  await Ambassador.save();
  return averageViews;
}
// Valider une publication d'ambassadeur
exports.validatePublication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { views_count, comment } = req.body;
    if (!views_count) {
      return res.status(400).json({
        success: false,
        message: 'Le nombre de vues est requis'
      });
    }
    
    const publication = await AmbassadorCampaign.findById(id)
      .populate('ambassador', 'name')
      .populate('campaign', 'title expected_views cpv_ambassador');
    
    if (!publication) {
      return res.status(404).json({
        success: false,
        message: 'Publication non trouvée'
      });
    }
    const ambassador = await User.findById(publication.ambassador);
    if(!ambassador) {
      return res.status(404).json({
        success: false,
        message: 'Ambassadeur non trouvé'
      });
    }

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
    
    const cpv_ambassador = publication.campaign.cpv_ambassador;
    if(publication.campaign.campaign_test) {
      cpv_ambassador = 0;
    }
    const amount_earned = publication.target_views > views_count ? views_count * cpv_ambassador*0.8 : publication.target_views * cpv_ambassador;
    // Mettre à jour le statut
    publication.status = 'validated';
    publication.validatedAt = new Date();
    publication.validatedBy = req.user.id;
    publication.comment = comment;
    publication.views_count = views_count;
    publication.amount_earned = amount_earned;
    ambassador.balance += amount_earned;
    await Transaction.create({
      ambassador: ambassador._id,
      user: ambassador._id,
      amount: amount_earned,
      type: 'payment',
      method: 'cm.echopub',
      status: 'confirmed',
      reference: `TXECHO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}--${publication.campaign._id}`,
      campaign: publication.campaign._id,
      description: `Publication validée: ${publication.campaign.title}`
    });
    await publication.save();
    await ambassador.save();
    calculateAverageViews(ambassador);
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
