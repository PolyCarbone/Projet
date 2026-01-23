# Polycarbone

Application web de sensibilisation et de réduction de l'empreinte carbone personnelle.

## Équipe

- **Justin Allanic** - Chef de projet
- **Rémi Geraud** - UX/UI Designer
- **Alban Sellier** - Développeur Back-end & DevOps
- **Théophile Arnould** - Développeur Front-end

## Prérequis

Avant de commencer, assurez-vous d'avoir les éléments suivants installés sur votre machine :

### Logiciels requis
- **Node.js** (version 18.x ou supérieure) - [Télécharger Node.js](https://nodejs.org/)
- **npm** (version 9.x ou supérieure) - Généralement installé avec Node.js
- **Docker Desktop** - [Télécharger Docker](https://www.docker.com/products/docker-desktop/)
- **Git** - [Télécharger Git](https://git-scm.com/)

### Fichiers de configuration requis
Avant de lancer le projet, vous devez disposer des fichiers de configuration suivants :

1. **`.env`** - Variables d'environnement pour Docker et la base de données
2. **`.env.local`** - Variables d'environnement pour l'application Next.js

> ⚠️ **Important** : Ces fichiers contiennent des informations sensibles et ne sont pas versionnés. Contactez un membre de l'équipe pour obtenir les valeurs appropriées.

### Vérification de l'installation
Pour vérifier que tout est correctement installé :

```bash
node --version    # Devrait afficher v18.x.x ou supérieur
npm --version     # Devrait afficher 9.x.x ou supérieur
docker --version  # Devrait afficher Docker version 20.x.x ou supérieur
git --version     # Devrait afficher git version 2.x.x ou supérieur
```

## Installation initiale

### 1. Cloner le dépôt
```bash
git clone https://github.com/PolyCarbone/Projet
cd polycarbone
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Démarrer Docker
Assurez-vous que Docker Desktop est lancé, puis démarrez les conteneurs :

```bash
docker compose up -d
```

Cette commande démarre la base de données PostgreSQL en arrière-plan.

### 4. Configurer Prisma et la base de données
```bash
# Générer le client Prisma
npx prisma generate

# Créer et appliquer la migration initiale
npx prisma migrate dev --name init

# Vérifier que le client est bien généré
npx prisma generate
```

### 5. Lancer l'application
```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour voir l'application.

## Gestion de la base de données avec Prisma

### Comprendre Prisma
Prisma est un ORM (Object-Relational Mapping) moderne qui facilite l'interaction avec la base de données. Le fichier `prisma/schema.prisma` définit votre modèle de données.

### Commandes essentielles

#### Générer le client Prisma
```bash
npx prisma generate
```
**Quand l'utiliser** : Après chaque modification du fichier `schema.prisma`. Cette commande génère le client TypeScript typé qui vous permet d'interagir avec votre base de données.

#### Créer une nouvelle migration
```bash
npx prisma migrate dev --name nom_de_la_migration
```
**Quand l'utiliser** : Après avoir modifié le schéma (`schema.prisma`). Cette commande :
1. Crée un fichier de migration SQL dans `prisma/migrations/`
2. Applique la migration à la base de données de développement
3. Génère automatiquement le client Prisma

**Exemple** :
```bash
npx prisma migrate dev --name add_user_avatar
```

#### Appliquer les migrations existantes
```bash
npx prisma migrate deploy
```
**Quand l'utiliser** : En production ou lors du déploiement. Cette commande applique toutes les migrations en attente sans créer de nouvelles migrations.

#### Réinitialiser complètement la base de données
```bash
npx prisma migrate reset
```
**Quand l'utiliser** : Quand vous voulez repartir de zéro. Cette commande :
1. Supprime la base de données
2. Recrée la base de données
3. Applique toutes les migrations depuis le début
4. Exécute le seed (si configuré)

⚠️ **Attention** : Cette commande supprime TOUTES les données !

#### Vérifier l'état des migrations
```bash
npx prisma migrate status
```
**Quand l'utiliser** : Pour vérifier si toutes les migrations ont été appliquées correctement.

#### Ouvrir Prisma Studio (interface graphique)
```bash
npx prisma studio
```
**Quand l'utiliser** : Pour visualiser et éditer les données de votre base de données via une interface web conviviale. Accessible sur [http://localhost:5555](http://localhost:5555).

#### Formater le fichier schema.prisma
```bash
npx prisma format
```
**Quand l'utiliser** : Pour formater automatiquement votre fichier `schema.prisma` selon les conventions Prisma.

#### Valider le schéma Prisma
```bash
npx prisma validate
```
**Quand l'utiliser** : Pour vérifier que votre fichier `schema.prisma` ne contient pas d'erreurs de syntaxe.

### Workflow de développement complet

#### Ajouter un nouveau modèle ou modifier le schéma
1. Modifier le fichier `prisma/schema.prisma`
2. Créer et appliquer la migration :
   ```bash
   npx prisma migrate dev --name description_du_changement
   ```
3. Le client Prisma est automatiquement généré

#### Synchroniser avec les modifications d'un collègue
```bash
git pull
npm install
npx prisma migrate dev
npx prisma generate
```

#### Résoudre les conflits de migration
Si vous avez des migrations qui entrent en conflit :
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### 🐳 Gestion de Docker

#### Démarrer les conteneurs
```bash
docker compose up -d
```
Le flag `-d` (detached) lance les conteneurs en arrière-plan.

#### Arrêter les conteneurs
```bash
docker compose down
```

#### Voir les logs des conteneurs
```bash
docker compose logs -f
```

#### Redémarrer les conteneurs
```bash
docker compose restart
```

#### Supprimer complètement les conteneurs et les volumes (⚠️ supprime les données)
```bash
docker compose down -v
```

#### Reconstruire les conteneurs
```bash
docker compose up -d --build
```

#### Vérifier l'état des conteneurs
```bash
docker compose ps
```

## Réinitialisation totale

Si vous voulez tout réinitialiser (base de données, conteneurs, etc.) :

```bash
# 1. Arrêter et supprimer les conteneurs + volumes
docker compose down -v

# 2. Redémarrer les conteneurs
docker compose up -d

# 3. Réinitialiser Prisma
npx prisma migrate reset

# 4. Optionnel : Vérifier avec Prisma Studio
npx prisma studio
```

## Scripts disponibles

```bash
npm run dev          # Lancer le serveur de développement
npm run build        # Créer un build de production
npm run start        # Lancer le serveur de production
npm run lint         # Vérifier le code avec ESLint
```

## 📦 Technologies utilisées

- **Next.js** - Framework React
- **TypeScript** - Langage de programmation
- **Prisma** - ORM pour la base de données
- **PostgreSQL** - Base de données
- **Docker** - Conteneurisation
- **Tailwind CSS** - Framework CSS
- **Better-Auth** - Authentification
