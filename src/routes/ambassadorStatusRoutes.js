const express = require('express');
const router = express.Router();
const AmbassadorCampaign = require('../models/AmbassadorCampaign');
const auth = require('../middleware/auth');

// Liste paginée des statuts publiés par l'ambassadeur connecté
router.get('/my-publications', auth, async (req, res, next) => {
  try {
    const ambassadorId = req.user.id;
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const total = await AmbassadorCampaign.countDocuments({ ambassador: ambassadorId });
    const statuses = await AmbassadorCampaign.find({ ambassador: ambassadorId })
      .populate('campaign', '_id title')
      .select('campaign status screenshot_url screenshot_url2 views_count clicks_count amount_earned createdAt updatedAt')
      .skip(skip)
      .sort({createdAt: -1})
      .limit(parseInt(pageSize));
    res.json({
      totalCount: total,
      page: Number(page),
      pageSize: statuses.length,
      data :statuses
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
