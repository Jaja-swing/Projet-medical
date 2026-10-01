# Système de Gestion des Rendez-vous Médicaux

API REST de prise de rendez-vous médicaux (NestJS + PostgreSQL) et interface React,
organisées en un monorepo simple.

---

## 🧱 Stack

| Couche | Technologie |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Backend | NestJS 11 + TypeScript (strict) |
| Base de données | PostgreSQL 16 |
| ORM | TypeORM |
| Authentification | JWT (Passport) + bcrypt |
| Validation | class-validator / class-transformer |
| Documentation API | Swagger (`/docs`) |

---

## 📁 Structure du monorepo

```
medical-appointments/
├── package.json              # scripts d'orchestration des deux apps
|
├── README.md
└── apps/
    ├── backend/              # API NestJS
    │   ├── .env.example
    │   └── src/
    │       ├── auth/         # register, login, JWT strategy, guard
    │       ├── users/        # entité User + service
    │       ├── doctors/      # ressource principale (CRUD)
    │       ├── availabilities/
    │       ├── appointments/
    │       ├── common/       # filters, guards, decorators, enums
    │       ├── config/
    │       ├── app.module.ts
    │       └── main.ts
    └── frontend/             # interface React
        ├── .env.example
        └── src/
            ├── api/          # client HTTP + typages
            ├── context/      # AuthContext (JWT)
            ├── components/   # Layout, ProtectedRoute, StatusBadge
            └── pages/        # connexion, inscription, médecins, RDV, profil médecin
```
---

## 🚀 Démarrage rapide

### 1. Prérequis

- Node.js ≥ 20
- PostgreSQL 16 (ou Docker)

### 2. Base de données

Avec Docker :

```bash
npm run db:up      # démarre postgres:16-alpine sur le port 5432
npm run db:down    # supprime le conteneur
```

Ou avec une instance PostgreSQL locale :

```sql
CREATE DATABASE medical_appointments;
```

> Si le port 5432 est déjà occupé par un autre conteneur, démarrer la base sur un autre port
> (`-p 5433:5432`) et ajuster `DB_PORT=5433` dans `apps/backend/.env`.

### 3. Variables d'environnement

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Puis renseigner `JWT_SECRET` avec une valeur longue et aléatoire :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> ⚠️ Les fichiers `.env` ne sont **jamais** commités (voir `.gitignore`).

### 4. Installation

```bash
npm run install:all
```

### 5. Lancement

```bash
npm run dev            # backend + frontend
npm run dev:backend    # API seule    -> http://localhost:3000  (docs: /docs)
npm run dev:frontend   # UI seule     -> http://localhost:5173
```

---

## 🔨 Compilation

```bash
npm run typecheck   # vérification des types seule (rapide, sans écriture)
npm run build       # compile les deux apps
```

| Commande | Sortie |
|---|---|
| `npm --prefix apps/backend run build` | `apps/backend/dist/` (exécuter avec `npm --prefix apps/backend run start:prod`) |
| `npm --prefix apps/frontend run build` | `apps/frontend/dist/` (prévisualiser avec `npm --prefix apps/frontend run preview`) |

