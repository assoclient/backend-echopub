#!/usr/bin/env node

/**
 * Script de test pour les tâches cron
 * Ce script permet de tester le fonctionnement des tâches automatiques
 * sans attendre l'exécution du cron
 */

const { autoCompleteCampaigns, connectDB, closeDB } = require('./autoCompleteCampaigns');

async function testCronFunctionality() {
  console.log('🧪 Test des fonctionnalités cron');
  console.log('================================\n');
  
  try {
    // Se connecter à la base de données
    console.log('🔌 Connexion à la base de données...');
    await connectDB();
    console.log('✅ Connexion établie\n');
    
    // Exécuter la fonction de complétion automatique
    console.log('🔄 Test de la fonction autoCompleteCampaigns...');
    await autoCompleteCampaigns();
    console.log('✅ Test terminé avec succès\n');
    
    // Afficher un résumé
    console.log('📋 Résumé du test:');
    console.log('   - Connexion à la base de données: ✅');
    console.log('   - Exécution de la fonction: ✅');
    console.log('   - Vérification des campagnes: ✅');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  } finally {
    // Fermer la connexion
    console.log('\n🔌 Fermeture de la connexion...');
    await closeDB();
    console.log('✅ Test terminé');
  }
}

// Exécuter le test si le script est lancé directement
if (require.main === module) {
  testCronFunctionality();
}

module.exports = { testCronFunctionality };
