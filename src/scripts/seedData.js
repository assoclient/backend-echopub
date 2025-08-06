const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const User = require('../models/User');
require('dotenv').config();

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/echopub';

// Données du super admin par défaut
const defaultSuperAdmin = {
  name: 'Super Administrateur',
  email: 'admin@echopub.com',
  phone: '+237 123456789',
  password: 'admin123456',
  role: 'superadmin',
  permissions: [
    'users_manage',
    'campaigns_manage', 
    'admins_manage',
    'reports_view',
    'settings_manage'
  ],
  isActive: true
};

// Données de test pour les utilisateurs
const testUsers = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+237 123456789',
    password: 'password123',
    role: 'advertiser',
    whatsapp_number: '+237 123456789',
    location: 'Douala',
    contacts_count: 150,
    balance: 50000
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+237 987654321',
    password: 'password123',
    role: 'ambassador',
    whatsapp_number: '+237 987654321',
    location: 'Yaoundé',
    contacts_count: 300,
    balance: 25000
  },
  {
    name: 'Manager Test',
    email: 'manager@echopub.com',
    phone: '+237 555555555',
    password: 'manager123',
    role: 'manager',
    permissions: [
      'users_manage',
      'campaigns_manage',
      'reports_view'
    ],
    isActive: true
  }
];

async function seedSuperAdmin() {
  try {
    // Vérifier si un super admin existe déjà
    const existingSuperAdmin = await Admin.findOne({ 
      role: 'superadmin',
      email: defaultSuperAdmin.email 
    });

    if (existingSuperAdmin) {
      console.log('ℹ️  Un super admin existe déjà avec cet email:', defaultSuperAdmin.email);
      console.log('📧 Email:', existingSuperAdmin.email);
      console.log('👤 Nom:', existingSuperAdmin.name);
      console.log('📱 Téléphone:', existingSuperAdmin.phone);
      console.log('🔑 Mot de passe: admin123456');
      return existingSuperAdmin;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(defaultSuperAdmin.password, 10);

    // Créer le super admin
    const superAdmin = new Admin({
      ...defaultSuperAdmin,
      password: hashedPassword
    });

    await superAdmin.save();

    console.log('✅ Super admin créé avec succès !');
    console.log('📧 Email:', superAdmin.email);
    console.log('👤 Nom:', superAdmin.name);
    console.log('📱 Téléphone:', superAdmin.phone);
    console.log('🔑 Mot de passe:', defaultSuperAdmin.password);
    console.log('🔐 Rôle:', superAdmin.role);
    console.log('✅ Permissions:', superAdmin.permissions.join(', '));

    return superAdmin;

  } catch (error) {
    console.error('❌ Erreur lors de la création du super admin:', error);
    throw error;
  }
}

async function seedTestUsers() {
  try {
    const createdUsers = [];

    for (const userData of testUsers) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`ℹ️  Utilisateur existe déjà: ${userData.email}`);
        createdUsers.push(existingUser);
        continue;
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Créer l'utilisateur
      const user = new User({
        ...userData,
        password: hashedPassword
      });

      await user.save();
      createdUsers.push(user);

      console.log(`✅ Utilisateur créé: ${userData.name} (${userData.email})`);
      console.log(`   📱 Téléphone: ${userData.phone}`);
      console.log(`   🔑 Mot de passe: ${userData.password}`);
      console.log(`   👤 Rôle: ${userData.role}`);
    }

    return createdUsers;

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs de test:', error);
    throw error;
  }
}

async function seedAllData() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connecté à MongoDB');

    console.log('\n🌱 Début du seeding des données...\n');

    // Créer le super admin
    console.log('👑 Création du Super Admin...');
    await seedSuperAdmin();

    console.log('\n👥 Création des utilisateurs de test...');
    await seedTestUsers();

    console.log('\n🎉 Seeding terminé avec succès !');
    console.log('\n📋 Récapitulatif des comptes créés:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 Super Admin:');
    console.log('   📧 Email: admin@echopub.com');
    console.log('   🔑 Mot de passe: admin123456');
    console.log('   🔐 Rôle: superadmin');
    console.log('');
    console.log('👥 Utilisateurs de test:');
    console.log('   📧 john@example.com (Annonceur) - password123');
    console.log('   📧 jane@example.com (Ambassadeur) - password123');
    console.log('   📧 manager@echopub.com (Manager) - manager123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('💥 Erreur fatale lors du seeding:', error);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le seed si le script est appelé directement
if (require.main === module) {
  seedAllData()
    .then(() => {
      console.log('\n🎉 Script de seed terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { seedSuperAdmin, seedTestUsers, seedAllData }; 