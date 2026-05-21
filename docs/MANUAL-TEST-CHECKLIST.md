# Checklist tests manuels — VIBRA CONNECT

**Environnement testé :** ☐ Local `http://localhost:3000` ☐ Prod `https://vibra-connect-ten.vercel.app`

**Date / testeur :** _______________

---

## Prérequis

| # | Vérification | OK |
|---|----------------|-----|
| P1 | `NEXTAUTH_URL` = URL exacte du site testé | ☐ |
| P2 | Base accessible (`npm run prisma:verify-seed` ou app sans erreur DB) | ☐ |
| P3 | Compte CEO : `ceo@bizaflow.app` / `Admin@2026` (changer en prod réelle) | ☐ |
| P4 | Cloudinary configuré **ou** fallback URL accepté pour les tests image | ☐ |

**Comptes à créer pendant les tests :**

- `client-test@…` — rôle CLIENT (inscription)
- Optionnel : second navigateur / navigation privée pour invité

---

## A. Invité (non connecté)

| ID | Action | Résultat attendu | OK |
|----|--------|------------------|-----|
| A1 | Accueil `/` | Page landing, pas d’erreur | ☐ |
| A2 | Clic **Marketplace** | `/explore`, liste ou état vide propre | ☐ |
| A3 | Clic **Business** (nav) | `/register?callbackUrl=…/dashboard/business/create` — **pas** `/login` | ☐ |
| A4 | Clic **Publier mon business** | Même URL que A3 | ☐ |
| A5 | Clic **Connexion** | `/login` | ☐ |
| A6 | Fiche publique `/b/[slug]` (si business ACTIVE existe) | Page vitrine visible | ☐ |

---

## B. Inscription & connexion CLIENT

| ID | Action | Résultat attendu | OK |
|----|--------|------------------|-----|
| B1 | `/register` → créer compte CLIENT | Compte créé, redirection cohérente | ☐ |
| B2 | `/register?callbackUrl=/dashboard/business/create` → inscription | Après signup → **`/dashboard/business/create`** (pas login) | ☐ |
| B3 | Déconnexion `/logout` puis `/login` avec `callbackUrl=/dashboard/business/create` | Après login → **create** | ☐ |
| B4 | Top nav : badge **CLIENT**, menu profil visible | ☐ |
| B5 | Clic **Business** / **Publier** (connecté CLIENT) | **`/dashboard/business/create`** — **pas** `/login` | ☐ |

---

## C. Création business (CLIENT → BUSINESS_OWNER)

| ID | Action | Résultat attendu | OK |
|----|--------|------------------|-----|
| C1 | `/dashboard/business/create` — formulaire | Pays/province/ville, catégorie, nom | ☐ |
| C2 | Soumettre formulaire valide | Redirection **`/dashboard/business`** | ☐ |
| C3 | Session / nav après création | Rôle **BUSINESS** (ou BUSINESS_OWNER), plus CLIENT | ☐ |
| C4 | `/explore` | Business **non visible** tant que statut **PENDING** (normal) | ☐ |
| C5 | `/dashboard/business` sans business (edge) | Redirige vers create si 0 business | ☐ |

---

## D. CEO — validation business

| ID | Action | Résultat attendu | OK |
|----|--------|------------------|-----|
| D1 | Login `ceo@bizaflow.app` | Accès `/dashboard/ceo` | ☐ |
| D2 | `/admin/businesses` — business test **PENDING** | Visible dans la liste | ☐ |
| D3 | Passer statut → **ACTIVE** | Succès, pas d’erreur | ☐ |
| D4 | `/explore` | Business apparaît dans la marketplace | ☐ |
| D5 | `/b/[slug]` | Fiche publique accessible (pas 404) | ☐ |

---

## E. BUSINESS_OWNER — profil & médias

