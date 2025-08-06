const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: false, unique: true },
  phone: { type: String, required: false, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ambassador', 'advertiser', 'admin'], required: true },
  whatsapp_number: { type: String },
  view_average: { type: Number, default: 0 },  
  /* Moyenne de vues par capture: c'est la moyenne des vues des 10 dernieres publications */
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
  isValid:{type:Boolean,default:true},
  audience:[
    {
      city:[{pourcentage:Number,value:String}],
      age:[{pourcentage:Number,value:{min:Number,max:Number}}],
      genre:[{pourcentage:Number,value:String,enum:['M','F']}],
      }
  ]

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
