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
const { logPaymentActivity } = require('../utils/activityLogger');

exports.getAllTransactions = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, search = '', type = '', status = '', user = '' } = req.query;
    
    // Construire la requête de base
    let query = {};
    
    // Filtre par type
    if (type) {
      query.type = type;
    }
    
    // Filtre par statut
    if (status) {
      query.status = status;
    }
    
    // Filtre par utilisateur
    if (user) {
      query.user = user;
    }
    
    // Recherche textuelle
    if (search) {
      query.$or = [
        { type: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } }
      ];
    }
    
    const count = await Transaction.countDocuments(query);
    const docs = await Transaction.find(query)
      .populate('user', 'name email phone')
      .populate('campaign', 'title')
      .sort({ createdAt: -1 })
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
exports.getMyTransactions = async (req, res, next) => {
  try {
     res.set('Cache-Control', 'no-store');
    const { page = 1, pageSize = 100, search = '', type = '', status = '' } = req.query;
    const user = req.user.id;
    // Construire la requête de base
    let query = {};
    
    // Filtre par type
    if (type) {
      query.type = type;
    }
    
    // Filtre par statut
    if (status) {
      query.status = status;
    }
    
    // Filtre par utilisateur
    if (user) {
      query.user = user;
    }
    
    // Recherche textuelle
    if (search) {
      query.$or = [
        { type: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } }
      ];
    }
    
    const count = await Transaction.countDocuments(query);
    const docs = await Transaction.find(query)
      .populate('user', 'name email phone')
      .populate('campaign', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize));
      
    return res.status(200).json({
      totalCount: count,
      page: Number(page),
      pageSize: docs.length,
      data: docs
    });
  } catch (err) {
    next(err);
  }
};
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration CamPay API
const CAMPAY_CONFIG = {
  baseUrl: process.env.CAMPAY_BASE_URL || 'https://demo.campay.net',
  username: process.env.CAMPAY_USERNAME,
  password: process.env.CAMPAY_PASSWORD,
  accessToken: null,
  tokenExpiry: null
}; 

// Fonction pour obtenir un token d'accès CamPay
async function getCamPayToken() {
  try {
    // Vérifier si le token est encore valide
    if (CAMPAY_CONFIG.accessToken && CAMPAY_CONFIG.tokenExpiry && Date.now() < CAMPAY_CONFIG.tokenExpiry) {
      return CAMPAY_CONFIG.accessToken;
    }

    console.log('🔄 Récupération d\'un nouveau token CamPay...');
    
    const response = await axios.post(`${CAMPAY_CONFIG.baseUrl}/api/token/`, {
      username: CAMPAY_CONFIG.username,
      password: CAMPAY_CONFIG.password
    });

    if (response.data && response.data.token) {
      CAMPAY_CONFIG.accessToken = response.data.token;
      // Le token expire dans 1 heure (3600 secondes)
      CAMPAY_CONFIG.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      console.log('✅ Token CamPay obtenu avec succès');
      return CAMPAY_CONFIG.accessToken;
    } else {
      throw new Error('Réponse invalide de CamPay API');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'obtention du token CamPay:', error.message);
    throw new Error('Impossible de s\'authentifier auprès de CamPay');
  }
}

