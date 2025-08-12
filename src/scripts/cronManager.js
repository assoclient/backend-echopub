const cron = require('node-cron');
const { autoCompleteCampaigns } = require('./autoCompleteCampaigns');

// Configuration des tâches cron
const CRON_CONFIG = {
  // Vérifier et compléter les campagnes toutes les heures
  CAMPAIGN_COMPLETION: '0 * * * *', // Toutes les heures à la minute 0
  
  // Vérifier et compléter les campagnes tous les jours à 2h du matin
  DAILY_CAMPAIGN_CHECK: '0 2 * * *', // Tous les jours à 2h00
  
  // Vérifier et compléter les campagnes toutes les 30 minutes (pour les tests)
  FREQUENT_CHECK: '*/30 * * * *', // Toutes les 30 minutes
};

// Tâche pour la vérification automatique des campagnes
const campaignCompletionTask = cron.schedule(CRON_CONFIG.CAMPAIGN_COMPLETION, async () => {
  console.log('\n🕐 Exécution de la tâche cron: Vérification des campagnes à compléter');
  console.log(`⏰ Heure d'exécution: ${new Date().toISOString()}`);
  
  try {
    await autoCompleteCampaigns();
    console.log('✅ Tâche cron exécutée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la tâche cron:', error);
  }
}, {
  scheduled: false, // Ne pas démarrer automatiquement
  timezone: "Africa/Douala" // Fuseau horaire du Cameroun
});

// Tâche pour la vérification quotidienne (plus détaillée)
const dailyCampaignCheckTask = cron.schedule(CRON_CONFIG.DAILY_CAMPAIGN_CHECK, async () => {
  console.log('\n🌅 Exécution de la tâche cron quotidienne: Vérification complète des campagnes');
  console.log(`⏰ Heure d'exécution: ${new Date().toISOString()}`);
  
  try {
    await autoCompleteCampaigns();
    console.log('✅ Tâche cron quotidienne exécutée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la tâche cron quotidienne:', error);
  }
}, {
  scheduled: false, // Ne pas démarrer automatiquement
  timezone: "Africa/Douala" // Fuseau horaire du Cameroun
});

// Tâche pour les vérifications fréquentes (utile pour les tests)
const frequentCheckTask = cron.schedule(CRON_CONFIG.FREQUENT_CHECK, async () => {
  console.log('\n⚡ Exécution de la tâche cron fréquente: Vérification des campagnes');
  console.log(`⏰ Heure d'exécution: ${new Date().toISOString()}`);
  
  try {
    await autoCompleteCampaigns();
    console.log('✅ Tâche cron fréquente exécutée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la tâche cron fréquente:', error);
  }
}, {
  scheduled: false, // Ne pas démarrer automatiquement
  timezone: "Africa/Douala" // Fuseau horaire du Cameroun
});

// Fonction pour démarrer toutes les tâches cron
function startAllCronJobs() {
  console.log('🚀 Démarrage des tâches cron...');
  
  // Démarrer la tâche horaire
  campaignCompletionTask.start();
  console.log('✅ Tâche horaire démarrée');
  
  // Démarrer la tâche quotidienne
  dailyCampaignCheckTask.start();
  console.log('✅ Tâche quotidienne démarrée');
  
  // Démarrer la tâche fréquente (optionnel, pour les tests)
  // frequentCheckTask.start();
  // console.log('✅ Tâche fréquente démarrée');
  
  console.log('🎯 Toutes les tâches cron sont actives');
}

// Fonction pour arrêter toutes les tâches cron
function stopAllCronJobs() {
  console.log('🛑 Arrêt des tâches cron...');
  
  campaignCompletionTask.stop();
  dailyCampaignCheckTask.stop();
  frequentCheckTask.stop();
  
  console.log('✅ Toutes les tâches cron ont été arrêtées');
}

// Fonction pour obtenir le statut des tâches cron
function getCronStatus() {
  return {
    hourly: campaignCompletionTask.getStatus(),
    daily: dailyCampaignCheckTask.getStatus(),
    frequent: frequentCheckTask.getStatus(),
    nextExecution: {
      hourly: campaignCompletionTask.nextDate().toISOString(),
      daily: dailyCampaignCheckTask.nextDate().toISOString(),
      frequent: frequentCheckTask.nextDate().toISOString()
    }
  };
}

// Fonction pour exécuter manuellement une tâche
async function runManualTask(taskType = 'hourly') {
  console.log(`🔄 Exécution manuelle de la tâche: ${taskType}`);
  
  try {
    switch (taskType) {
      case 'hourly':
        await autoCompleteCampaigns();
        break;
      case 'daily':
        await autoCompleteCampaigns();
        break;
      case 'frequent':
        await autoCompleteCampaigns();
        break;
      default:
        throw new Error(`Type de tâche inconnu: ${taskType}`);
    }
    
    console.log(`✅ Tâche manuelle '${taskType}' exécutée avec succès`);
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution de la tâche manuelle '${taskType}':`, error);
    throw error;
  }
}

// Gestion des signaux pour arrêter proprement les tâches
process.on('SIGINT', () => {
  console.log('\n🛑 Signal SIGINT reçu, arrêt des tâches cron...');
  stopAllCronJobs();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Signal SIGTERM reçu, arrêt des tâches cron...');
  stopAllCronJobs();
  process.exit(0);
});

// Export des fonctions
module.exports = {
  startAllCronJobs,
  stopAllCronJobs,
  getCronStatus,
  runManualTask,
  campaignCompletionTask,
  dailyCampaignCheckTask,
  frequentCheckTask
};

// Exécution directe si le script est lancé directement
if (require.main === module) {
  console.log('🚀 Démarrage du gestionnaire de cron...');
  
  // Démarrer les tâches cron
  startAllCronJobs();
  
  // Afficher le statut
  console.log('\n📊 Statut des tâches cron:');
  console.log(JSON.stringify(getCronStatus(), null, 2));
  
  // Garder le processus en vie
  console.log('\n⏳ Le gestionnaire de cron est actif. Appuyez sur Ctrl+C pour arrêter.');
}
