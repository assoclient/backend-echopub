const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Route pour obtenir la balance d'un ambassadeur
router.get('/balance/:ambassadorId', async (req, res, next) => {
  try {
    const { ambassadorId } = req.params;
    const user = await User.findById(ambassadorId).select('balance');
    if (!user) return res.status(404).json({ message: 'Ambassadeur non trouvé' });
    res.json({ ambassadorId, balance: user.balance });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
