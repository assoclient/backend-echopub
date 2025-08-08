const mongoose = require('mongoose');
const Activity = require('../models/Activity');

// Définir les types d'activités (en accord avec le modèle existant)
const ACTIVITY_TYPES = {
  USER_REGISTERED: 'user_registered',
  AMBASSADOR_JOINED: 'ambassador_joined',
  USER_LOGIN: 'user_login',
  CAMPAIGN_CREATED: 'campaign_created',
  CAMPAIGN_UPDATED: 'campaign_updated',
  CAMPAIGN_DELETED: 'campaign_deleted',
  PUBLICATION_CREATED: 'publication_created',
  PUBLICATION_VALIDATED: 'publication_validated',
  TRANSACTION_CREATED: 'transaction_created',
  PAYMENT_PROCESSED: 'payment_processed',
  ADMIN_ACTION: 'admin_action',
  SETTINGS_UPDATED: 'settings_updated'
};

/**
 * Enregistre une activité utilisateur
 * @param {string} type - Type d'activité (ACTIVITY_TYPES)
 * @param {Object} user - Objet utilisateur
 * @param {Object} metadata - Métadonnées supplémentaires
 * @param {Object} req - Objet request (optionnel, pour IP et User-Agent)
 */
const logUserActivity = async (type, user, metadata = {}, req = null) => {
  try {
    const descriptions = {
      [ACTIVITY_TYPES.USER_REGISTERED]: 'Nouvel utilisateur inscrit',
      [ACTIVITY_TYPES.AMBASSADOR_JOINED]: 'Nouvel ambassadeur rejoint la plateforme',
      [ACTIVITY_TYPES.USER_LOGIN]: 'Connexion utilisateur',
      [ACTIVITY_TYPES.CAMPAIGN_CREATED]: 'Nouvelle campagne créée',
      [ACTIVITY_TYPES.CAMPAIGN_UPDATED]: 'Campagne mise à jour',
      [ACTIVITY_TYPES.CAMPAIGN_DELETED]: 'Campagne supprimée',
      [ACTIVITY_TYPES.PUBLICATION_CREATED]: 'Nouvelle publication créée',
      [ACTIVITY_TYPES.PUBLICATION_VALIDATED]: 'Publication validée',
      [ACTIVITY_TYPES.TRANSACTION_CREATED]: 'Nouvelle transaction créée',
      [ACTIVITY_TYPES.PAYMENT_PROCESSED]: 'Paiement traité',
      [ACTIVITY_TYPES.ADMIN_ACTION]: 'Action administrative effectuée',
      [ACTIVITY_TYPES.SETTINGS_UPDATED]: 'Paramètres mis à jour'
    };

    const activity = new Activity({
      type,
      title: descriptions[type] || 'Activité enregistrée',
      description: `${user.name} (${user.role}) - ${descriptions[type] || 'Activité enregistrée'}`,
      userId: user._id || user.id,
      metadata: {
        ...metadata,
        userId: user._id || user.id,
        userRole: user.role,
        userName: user.name,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.headers?.['user-agent']
      }
    });

    await activity.save();
    
    // Log en console pour le développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ACTIVITY] ${type}: ${user.name} (${user.role})`);
    }
  } catch (error) {
    // Ne pas faire échouer l'application si le logging échoue
    console.error('Erreur lors de l\'enregistrement de l\'activité:', error);
  }
};

/**
 * Récupère les activités d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {number} limit - Nombre d'activités à récupérer
 * @param {number} skip - Nombre d'activités à ignorer
 */
const getUserActivities = async (userId, limit = 50, skip = 0) => {
  try {
    return await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('userId', 'name email role');
  } catch (error) {
    console.error('Erreur lors de la récupération des activités:', error);
    return [];
  }
};

/**
 * Récupère toutes les activités (pour les admins)
 * @param {Object} filters - Filtres optionnels
 * @param {number} limit - Nombre d'activités à récupérer
 * @param {number} skip - Nombre d'activités à ignorer
 */
const getAllActivities = async (filters = {}, limit = 100, skip = 0) => {
  try {
    const query = {};
    
    if (filters.type) {
      query.type = filters.type;
    }
    
    if (filters.userId) {
      query.userId = filters.userId;
    }
    
    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    return await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('userId', 'name email role');
  } catch (error) {
    console.error('Erreur lors de la récupération des activités:', error);
    return [];
  }
};

/**
 * Récupère les statistiques d'activité
 */
const getActivityStats = async () => {
  try {
    const stats = await Activity.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          lastActivity: { $max: '$createdAt' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalActivities = await Activity.countDocuments();
    const todayActivities = await Activity.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    return {
      byType: stats,
      total: totalActivities,
      today: todayActivities
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return { byType: [], total: 0, today: 0 };
  }
};

module.exports = {
  logUserActivity,
  getUserActivities,
  getAllActivities,
  getActivityStats,
  ACTIVITY_TYPES
}; 