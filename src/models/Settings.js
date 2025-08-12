const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Paramètres généraux
  general: {
    platformName: {
      type: String,
      default: 'EchoPub'
    },
    contactEmail: {
      type: String,
      default: 'contact@echopub.com'
    },
    contactPhone: {
      type: String,
      default: '+237 123456789'
    },
    currency: {
      type: String,
      enum: ['FCFA', 'EUR', 'USD'],
      default: 'FCFA'
    },
    timezone: {
      type: String,
      default: 'Africa/Douala'
    }
  },

  // Paramètres de paiement
  payment: {
    cpv: {
      type: Number,
      min: 10,
      max: 100,
      default: 14
    },
    cpv_ambassador: {
      type: Number,
      min: 5,
      max: 50,
      default: 10
    },
    minCampaignAmount: {
      type: Number,
      min: 100,
      default: 10000
    },
    maxCampaignAmount: {
      type: Number,
      min: 10000,
      default: 1000000
    },
    mtnMoneyEnabled: {
      type: Boolean,
      default: true
    },
    orangeMoneyEnabled: {
      type: Boolean,
      default: true
    }
  },

  // Paramètres de sécurité
  security: {
    maxLoginAttempts: {
      type: Number,
      min: 3,
      max: 10,
      default: 5
    },
    sessionTimeout: {
      type: Number,
      min: 15,
      max: 480,
      default: 60 // minutes
    },
    requireEmailVerification: {
      type: Boolean,
      default: false
    },
    requirePhoneVerification: {
      type: Boolean,
      default: false
    }
  },

  // Paramètres de notification
  notification: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    adminNotifications: {
      type: Boolean,
      default: true
    }
  },

  // Paramètres de maintenance
  maintenance: {
    isMaintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      default: 'La plateforme est en maintenance. Veuillez réessayer plus tard.'
    },
    allowedIPs: [{
      type: String
    }]
  }
}, { 
  timestamps: true 
});

// Index pour optimiser les requêtes
settingsSchema.index({ 'general.platformName': 1 });

// Méthode pour obtenir les paramètres par défaut
settingsSchema.statics.getDefaultSettings = function() {
  return {
    general: {
      platformName: 'EchoPub',
      contactEmail: 'contact@echopub.com',
      contactPhone: '+237 123456789',
      currency: 'FCFA',
      timezone: 'Africa/Douala'
    },
    payment: {
      cpv: 14,
      cpv_ambassador: 10,
      minCampaignAmount: 10000,
      maxCampaignAmount: 1000000,
      mtnMoneyEnabled: true,
      orangeMoneyEnabled: true
    },
    security: {
      maxLoginAttempts: 5,
      sessionTimeout: 60,
      requireEmailVerification: false,
      requirePhoneVerification: false
    },
    notification: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      adminNotifications: true
    },
    maintenance: {
      isMaintenanceMode: false,
      maintenanceMessage: 'La plateforme est en maintenance. Veuillez réessayer plus tard.',
      allowedIPs: []
    }
  };
};

module.exports = mongoose.model('Settings', settingsSchema); 