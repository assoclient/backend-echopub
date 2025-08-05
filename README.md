# Backend WhatsApp Ads Platform

Backend Node.js/Express/MongoDB pour la gestion de campagnes sponsorisées via statuts WhatsApp.

## Démarrage

1. Copier `.env` et configurer les variables.
2. Installer les dépendances : `npm install`
3. Lancer le serveur : `node src/server.js`

## Structure
- `src/models` : Schémas Mongoose
- `src/controllers` : Logique métier
- `src/routes` : Endpoints API
- `src/middleware` : Middlewares (auth, erreurs)

## Fonctionnalités principales
- Authentification JWT
- Gestion utilisateurs, campagnes, transactions
- Attribution campagnes ambassadeurs
- Upload captures, extraction vues (OCR)
- Paiements Mobile Money

## Endpoints principaux

- `POST /api/users` : Créer un utilisateur
- `POST /api/campaigns` : Créer une campagne (annonceur)
- `POST /api/ambassador-campaigns` : Attribuer une campagne à un ambassadeur
- `POST /api/transactions` : Créer une transaction
- `POST /api/admins` : Créer un admin (superadmin)
