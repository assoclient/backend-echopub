# 🚀 Intégration CamPay API - Guide d'utilisation

## 📋 Prérequis

1. **Compte CamPay** : Créez un compte sur [https://demo.campay.net](https://demo.campay.net)
2. **Application** : Enregistrez une application pour obtenir vos identifiants API
3. **Variables d'environnement** : Configurez vos identifiants CamPay

## 🔧 Installation

### 1. Installer les dépendances

```bash
npm install axios uuid
```

### 2. Configuration des variables d'environnement

Créez un fichier `.env` dans le dossier `backend/` :

```bash
# CamPay API Configuration
CAMPAY_BASE_URL=https://demo.campay.net
CAMPAY_USERNAME=votre_username_campay
CAMPAY_PASSWORD=votre_password_campay

# Autres configurations...
MONGODB_URI=mongodb://localhost:27017/echopub
PORT=5000
JWT_SECRET=votre_jwt_secret
```

### 3. Redémarrer le serveur

```bash
npm run dev
```

## 🧪 Tests

### Test de configuration

```bash
npm run test:campay
```

### Test manuel avec Postman

1. **Créer une transaction de dépôt** :
   ```
   POST /api/transactions
   Authorization: Bearer <token>
   Body: {
     "user": "user_id",
     "type": "deposit",
     "method": "cm.mtn",
     "campaign": "campaign_id",
     "paymentData": {
       "phoneNumber": "237XXXXXXXXX"
     }
   }
   ```

2. **Vérifier le statut** :
   ```
   GET /api/transactions/status/:reference
   Authorization: Bearer <token>
   ```

3. **Effectuer un retrait** :
   ```
   POST /api/transactions/withdraw
   Authorization: Bearer <token>
   Body: {
     "user": "ambassador_id",
     "amount": 1000,
     "method": "cm.orange",
     "description": "Retrait de mes gains"
   }
   ```

## 🔄 Flux de paiement

### Dépôt (Annonceur)

1. L'annonceur crée une campagne
2. Il initie le dépôt via l'API
3. Il reçoit un code USSD à utiliser
4. Il confirme le paiement via le code USSD
5. La transaction est confirmée automatiquement
6. La campagne passe au statut "submitted"

### Retrait (Ambassadeur)

1. L'ambassadeur demande un retrait
2. Le système valide le montant et les permissions
3. La demande est envoyée à CamPay
4. CamPay traite le retrait vers le numéro mobile
5. Le statut est mis à jour selon la réponse

## 📱 Codes USSD

- **MTN** : `*126#`
- **Orange** : `#150*50#`

## 🔍 Monitoring

### Logs de débogage

Le système génère des logs détaillés pour chaque opération :

```bash
🔄 Récupération d'un nouveau token CamPay...
✅ Token CamPay obtenu avec succès
🌐 Appel CamPay API: POST collect/ {...}
✅ Paiement CamPay initialisé: {...}
🔄 Statut de la transaction mis à jour: pending → confirmed
```

### Vérification des transactions

Utilisez l'endpoint de vérification pour suivre l'état des transactions :

```bash
GET /api/transactions/status/:reference
```

## 🚨 Dépannage

### Erreurs courantes

1. **Token expiré** : Régénération automatique
2. **Erreur réseau** : Vérifiez la connectivité
3. **Identifiants invalides** : Vérifiez vos variables d'environnement
4. **Montant invalide** : Respectez les limites CamPay

### Vérifications

1. **Configuration** : Variables d'environnement définies
2. **Connectivité** : Accès à l'API CamPay
3. **Permissions** : Droits d'accès à l'application
4. **Logs** : Messages d'erreur détaillés

## 📚 Documentation

- **CamPay API** : [https://demo.campay.net](https://demo.campay.net)
- **Intégration EchoPub** : `CAMPAY_INTEGRATION.md`
- **Tests** : `test-campay.js`

## 🔮 Évolutions

- [ ] Webhooks automatiques
- [ ] Notifications push
- [ ] Historique des transactions
- [ ] Rapports de paiement
- [ ] Support multi-devises

## 💡 Support

Pour toute question ou problème :

1. Vérifiez les logs du serveur
2. Consultez la documentation CamPay
3. Testez avec l'outil de test intégré
4. Vérifiez la configuration des variables d'environnement
