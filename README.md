# Workout Tracker

Application de gestion de séances de sport hebdomadaires avec thème "Neon Nights".

## Prérequis

- Docker & Docker Compose

## Lancement rapide

```bash
docker-compose up --build
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000).

**Identifiants par défaut :** `admin` / `changeme`

## Configuration

Créez un fichier `.env` à la racine :

```env
JWT_SECRET=votre-secret-jwt-tres-long-et-securise
ADMIN_USERNAME=admin
ADMIN_PASSWORD=motdepasse_securise
DATABASE_PATH=/app/data/db.sqlite
```

## Développement local

```bash
npm install
cp .env.example .env
# Éditez .env avec vos valeurs
npm run dev
```

L'application démarre sur [http://localhost:3000](http://localhost:3000).

## Stack

- **Next.js 15** (App Router, Server Components)
- **Tailwind CSS 4** (thème via variables CSS)
- **SQLite** + **Drizzle ORM**
- **JWT** (jose) stocké en cookie httpOnly
