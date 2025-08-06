const Settings = require('../models/Settings');

// Récupérer tous les paramètres
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // Si aucun paramètre n'existe, créer avec les valeurs par défaut
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres',
      error: error.message
    });
  }
};

// Mettre à jour les paramètres généraux
exports.updateGeneralSettings = async (req, res) => {
  try {
    const { platformName, contactEmail, contactPhone, currency, timezone } = req.body;

    // Validation
    if (!platformName || !contactEmail || !contactPhone || !currency || !timezone) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Validation de la devise
    const validCurrencies = ['FCFA', 'EUR', 'USD'];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        message: 'Devise invalide'
      });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    settings.general = {
      platformName,
      contactEmail,
      contactPhone,
      currency,
      timezone
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Paramètres généraux mis à jour avec succès',
      data: settings.general
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres généraux:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres généraux',
      error: error.message
    });
  }
};

// Mettre à jour les paramètres de paiement
exports.updatePaymentSettings = async (req, res) => {
  try {
    const { 
      platformCommission, 
      minCampaignAmount, 
      maxCampaignAmount, 
      mtnMoneyEnabled, 
      orangeMoneyEnabled 
    } = req.body;

    // Validation
    if (platformCommission < 0 || platformCommission > 50) {
      return res.status(400).json({
        success: false,
        message: 'La commission doit être entre 0 et 50%'
      });
    }

    if (minCampaignAmount < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Le montant minimum doit être d\'au moins 1000 FCFA'
      });
    }

    if (maxCampaignAmount < minCampaignAmount) {
      return res.status(400).json({
        success: false,
        message: 'Le montant maximum doit être supérieur au montant minimum'
      });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    settings.payment = {
      platformCommission,
      minCampaignAmount,
      maxCampaignAmount,
      mtnMoneyEnabled,
      orangeMoneyEnabled
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Paramètres de paiement mis à jour avec succès',
      data: settings.payment
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres de paiement',
      error: error.message
    });
  }
};

// Mettre à jour les paramètres de sécurité
exports.updateSecuritySettings = async (req, res) => {
  try {
    const { 
      maxLoginAttempts, 
      sessionTimeout, 
      requireEmailVerification, 
      requirePhoneVerification 
    } = req.body;

    // Validation
    if (maxLoginAttempts < 3 || maxLoginAttempts > 10) {
      return res.status(400).json({
        success: false,
        message: 'Le nombre maximum de tentatives doit être entre 3 et 10'
      });
    }

    if (sessionTimeout < 15 || sessionTimeout > 480) {
      return res.status(400).json({
        success: false,
        message: 'Le timeout de session doit être entre 15 et 480 minutes'
      });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    settings.security = {
      maxLoginAttempts,
      sessionTimeout,
      requireEmailVerification,
      requirePhoneVerification
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Paramètres de sécurité mis à jour avec succès',
      data: settings.security
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres de sécurité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres de sécurité',
      error: error.message
    });
  }
};

// Mettre à jour les paramètres de notification
exports.updateNotificationSettings = async (req, res) => {
  try {
    const { 
      emailNotifications, 
      smsNotifications, 
      pushNotifications, 
      adminNotifications 
    } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    settings.notification = {
      emailNotifications,
      smsNotifications,
      pushNotifications,
      adminNotifications
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Paramètres de notification mis à jour avec succès',
      data: settings.notification
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres de notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres de notification',
      error: error.message
    });
  }
};

// Mettre à jour les paramètres de maintenance
exports.updateMaintenanceSettings = async (req, res) => {
  try {
    const { 
      isMaintenanceMode, 
      maintenanceMessage, 
      allowedIPs 
    } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    settings.maintenance = {
      isMaintenanceMode,
      maintenanceMessage: maintenanceMessage || 'La plateforme est en maintenance. Veuillez réessayer plus tard.',
      allowedIPs: allowedIPs || []
    };

    await settings.save();

    res.json({
      success: true,
      message: 'Paramètres de maintenance mis à jour avec succès',
      data: settings.maintenance
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres de maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres de maintenance',
      error: error.message
    });
  }
};

// Réinitialiser tous les paramètres aux valeurs par défaut
exports.resetSettings = async (req, res) => {
  try {
    const defaultSettings = Settings.getDefaultSettings();
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    settings.general = defaultSettings.general;
    settings.payment = defaultSettings.payment;
    settings.security = defaultSettings.security;
    settings.notification = defaultSettings.notification;
    settings.maintenance = defaultSettings.maintenance;

    await settings.save();

    res.json({
      success: true,
      message: 'Paramètres réinitialisés aux valeurs par défaut',
      data: settings
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation des paramètres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation des paramètres',
      error: error.message
    });
  }
}; 