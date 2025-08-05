const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: false, unique: true },
  phone: { type: String, required: false, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ambassador', 'advertiser', 'admin'], required: true },
  whatsapp_number: { type: String },
  location: {
    countryCode:String,
    city: String,
    region: String,
    gps: {
      lat: Number,
      lng: Number
    }
  },
  contacts_count: Number, // pour les ambassadeurs
  balance: { type: Number, default: 0 }, // Solde actuel de l'utilisateur
  isValid:{type:Boolean,default:true}
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