Les scripts npm invoquent directement les binaires Node
(`node node_modules/@nestjs/cli/bin/nest.js build`) au lieu de passer par `node_modules/.bin`,
afin de rester fonctionnels même quand l'installation a été faite avec `--no-bin-links`
(voir la note d'environnement en fin de document).

---

## ⚙️ Variables d'environnement

### `apps/backend/.env`

| Variable | Description | Défaut |
|---|---|---|
| `PORT` | Port d'écoute de l'API | `3000` |
| `DB_HOST` / `DB_PORT` | Hôte et port PostgreSQL | `localhost` / `5432` |
| `DB_USERNAME` / `DB_PASSWORD` | Identifiants PostgreSQL | `postgres` / `postgres` |
| `DB_NAME` | Nom de la base | `medical_appointments` |
| `DB_SYNCHRONIZE` | Synchronisation auto du schéma (**dev uniquement**) | `true` |
| `JWT_SECRET` | Secret de signature des JWT | — (obligatoire) |
| `JWT_EXPIRES_IN` | Durée de validité du token | `1d` |
| `CORS_ORIGIN` | Origine autorisée pour le frontend | `http://localhost:5173` |

### `apps/frontend/.env`

| Variable | Description | Défaut |
|---|---|---|
| `VITE_API_URL` | URL de base de l'API | `http://localhost:3000` |

---

## 🛣️ Endpoints

### 🔐 Auth

| Méthode | Route | Accès | Succès |
|---|---|---|---|
| `POST` | `/auth/register` | public | `201` |
| `POST` | `/auth/login` | public | `200` |

### 👨‍⚕️ Doctors

| Méthode | Route | Accès | Succès |
|---|---|---|---|
| `POST` | `/doctors` | MEDECIN, ADMIN | `201` |
| `GET` | `/doctors` | public | `200` |
| `GET` | `/doctors/:id` | public | `200` |
| `PATCH` | `/doctors/:id` | propriétaire, ADMIN | `200` |
| `DELETE` | `/doctors/:id` | propriétaire, ADMIN | `204` |

### 📅 Availabilities

| Méthode | Route | Accès | Succès |
|---|---|---|---|
| `POST` | `/doctors/:id/availabilities` | propriétaire, ADMIN | `201` |
| `GET` | `/doctors/:id/availabilities` | public | `200` |
| `DELETE` | `/availabilities/:id` | propriétaire, ADMIN | `204` |

### 🩺 Appointments

| Méthode | Route | Accès | Succès |
|---|---|---|---|
| `POST` | `/appointments` | PATIENT | `201` |
| `GET` | `/appointments/me` | PATIENT | `200` |
| `GET` | `/appointments/:id` | concerné, ADMIN | `200` |
| `PATCH` | `/appointments/:id/reschedule` | concerné | `200` |
| `PATCH` | `/appointments/:id/cancel` | concerné | `200` |
| `DELETE` | `/appointments/:id` | ADMIN | `204` |

---

## 🖥️ Écrans du frontend

| Route | Écran | Accès |
|---|---|---|
| `/login`, `/register` | Connexion et inscription (choix du rôle) | public |
| `/` | Liste des médecins | authentifié |
| `/doctors/:id` | Fiche médecin, créneaux libres, réservation | authentifié (réservation : `PATIENT`) |
| `/appointments` | Historique des rendez-vous, annulation, reprogrammation | authentifié |
| `/profile` | Profil médecin et gestion des créneaux | `MEDECIN` |

Le JWT est conservé dans `localStorage` et injecté par le client HTTP unique
(`src/api/client.ts`), qui normalise aussi les erreurs renvoyées par l'API.

---

## 🚨 Format d'erreur unifié

Toutes les erreurs passent par `HttpExceptionFilter` (global) :

```json
{
  "statusCode": 404,
  "message": "Doctor not found",
  "error": "Not Found",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "path": "/doctors/123"
}
```

| Code | Cas d'usage |
|---|---|
| `200` | Lecture / mise à jour réussie |
| `201` | Création réussie |
| `204` | Suppression réussie |
| `400` | Validation échouée |
| `401` | Non authentifié / token invalide |
| `403` | Authentifié mais rôle insuffisant |
| `404` | Ressource inexistante |
| `409` | Conflit (email déjà pris, créneau déjà réservé) |

---

## 🔒 Sécurité

- Mots de passe hachés avec **bcrypt** (12 salt rounds).
- Colonne `password` en `select: false` — jamais renvoyée par l'API.
- JWT signé avec `JWT_SECRET` (variable d'environnement, jamais commitée).
- Routes protégées par `JwtAuthGuard` (Passport JWT).
- Autorisation par rôle via `@Roles(...)` + `RolesGuard` (`PATIENT` / `MEDECIN` / `ADMIN`).
- `ValidationPipe` global : `whitelist`, `forbidNonWhitelisted`, `transform`.
- CORS restreint à l'origine du frontend.

---

## 📡 Exemple d'appel curl

```bash
# Inscription
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"patient@example.com","password":"Password123","firstName":"Ana","lastName":"Rakoto"}'

# Connexion
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"patient@example.com","password":"Password123"}'

# Route protégée
curl http://localhost:3000/appointments/me -H "Authorization: Bearer <accessToken>"
```



### Règles métier appliquées

| Règle | Comportement |
|---|---|
| Un utilisateur = un seul profil médecin | `409 Conflict` |
| `licenseNumber` unique | `409 Conflict` |
| Créneau dont `endTime <= startTime` | `400 Bad Request` |
| Créneau chevauchant un créneau existant du même médecin | `409 Conflict` |
| Suppression d'un créneau déjà réservé | `409 Conflict` |
| Réservation d'un créneau déjà pris | `409 Conflict` (UPDATE conditionnel atomique) |
| Réservation d'un créneau passé | `400 Bad Request` |
| Reprogrammation d'un rendez-vous annulé ou terminé | `400 Bad Request` |
| Annulation d'un rendez-vous déjà annulé | `409 Conflict` |
| Annulation ou suppression d'un rendez-vous | le créneau est libéré (`isBooked = false`) |
| Accès à un rendez-vous tiers | `403 Forbidden` |
| Modification du profil médecin d'un autre | `403 Forbidden` |



