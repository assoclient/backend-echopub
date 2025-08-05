const mongoose = require('mongoose');

const clickEventSchema = new mongoose.Schema({
  ambassadorCampaign: { type: mongoose.Schema.Types.ObjectId, ref: 'AmbassadorCampaign', required: true },
  ip: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now },
  referer: String,
  geo: Object // Pour stocker la géolocalisation si besoin
});

module.exports = mongoose.model('ClickEvent', clickEventSchema);
