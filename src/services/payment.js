exports.initializePayment = async (body,userData) => {
  try {
    const { campaign, type, amount, reference,description,method } = body;
    const Transaction = require('../models/Transaction');

    const response = await fetch('https://api.notchpay.co/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'pk_test.xwcFiZUW9ON89f4coesL0KZFbl02unjQIobd0ucleFr8BFJGRMpVdXjSO0h9w9vNfOkCJHz9XiLacjPrhhR3BKPnkzDevuMbZKD5pW3Ethaxcw0sG2DfcAFgHBpAK'
      },
      body: JSON.stringify({
        amount,
        reference,
        currency: 'XAF',
        customer: {
          email: userData.email,
          name: userData.name
        },
        description
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NotchPay API error response:', errorText);
      throw new Error('Network response was not ok: ' + errorText);
    }
  // console.log('Payment initialization response:', response);
    
    const data = await response.json();
   // console.log('Payment initialization response:', data);
    const tx = await Transaction.create({
      user:userData._id,
      type,
      amount,
      method,
      status: 'pending',
      reference,
      campaign,
      transactionId: data.transaction.reference
    });

    return { message: 'Transaction créée', transaction: tx, data };
  } catch (error) {
    throw new Error(`Erreur lors de l'initialisation du paiement : ${error.message}`);
  }
}
exports.processPayment = async (paymentReference,method,data,campaign=null) => {
  try {
    const Transaction = require('../models/Transaction');
    const Campaign = require('../models/Campaign');
    // Vérifie si la transaction existe déjà
    const existingTransaction = await Transaction.findOne({ transactionId: paymentReference });
    if (!existingTransaction) {
      return { message: 'Transaction nexiste pas',status:false };
    }
    const existingCampaign = await Campaign.findById(campaign);
    if (!existingCampaign) {
        return { message: 'Campagne inexistante', status: false };
        }
   const response= await  fetch(`https://api.notchpay.co/payments/${paymentReference}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'pk_test.xwcFiZUW9ON89f4coesL0KZFbl02unjQIobd0ucleFr8BFJGRMpVdXjSO0h9w9vNfOkCJHz9XiLacjPrhhR3BKPnkzDevuMbZKD5pW3Ethaxcw0sG2DfcAFgHBpAK'
      },
        body: JSON.stringify({
            channel: method,
            data,
        })})
            if (!response.ok) {
                throw new Error('Network response was not ok');
                }
        const responseData = await response.json();

        if (responseData.code !==202) {
            existingTransaction.status = 'failed';
            await existingTransaction.save();
            return { message: 'Transaction failed', status:false }
        }
        //console.log('notchpay', responseData);
        return { message: 'Transaction processing', responseData, status:true };
    //return { message: 'Paiement effectué', transaction: tx };
  } catch (err) {
    throw new Error(`Erreur lors du traitement du paiement : ${err.message}`);
  }
}
exports.getPaymentStatus = async (reference) => {
  try {
   const response =await fetch(`https://api.notchpay.co/payments/${reference}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'pk_test.xwcFiZUW9ON89f4coesL0KZFbl02unjQIobd0ucleFr8BFJGRMpVdXjSO0h9w9vNfOkCJHz9XiLacjPrhhR3BKPnkzDevuMbZKD5pW3Ethaxcw0sG2DfcAFgHBpAK'
      },
    });
     if (!response.ok) {
        return { message: 'Statut de la transaction récupéré', status: false };
      }
      const data = await response.json();
        return { message: 'Statut de la transaction récupéré', data, status: true };
  } catch (err) {
            return { message: 'Statut de la transaction récupéré', status: false };
  }
}