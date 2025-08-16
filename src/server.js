const app = require('./app');
const cron = require('node-cron');
const { autoCompleteCampaigns } = require('./scripts/autoCompleteCampaigns');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/echopub';

cron.schedule('0 * * * *', async () => {
try {
  console.log('🌅 Démarrage de la tâche quotidienne pour compléter les campagnes...');
  
   autoCompleteCampaigns();
  console.log('✅ Tâche quotidienne terminée');
} catch (error) {
  console.log(error)
}
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
