const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
// Routes publiques (si nécessaire)
// router.get('/public/status/:reference', transactionController.checkTransactionStatus);



// Récupérer toutes les transactions (admin seulement)
router.get('/', auth,
  role(['admin', 'superadmin']), 
  transactionController.getAllTransactions
);

// Créer une transaction de dépôt (annonceurs)
router.post('/', auth,
  role('advertiser'), 
  transactionController.createTransaction
);

// Retrait d'argent (ambassadeurs seulement)
router.post('/withdraw', auth,
  role('ambassador'), 
  transactionController.withdrawFunds
);

// Vérifier le statut d'une transaction
router.get('/status/:reference', auth,
  transactionController.checkTransactionStatus
);

// Mettre à jour une transaction (admin seulement)
router.put('/:id', auth,
  role(['admin', 'superadmin']), 
  transactionController.updateTransaction
);

// Supprimer une transaction (admin seulement)
router.delete('/:id', auth,
  role(['admin', 'superadmin']), 
  transactionController.deleteTransaction
);

// Récupérer les transactions d'un utilisateur spécifique
router.get('/user/:userId', auth,
  transactionController.getAllTransactions
);

// Récupérer les transactions d'une campagne spécifique
router.get('/campaign/:campaignId', auth, 
  transactionController.getAllTransactions
);

module.exports = router;
