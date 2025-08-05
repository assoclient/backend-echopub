// Mise à jour d'une transaction
exports.updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };
    const tx = await Transaction.findByIdAndUpdate(id, update, { new: true });
    if (!tx) return res.status(404).json({ message: 'Transaction non trouvée' });
    res.json({ message: 'Transaction modifiée', transaction: tx });
  } catch (err) {
    next(err);
  }
};

// Suppression d'une transaction
exports.deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tx = await Transaction.findByIdAndDelete(id);
    if (!tx) return res.status(404).json({ message: 'Transaction non trouvée' });
    res.json({ message: 'Transaction supprimée' });
  } catch (err) {
    next(err);
  }
};
// Contrôleur Transaction

// Liste paginée et recherche transactions (par type ou status)

const Transaction = require('../models/Transaction');

exports.getAllTransactions = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const query = search
      ? {
          $or: [
            { type: { $regex: search, $options: 'i' } },
            { status: { $regex: search, $options: 'i' } }
          ]
        }
      : {};
    const count = await Transaction.countDocuments(query);
    const docs = await Transaction.find(query)
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize));
    res.json({
      totalCount: count,
      page: Number(page),
      pageSize: docs.length,
      data: docs
    });
  } catch (err) {
    next(err);
  }
};

const  NotchPayAPI  = require('notchpay.js');
const { initializePayment, processPayment, getPaymentStatus } = require('../services/payment');

// Initialize with your secret key
console.log('Initializing NotchPay API with secret key',typeof NotchPayAPI);

const notchpay = NotchPayAPI(
  'pk_test.xwcFiZUW9ON89f4coesL0KZFbl02unjQIobd0ucleFr8BFJGRMpVdXjSO0h9w9vNfOkCJHz9XiLacjPrhhR3BKPnkzDevuMbZKD5pW3Ethaxcw0sG2DfcAFgHBpAK',
   { debug : true, } 
);
// Création d'une transaction
exports.createTransaction = async (req, res, next) => {
   try {
       const { user, type, method,campaign,paymentData } = req.body;
    if (!user || !type || !method) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }
    const User = require('../models/User');
    const userExists = await User.findById(user); 
    if (!userExists) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    const Campaign = require('../models/Campaign');
    const campaignExists = await Campaign.findById(campaign);
    if (!campaignExists) {
      return res.status(400).json({ message: 'Campagne obligatoire pour les transactions' });
    }

    if (!['deposit'].includes(type)) {
      return res.status(400).json({ message: 'Type de transaction invalide' });
    }
   
    if (method !== 'cm.orange' && method !== 'cm.mtn') {
      return res.status(400).json({ message: 'Méthode de paiement invalide' });
    }
     const reference = `TXECHO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}--${campaign}`;
     const body ={
                amount: campaignExists.budget,
                currency: 'XAF',
                customer: {
                  email: userExists.email,
                  name: userExists.name
                },
                reference,
                type,
                method,
                description: `Payment for Transaction ${reference}`
              }
    //console.log('Initializing payment with body:', body);
    const initPayment = await initializePayment(body, userExists);
    if(initPayment?.status){
      return res.status(400).json({ message: 'Payment already initialized', status: false });
    }
    const processedPayment = await processPayment(initPayment.transaction.transactionId, method,paymentData,campaign);
   // console.log('Processed Payment:', processedPayment);
         
    if (!processedPayment?.status) {
      return res.status(400).json({ message: 'Payment processing failed', status: false });
    }
    await new Promise(resolve => setTimeout(resolve, 15000)); // Attendre 10 secondes pour simuler le traitement du paiement
    let paymentStatus = await getPaymentStatus(initPayment.transaction.transactionId);
    console.log('Final Payment Status 1:', paymentStatus);
    if (paymentStatus?.status && paymentStatus?.data?.transaction?.status !== 'complete') {
      await new Promise(resolve => setTimeout(resolve, 15000)); // Attendre 5 secondes avant de vérifier à nouveau
      paymentStatus =await getPaymentStatus(initPayment.transaction.transactionId);  
    }
    console.log('Final Payment Status:', paymentStatus);
     
    if (!paymentStatus?.status|| paymentStatus?.data?.transaction.status !== 'complete' ) {
      return res.status(400).json({ message: 'Payment failed', status: false });
    } 
    campaignExists.status = 'submitted';
    await campaignExists.save();
    const transaction = await Transaction.findById(initPayment.transaction._id);
    if (transaction) {
        transaction.status = 'confirmed';
        await transaction.save();
      }
    return res.status(200).json({message: 'Transaction créée', transaction: initPayment.transaction, paymentStatus });
   
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
 
};
