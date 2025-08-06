const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { changeCampaignStatus } = require('../controllers/campaignController');

// Liste paginée des campagnes actives dans la même zone que l'ambassadeur (ville, région ou radius)
router.get('/active-campaigns', auth, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const ambassador = await User.findById(req.user.id);
    const query = {
      status: 'active',
      end_date: { $gte: new Date() },
      $expr: { $gt: ["$expected_views", "$number_views_assigned"] },
      $or: [
        { 'target_location': { $elemMatch: { value: ambassador.location.city } }},
        { 'target_location': { $elemMatch: { value: ambassador.location.region } } },
      ]
    };
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    // Critère de zone : ville ou région avec $elemMatch
    
    // On combine les campagnes trouvées par query et celles par radius
    let campaigns = await Campaign.find(query).populate('advertiser', 'name')
      .skip(skip)
      .limit(parseInt(pageSize));
   
    const total = campaigns.length;
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
    console.log(result);
    
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
