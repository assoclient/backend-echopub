const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Liste paginée des campagnes actives dans la même zone que l'ambassadeur (ville, région ou radius)
router.get('/active-campaigns', auth, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const ambassador = await User.findById(req.user.id);
    const query = {
      status: 'active',
      end_date: { $gte: new Date() }
    };
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    // Critère de zone : ville ou région avec $elemMatch
    if (ambassador.location && ambassador.location.city) {
      query['location_type'] = 'city';
      query['target_location'] = { $elemMatch: { value: ambassador.location.city } };
    } else if (ambassador.location && ambassador.location.region) {
      query['location_type'] = 'region';
      query['target_location'] = { $elemMatch: { value: ambassador.location.region } };
    }
    
    // On combine les campagnes trouvées par query et celles par radius
    let campaigns = await Campaign.find(query).populate('advertiser', 'name')
      .skip(skip)
      .limit(parseInt(pageSize));
   
    const total = campaigns.length;
    res.json({
      totalCount: total,
      page: Number(page),
      pageSize: campaigns.length,
      data: campaigns
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
