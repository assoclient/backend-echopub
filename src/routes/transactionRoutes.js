const express = require('express');
const router = express.Router();


const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Seuls les admins peuvent voir toutes les transactions
router.get('/', auth, role('admin','superadmin'), transactionController.getAllTransactions);

// Récupérer les transactions de l'utilisateur connecté
router.get('/my-transactions', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    
    const total = await Transaction.countDocuments({ user: userId });
    const transactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize))
      .populate('campaign', 'title');

    res.json({
      totalCount: total,
      page: Number(page),
      pageSize: transactions.length,
      data: transactions
    });
  } catch (err) {
    next(err);
  }
});

// Création d'une transaction (paiement, retrait, etc.)
router.post('/', auth, role('admin', 'advertiser', 'ambassador'), transactionController.createTransaction);

// Mise à jour d'une transaction (admin uniquement)
router.put('/:id', auth, role('admin'), transactionController.updateTransaction);

// Suppression d'une transaction (admin uniquement)
router.delete('/:id', auth, role('admin'), transactionController.deleteTransaction);

// Paiement d'une campagne par un annonceur
router.post('/pay-campaign', auth, async (req, res, next) => {
  try {
    const { campaignId, amount, method, transactionId } = req.body;
    const userId = req.user.id;
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || String(campaign.advertiser) !== String(userId)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    // Crée la transaction
    const tx = await Transaction.create({
      user: userId,
      type: 'payment',
      amount,
      status: 'pending',
      method,
      transactionId,
      campaign: campaignId
    });
    // Ici, tu peux intégrer la logique de paiement réel (mobile money, etc.)
    // Pour la démo, on confirme directement
    tx.status = 'confirmed';
    await tx.save();
    // Met à jour le statut de la campagne si besoin
    campaign.status = 'active';
    await campaign.save();
    res.json({ message: 'Paiement effectué', transaction: tx });
  } catch (err) {
    next(err);
  }
});

// Retrait d'argent par un ambassadeur
router.post('/withdraw', auth, async (req, res, next) => {
  try {
    const { amount, method, transactionId } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user || user.role !== 'ambassador') {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    if (user.balance < amount) {
      return res.status(400).json({ message: 'Solde insuffisant' });
    }
    // Crée la transaction
    const tx = await Transaction.create({
      user: userId,
      type: 'withdrawal',
      amount,
      status: 'pending',
      method,
      transactionId,
      ambassador: userId
    });
    // Ici, tu peux intégrer la logique de retrait réel (mobile money, etc.)
    // Pour la démo, on confirme directement et débite le solde
    tx.status = 'confirmed';
    await tx.save();
    user.balance -= amount;
    await user.save();
    res.json({ message: 'Retrait effectué', transaction: tx });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