// Fonction pour effectuer un appel API CamPay avec authentification
async function camPayApiCall(endpoint, data = null, method = 'GET') {
  try {
    const token = await getCamPayToken();
    
    const config = {
      method: method.toLowerCase(),
      url: `${CAMPAY_CONFIG.baseUrl}/api/${endpoint}`,
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data && method !== 'GET') {
      config.data = data;
    }

    console.log(`🌐 Appel CamPay API: ${method} ${endpoint}`, data || '');
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur CamPay API (${endpoint}):`, error.response?.data || error.message);
    throw error;
  }
}
 // Fonction pour vérifier le statut CamPay
 async function checkStatus(reference, transaction) {
  try {
    // Appel à l'API CamPay pour vérifier le statut
    const statusResponse = await camPayApiCall(`transaction/${reference}`, {}, 'GET');
    if (statusResponse && statusResponse.status) {
      lastStatus = statusResponse.status;
      console.log('statusResponse', lastStatus);
      if (statusResponse.status === 'SUCCESSFUL') {
        // Paiement confirmé
        transaction.status = 'confirmed';
        await transaction.save();
        //statusChecked = true;
        return true;
      } else if (statusResponse.status === 'FAILED') {
        // Paiement échoué
        transaction.status = 'failed';
        transaction.error_message = statusResponse.reason || 'Paiement échoué';
        await transaction.save();
        //statusChecked = true;
        return false;
      }
    }
  } catch (err) {
    // On ignore l'erreur pour continuer à checker
    console.error('Erreur lors de la vérification du statut CamPay:', err.message);
  }
  return null;
}
// Création d'une transaction de dépôt (Collect)
exports.createTransaction = async (req, res, next) => {
  try {
    const { user, type, method, campaign, paymentData } = req.body;
    
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

    if (type !== 'deposit') {
      return res.status(400).json({ message: 'Type de transaction invalide' });
    }
   
    if (method !== 'cm.orange' && method !== 'cm.mtn') {
      return res.status(400).json({ message: 'Méthode de paiement invalide' });
    }

    // Vérifier qu'il n'y a pas déjà une transaction pour cette campagne
    const existingTransaction = await Transaction.findOne({ 
      campaign: campaign, 
      type: 'deposit',
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingTransaction) {
      return res.status(400).json({ 
        message: 'Une transaction est déjà en cours pour cette campagne', 
        status: false 
      });
    }

    // Générer une référence unique
    const reference = `TXECHO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Créer la transaction en base
    const transaction = new Transaction({
      user: user,
      type: type,
      method: method,
      campaign: campaign,
      amount: campaignExists.budget,
      currency: 'XAF',
      reference: reference,
      status: 'pending',
      description: `Dépôt pour la campagne: ${campaignExists.title}`,
      //external_reference: uuidv4() // Référence externe pour CamPay
    });
    
    await transaction.save();

    // Préparer les données pour CamPay Collect API
    const camPayData = {
      amount: campaignExists.budget.toString(),
      currency: 'XAF',
      from: paymentData.phone, // Numéro de téléphone de l'utilisateur
      description: `Dépôt pour la campagne: ${campaignExists.title}`,
      external_reference: transaction.reference
    };

    console.log('🚀 Initialisation du paiement CamPay:', camPayData);

    try {
      // Appeler l'API CamPay Collect
      const camPayResponse = await camPayApiCall('collect/', camPayData, 'POST');
      
      if (camPayResponse && camPayResponse.reference) {
        // Mettre à jour la transaction avec la référence CamPay
        transaction.transactionId = camPayResponse.reference;
        transaction.status = 'pending';
        await transaction.save();

        console.log('✅ Paiement CamPay initialisé:', camPayResponse);
        // On donne 30s à l'utilisateur pour valider le paiement sur son mobile
        // On vérifie le statut toutes les 5 secondes, max 30s
        const checkInterval = 5000; // 5 secondes
        const maxWaitTime = 35000; // 30 secondes
        let elapsed = 0;
        let statusChecked = false;
        let lastStatus = null;

       

        // Boucle d'attente asynchrone
        while (elapsed < maxWaitTime && !statusChecked) {
          // Attendre 5 secondes
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          elapsed += checkInterval;
          const result = await checkStatus(camPayResponse.reference, transaction);
          if (result === true) {
            statusChecked = true;
            // Paiement confirmé, on sort de la boucle
            break;
          } else if (result === false) {
            statusChecked = true;
            // Paiement échoué, on sort de la boucle
            break;
          }
          // Sinon, on continue d'attendre
        }

        // Après 30s, si toujours pas confirmé, on considère comme échoué
        if (!statusChecked) {
          transaction.status = 'failed';
          transaction.error_message = 'Temps de validation dépassé. Paiement non confirmé.';
          await transaction.save();
          return res.status(400).json({
            message: 'Transaction non confirmée',
            transaction: transaction,
            transactionId: camPayResponse.reference,
            ussd_code: camPayResponse.ussd_code,
            operator: camPayResponse.operator,
            instructions: `Utilisez le code USSD ${camPayResponse.ussd_code} pour compléter le paiement`
          });
        }
        campaignExists.status = 'submitted';
        await campaignExists.save();
        // Retourner la réponse avec les instructions
        return res.status(200).json({
          message: 'Transaction créée et paiement initialisé',
          transaction: transaction,
          transactionId: camPayResponse.reference,
          ussd_code: camPayResponse.ussd_code,
          operator: camPayResponse.operator,
          instructions: `Utilisez le code USSD ${camPayResponse.ussd_code} pour compléter le paiement`
        });
      } else {
        throw new Error('Réponse invalide de CamPay');
      }
    } catch (camPayError) {
      // En cas d'erreur CamPay, marquer la transaction comme échouée
      transaction.status = 'failed';
      transaction.error_message = camPayError.message;
      await transaction.save();
      
      return res.status(400).json({
        message: 'Erreur lors de la création de la transaction',
        transaction: transaction,
        transactionId: null,
        ussd_code: null,
        operator: null,
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création de la transaction:', error);
    next(error);
  }
};

// Retrait d'argent pour les ambassadeurs (Withdraw)
exports.withdrawFunds = async (req, res, next) => {
  try {
    const { phone, amount,method } = req.body;
    
    if (!phone || !amount) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    } 
    const user = req.user.id;


    const User = require('../models/User');
    const userExists = await User.findById(user); 
    if (!userExists) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier que l'utilisateur est un ambassadeur
    if (userExists.role !== 'ambassador') {
      return res.status(403).json({ message: 'Seuls les ambassadeurs peuvent effectuer des retraits' });
    }

    // Vérifier que l'utilisateur a un numéro de téléphone
    /* if (!userExists.phone) {
      return res.status(400).json({ message: 'Numéro de téléphone requis pour le retrait' });
    } */

    // Vérifier que le montant est valide
    if (amount > userExists.balance) {
      return res.status(400).json({ message: 'Le montant minimum de retrait est de 100 FCFA' });
    }

    // Vérifier que l'utilisateur a suffisamment de fonds
    // TODO: Implémenter la logique de vérification du solde
    // const userBalance = await getUserBalance(user);
    // if (userBalance < amount) {
    //   return res.status(400).json({ message: 'Solde insuffisant' });
    // }

    /* if (method !== 'cm.orange' && method !== 'cm.mtn') {
      return res.status(400).json({ message: 'Méthode de paiement invalide' });
    } */

    // Générer une référence unique
    const reference = `WITHDRAW-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Créer la transaction de retrait en base
    const transaction = new Transaction({
      user: user,
      ambassador: userExists._id,
      type: 'withdrawal',
      method: method||'cm.echopub',
      amount: amount,
      currency: 'XAF',
      reference: reference,
      status: 'pending',
      description: `Retrait de ${amount} FCFA`,
    });

    await transaction.save();

    // Préparer les données pour CamPay Withdraw API
    const camPayData = {
      amount: amount.toString(),
      to: phone, // Numéro de téléphone de l'ambassadeur
      description: `Retrait EchoPub: ${amount} FCFA`,
      external_reference: transaction.reference
    };

    console.log('🚀 Initialisation du retrait CamPay:', camPayData);

    try {
      // Appeler l'API CamPay Withdraw
      const camPayResponse = await camPayApiCall('withdraw/', camPayData, 'POST');
      
      if (camPayResponse && camPayResponse.reference) {
        // Mettre à jour la transaction avec la référence CamPay
        userExists.balance = userExists.balance - amount;
        await userExists.save();
        transaction.transactionId = camPayResponse.reference;
        transaction.status = 'pending';
        await transaction.save();

        console.log('✅ Retrait CamPay initialisé:', camPayResponse);
        
        // Retourner la réponse
        return res.status(200).json({
          message: 'Retrait initialisé avec succès',
          transaction: transaction,
          transactionId: camPayResponse.reference,
          status: 'pending',
          
          success: true,
          note: 'Le retrait sera traité dans les prochaines minutes'
        });
      } else {
        throw new Error('Réponse invalide de CamPay');
      }
    } catch (camPayError) {
      // En cas d'erreur CamPay, marquer la transaction comme échouée
      transaction.status = 'failed';
      transaction.error_message = camPayError.message;
      await transaction.save();
      
      return res.status(400).json({
        message: 'Erreur lors du retrait',
        transaction: transaction,
        transactionId: null,
        status: 'failed',
        success: false,
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors du retrait:', error);
    next(error);
  }
};

// Vérifier le statut d'une transaction CamPay
exports.checkTransactionStatus = async (req, res, next) => {
  try {
    const { reference } = req.params;
    
    if (!reference) {
      return res.status(400).json({ message: 'Référence de transaction requise' });
    }

    // Vérifier d'abord en base de données
    const transaction = await Transaction.findOne({ 
      $or: [
        { reference: reference },
        { campay_reference: reference },
        { external_reference: reference }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }

    // Si la transaction a une référence CamPay, vérifier le statut
    if (transaction.campay_reference) {
      try {
        const camPayStatus = await camPayApiCall(`transaction/${transaction.campay_reference}/`);
        
        if (camPayStatus) {
          // Mettre à jour le statut de la transaction selon la réponse CamPay
          let newStatus = transaction.status;
          
          switch (camPayStatus.status) {
            case 'SUCCESSFUL':
              newStatus = 'confirmed';
              break;
            case 'FAILED':
              newStatus = 'failed';
              break;
            case 'PENDING':
              newStatus = 'pending';
              break;
          }

          // Mettre à jour la transaction si le statut a changé
          if (newStatus !== transaction.status) {
            transaction.status = newStatus;
            transaction.campay_status = camPayStatus.status;
            transaction.operator_reference = camPayStatus.operator_reference;
            transaction.campay_code = camPayStatus.code;
            
            await transaction.save();

            // Si c'est un dépôt confirmé, mettre à jour le statut de la campagne
            if (newStatus === 'confirmed' && transaction.type === 'deposit' && transaction.campaign) {
              const Campaign = require('../models/Campaign');
              const campaign = await Campaign.findById(transaction.campaign);
              if (campaign && campaign.status === 'draft') {
                campaign.status = 'submitted';
                await campaign.save();
                console.log('✅ Campagne mise à jour: draft → submitted');
              }
            }

            console.log(`🔄 Statut de la transaction mis à jour: ${transaction.status} → ${newStatus}`);
          }

          return res.json({
            transaction: transaction,
            campay_status: camPayStatus,
            message: 'Statut de la transaction récupéré'
          });
        }
      } catch (camPayError) {
        console.error('❌ Erreur lors de la vérification CamPay:', camPayError);
        // Retourner le statut en base même en cas d'erreur CamPay
      }
    }

    // Retourner le statut en base de données
    return res.json({
      transaction: transaction,
      message: 'Statut de la transaction récupéré depuis la base de données'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du statut:', error);
    next(error);
  }
};

// Webhook pour mettre à jour le statut d'une transaction de retrait
exports.withdrawalWebhook = async (req, res, next) => {
  try {
    const { external_reference, reference,status } = req.query;
    if (!external_reference || !status|| !reference) {
      return res.status(400).json({ message: 'transactionId et status requis' });
    }
    const Transaction = require('../models/Transaction');
    const transaction = await Transaction.findById({reference:external_reference});
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }
    if(status =='SUCCESSFUL') {
      transaction.status = 'confirmed'; 
      
  }
   transaction.transactionId = reference
   await transaction.save();
    res.json({ message: 'Statut de la transaction mis à jour', transaction });
  } catch (err) {
    next(err);
  }
};
