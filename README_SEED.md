# 🌱 Scripts de Seed - EchoPub Backend

Ce dossier contient les scripts de seed pour initialiser la base de données avec des données par défaut.

## 📁 Fichiers

- `src/scripts/seedAdmin.js` - Script pour créer uniquement le super admin
- `src/scripts/seedData.js` - Script complet pour créer le super admin et les utilisateurs de test

## 🚀 Utilisation

### 1. Seed du Super Admin uniquement

```bash
npm run seed:admin
```

**Résultat :**
- Crée un super admin avec les identifiants par défaut
- Vérifie si un super admin existe déjà avant de créer

### 2. Seed complet (recommandé)

```bash
npm run seed:data
```

**Résultat :**
- Crée le super admin
- Crée des utilisateurs de test (annonceur, ambassadeur, manager)
- Affiche un récapitulatif complet des comptes créés

## 👑 Comptes créés par défaut

### Super Admin
- **Email :** `admin@echopub.com`
- **Mot de passe :** `admin123456`
- **Rôle :** `superadmin`
- **Permissions :** Toutes les permissions

### Utilisateurs de test

#### Annonceur
- **Email :** `john@example.com`
- **Mot de passe :** `password123`
- **Rôle :** `advertiser`
- **Solde :** 50,000 FCFA

#### Ambassadeur
- **Email :** `jane@example.com`
- **Mot de passe :** `password123`
- **Rôle :** `ambassador`
- **Solde :** 25,000 FCFA

#### Manager
- **Email :** `manager@echopub.com`
- **Mot de passe :** `manager123`
- **Rôle :** `manager`
- **Permissions :** Gestion des utilisateurs, campagnes, rapports

## 🔧 Configuration

### Variables d'environnement

Le script utilise les variables d'environnement suivantes :

```env
MONGODB_URI=mongodb://localhost:27017/echopub
```

### Personnalisation

Pour modifier les données par défaut, éditez les constantes dans les fichiers de seed :

- `defaultSuperAdmin` dans `seedAdmin.js`
- `testUsers` dans `seedData.js`

## 🛡️ Sécurité

- Les mots de passe sont automatiquement hashés avec bcrypt
- Le script vérifie l'existence avant de créer pour éviter les doublons
- Les données sensibles ne sont pas exposées dans les logs

## 📝 Logs

Le script affiche des logs détaillés :

```
✅ Connecté à MongoDB

🌱 Début du seeding des données...

👑 Création du Super Admin...
✅ Super admin créé avec succès !
📧 Email: admin@echopub.com
👤 Nom: Super Administrateur
📱 Téléphone: +237 123456789
🔑 Mot de passe: admin123456
🔐 Rôle: superadmin
✅ Permissions: users_manage, campaigns_manage, admins_manage, reports_view, settings_manage

👥 Création des utilisateurs de test...
✅ Utilisateur créé: John Doe (john@example.com)
   📱 Téléphone: +237 123456789
   🔑 Mot de passe: password123
   👤 Rôle: advertiser

🎉 Seeding terminé avec succès !

📋 Récapitulatif des comptes créés:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👑 Super Admin:
   📧 Email: admin@echopub.com
   🔑 Mot de passe: admin123456
   🔐 Rôle: superadmin

👥 Utilisateurs de test:
   📧 john@example.com (Annonceur) - password123
   📧 jane@example.com (Ambassadeur) - password123
   📧 manager@echopub.com (Manager) - manager123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔌 Connexion MongoDB fermée
```

## ⚠️ Notes importantes

1. **Exécutez le seed après avoir configuré votre base de données**
2. **Changez les mots de passe par défaut en production**
3. **Le script est idempotent - il peut être exécuté plusieurs fois sans créer de doublons**
4. **Assurez-vous que MongoDB est en cours d'exécution avant d'exécuter le script**

## 🔄 Réinitialisation

Pour réinitialiser complètement la base de données :

1. Supprimez les collections existantes
2. Exécutez `npm run seed:data`
3. Vérifiez que les comptes ont été créés correctement 