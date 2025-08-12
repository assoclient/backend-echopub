# Correction du Filtrage des Campagnes pour Ambassadeurs

## Problème Identifié

L'endpoint `/active-campaigns` retournait toutes les campagnes actives dans la zone de l'ambassadeur, même celles auxquelles il avait déjà participé. L'utilisateur voulait voir seulement les campagnes **non encore publiées** par l'ambassadeur.

## Solution Appliquée

### 1. Ajout du Modèle AmbassadorCampaign

```javascript
const AmbassadorCampaign = require('../models/AmbassadorCampaign');
```

### 2. Exclusion des Campagnes Déjà Participées

**Avant :**
```javascript
const query = {
  status: 'active',
  end_date: { $gte: new Date() },
  $expr: { $gt: ["$expected_views", "$number_views_assigned"] },
  $or: [
    { 'target_location': { $elemMatch: { value: ambassador.location.city } }},
    { 'target_location': { $elemMatch: { value: ambassador.location.region } } },
  ]
};
```

**Après :**
```javascript
// Trouver les campagnes où l'ambassadeur a déjà participé
const ambassadorCampaigns = await AmbassadorCampaign.find({
  ambassador: req.user.id
}).distinct('campaign');

const query = {
  status: 'active',
  end_date: { $gte: new Date() },
  $expr: { $gt: ["$expected_views", "$number_views_assigned"] },
  // Exclure les campagnes où l'ambassadeur a déjà participé
  _id: { $nin: ambassadorCampaigns },
  $or: [
    { 'target_location': { $elemMatch: { value: ambassador.location.city } }},
    { 'target_location': { $elemMatch: { value: ambassador.location.region } } },
  ]
};
```

### 3. Correction du Comptage Total

**Avant :**
```javascript
let campaigns = await Campaign.find(query).populate('advertiser', 'name')
  .skip(skip)
  .limit(parseInt(pageSize));

const total = campaigns.length; // ❌ Incorrect - compte seulement la page actuelle
```

**Après :**
```javascript
// Compter le total des campagnes disponibles (pour la pagination)
const total = await Campaign.countDocuments(query); // ✅ Correct - compte toutes les campagnes

// Trouver les campagnes disponibles avec pagination
let campaigns = await Campaign.find(query).populate('advertiser', 'name')
  .skip(skip)
  .limit(parseInt(pageSize));
```

### 4. Amélioration du Logging

```javascript
console.log('Campagnes déjà participées par l\'ambassadeur:', ambassadorCampaigns);
console.log(`Ambassadeur ${req.user.id}: ${total} campagnes disponibles, ${campaigns.length} retournées`);
```

## Logique de Filtrage

### Étapes de Filtrage :

1. **Récupération des participations existantes** :
   ```javascript
   const ambassadorCampaigns = await AmbassadorCampaign.find({
     ambassador: req.user.id
   }).distinct('campaign');
   ```

2. **Exclusion des campagnes participées** :
   ```javascript
   _id: { $nin: ambassadorCampaigns }
   ```

3. **Autres critères maintenus** :
   - ✅ Campagnes actives (`status: 'active'`)
   - ✅ Non expirées (`end_date: { $gte: new Date() }`)
   - ✅ Vues disponibles (`$expr: { $gt: ["$expected_views", "$number_views_assigned"] }`)
   - ✅ Zone géographique correspondante (ville/région)
   - ✅ Recherche par titre (optionnel)

## Avantages de la Solution

1. **Filtrage Précis** :
   - Affiche seulement les nouvelles opportunités
   - Évite les doublons de participation
   - Améliore l'expérience utilisateur

2. **Performance Optimisée** :
   - Utilise `distinct()` pour récupérer efficacement les IDs
   - `$nin` pour exclusion performante
   - `countDocuments()` pour pagination correcte

3. **Debugging Amélioré** :
   - Logs des campagnes déjà participées
   - Comptage des résultats retournés
   - Traçabilité des requêtes

## Résultat

### Avant la Correction :
- Ambassadeur voit **toutes** les campagnes actives dans sa zone
- Possibilité de voir des campagnes déjà publiées
- Confusion et redondance

### Après la Correction :
- Ambassadeur voit **seulement** les nouvelles opportunités
- Exclusion automatique des campagnes déjà participées
- Interface claire et pertinente

## Test de Validation

Pour tester :
1. ✅ **Nouvel ambassadeur** : Voit toutes les campagnes disponibles
2. ✅ **Ambassadeur expérimenté** : Voit seulement les nouvelles campagnes
3. ✅ **Après participation** : La campagne disparaît de la liste
4. ✅ **Pagination** : Comptage total correct

L'endpoint retourne maintenant exactement ce que l'utilisateur souhaitait : les campagnes non encore publiées par l'ambassadeur !
