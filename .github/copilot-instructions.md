<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

Ce projet est un backend Node.js/Express/MongoDB pour une plateforme de campagnes sponsorisées WhatsApp. Utiliser Mongoose pour les modèles, JWT pour l’authentification, et respecter la structure MVC (models, controllers, routes).

Projet : Plateforme de diffusion de statuts WhatsApp sponsorisés
Slogan : "C’est comme du bouche-à-oreille digital."
🎯 Objectif
Permettre aux annonceurs de promouvoir leurs produits ou services via les statuts WhatsApp d’utilisateurs ordinaires (ambassadeurs), qui sont rémunérés en fonction des vues (CPV) et des clics (CPC) générés. La plateforme assure la gestion, le suivi, la sécurité et la rémunération des campagnes.

👥 Les 3 rôles clés
1. Annonceur
Crée des campagnes sponsorisées.

Définit un budget, un format (image/vidéo/texte), un lien cible.

Cible les ambassadeurs par ville, région ou rayon GPS.

Choisit un mode de paiement : CPV (min 10 FCFA) ou CPC (min 20 FCFA).

Achète des packs de publication.

Suit les statistiques de performance.

Peut ajuster les prix ou arrêter une campagne.

2. Ambassadeur
Renseigne son profil WhatsApp (contacts, localité).

Accepte et publie les campagnes disponibles dans sa zone.

Upload une capture d’écran pour prouver la publication.

Le système extrait automatiquement le nombre de vues via OCR.

Les clics sont détectés via des liens trackés.

Reçoit 75 % du montant par vue ou clic.

Peut retirer ses gains via Mobile Money.

3. Administrateur
Supervise l’ensemble de la plateforme.

Modère les campagnes ou contenus douteux.

Vérifie les captures si l’OCR échoue.

Valide ou rejette des ambassadeurs suspects.

Gère les packs de publication et les tarifs plancher (CPV, CPC).

Dispose d’un tableau de bord global : campagnes, paiements, statistiques, fraudes.

Peut bloquer des comptes ou des campagnes.

⚙️ Fonctionnalités clés du MVP
🔸 Annonceurs
Inscription + KYC simplifié.

Création de campagne : message, visuel, lien, géociblage.

Choix entre CPV ou CPC (tarifs ≥ 10 FCFA / 20 FCFA).

Paiement d’un pack (Mobile Money).

Visualisation des performances (nombre de vues / clics, coût par action...).

🔸 Ambassadeurs
Création de profil + infos WhatsApp.

Liste des campagnes disponibles (selon sa géolocalisation).

Upload de captures d’écran (analyse automatique des vues).

Rémunération automatique en fonction des résultats.

Historique des gains + demande de retrait Mobile Money.

🔸 Admin
Tableau de bord global : campagnes, utilisateurs, paiements, vues/clics totaux.

Modération des contenus (visuels/messages).

Vérification manuelle des preuves de publication (si OCR douteux).

Analyse anti-fraude : détection doublons, bots, triche...

Configuration des commissions, seuils de CPV/CPC, packs disponibles.

💰 Business Model
Revenu principal : 25 % de commission sur chaque vue ou clic.

Vente de packs publicitaires (ex. 5 000 vues pour 50 000 FCFA).

Tarification minimale :

CPV = 10 FCFA

CPC = 20 FCFA

Paiements des annonceurs via Mobile Money.

Rémunération automatique des ambassadeurs avec suivi.
