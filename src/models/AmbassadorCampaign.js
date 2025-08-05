const mongoose = require('mongoose');

const ambassadorCampaignSchema = new mongoose.Schema({
  ambassador: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  status: { type: String, enum: ['pending', 'published', 'submitted', 'validated', 'rejected'], default: 'pending' },
  screenshot_url: String, // première capture
  screenshot_url2: String, // deuxième capture (18h après)
  views_count: Number, // extrait via OCR
  clicks_count: Number, // trackés via lien
  amount_earned: Number,
}, { timestamps: true });

module.exports = mongoose.model('AmbassadorCampaign', ambassadorCampaignSchema);
