// Définition stricte des permissions par rôle
// Utilisé côté client (sidebar) ET côté serveur (API)

export type Role = 'owner' | 'manager' | 'comptable' | 'caissier' | 'vendeur' | 'magasinier'

export interface ModulePermission {
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
  export: boolean
}

export type Module =
  | 'dashboard'
  | 'analytics'
  | 'ventes'
  | 'clients'
  | 'produits'
  | 'stock'
  | 'fournisseurs'
  | 'achats'
  | 'depenses'
  | 'employes'
  | 'comptabilite'
  | 'equipe'
  | 'parametres'

type PermMatrix = Record<Role, Record<Module, ModulePermission>>

const FULL: ModulePermission = { view: true, create: true, edit: true, delete: true, export: true }
const READ: ModulePermission = { view: true, create: false, edit: false, delete: false, export: true }
const WRITE: ModulePermission = { view: true, create: true, edit: true, delete: false, export: true }
const NONE: ModulePermission = { view: false, create: false, edit: false, delete: false, export: false }
const CREATE_ONLY: ModulePermission = { view: true, create: true, edit: false, delete: false, export: false }

export const PERMISSIONS: PermMatrix = {
  owner: {
    dashboard:    FULL,
    analytics:    FULL,
    ventes:       FULL,
    clients:      FULL,
    produits:     FULL,
    stock:        FULL,
    fournisseurs: FULL,
    achats:       FULL,
    depenses:     FULL,
    employes:     FULL,
    comptabilite: FULL,
    equipe:       FULL,
    parametres:   FULL,
  },
  manager: {
    dashboard:    READ,
    analytics:    READ,
    ventes:       FULL,
    clients:      FULL,
    produits:     WRITE,
    stock:        FULL,
    fournisseurs: FULL,
    achats:       FULL,
    depenses:     WRITE,
    employes:     NONE,   // ne voit pas les salaires
    comptabilite: READ,
    equipe:       WRITE,
    parametres:   NONE,   // pas les paramètres abonnement
  },
  comptable: {
    dashboard:    READ,
    analytics:    READ,
    ventes:       READ,
    clients:      READ,
    produits:     NONE,
    stock:        NONE,
    fournisseurs: READ,
    achats:       READ,
    depenses:     WRITE,
    employes:     NONE,
    comptabilite: FULL,
    equipe:       NONE,
    parametres:   NONE,
  },
  caissier: {
    dashboard:    NONE,
    analytics:    NONE,
    ventes:       CREATE_ONLY,  // crée, encaisse, imprime — ne valide pas
    clients:      READ,
    produits:     READ,         // ne voit pas les marges
    stock:        READ,
    fournisseurs: NONE,
    achats:       NONE,
    depenses:     NONE,
    employes:     NONE,
    comptabilite: NONE,
    equipe:       NONE,
    parametres:   NONE,
  },
  vendeur: {
    dashboard:    NONE,
    analytics:    NONE,
    ventes:       CREATE_ONLY,  // brouillons uniquement
    clients:      WRITE,
    produits:     READ,         // voit les produits sans prix d'achat
    stock:        NONE,
    fournisseurs: NONE,
    achats:       NONE,
    depenses:     NONE,
    employes:     NONE,
    comptabilite: NONE,
    equipe:       NONE,
    parametres:   NONE,
  },
  magasinier: {
    dashboard:    NONE,
    analytics:    NONE,
    ventes:       NONE,
    clients:      NONE,
    produits:     READ,
    stock:        FULL,
    fournisseurs: NONE,
    achats:       READ,
    depenses:     NONE,
    employes:     NONE,
    comptabilite: NONE,
    equipe:       NONE,
    parametres:   NONE,
  },
}

export function can(role: Role, module: Module, action: keyof ModulePermission): boolean {
  return PERMISSIONS[role]?.[module]?.[action] ?? false
}

export function canView(role: Role, module: Module): boolean {
  return can(role, module, 'view')
}

// Modules visibles dans la sidebar selon le rôle
export function getVisibleModules(role: Role): Module[] {
  return (Object.keys(PERMISSIONS[role]) as Module[]).filter(m => canView(role, m))
}
