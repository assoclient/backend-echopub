const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const AmbassadorCampaign = require('../models/AmbassadorCampaign');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { changeCampaignStatus } = require('../controllers/campaignController');

// Liste paginée des campagnes actives dans la même zone que l'ambassadeur (ville, région ou radius)
router.get('/active-campaigns', auth, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const ambassador = await User.findById(req.user.id);
    if(!ambassador) {
      return res.status(404).json({
        success: false,
        message: 'Ambassadeur non trouvé'
      });
    }
    // Trouver les campagnes où l'ambassadeur a déjà participé
    const ambassadorCampaigns = await AmbassadorCampaign.find({
      ambassador: req.user.id
    }).distinct('campaign');
    const publicationsValidated = await AmbassadorCampaign.find({
      ambassador: req.user.id,
      status: 'validated'
    });
    const publications = await AmbassadorCampaign.find({
      ambassador: req.user.id,
    });
    //Gestion de la campagne test
    if(publicationsValidated.length == 0||ambassador.view_average ==0) {
      if(publications.length > 0) {
        return res.status(200).json({
          data: [],
          totalCount: 0,
          campaign_test_ongoing: true,
          page: Number(page),
          pageSize: 0,
          success: true,
          message: 'Vous devez avoir au moins une publication validée pour accéder à cette page'
        });
      }
      const ad = await Campaign.findOne({
        campaign_test: true,
      }).populate('advertiser', 'name');
      const adObject = {...ad.toObject()
        ,expected_views: 100,
        expected_earnings: 0
        }; 
      return res.status(200).json({
        data: [adObject],
        totalCount: 1,
        campaign_test_ongoing: true,
        page: Number(page),
        pageSize: 0,
      });
    }
    console.log('Campagnes déjà participées par l\'ambassadeur:', ambassadorCampaigns);
    
    const query = {
      status: 'active',
      end_date: { $gte: new Date() },
      $expr: { $gt: ["$expected_views", "$number_views_assigned"] },
      // Exclure les campagnes où l'ambassadeur a déjà participé
      _id: { $nin: ambassadorCampaigns },
      $or: [
        { 'target_location': { $elemMatch: { value: ambassador.location.city } }},
        { 'target_location': { $elemMatch: { value: ambassador.location.region } } },
      ]
    };
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    // Compter le total des campagnes disponibles (pour la pagination)
    const total = await Campaign.countDocuments(query);
    
    // Trouver les campagnes disponibles avec pagination
    let campaigns = await Campaign.find(query).populate('advertiser', 'name')
      .skip(skip)
      .limit(parseInt(pageSize));
    const result = campaigns.map(c => ({
      id: c._id,
      title: c.title,
      description: c.description,
      advertiser: {name: c.advertiser.name},
      start_date: c.start_date,
      end_date: c.end_date,
      target_location: c.target_location,
      location_type: c.location_type,
      target_link: c.target_link,
      media_url: c.media_url,
      expected_views: ambassador.view_average < (c.expected_views - c.number_views_assigned) ? ambassador.view_average : (c.expected_views - c.number_views_assigned),
      expected_earnings:Math.round((ambassador.view_average < (c.expected_views - c.number_views_assigned) ? ambassador.view_average : (c.expected_views - c.number_views_assigned)) * c.cpv_ambassador),
      cpv: c.cpv_ambassador,
      cpc: c.cpc,

    }));
    
    console.log(`Ambassadeur ${req.user.id}: ${total} campagnes disponibles, ${campaigns.length} retournées`);
    
    res.json({
      totalCount: total,
      page: Number(page),
      pageSize: campaigns.length,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
