const Activity = require('../models/Activity');

// Types d'activités supportés
const ACTIVITY_TYPES = {
  CAMPAIGN_CREATED: 'campaign_created',
  CAMPAIGN_APPROVED: 'campaign_approved',
  CAMPAIGN_REJECTED: 'campaign_rejected',
  CAMPAIGN_COMPLETED: 'campaign_completed',
  CAMPAIGN_PAUSED: 'campaign_paused',
  PAYMENT_RECEIVED: 'payment_received',
  USER_REGISTERED: 'user_registered',
  AMBASSADOR_JOINED: 'ambassador_joined'
};

// Titres par défaut pour chaque type d'activité
const DEFAULT_TITLES = {
  [ACTIVITY_TYPES.CAMPAIGN_CREATED]: 'Nouvelle campagne créée',
  [ACTIVITY_TYPES.CAMPAIGN_APPROVED]: 'Campagne approuvée',
  [ACTIVITY_TYPES.CAMPAIGN_REJECTED]: 'Campagne rejetée',
  [ACTIVITY_TYPES.CAMPAIGN_COMPLETED]: 'Campagne terminée',
  [ACTIVITY_TYPES.CAMPAIGN_PAUSED]: 'Campagne mise en pause',
  [ACTIVITY_TYPES.PAYMENT_RECEIVED]: 'Paiement reçu',
  [ACTIVITY_TYPES.USER_REGISTERED]: 'Nouvel utilisateur inscrit',
  [ACTIVITY_TYPES.AMBASSADOR_JOINED]: 'Nouvel ambassadeur rejoint'
};

// Descriptions par défaut pour chaque type d'activité
const DEFAULT_DESCRIPTIONS = {
  [ACTIVITY_TYPES.CAMPAIGN_CREATED]: 'Une nouvelle campagne publicitaire a été créée',
  [ACTIVITY_TYPES.CAMPAIGN_APPROVED]: 'Une campagne a été approuvée par l\'administrateur',
  [ACTIVITY_TYPES.CAMPAIGN_REJECTED]: 'Une campagne a été rejetée par l\'administrateur',
  [ACTIVITY_TYPES.CAMPAIGN_COMPLETED]: 'Une campagne a été marquée comme terminée',
  [ACTIVITY_TYPES.CAMPAIGN_PAUSED]: 'Une campagne a été mise en pause temporairement',
  [ACTIVITY_TYPES.PAYMENT_RECEIVED]: 'Un nouveau paiement a été reçu',
  [ACTIVITY_TYPES.USER_REGISTERED]: 'Un nouvel utilisateur s\'est inscrit sur la plateforme',
  [ACTIVITY_TYPES.AMBASSADOR_JOINED]: 'Un nouvel ambassadeur a rejoint la plateforme'
};

/**
 * Créer une nouvelle activité
 * @param {string} type - Type d'activité
 * @param {string} title - Titre de l'activité (optionnel)
 * @param {string} description - Description de l'activité (optionnel)
 * @param {Object} metadata - Métadonnées supplémentaires
 * @param {Object} references - Références aux modèles (userId, adminId, campaignId, etc.)
 */
const createActivity = async (type, title = null, description = null, metadata = {}, references = {}) => {
  try {
    // Vérifier que le type est valide
    if (!Object.values(ACTIVITY_TYPES).includes(type)) {
      console.error(`Type d'activité invalide: ${type}`);
      return null;
    }

    // Utiliser les titres et descriptions par défaut si non fournis
    const activityTitle = title || DEFAULT_TITLES[type];
    const activityDescription = description || DEFAULT_DESCRIPTIONS[type];

    const activityData = {
      type,
      title: activityTitle,
      description: activityDescription,
      metadata,
      ...references
    };

    const activity = new Activity(activityData);
    await activity.save();

    console.log(`✅ Activité créée: ${activityTitle} (${type})`);
    return activity;

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'activité:', error);
    return null;
  }
};

/**
 * Créer une activité pour une campagne
 */
const logCampaignActivity = async (type, campaign, user = null, additionalMetadata = {}) => {
  const metadata = {
    campaignTitle: campaign.title,
    campaignId: campaign._id,
    ...additionalMetadata
  };

  const references = {
    campaignId: campaign._id,
    userId: user?._id || campaign.advertiser
  };

  return await createActivity(type, null, null, metadata, references);
};

/**
 * Créer une activité pour un utilisateur
 */
const logUserActivity = async (type, user, additionalMetadata = {}) => {
  const metadata = {
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    ...additionalMetadata
  };

  const references = {
    userId: user._id
  };

  return await createActivity(type, null, null, metadata, references);
};

/**
 * Créer une activité pour un paiement
 */
const logPaymentActivity = async (transaction, additionalMetadata = {}) => {
  const metadata = {
    amount: transaction.amount,
    paymentMethod: transaction.paymentMethod,
    ...additionalMetadata
  };

  const references = {
    transactionId: transaction._id,
    userId: transaction.user
  };

  return await createActivity(ACTIVITY_TYPES.PAYMENT_RECEIVED, null, null, metadata, references);
};
const getNumberOfDayBeetweenDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
module.exports = {
  ACTIVITY_TYPES,
  createActivity,
  logCampaignActivity,
  logUserActivity,
  logPaymentActivity,
  getNumberOfDayBeetweenDates
}; 