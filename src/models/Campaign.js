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
  cpv: { type: Number, min: 10 },
  cpc: { type: Number, min: 20 },
  start_date: Date,
  end_date: Date,
  budget: Number,
  status: { type: String, enum: ['draft','submitted', 'active', 'paused', 'completed','stopped'], default: 'draft' },
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
