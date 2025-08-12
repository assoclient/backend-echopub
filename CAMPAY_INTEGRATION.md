# 🔄 Intégration CamPay API

## 📋 Vue d'ensemble

Ce document décrit l'intégration de l'API CamPay pour gérer les paiements dans EchoPub :
- **Dépôts** : Pour les annonceurs qui financent leurs campagnes
- **Retraits** : Pour les ambassadeurs qui retirent leurs gains

## 🔧 Configuration

### Variables d'environnement requises

```bash
# CamPay API Configuration
CAMPAY_BASE_URL=https://demo.campay.net
CAMPAY_USERNAME=your_campay_username
CAMPAY_PASSWORD=your_campay_password
```

### Installation des dépendances

```bash
npm install axios uuid
```

## 🚀 Fonctionnalités Implémentées

### 1. Dépôt (Collect) - `createTransaction`

**Endpoint** : `POST /api/transactions`

**Fonctionnalité** : Initialise un dépôt pour financer une campagne

**Paramètres** :
```json
{
  "user": "user_id",
  "type": "deposit",
  "method": "cm.orange" | "cm.mtn",
  "campaign": "campaign_id",
  "paymentData": {
    "phoneNumber": "237XXXXXXXXX"
  }
}
```

**Réponse** :
```json
{
  "message": "Transaction créée et paiement initialisé",
  "transaction": {...},
  "campay_reference": "uuid",
  "ussd_code": "*126# for MTN or #150*50# for ORANGE",
  "operator": "mtn or orange",
  "instructions": "Utilisez le code USSD *126# pour compléter le paiement"
}
```

### 2. Retrait (Withdraw) - `withdrawFunds`

**Endpoint** : `POST /api/transactions/withdraw`

**Fonctionnalité** : Initialise un retrait pour un ambassadeur

**Paramètres** :
```json
{
  "user": "user_id",
  "amount": 1000,
  "method": "cm.orange" | "cm.mtn",
  "description": "Retrait de mes gains"
}
```

**Réponse** :
```json
{
  "message": "Retrait initialisé avec succès",
  "transaction": {...},
  "campay_reference": "uuid",
  "status": "pending",
  "note": "Le retrait sera traité dans les prochaines minutes"
}
```

### 3. Vérification de statut - `checkTransactionStatus`

**Endpoint** : `GET /api/transactions/status/:reference`

**Fonctionnalité** : Vérifie le statut d'une transaction CamPay

**Réponse** :
```json
{
  "transaction": {...},
  "campay_status": {
    "status": "SUCCESSFUL" | "PENDING" | "FAILED",
    "amount": 1000,
    "currency": "XAF",
    "operator": "MTN",
    "code": "CP201027T00005",
    "operator_reference": "1880106956"
  },
  "message": "Statut de la transaction récupéré"
}
```

## 🔄 Flux de Paiement

### Dépôt (Annonceur)

1. **Initialisation** : L'annonceur initie un dépôt
2. **Création Transaction** : Transaction créée en base avec statut `pending`
3. **Appel CamPay** : API CamPay Collect appelée
4. **Instructions USSD** : L'annonceur reçoit le code USSD à utiliser
5. **Confirmation** : L'annonceur utilise le code USSD pour confirmer
6. **Mise à jour** : Statut mis à jour via webhook ou vérification manuelle
7. **Activation Campagne** : La campagne passe de `draft` à `submitted`

### Retrait (Ambassadeur)

1. **Demande** : L'ambassadeur demande un retrait
2. **Validation** : Vérification du solde et des permissions
3. **Création Transaction** : Transaction de retrait créée
4. **Appel CamPay** : API CamPay Withdraw appelée
5. **Traitement** : CamPay traite le retrait vers le numéro mobile
6. **Confirmation** : Statut mis à jour selon la réponse CamPay

## 📱 Codes USSD

- **MTN** : `*126#`
- **Orange** : `#150*50#`

## 🔍 Gestion des Erreurs

### Erreurs CamPay

- **ER101** : Numéro de téléphone invalide
- **ER102** : Opérateur non supporté
- **ER201** : Montant invalide
- **ER301** : Solde insuffisant

### Erreurs EchoPub

- **400** : Données invalides
- **403** : Permissions insuffisantes
- **404** : Ressource non trouvée
- **500** : Erreur serveur

## 🔐 Sécurité

- **Authentification** : Token CamPay avec expiration automatique
- **Validation** : Vérification des montants et permissions
- **Idempotence** : Support des références externes uniques
- **Logs** : Traçabilité complète des transactions

## 📊 Monitoring

### Logs de débogage

```bash
🔄 Récupération d'un nouveau token CamPay...
✅ Token CamPay obtenu avec succès
🌐 Appel CamPay API: POST collect/ {...}
✅ Paiement CamPay initialisé: {...}
🔄 Statut de la transaction mis à jour: pending → confirmed
```

### Métriques à surveiller

- Taux de succès des transactions
- Temps de traitement moyen
- Erreurs d'API CamPay
- Utilisation des tokens

## 🚨 Dépannage

### Problèmes courants

1. **Token expiré** : Régénération automatique
2. **Erreur réseau** : Retry automatique
3. **Solde insuffisant** : Vérification préalable
4. **Numéro invalide** : Validation du format

### Support

- **Documentation CamPay** : [https://demo.campay.net](https://demo.campay.net)
- **Logs serveur** : Vérifier les messages d'erreur
- **Statut API** : Endpoint de vérification de statut

## 🔮 Évolutions Futures

- [ ] Webhooks automatiques
- [ ] Notifications push
- [ ] Historique des transactions
- [ ] Rapports de paiement
- [ ] Intégration multi-devises
