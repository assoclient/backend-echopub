const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
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

async function seedSuperAdmin() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connecté à MongoDB');

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
      return;
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

  } catch (error) {
    console.error('❌ Erreur lors de la création du super admin:', error);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le seed si le script est appelé directement
if (require.main === module) {
  seedSuperAdmin()
    .then(() => {
      console.log('🎉 Script de seed terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { seedSuperAdmin }; 