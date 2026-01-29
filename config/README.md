# Configuration des Défis et Événements

Ce dossier contient les fichiers de configuration JSON pour gérer les défis et événements de l'application PolyCarbone.

## 📁 Structure des fichiers

### `challenges.json`
Contient tous les défis quotidiens et annuels de l'application.

**Structure d'un défi :**
```json
{
  "id": "daily-bike-commute",
  "title": "Privilégier le vélo pour vos trajets",
  "description": "Utilisez le vélo plutôt que la voiture pour vos déplacements quotidiens",
  "category": "transport",
  "type": "daily",
  "co2Impact": 2.5,
  "isActive": true
}
```

**Catégories disponibles :**
- `transport` : Défis liés aux déplacements
- `alimentation` : Défis liés à l'alimentation
- `logement` : Défis liés au logement et à l'énergie
- `divers` : Défis divers (consommation, numérique, etc.)
- `serviceSocietal` : Défis d'actions collectives

**Types de défis :**
- `daily` : Défi quotidien
- `annual` : Défi annuel (engagement sur l'année)
- `event` : Défi lié à un événement spécifique (géré via events.json)

### `events.json`
Contient tous les événements avec leurs défis associés.

**Structure d'un événement :**
```json
{
  "id": "earth-day-2026",
  "name": "Journée de la Terre 2026",
  "description": "Célébrons la Journée de la Terre...",
  "startDate": "2026-04-22T00:00:00.000Z",
  "endDate": "2026-04-22T23:59:59.999Z",
  "isActive": true,
  "challenges": [
    {
      "id": "earth-day-tree-planting",
      "title": "Planter un arbre",
      "description": "Plantez un arbre...",
      "category": "serviceSocietal",
      "co2Impact": 20.0
    }
  ]
}
```

### Schémas JSON
- `challenges-schema.json` : Schéma de validation pour challenges.json
- `events-schema.json` : Schéma de validation pour events.json

Ces schémas permettent la validation automatique dans les éditeurs compatibles (VS Code, etc.).

## 🚀 Utilisation

### Synchroniser la base de données

Pour mettre à jour la base de données avec les défis et événements configurés :

```bash
# Aperçu des modifications (dry-run)
npm run sync-challenges:dry-run

# Créer les nouveaux défis/événements uniquement
npm run sync-challenges

# Forcer la mise à jour de tous les défis/événements
npm run sync-challenges:force
```

### Options disponibles

- **Sans option** : Crée uniquement les nouveaux défis/événements
- **`--dry-run`** : Affiche les modifications sans les appliquer
- **`--force`** : Met à jour les défis/événements existants avec les nouvelles données

## 📝 Ajouter un nouveau défi

1. Ouvrez `challenges.json`
2. Ajoutez votre défi dans le tableau `challenges` :
   ```json
   {
     "id": "mon-nouveau-defi",
     "title": "Titre du défi",
     "description": "Description détaillée",
     "category": "transport",
     "type": "daily",
     "co2Impact": 1.5,
     "isActive": true
   }
   ```
3. Exécutez `npm run sync-challenges` pour synchroniser

## 📅 Ajouter un événement

1. Ouvrez `events.json`
2. Ajoutez votre événement dans le tableau `events` :
   ```json
   {
     "id": "mon-evenement-2026",
     "name": "Nom de l'événement",
     "description": "Description de l'événement",
     "startDate": "2026-XX-XXT00:00:00.000Z",
     "endDate": "2026-XX-XXT23:59:59.999Z",
     "isActive": true,
     "challenges": [
       {
         "id": "defi-evenement-1",
         "title": "Défi spécial",
         "description": "Description du défi",
         "category": "divers",
         "co2Impact": 5.0
       }
     ]
   }
   ```
3. Exécutez `npm run sync-challenges` pour synchroniser

## ⚠️ Bonnes pratiques

### IDs
- Utilisez le format kebab-case (minuscules avec tirets)
- Les IDs doivent être uniques et descriptifs
- Préfixez les IDs d'événements avec le nom de l'événement

### Impact CO2
- Défis quotidiens : généralement entre 0.1 et 10 kg CO2e
- Défis annuels : généralement entre 100 et 2000 kg CO2e
- Défis événementiels : entre 1 et 50 kg CO2e
- Basez-vous sur des données réalistes

### Dates d'événements
- Utilisez toujours le format ISO 8601
- Vérifiez que endDate > startDate
- Planifiez les événements à l'avance

### Descriptions
- Soyez clair et concis
- Expliquez comment réaliser le défi
- Mentionnez l'impact environnemental

## 🔍 Validation

Les fichiers JSON sont automatiquement validés par les schémas. Si vous utilisez VS Code :

1. Les erreurs de format apparaîtront directement dans l'éditeur
2. L'autocomplétion est disponible
3. Les descriptions des champs s'affichent au survol

## 📊 Impact sur la base de données

Le script de synchronisation :
- ✅ Crée les nouveaux défis et événements
- ✅ Préserve les défis existants par défaut
- ✅ Met à jour avec `--force` si nécessaire
- ✅ Lie automatiquement les défis aux événements
- ⚠️ Ne supprime jamais de données existantes

## 🤝 Contribution

Lors de l'ajout de nouveaux défis :
1. Testez avec `--dry-run` d'abord
2. Vérifiez les valeurs de CO2
3. Assurez-vous que les catégories sont correctes
4. Documentez les défis complexes

## 📚 Références

- [Schéma Prisma](../prisma/schema.prisma) : Modèles de données
- [Script de synchronisation](../scripts/sync-challenges.ts) : Code de synchronisation
- Documentation CO2 : Consultez les sources officielles pour les valeurs d'impact
