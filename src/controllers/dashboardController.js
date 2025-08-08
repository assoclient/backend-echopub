const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Transaction = require('../models/Transaction');
const Activity = require('../models/Activity');
const AmbassadorCampaign = require('../models/AmbassadorCampaign');

// Récupérer les statistiques du dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    // Statistiques des utilisateurs
    const totalUsers = await User.countDocuments();
    const totalAdvertisers = await User.countDocuments({ role: 'advertiser' });
    const totalAmbassadors = await User.countDocuments({ role: 'ambassador' });

    // Statistiques des campagnes
    const totalCampaigns = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });
    const pendingCampaigns = await Campaign.countDocuments({ status: 'pending' });
    const completedCampaigns = await Campaign.countDocuments({ status: 'completed' });
    const pausedCampaigns = await Campaign.countDocuments({ status: 'paused' });

    // Statistiques financières
    const totalRevenue = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyRevenue = await Transaction.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { 
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
          } 
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Activités récentes
    const recentActivities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .populate('campaignId', 'title')
      .populate('transactionId', 'amount');

    // Statistiques par statut de campagne
    const campaignStatusStats = [
      { status: 'active', count: activeCampaigns },
      { status: 'pending', count: pendingCampaigns },
      { status: 'completed', count: completedCampaigns },
      { status: 'paused', count: pausedCampaigns }
    ];

    // Revenus des 6 derniers mois
    const monthlyRevenueData = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);

    const stats = {
      users: {
        total: totalUsers,
        advertisers: totalAdvertisers,
        ambassadors: totalAmbassadors
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
        pending: pendingCampaigns,
        completed: completedCampaigns,
        paused: pausedCampaigns,
        byStatus: campaignStatusStats
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        monthly: monthlyRevenue[0]?.total || 0,
        monthlyData: monthlyRevenueData
      },
      activities: recentActivities
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

// Créer une nouvelle activité
exports.createActivity = async (activityData) => {
  try {
    const activity = new Activity(activityData);
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Erreur lors de la création de l\'activité:', error);
    throw error;
  }
};

// Marquer une activité comme lue
exports.markActivityAsRead = async (req, res) => {
  try {
    const { activityId } = req.params;
    
    const activity = await Activity.findByIdAndUpdate(
      activityId,
      { isRead: true },
      { new: true }
    );

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activité non trouvée'
      });
    }

    res.json({
      success: true,
      data: activity
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'activité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'activité',
      error: error.message
    });
  }
};

// Marquer toutes les activités comme lues
exports.markAllActivitiesAsRead = async (req, res) => {
  try {
    await Activity.updateMany(
      { isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'Toutes les activités ont été marquées comme lues'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour des activités:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des activités',
      error: error.message
    });
  }
}; 

