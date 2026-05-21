# VIBRA CONNECT

Marketplace digital africain (Next.js 16, Prisma, NextAuth, Bizapay).

## Prérequis

- Node.js 20+
- PostgreSQL (local ou hébergé : Neon, Supabase, Vercel Postgres, etc.)

## Installation locale

```bash
npm install
cp .env.example .env
# Renseigner DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
```

### Base de données

```bash
# Générer le client Prisma
npm run prisma:generate

# Appliquer le schéma + seed (dev rapide)
npm run prisma:sync

# Ou migrations formelles (recommandé prod)
npm run prisma:migrate:deploy
npm run prisma:seed
```

### Base déjà créée avec `db push` (Supabase / prod existante)

Si `prisma migrate deploy` renvoie **P3005** (base non vide) et que le schéma est déjà à jour :

```bash
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script
# → doit afficher « empty migration »

npm run prisma:baseline:location   # marque la migration localisation comme appliquée
npm run prisma:seed
```

### Compte CEO (seed dev)

Après le seed :

| Champ | Valeur |
|--------|--------|
| Email | `ceo@bizaflow.app` |
| Mot de passe | `Admin@2026` |

**Changer ce mot de passe en production.**

### Lancer l’app

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) (éviter `127.0.0.1` : NextAuth lie les cookies à l’hôte).

## Variables d’environnement

Voir [`.env.example`](.env.example).

| Variable | Obligatoire | Rôle |
|----------|-------------|------|
| `DATABASE_URL` | Oui | Connexion Prisma |
| `DIRECT_URL` | Oui | Migrations / connexion directe |
| `NEXTAUTH_SECRET` | Oui | Sessions JWT |
| `NEXTAUTH_URL` | Oui | URL canonique (login, liens, callbacks) |
| `NEXT_PUBLIC_APP_URL` | Prod recommandé | Métadonnées / Open Graph |
| `CLOUDINARY_*` | Non | Upload fichier ; sinon URLs manuelles |

## Déploiement Vercel

1. Importer le projet et lier la base Postgres.
2. Définir les variables du tableau ci-dessus (Settings → Environment Variables).
3. `NEXTAUTH_URL` = URL de production exacte (ex. `https://vibra-connect-ten.vercel.app`).
4. Après déploiement : exécuter `prisma migrate deploy` puis `prisma db seed` sur la base prod (CLI ou script de build).
5. Optionnel : Cloudinary pour les uploads image.

## Scripts utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run lint` | ESLint |
| `npm run prisma:sync` | generate + db push + seed |
| `npm run pwa:icons` | Régénérer les icônes PWA |

## Parcours principaux

- **Invité** : Marketplace `/explore`, inscription `/register`
- **CLIENT** : Publier un business → `/dashboard/business/create` (puis validation CEO, statut `PENDING`)
- **BUSINESS_OWNER** : Dashboard `/dashboard/business`, produits, abonnement Bizapay
- **AGENT** : `/agent`
- **CEO** (`SUPER_ADMIN`) : `/dashboard/ceo`, admin `/admin`

## Upload images

Si Cloudinary est configuré : bouton « Choisir une photo » sur profil, business, produits, preuve Bizapay.  
Sinon : message *« Upload image non configuré, utilisez une URL »* et champs URL inchangés.

## Suite du plan projet (point par point)

1. ✅ Configuration documentée (ce README + `.env.example`)
2. ✅ Migrations + seed base (baseline + seed — voir ci-dessus)
3. ✅ Versionner le code (`54cf8c1` sur `origin/main`)
4. Tests manuels des parcours critiques
5. … (promotions, avis, notifications, etc.)
