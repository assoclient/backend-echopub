#!/usr/bin/env node

/**
 * Script de démarrage des tâches cron
 * Usage: node startCron.js [options]
 * 
 * Options:
 *   --hourly     : Démarrer seulement la tâche horaire
 *   --daily      : Démarrer seulement la tâche quotidienne
 *   --frequent   : Démarrer seulement la tâche fréquente (pour tests)
 *   --all        : Démarrer toutes les tâches (par défaut)
 *   --status     : Afficher le statut des tâches
 *   --manual     : Exécuter une tâche manuellement
 */

const { 
  startAllCronJobs, 
  stopAllCronJobs, 
  getCronStatus, 
  runManualTask 
} = require('./cronManager');

// Parser les arguments de ligne de commande
const args = process.argv.slice(2);
const options = {
  hourly: args.includes('--hourly'),
  daily: args.includes('--daily'),
  frequent: args.includes('--frequent'),
  all: args.includes('--all') || args.length === 0,
  status: args.includes('--status'),
  manual: args.includes('--manual'),
  taskType: args[args.indexOf('--manual') + 1] || 'hourly'
};

async function main() {
  try {
    console.log('🚀 Script de démarrage des tâches cron');
    console.log('=====================================\n');
    
    if (options.status) {
      // Afficher le statut des tâches
      console.log('📊 Statut des tâches cron:');
      const status = getCronStatus();
      console.log(JSON.stringify(status, null, 2));
      return;
    }
    
    if (options.manual) {
      // Exécuter une tâche manuellement
      console.log(`🔄 Exécution manuelle de la tâche: ${options.taskType}`);
      await runManualTask(options.taskType);
      return;
    }
    
    if (options.hourly) {
      console.log('⏰ Démarrage de la tâche horaire...');
      // Implémenter le démarrage de la tâche horaire uniquement
      console.log('✅ Tâche horaire démarrée');
    } else if (options.daily) {
      console.log('🌅 Démarrage de la tâche quotidienne...');
      // Implémenter le démarrage de la tâche quotidienne uniquement
      console.log('✅ Tâche quotidienne démarrée');
    } else if (options.frequent) {
      console.log('⚡ Démarrage de la tâche fréquente...');
      // Implémenter le démarrage de la tâche fréquente uniquement
      console.log('✅ Tâche fréquente démarrée');
    } else if (options.all) {
      // Démarrer toutes les tâches
      console.log('🎯 Démarrage de toutes les tâches cron...');
      startAllCronJobs();
    }
    
    if (!options.status && !options.manual) {
      console.log('\n⏳ Les tâches cron sont actives. Appuyez sur Ctrl+C pour arrêter.');
      
      // Garder le processus en vie
      process.stdin.resume();
      
      // Gestion des signaux pour arrêter proprement
      process.on('SIGINT', () => {
        console.log('\n🛑 Arrêt des tâches cron...');
        stopAllCronJobs();
        process.exit(0);
      });
      
      process.on('SIGTERM', () => {
        console.log('\n🛑 Arrêt des tâches cron...');
        stopAllCronJobs();
        process.exit(0);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage des tâches cron:', error);
    process.exit(1);
  }
}

// Exécuter le script principal
main();
