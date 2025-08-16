const mongoose = require('mongoose');

const ambassadorCampaignSchema = new mongoose.Schema({
  ambassador: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  status: { type: String, enum: ['published', 'submitted', 'validated', 'rejected'], default: 'published' },
  screenshot_url: String, // première capture
  screenshot_url2: String, // deuxième capture (18h après)
  views_count: {type:Number,default:0}, // extrait via OCR
  clicks_count: {type:Number,default:0}, // trackés via lien
  amount_earned: {type:Number,default:0},
  validatedAt: {type:Date,default:null},
  comment: {type:String,default:null},
  submittedAt: {type:Date,default:null},
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  link: { type: String, default: null }, // lien de la publication
  target_views: { type: Number, default: 0 }, // vues attendues pour la campagne : se calcule  en fonction du view average de l'ambassadeur et du( expected_views  - number_views_assigned)
   /* 
  target_views = (expected_views - number_views_assigned)> ambassador.view_average?ambassador.view_average : (expected_views - number_views_assigned);
    */
}, { timestamps: true });

module.exports = mongoose.model('AmbassadorCampaign', ambassadorCampaignSchema);
