# SunuGestion

**Plateforme SaaS de gestion pour commerçants et PME au Sénégal**
Plan comptable SYSCOHADA · Multi-tenant · Next.js 14 · PostgreSQL RLS

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Next.js API Routes (Node.js) |
| Base de données | PostgreSQL 15 + Row Level Security |
| Auth | JWT (jose) + cookies HttpOnly |
| PDF | jsPDF + jsPDF-AutoTable |
| Charts | Recharts |
| Mobile (v2) | React Native |

---

## Architecture multi-tenant

Chaque boutique est un **tenant** isolé. L'isolation est garantie par :

1. Champ `tenant_id` UUID sur **chaque table**
2. **Row Level Security (RLS)** PostgreSQL activé sur toutes les tables
3. Le backend injecte `SET app.tenant_id = 'xxx'` avant toute requête
4. Le middleware Next.js valide le JWT et injecte `x-tenant-id` dans les headers

```
Client HTTP
   ↓ JWT (contient tenantId)
Middleware Next.js
   ↓ x-tenant-id header
API Route Handler
   ↓ SET app.tenant_id = 'xxx'
PostgreSQL RLS Policy → filtre automatique
```

---

## Modules fonctionnels

- **Dashboard** propriétaire (CA, bénéfice, alertes stock, top produits)
- **Produits & Catalogue** (catégories, code-barre, partage réseaux sociaux)
- **Stock** (multi-dépôts, entrées/sorties, alertes, lots)
- **Ventes** (factures, devis, tickets caisse, bons de livraison)
- **Clients** (dossier, commandes, crédit)
- **Fournisseurs** (achats, retours, dossier)
- **Dépenses & RH** (salaires, paie, CNSS)
- **Comptabilité SYSCOHADA** (plan comptable, journal, grand livre, bilan)
- **Analytics** (graphiques CA, marges, rapports PDF exportables)
- **Équipe & Permissions** (rôles granulaires par module)

---

## Installation

```bash
# 1. Cloner le projet
git clone https://github.com/francistech/sunugestion
cd sunugestion

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos paramètres

# 4. Créer la base de données
createdb sunugestion
psql sunugestion < scripts/001_init_schema.sql

# 5. Lancer en développement
npm run dev
```

---

## Plans tarifaires (SaaS)

| Plan | Prix/mois | Boutiques | Utilisateurs | Modules |
|---|---|---|---|---|
| Starter | 5 000 XOF | 1 | 2 | Ventes, Stock, Clients |
| Pro | 15 000 XOF | 1 | 10 | Tous modules |
| Business | 35 000 XOF | 5 | Illimité | Tous + API + Support |

---

## Structure des dossiers

```
sunugestion/
├── src/
│   ├── app/
│   │   ├── api/          ← Routes API (REST)
│   │   │   ├── auth/     ← Login, register, logout
│   │   │   ├── ventes/   ← CRUD ventes + validation
│   │   │   ├── achats/   ← CRUD achats fournisseurs
│   │   │   ├── produits/ ← Catalogue + stock
│   │   │   ├── comptabilite/ ← SYSCOHADA automatique
│   │   │   └── analytics/    ← KPIs dashboard
│   │   ├── (auth)/       ← Pages login/register
│   │   └── (dashboard)/  ← Pages protégées
│   ├── lib/
│   │   ├── db/           ← Pool PostgreSQL + helpers tenant
│   │   ├── auth/         ← JWT helpers
│   │   └── syscohada/    ← Moteur écritures comptables
│   ├── components/       ← Composants UI réutilisables
│   ├── hooks/            ← React Query hooks
│   └── types/            ← TypeScript interfaces
├── scripts/
│   └── 001_init_schema.sql ← Script DB complet
└── .env.example
```

---

## Comptabilité SYSCOHADA

Les écritures sont générées **automatiquement** lors de :
- Validation d'une vente → Débit 411000 / Crédit 701000 + 445700
- Encaissement → Débit 571000/572000 / Crédit 411000
- Réception achat → Débit 601000 / Crédit 401000
- Paiement fournisseur → Débit 401000 / Crédit 571000

Journaux disponibles : VT (Ventes), AC (Achats), CA (Caisse), BQ (Banque), OD (Opérations diverses), SA (Salaires), IM (Immobilisations)

---

*Projet de mémoire — Licence 3 Développement Web & Génie Logiciel*
*ICAGI Amadou Mactar Mbow — Dakar, Sénégal*
*Francis Tech © 2025*
