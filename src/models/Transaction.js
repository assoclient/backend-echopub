const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true }, // Référence unique de la transaction
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdrawal','payment'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
  method: { type: String, enum: ['cm.orange','cm.mtn','cm.echopub'], required: true },
  transactionId: { type: String }, // ID du tiers (mobile money, etc.)
  ambassador: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String },
  error_message: { type: String },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }, // Paiement campagne
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
