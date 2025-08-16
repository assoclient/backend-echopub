const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const { logCampaignActivity, ACTIVITY_TYPES } = require('../utils/activityLogger');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/echopub';
//console.log(`🔗 Connexion à MongoDB: ${process.env.MONGODB_URI}`);

// Fonction pour se connecter à la base de données
async function connectDB(MONGODB_URI) {
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

// Fonction principale pour compléter automatiquement les campagnes
async function autoCompleteCampaigns() {
  try {
    //await connectDB();
    console.log('🔄 Début de la vérification automatique des campagnes...');
    
    const now = new Date();
    console.log(`⏰ Heure actuelle: ${now.toISOString()}`);
    
    // Trouver toutes les campagnes actives ou en pause dont la date de fin est passée
    const campaignsToComplete = await Campaign.find({
      status: { $in: ['active', 'paused'] },
      campaign_test: false,
      end_date: {
          $exists: true,
          $ne: null,
          $lte: new Date(), // doit être passée
        }
    }).populate('advertiser', 'name');
    
    console.log(`📊 ${campaignsToComplete.length} campagne(s) trouvée(s) à compléter`);
    
    if (campaignsToComplete.length === 0) {
      console.log('✅ Aucune campagne à compléter');
      return;
    }
    
    // Traiter chaque campagne
    let completedCount = 0;
    let errorCount = 0;
    
    for (const campaign of campaignsToComplete) {
      try {
        console.log(`\n📝 Traitement de la campagne: ${campaign.title} (ID: ${campaign._id})`);
        console.log(`   - Statut actuel: ${campaign.status}`);
        console.log(`   - Date de fin: ${campaign.end_date}`);
        console.log(`   - Annonceur: ${campaign.advertiser?.name || 'Inconnu'}`);
        
        // Changer le statut à completed
        campaign.status = 'completed';
        campaign.completed_at = now;
        
        // Sauvegarder la campagne
        await campaign.save();
        
        console.log(`   ✅ Statut changé à 'completed'`);
        
        // Logger l'activité
        try {
          await logCampaignActivity(ACTIVITY_TYPES.CAMPAIGN_COMPLETED, campaign, {
            id: 'system',
            name: 'Système Automatique',
            role: 'system'
          }, {
            previousStatus: campaignsToComplete.find(c => c._id.toString() === campaign._id.toString())?.status,
            newStatus: 'completed',
            changedBy: 'Système Automatique',
            reason: 'Date de fin dépassée'
          });
          console.log(`   📝 Activité loggée`);
        } catch (logError) {
          console.warn(`   ⚠️ Erreur lors du logging de l'activité:`, logError.message);
        }
        
        completedCount++;
        
      } catch (campaignError) {
        console.error(`   ❌ Erreur lors du traitement de la campagne ${campaign.title}:`, campaignError.message);
        errorCount++;
      }
    }
    
    // Résumé final
    console.log('\n📋 Résumé de l\'exécution:');
    console.log(`   ✅ Campagnes complétées: ${completedCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`   📊 Total traité: ${campaignsToComplete.length}`);
    
    if (completedCount > 0) {
      console.log('\n🎉 Script exécuté avec succès!');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale lors de l\'exécution du script:', error);
    throw error;
  }
}

// Fonction pour exécuter le script en mode standalone
async function runStandalone() {
  try {
    await connectDB();
    await autoCompleteCampaigns();
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await closeDB();
    process.exit(0);
  }
}

// Fonction pour exécuter le script en mode cron (sans fermer la connexion)
async function runCron() {
  try {
    await autoCompleteCampaigns();
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution cron:', error);
  }
}

// Exécution du script
if (require.main === module) {
  // Mode standalone (exécution directe)
  console.log('🚀 Démarrage du script de complétion automatique des campagnes...');
  runStandalone();
} else {
  // Mode module (importé par un autre script)
  module.exports = {
    runCron,
    autoCompleteCampaigns,
    connectDB,
    closeDB
  };
}