| ID | Action | Résultat attendu | OK |
|----|--------|------------------|-----|
| E1 | `/profile/edit` — modifier nom / ville | Enregistrement OK | ☐ |
| E2 | Avatar : upload **ou** URL | URL enregistrée, visible sur `/profile` | ☐ |
| E3 | `/dashboard/business/edit` — logo, bannière | Preview + sauvegarde API OK | ☐ |
| E4 | Galerie : upload ajoute une ligne URL | Compteur galerie cohérent | ☐ |
| E5 | Clic **Business** (nav) | **`/dashboard/business`** (plus create) | ☐ |

---

## F. Produits / services

| ID | Action | Résultat attendu | OK |
|----|--------|------------------|-----|
| F1 | `/dashboard/business/products` — **Créer** | Modal, champs titre / description / prix | ☐ |
| F2 | Image produit (upload ou URL) | Image sur carte liste + fiche publique | ☐ |
| F3 | **Vente en urgence** (optionnel) | Prix barré + urgent sur explore/card si dates valides | ☐ |
| F4 | Modifier / désactiver disponibilité | Changement persisté après refresh | ☐ |
| F5 | Limite plan FREE | Message clair si quota produits atteint | ☐ |

---

## G. Bizapay (abonnement)

| ID | Action | Résultat attendu | OK |
|----|--------|------------------|-----|
| G1 | `/dashboard/business/subscription` | Numéros officiels + formulaire | ☐ |
| G2 | Preuve paiement (upload ou URL) + référence + envoi | Demande **PENDING**, message succès | ☐ |
| G3 | CEO — validation paiement (si UI prévue) | Statut business / abonnement mis à jour | ☐ |

---

## H. Marketplace & landing

| ID | Action | Résultat attendu | OK |
|----|--------|------------------|-----|
| H1 | `/explore` — filtres ville / catégorie / plan | Résultats filtrés | ☐ |
| H2 | Landing — recherche hero (si données) | Redirection explore avec query | ☐ |
| H3 | Carte business — clic | Fiche `/b/[slug]` | ☐ |
| H4 | Boutons contact (WhatsApp / tel selon préférence) | Pas d’erreur (tracking optionnel) | ☐ |

---

## I. Rôles spéciaux

| ID | Action | Résultat attendu | OK |
|----|--------|------------------|-----|
| I1 | **AGENT** : login → `/agent` (nav Business → `/agent`) | ☐ |
| I2 | **CEO** : nav Business → `/dashboard/ceo` | ☐ |
| I3 | CLIENT ne accède pas `/dashboard/ceo` | Redirection / refus | ☐ |
| I4 | BUSINESS_OWNER ne accède pas `/agent` | Redirection / refus | ☐ |

---

## J. Upload API (si Cloudinary configuré)

| ID | Action | Résultat attendu | OK |
|----|--------|------------------|-----|
| J1 | Upload avatar < 5 Mo JPG/PNG/WebP | URL `https://res.cloudinary.com/…` dans le champ | ☐ |
| J2 | Fichier > 5 Mo ou PDF | Erreur claire, pas de crash | ☐ |
| J3 | `POST /api/upload` sans session (outil API) | **401** JSON | ☐ |
| J4 | Sans Cloudinary | Message « non configuré » + champ URL fonctionne | ☐ |

---

## K. PWA & technique

| ID | Action | Résultat attendu | OK |
|----|--------|------------------|-----|
| K1 | `/manifest.webmanifest` | JSON valide | ☐ |
| K2 | Mobile : bannière install (optionnel) | Pas de erreur console bloquante | ☐ |
| K3 | Pas d’erreur **Configuration** NextAuth sur login | ☐ |

---

## Résumé

| Bloc | Passés | Total |
|------|--------|-------|
| A Invité | /6 | |
| B Auth CLIENT | /5 | |
| C Création business | /5 | |
| D CEO validation | /5 | |
| E Profil & médias | /5 | |
| F Produits | /5 | |
| G Bizapay | /3 | |
| H Marketplace | /4 | |
| I Rôles | /4 | |
| J Upload | /4 | |
| K PWA | /3 | |

**Bloquants relevés :**

```
( notes )
```

**Décision :** ☐ OK pour suite produit ☐ Corrections requises avant point 5
