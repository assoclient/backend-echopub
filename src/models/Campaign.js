const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  advertiser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  media_url: String,
  target_link: String,
  location_type: { type: String, enum: ['city', 'region'], required: true },
  target_location: [{
    value: { type: String, required: true },
  }],
  number_views_assigned: { type: Number, default: 0 },
  expected_views: { type: Number, min: 100 },
  cpv: { type: Number, min: 14 ,default: 14 }, // CPV minimum pour l'annonceur
  cpv_ambassador: { type: Number, default:10 }, // CPV pour l'ambassadeur
  start_date: Date,
  end_date: Date,
  budget: Number,
  status: { type: String, enum: ['draft','submitted', 'active', 'paused', 'completed','stopped'], default: 'draft' },
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