// Récupérer les statistiques du dashboard pour un annonceur
exports.getAdvertiserDashboardStats = async (req, res) => {
  try {
    const advertiserId = req.user.id;

    // Statistiques des campagnes de l'annonceur
    const totalCampaigns = await Campaign.countDocuments({ advertiser: advertiserId });
    const activeCampaigns = await Campaign.countDocuments({ advertiser: advertiserId, status: 'active' });
    const draftCampaigns = await Campaign.countDocuments({ advertiser: advertiserId, status: 'draft' });
    const completedCampaigns = await Campaign.countDocuments({ advertiser: advertiserId, status: 'completed' });
    const pausedCampaigns = await Campaign.countDocuments({ advertiser: advertiserId, status: 'paused' });
    const submittedCampaigns = await Campaign.countDocuments({ advertiser: advertiserId, status: 'submitted' });

    // Récupérer toutes les campagnes de l'annonceur avec leurs statistiques
    const campaigns = await Campaign.find({ advertiser: advertiserId }).lean();
    const campaignIds = campaigns.map(c => c._id);

    // Statistiques des publications et ambassadeurs
    const ambassadorStats = await AmbassadorCampaign.aggregate([
      { $match: { campaign: { $in: campaignIds } } },
      { $group: {
        _id: null,
        totalAmbassadors: { $addToSet: '$ambassador' },
        totalViews: { $sum: '$views_count' },
        totalClicks: { $sum: '$clicks_count' },
        totalSpent: { $sum: '$amount_earned' }
      }}
    ]);

    const stats = ambassadorStats[0] || {};
    const uniqueAmbassadors = stats.totalAmbassadors ? stats.totalAmbassadors.length : 0;

    // Top 5 campagnes les plus virales (par vues)
    const topViralAds = await Campaign.aggregate([
      { $match: { advertiser: advertiserId } },
      {
        $lookup: {
          from: 'ambassadorcampaigns',
          localField: '_id',
          foreignField: 'campaign',
          as: 'publications'
        }
      },
      {
        $addFields: {
          totalViews: { $sum: '$publications.views_count' },
          totalClicks: { $sum: '$publications.clicks_count' },
          ambassadorCount: { $size: '$publications' }
        }
      },
      { $sort: { totalViews: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 1,
          title: 1,
          status: 1,
          totalViews: 1,
          totalClicks: 1,
          ambassadorCount: 1,
          budget: 1,
          expected_views: 1
        }
      }
    ]);

    // Calculer le taux d'engagement pour chaque campagne virale
    const topViralAdsWithEngagement = topViralAds.map(ad => {
      const engagementRate = ad.expected_views > 0 
        ? Math.round((ad.totalViews / ad.expected_views) * 100)
        : 0;
      return {
        ...ad,
        engagementRate: Math.min(engagementRate, 100)
      };
    });

    // Campagnes récentes (5 dernières)
    const recentCampaigns = await Campaign.find({ advertiser: advertiserId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Calculer les statistiques pour chaque campagne récente
    const recentCampaignsWithStats = await Promise.all(
      recentCampaigns.map(async (campaign) => {
        const publications = await AmbassadorCampaign.find({ campaign: campaign._id });
        const totalViews = publications.reduce((sum, pub) => sum + (pub.views_count || 0), 0);
        const totalClicks = publications.reduce((sum, pub) => sum + (pub.clicks_count || 0), 0);
        const progress = campaign.expected_views > 0 
          ? Math.round((totalViews / campaign.expected_views) * 100)
          : 0;

        return {
          ...campaign,
          views: totalViews,
          clicks: totalClicks,
          progress: Math.min(progress, 100)
        };
      })
    );

    const dashboardStats = {
      stats: {
        totalCampaigns,
        activeCampaigns,
        totalAmbassadors: uniqueAmbassadors,
        totalViews: stats.totalViews || 0,
        totalSpent: stats.totalSpent || 0
      },
      topViralAds: topViralAdsWithEngagement,
      recentCampaigns: recentCampaignsWithStats
    };
   //console.log('🔍 Debug - dashboardStats:', dashboardStats)
    res.json({
      success: true,
      data: dashboardStats
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques annonceur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
}; 

// Récupérer les rapports détaillés pour les admins
exports.getDetailedReports = async (req, res) => {
  try {
    const { period = 30, startDate, endDate } = req.query;
    
    // Calculer les dates de filtrage
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));
      dateFilter = {
        createdAt: { $gte: daysAgo }
      };
    }

    // Statistiques des utilisateurs
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments(dateFilter);
    const activeUsers = await User.countDocuments({ 
      ...dateFilter,
      lastLoginAt: { $exists: true, $ne: null }
    });
    const retentionRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    // Statistiques des campagnes
    const totalCampaigns = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });
    const campaignsInPeriod = await Campaign.countDocuments(dateFilter);
    
    // Calculer le taux de conversion (campagnes actives / total)
    const conversionRate = totalCampaigns > 0 ? Math.round((activeCampaigns / totalCampaigns) * 100) : 0;

    // Statistiques financières
    const totalRevenue = await Transaction.aggregate([
      { $match: { status: 'confirmed', ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyRevenue = await Transaction.aggregate([
      { 
        $match: { 
          status: 'confirmed',
          createdAt: { 
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
          } 
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Calculer les commissions plateforme (25% des transactions)
    const platformCommission = totalRevenue[0]?.total ? Math.round(totalRevenue[0].total * 0.25) : 0;
    const ambassadorPayments = totalRevenue[0]?.total ? Math.round(totalRevenue[0].total * 0.75) : 0;

    // Statistiques des vues
    const totalViews = await AmbassadorCampaign.aggregate([
      { $group: { _id: null, total: { $sum: '$views_count' } } }
    ]);

    const monthlyViews = await AmbassadorCampaign.aggregate([
      { 
        $match: { 
          createdAt: { 
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
          } 
        } 
      },
      { $group: { _id: null, total: { $sum: '$views_count' } } }
    ]);

    // Calculer le CTR moyen
    const totalClicks = await AmbassadorCampaign.aggregate([
      { $group: { _id: null, total: { $sum: '$clicks_count' } } }
    ]);

    const averageCTR = totalViews[0]?.total && totalClicks[0]?.total 
      ? Math.round((totalClicks[0].total / totalViews[0].total) * 100 * 100) / 100 
      : 0;

    // Top 10 des annonceurs
    const topAdvertisers = await Campaign.aggregate([
      {
        $lookup: {
          from: 'ambassadorcampaigns',
          localField: '_id',
          foreignField: 'campaign',
          as: 'publications'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'advertiser',
          foreignField: '_id',
          as: 'advertiser'
        }
      },
      {
        $addFields: {
          advertiserName: { $arrayElemAt: ['$advertiser.name', 0] },
          totalViews: { $sum: '$publications.views_count' },
          totalSpent: '$budget'
        }
      },
      {
        $group: {
          _id: '$advertiser',
          name: { $first: '$advertiserName' },
          campaigns: { $sum: 1 },
          spent: { $sum: '$totalSpent' },
          views: { $sum: '$totalViews' }
        }
      },
      { $sort: { spent: -1 } },
      { $limit: 10 }
    ]);

    // Top 10 des ambassadeurs
    const topAmbassadors = await AmbassadorCampaign.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'ambassador',
          foreignField: '_id',
          as: 'ambassador'
        }
      },
      {
        $addFields: {
          ambassadorName: { $arrayElemAt: ['$ambassador.name', 0] },
          publications: 1,
          earnings: '$amount_earned',
          clicks: '$clicks_count'
        }
      },
      {
        $group: {
          _id: '$ambassador',
          name: { $first: '$ambassadorName' },
          publications: { $sum: 1 },
          earnings: { $sum: '$earnings' },
          clicks: { $sum: '$clicks' }
        }
      },
      { $sort: { earnings: -1 } },
      { $limit: 10 }
    ]);

    // Évolution des revenus (6 derniers mois)
    const revenueEvolution = await Transaction.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);

    // Répartition des campagnes par statut
    const campaignStatusDistribution = await Campaign.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const reports = {
      stats: {
        totalUsers,
        newUsers,
        activeUsers,
        retentionRate,
        totalCampaigns,
        activeCampaigns,
        campaignsInPeriod,
        conversionRate,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        totalViews: totalViews[0]?.total || 0,
        monthlyViews: monthlyViews[0]?.total || 0,
        platformCommission,
        ambassadorPayments,
        averageCTR
      },
      topAdvertisers: topAdvertisers.map((advertiser, index) => ({
        rank: index + 1,
        name: advertiser.name || 'Annonceur inconnu',
        campaigns: advertiser.campaigns,
        spent: advertiser.spent,
        views: advertiser.views
      })),
      topAmbassadors: topAmbassadors.map((ambassador, index) => ({
        rank: index + 1,
        name: ambassador.name || 'Ambassadeur inconnu',
        publications: ambassador.publications,
        earnings: ambassador.earnings,
        clicks: ambassador.clicks
      })),
      charts: {
        revenueEvolution,
        campaignStatusDistribution
      }
    };

    res.json({
      success: true,
      data: reports
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des rapports:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rapports',
      error: error.message
    });
  }
}; 

// Récupérer les rapports détaillés pour les admins
exports.getDetailedReports = async (req, res) => {
  try {
    const { period = 30, startDate, endDate } = req.query;
    
    // Calculer les dates de filtrage
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));
      dateFilter = {
        createdAt: { $gte: daysAgo }
      };
    }

    // Statistiques des utilisateurs
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments(dateFilter);
    const activeUsers = await User.countDocuments({ 
      ...dateFilter,
      lastLoginAt: { $exists: true, $ne: null }
    });
    const retentionRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    // Statistiques des campagnes
    const totalCampaigns = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: 'active' });
    const campaignsInPeriod = await Campaign.countDocuments(dateFilter);
    
    // Calculer le taux de conversion (campagnes actives / total)
    const conversionRate = totalCampaigns > 0 ? Math.round((activeCampaigns / totalCampaigns) * 100) : 0;

    // Statistiques financières
    const totalRevenue = await Transaction.aggregate([
      { $match: { status: 'confirmed', ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyRevenue = await Transaction.aggregate([
      { 
        $match: { 
          status: 'confirmed',
          createdAt: { 
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
          } 
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Calculer les commissions plateforme (25% des transactions)
    const platformCommission = totalRevenue[0]?.total ? Math.round(totalRevenue[0].total * 0.25) : 0;
    const ambassadorPayments = totalRevenue[0]?.total ? Math.round(totalRevenue[0].total * 0.75) : 0;

    // Statistiques des vues
    const totalViews = await AmbassadorCampaign.aggregate([
      { $group: { _id: null, total: { $sum: '$views_count' } } }
    ]);

    const monthlyViews = await AmbassadorCampaign.aggregate([
      { 
        $match: { 
          createdAt: { 
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
          } 
        } 
      },
      { $group: { _id: null, total: { $sum: '$views_count' } } }
    ]);

    // Calculer le CTR moyen
    const totalClicks = await AmbassadorCampaign.aggregate([
      { $group: { _id: null, total: { $sum: '$clicks_count' } } }
    ]);

    const averageCTR = totalViews[0]?.total && totalClicks[0]?.total 
      ? Math.round((totalClicks[0].total / totalViews[0].total) * 100 * 100) / 100 
      : 0;

    // Top 10 des annonceurs
    const topAdvertisers = await Campaign.aggregate([
      {
        $lookup: {
          from: 'ambassadorcampaigns',
          localField: '_id',
          foreignField: 'campaign',
          as: 'publications'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'advertiser',
          foreignField: '_id',
          as: 'advertiser'
        }
      },
      {
        $addFields: {
          advertiserName: { $arrayElemAt: ['$advertiser.name', 0] },
          totalViews: { $sum: '$publications.views_count' },
          totalSpent: '$budget'
        }
      },
      {
        $group: {
          _id: '$advertiser',
          name: { $first: '$advertiserName' },
          campaigns: { $sum: 1 },
          spent: { $sum: '$totalSpent' },
          views: { $sum: '$totalViews' }
        }
      },
      { $sort: { spent: -1 } },
      { $limit: 10 }
    ]);

    // Top 10 des ambassadeurs
    const topAmbassadors = await AmbassadorCampaign.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'ambassador',
          foreignField: '_id',
          as: 'ambassador'
        }
      },
      {
        $addFields: {
          ambassadorName: { $arrayElemAt: ['$ambassador.name', 0] },
          publications: 1,
          earnings: '$amount_earned',
          clicks: '$clicks_count'
        }
      },
      {
        $group: {
          _id: '$ambassador',
          name: { $first: '$ambassadorName' },
          publications: { $sum: 1 },
          earnings: { $sum: '$earnings' },
          clicks: { $sum: '$clicks' }
        }
      },
      { $sort: { earnings: -1 } },
      { $limit: 10 }
    ]);

    // Évolution des revenus (6 derniers mois)
    const revenueEvolution = await Transaction.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);

    // Répartition des campagnes par statut
    const campaignStatusDistribution = await Campaign.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const reports = {
      stats: {
        totalUsers,
        newUsers,
        activeUsers,
        retentionRate,
        totalCampaigns,
        activeCampaigns,
        campaignsInPeriod,
        conversionRate,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        totalViews: totalViews[0]?.total || 0,
        monthlyViews: monthlyViews[0]?.total || 0,
        platformCommission,
        ambassadorPayments,
        averageCTR
      },
      topAdvertisers: topAdvertisers.map((advertiser, index) => ({
        rank: index + 1,
        name: advertiser.name || 'Annonceur inconnu',
        campaigns: advertiser.campaigns,
        spent: advertiser.spent,
        views: advertiser.views
      })),
      topAmbassadors: topAmbassadors.map((ambassador, index) => ({
        rank: index + 1,
        name: ambassador.name || 'Ambassadeur inconnu',
        publications: ambassador.publications,
        earnings: ambassador.earnings,
        clicks: ambassador.clicks
      })),
      charts: {
        revenueEvolution,
        campaignStatusDistribution
      }
    };

    res.json({
      success: true,
      data: reports
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des rapports:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rapports',
      error: error.message
    });
  }
}; 