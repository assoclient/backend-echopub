const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Transaction = require('../models/Transaction');
const Activity = require('../models/Activity');

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