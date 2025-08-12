const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const AmbassadorCampaign = require('../models/AmbassadorCampaign');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp_ads';

// Fonction pour se connecter à la base de données
async function connectDB() {
  try {
    console.log('MONGODB_URI', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connexion à MongoDB établie');
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
}

// Fonction pour fermer la connexion à la base de données
async function closeDB() {
  try {
    await mongoose.connection.close();
    console.log('✅ Connexion à MongoDB fermée');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture de MongoDB:', error);
  }
}

const existingIP = '172.20.14.64'
const newIP = '192.168.43.138'

async function updateCampaignMediaUrls() {
    try {
        const result = await Campaign.find();
        for(const campaign of result) {
            if(campaign.media_url.includes(existingIP)) {
                console.log('campaign', campaign.media_url);
                campaign.media_url = campaign.media_url.replace(existingIP, newIP);
                await campaign.save();
            }
        }
    } catch (err) {
        console.error('Error updating Campaign media_url:', err);
    }
}

async function updateAmbassadorCampaignMediaUrls() {
    try {
        const getCampaigns = await AmbassadorCampaign.find();
        for(const campaign of getCampaigns) {
            if(campaign.screenshot_url?.includes(existingIP)) {
                campaign.screenshot_url = campaign.screenshot_url.replace(existingIP, newIP);
                await campaign.save();
            }
            if(campaign.screenshot_url2?.includes(existingIP)) {
                campaign.screenshot_url2 = campaign.screenshot_url2.replace(existingIP, newIP);
                await campaign.save();
            }
        }
    } catch (err) {
        console.error('Error updating AmbassadorCampaign media_url:', err);
    }
}

// Fonction principale
async function updateAllMediaUrls() {
  try {
    await connectDB();
    
    console.log('🔄 Début de la mise à jour des URLs média...');
    console.log(`📝 Ancienne IP: ${existingIP}`);
    console.log(`📝 Nouvelle IP: ${newIP}`);

    await updateCampaignMediaUrls();
    await updateAmbassadorCampaignMediaUrls();

    console.log('✅ Mise à jour terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    throw error;
  } finally {
    await closeDB();
  }
}

// Exécution du script
if (require.main === module) {
  console.log('🚀 Démarrage du script de mise à jour des IPs...');
  updateAllMediaUrls()
    .then(() => {
      console.log('✨ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(0);
    });
} else {
  module.exports = {
    updateAllMediaUrls,
    connectDB,
    closeDB
  };
}


