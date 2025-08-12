# 📅 Système de Tâches Cron - Echopub

Ce dossier contient les scripts pour automatiser la gestion des campagnes et autres tâches de maintenance.

## 🚀 Scripts Disponibles

### 1. `autoCompleteCampaigns.js`
**Fonction principale** : Change automatiquement le statut des campagnes à "completed" quand leur date de fin est passée.

**Fonctionnalités** :
- ✅ Vérifie les campagnes avec statut `active` ou `paused`
- ✅ Compare avec la date de fin (`end_date`)
- ✅ Change le statut à `completed` si la date est dépassée
- ✅ Ajoute un timestamp `completed_at`
- ✅ Log l'activité pour traçabilité
- ✅ Gestion des erreurs robuste

### 2. `cronManager.js`
**Gestionnaire principal** : Configure et gère toutes les tâches cron.

**Tâches configurées** :
- ⏰ **Horaire** : `0 * * * *` - Toutes les heures
- 🌅 **Quotidienne** : `0 2 * * *` - Tous les jours à 2h00
- ⚡ **Fréquente** : `*/30 * * * *` - Toutes les 30 minutes (pour tests)

### 3. `startCron.js`
**Script de démarrage** : Lance les tâches cron avec options configurables.

### 4. `testCron.js`
**Script de test** : Permet de tester les fonctionnalités sans attendre le cron.

## 🛠️ Installation et Configuration

### 1. Installer les dépendances
```bash
cd backend
npm install
```

### 2. Configuration de l'environnement
Assurez-vous que votre fichier `.env` contient :
```env
MONGODB_URI=mongodb://localhost:27017/echopub
NODE_ENV=production
```

## 📖 Utilisation

### Exécution manuelle d'une tâche
```bash
# Tester la fonction de complétion automatique
node src/scripts/testCron.js

# Exécuter manuellement une tâche
node src/scripts/startCron.js --manual hourly
node src/scripts/startCron.js --manual daily
```

### Démarrer les tâches cron
```bash
# Démarrer toutes les tâches
node src/scripts/startCron.js

# Démarrer seulement la tâche horaire
node src/scripts/startCron.js --hourly

# Démarrer seulement la tâche quotidienne
node src/scripts/startCron.js --daily

# Démarrer seulement la tâche fréquente (pour tests)
node src/scripts/startCron.js --frequent
```

### Vérifier le statut
```bash
# Afficher le statut des tâches
node src/scripts/startCron.js --status
```

## 🔧 Intégration dans le Serveur

### Option 1 : Processus séparé (Recommandé)
Lancer le gestionnaire de cron dans un processus séparé :
```bash
# Terminal 1 : Serveur principal
npm start

# Terminal 2 : Gestionnaire cron
node src/scripts/startCron.js
```

### Option 2 : Intégration dans le serveur principal
Ajouter dans votre `server.js` :
```javascript
const cronManager = require('./src/scripts/cronManager');

// Démarrer les tâches cron après le démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  
  // Démarrer les tâches cron
  cronManager.startAllCronJobs();
});
```

## ⚙️ Configuration des Tâches

### Modifier les fréquences
Dans `cronManager.js`, modifiez `CRON_CONFIG` :
```javascript
const CRON_CONFIG = {
  CAMPAIGN_COMPLETION: '0 * * * *',     // Toutes les heures
  DAILY_CAMPAIGN_CHECK: '0 2 * * *',    // Tous les jours à 2h00
  FREQUENT_CHECK: '*/15 * * * *',       // Toutes les 15 minutes
};
```

### Fuseau horaire
Le fuseau horaire est configuré pour le Cameroun (`Africa/Douala`). Pour le changer :
```javascript
timezone: "Europe/Paris"  // Exemple pour la France
```

## 📊 Monitoring et Logs

### Logs automatiques
Chaque exécution génère des logs détaillés :
```
🕐 Exécution de la tâche cron: Vérification des campagnes à compléter
⏰ Heure d'exécution: 2024-01-15T10:00:00.000Z
📊 2 campagne(s) trouvée(s) à compléter

📝 Traitement de la campagne: Campagne Pizza Hut (ID: 507f1f77bcf86cd799439011)
   - Statut actuel: active
   - Date de fin: 2024-01-14T23:59:59.000Z
   - Annonceur: John Doe
   ✅ Statut changé à 'completed'
   📝 Activité loggée
```

### Vérification du statut
```bash
node src/scripts/startCron.js --status
```

## 🚨 Gestion des Erreurs

### Erreurs de connexion
- Le script se reconnecte automatiquement à MongoDB
- Logs détaillés en cas d'échec

### Erreurs de traitement
- Chaque campagne est traitée individuellement
- Les erreurs n'arrêtent pas le traitement des autres campagnes
- Compteur d'erreurs dans le résumé

### Arrêt propre
- Gestion des signaux SIGINT et SIGTERM
- Arrêt propre des tâches cron
- Fermeture des connexions

## 🔍 Débogage

### Mode verbose
Ajouter des logs supplémentaires dans `autoCompleteCampaigns.js` :
```javascript
console.log('🔍 Debug: Requête MongoDB:', JSON.stringify(query, null, 2));
```

### Test avec données factices
Créer des campagnes de test avec des dates passées pour vérifier le fonctionnement.

## 📈 Performance

### Optimisations
- Requêtes MongoDB optimisées avec index sur `status` et `end_date`
- Traitement en parallèle des campagnes
- Timeout configurable pour éviter les blocages

### Monitoring
- Temps d'exécution mesuré
- Nombre de campagnes traitées
- Statistiques d'erreurs

## 🚀 Déploiement

### Production
```bash
# Installer PM2 pour la gestion des processus
npm install -g pm2

# Démarrer le gestionnaire de cron
pm2 start src/scripts/startCron.js --name "echopub-cron"

# Vérifier le statut
pm2 status
pm2 logs echopub-cron
```

### Docker
```dockerfile
# Ajouter dans votre Dockerfile
COPY src/scripts ./src/scripts
RUN chmod +x ./src/scripts/*.js

# Lancer le cron dans un conteneur séparé
docker run -d --name echopub-cron echopub:latest node src/scripts/startCron.js
```

## 📞 Support

En cas de problème :
1. Vérifier les logs avec `--status`
2. Tester manuellement avec `--manual`
3. Vérifier la connexion MongoDB
4. Consulter les logs d'erreur détaillés

---

**Note** : Ce système garantit que toutes les campagnes expirées sont automatiquement marquées comme terminées, améliorant la gestion des ressources et la traçabilité des activités.
