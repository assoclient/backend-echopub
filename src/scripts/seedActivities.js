const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
require('dotenv').config();

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/echopub';

// Données d'activités de test
const testActivities = [
  {
    type: 'campaign_created',
    title: 'Nouvelle campagne créée par "Tech Solutions"',
    description: 'Une nouvelle campagne publicitaire a été créée',
    metadata: {
      campaignTitle: 'Promo Tech 2024',
      advertiserName: 'Tech Solutions'
    }
  },
  {
    type: 'campaign_approved',
    title: 'Campagne "Promo Été" validée',
    description: 'Une campagne a été approuvée par l\'administrateur',
    metadata: {
      campaignTitle: 'Promo Été',
      approvedBy: 'Super Administrateur'
    }
  },
  {
    type: 'payment_received',
    title: 'Paiement reçu de 50,000 FCFA',
    description: 'Un nouveau paiement a été reçu',
    metadata: {
      amount: 50000,
      paymentMethod: 'Mobile Money'
    }
  },
  {
    type: 'user_registered',
    title: 'Nouvel annonceur inscrit',
    description: 'Un nouvel utilisateur s\'est inscrit sur la plateforme',
    metadata: {
      userRole: 'advertiser',
      registrationMethod: 'email'
    }
  },
  {
    type: 'ambassador_joined',
    title: 'Nouvel ambassadeur rejoint',
    description: 'Un nouvel ambassadeur a rejoint la plateforme',
    metadata: {
      userRole: 'ambassador',
      location: 'Douala'
    }
  },
  {
    type: 'campaign_completed',
    title: 'Campagne "Black Friday" terminée',
    description: 'Une campagne a été marquée comme terminée',
    metadata: {
      campaignTitle: 'Black Friday',
      duration: '30 jours'
    }
  },
  {
    type: 'campaign_paused',
    title: 'Campagne "Promo Hiver" mise en pause',
    description: 'Une campagne a été mise en pause temporairement',
    metadata: {
      campaignTitle: 'Promo Hiver',
      reason: 'Budget épuisé'
    }
  },
  {
    type: 'payment_received',
    title: 'Paiement reçu de 25,000 FCFA',
    description: 'Un nouveau paiement a été reçu',
    metadata: {
      amount: 25000,
      paymentMethod: 'Orange Money'
    }
  },
  {
    type: 'campaign_created',
    title: 'Nouvelle campagne créée par "Fashion Store"',
    description: 'Une nouvelle campagne publicitaire a été créée',
    metadata: {
      campaignTitle: 'Collection Printemps',
      advertiserName: 'Fashion Store'
    }
  },
  {
    type: 'user_registered',
    title: 'Nouvel ambassadeur inscrit',
    description: 'Un nouvel utilisateur s\'est inscrit sur la plateforme',
    metadata: {
      userRole: 'ambassador',
      registrationMethod: 'phone'
    }
  }
];

async function seedActivities() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connecté à MongoDB');

    console.log('\n🌱 Début du seeding des activités...\n');

    // Vérifier s'il y a déjà des activités
    const existingActivities = await Activity.countDocuments();
    
    if (existingActivities > 0) {
      console.log(`ℹ️  Il y a déjà ${existingActivities} activités dans la base de données`);
      console.log('💡 Pour réinitialiser, supprimez d\'abord la collection activities');
      return;
    }

    // Créer les activités avec des dates échelonnées
    const activities = testActivities.map((activity, index) => ({
      ...activity,
      createdAt: new Date(Date.now() - (index * 1000 * 60 * 60 * 2)), // 2h d'intervalle
      isRead: Math.random() > 0.5 // 50% de chance d'être lu
    }));

    await Activity.insertMany(activities);

    console.log(`✅ ${activities.length} activités créées avec succès !`);
    console.log('\n📋 Activités créées:');
    activities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.title} (${activity.type})`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création des activités:', error);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le seed si le script est appelé directement
if (require.main === module) {
  seedActivities()
    .then(() => {
      console.log('\n🎉 Script de seed des activités terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { seedActivities }; 