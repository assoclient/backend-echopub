const axios = require('axios');

// Configuration de test
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5000/api',
  testUser: {
    id: 'test_user_id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'advertiser'
  },
  testCampaign: {
    id: 'test_campaign_id',
    title: 'Test Campaign',
    budget: 1000
  }
};

// Test de l'API CamPay
async function testCamPayIntegration() {
  console.log('🧪 Test de l\'intégration CamPay API...\n');

  try {
    // Test 1: Création d'une transaction de dépôt
    console.log('📥 Test 1: Création d\'une transaction de dépôt');
    
    const depositData = {
      user: TEST_CONFIG.testUser.id,
      type: 'deposit',
      method: 'cm.mtn',
      campaign: TEST_CONFIG.testCampaign.id,
      paymentData: {
        phoneNumber: '237679587525'
      }
    };

    console.log('Données de test:', JSON.stringify(depositData, null, 2));

    try {
      const depositResponse = await axios.post(`${TEST_CONFIG.baseUrl}/transactions`, depositData);
      console.log('✅ Dépôt créé avec succès:', depositResponse.data);
      
      // Test 2: Vérification du statut de la transaction
      if (depositResponse.data.transaction?.reference) {
        console.log('\n📊 Test 2: Vérification du statut de la transaction');
        
        const statusResponse = await axios.get(
          `${TEST_CONFIG.baseUrl}/transactions/status/${depositResponse.data.transaction.reference}`
        );
        console.log('✅ Statut récupéré:', statusResponse.data);
      }
      
    } catch (depositError) {
      console.log('❌ Erreur lors du dépôt:', depositError.response?.data || depositError.message);
    }

    // Test 3: Test de retrait (simulation)
    console.log('\n📤 Test 3: Test de retrait (simulation)');
    
    const withdrawData = {
      user: 'test_ambassador_id',
      amount: 500,
      method: 'cm.orange',
      description: 'Test de retrait'
    };

    console.log('Données de retrait:', JSON.stringify(withdrawData, null, 2));
    console.log('ℹ️  Note: Ce test nécessite un utilisateur ambassadeur valide');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Test de la configuration CamPay
async function testCamPayConfig() {
  console.log('\n🔧 Test de la configuration CamPay...\n');

  const requiredEnvVars = [
    'CAMPAY_BASE_URL',
    'CAMPAY_USERNAME', 
    'CAMPAY_PASSWORD'
  ];

  console.log('Variables d\'environnement requises:');
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`❌ ${varName}: Non définie`);
    }
  });

  if (!process.env.CAMPAY_USERNAME || !process.env.CAMPAY_PASSWORD) {
    console.log('\n⚠️  Configuration incomplète. Créez un fichier .env avec:');
    console.log('CAMPAY_BASE_URL=https://demo.campay.net');
    console.log('CAMPAY_USERNAME=votre_username');
    console.log('CAMPAY_PASSWORD=votre_password');
  }
}

// Test de connectivité CamPay
async function testCamPayConnectivity() {
  console.log('\n🌐 Test de connectivité CamPay...\n');

  try {
    const baseUrl = process.env.CAMPAY_BASE_URL || 'https://demo.campay.net';
    console.log(`Test de connexion à: ${baseUrl}`);
    
    const response = await axios.get(`${baseUrl}/api/`, { timeout: 10000 });
    console.log('✅ Connectivité OK');
    
  } catch (error) {
    console.log('❌ Erreur de connectivité:', error.message);
  }
}

// Fonction principale
async function runTests() {
  console.log('🚀 Démarrage des tests CamPay API\n');
  
  await testCamPayConfig();
  await testCamPayConnectivity();
  await testCamPayIntegration();
  
  console.log('\n✨ Tests terminés');
}

// Exécution des tests si le fichier est appelé directement
if (require.main === module) {
  // Charger les variables d'environnement
  require('dotenv').config();
  
  runTests().catch(console.error);
}

module.exports = {
  testCamPayIntegration,
  testCamPayConfig,
  testCamPayConnectivity
};
