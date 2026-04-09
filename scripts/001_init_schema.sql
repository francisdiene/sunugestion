-- ============================================================
-- SunuGestion — Script d'initialisation base de données
-- Plan comptable SYSCOHADA + Architecture Multi-tenant
-- PostgreSQL 15+ avec Row Level Security (RLS)
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. FONDATION MULTI-TENANT
-- ============================================================

CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          VARCHAR(60) UNIQUE NOT NULL,
  nom           VARCHAR(200) NOT NULL,
  plan          VARCHAR(20) NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter','pro','business')),
  ninea         VARCHAR(50),
  rccm          VARCHAR(50),
  telephone     VARCHAR(20),
  email         VARCHAR(200),
  adresse       TEXT,
  logo_url      VARCHAR(500),
  devise        VARCHAR(10) NOT NULL DEFAULT 'XOF',
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email         VARCHAR(200) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nom_complet   VARCHAR(200) NOT NULL,
  telephone     VARCHAR(20),
  role          VARCHAR(20) NOT NULL DEFAULT 'vendeur'
                CHECK (role IN ('owner','manager','caissier','vendeur','comptable')),
  avatar_url    VARCHAR(500),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE permissions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module        VARCHAR(50) NOT NULL,
  can_view      BOOLEAN NOT NULL DEFAULT false,
  can_create    BOOLEAN NOT NULL DEFAULT false,
  can_edit      BOOLEAN NOT NULL DEFAULT false,
  can_delete    BOOLEAN NOT NULL DEFAULT false,
  can_export    BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (tenant_id, user_id, module)
);

-- ============================================================
-- 2. PRODUITS & CATALOGUE
-- ============================================================

CREATE TABLE categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id     UUID REFERENCES categories(id),
  nom           VARCHAR(150) NOT NULL,
  description   TEXT,
  ordre         INT DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE produits (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  categorie_id        UUID REFERENCES categories(id),
  code_barre          VARCHAR(100),
  reference           VARCHAR(100),
  nom                 VARCHAR(250) NOT NULL,
  description         TEXT,
  unite               VARCHAR(30) DEFAULT 'pcs',
  prix_vente          NUMERIC(15,2) NOT NULL DEFAULT 0,
  prix_achat          NUMERIC(15,2) DEFAULT 0,
  tva_taux            NUMERIC(5,2) DEFAULT 18.00,
  image_url           VARCHAR(500),
  partage_catalogue   BOOLEAN DEFAULT false,
  is_service          BOOLEAN DEFAULT false,
  is_actif            BOOLEAN DEFAULT true,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (tenant_id, code_barre)
);

-- ============================================================
-- 3. DÉPÔTS & STOCK
-- ============================================================

CREATE TABLE depots (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nom           VARCHAR(150) NOT NULL,
  adresse       TEXT,
  responsable_id UUID REFERENCES users(id),
  is_principal  BOOLEAN DEFAULT false,
  is_actif      BOOLEAN DEFAULT true,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE stocks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  produit_id    UUID NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
  depot_id      UUID NOT NULL REFERENCES depots(id) ON DELETE CASCADE,
  quantite      NUMERIC(15,3) NOT NULL DEFAULT 0,
  seuil_alerte  NUMERIC(15,3) DEFAULT 0,
  UNIQUE (tenant_id, produit_id, depot_id)
);

CREATE TABLE lots (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  produit_id        UUID NOT NULL REFERENCES produits(id),
  depot_id          UUID NOT NULL REFERENCES depots(id),
  numero_lot        VARCHAR(100) NOT NULL,
  date_fabrication  DATE,
  date_expiration   DATE,
  quantite          NUMERIC(15,3) DEFAULT 0,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE mouvements_stock (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  produit_id    UUID NOT NULL REFERENCES produits(id),
  depot_id      UUID NOT NULL REFERENCES depots(id),
  type          VARCHAR(20) NOT NULL CHECK (type IN ('entree','sortie','transfert','ajustement','inventaire')),
  quantite      NUMERIC(15,3) NOT NULL,
  quantite_avant NUMERIC(15,3) NOT NULL DEFAULT 0,
  quantite_apres NUMERIC(15,3) NOT NULL DEFAULT 0,
  reference_doc VARCHAR(100),
  motif         TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 4. CLIENTS & VENTES
-- ============================================================

CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nom           VARCHAR(200) NOT NULL,
  telephone     VARCHAR(20),
  email         VARCHAR(200),
  adresse       TEXT,
  type          VARCHAR(20) DEFAULT 'particulier' CHECK (type IN ('particulier','entreprise')),
  ninea         VARCHAR(50),
  solde_credit  NUMERIC(15,2) DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ventes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id),
  depot_id        UUID REFERENCES depots(id),
  numero          VARCHAR(50) NOT NULL,
  type            VARCHAR(20) NOT NULL CHECK (type IN ('facture','devis','bon_livraison','ticket_caisse','avoir')),
  statut          VARCHAR(20) NOT NULL DEFAULT 'brouillon'
                  CHECK (statut IN ('brouillon','valide','paye','partiellement_paye','annule')),
  date_vente      DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance   DATE,
  montant_ht      NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_tva     NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_ttc     NUMERIC(15,2) NOT NULL DEFAULT 0,
  remise_globale  NUMERIC(5,2) DEFAULT 0,
  montant_paye    NUMERIC(15,2) DEFAULT 0,
  mode_paiement   VARCHAR(20) CHECK (mode_paiement IN ('cash','wave','orange_money','carte','credit','virement','cheque')),
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (tenant_id, numero)
);

CREATE TABLE vente_lignes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vente_id        UUID NOT NULL REFERENCES ventes(id) ON DELETE CASCADE,
  produit_id      UUID REFERENCES produits(id),
  designation     VARCHAR(250) NOT NULL,
  quantite        NUMERIC(15,3) NOT NULL DEFAULT 1,
  prix_unitaire   NUMERIC(15,2) NOT NULL DEFAULT 0,
  remise_pct      NUMERIC(5,2) DEFAULT 0,
  tva_taux        NUMERIC(5,2) DEFAULT 18.00,
  montant_ht      NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_tva     NUMERIC(15,2) NOT NULL DEFAULT 0,
  montant_ttc     NUMERIC(15,2) NOT NULL DEFAULT 0,
  ordre           INT DEFAULT 0
);

-- ============================================================
-- 5. FOURNISSEURS & ACHATS
-- ============================================================

CREATE TABLE fournisseurs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nom           VARCHAR(200) NOT NULL,
  telephone     VARCHAR(20),
  email         VARCHAR(200),
  adresse       TEXT,
  ninea         VARCHAR(50),
  rccm          VARCHAR(50),
  solde_du      NUMERIC(15,2) DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE achats (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  fournisseur_id  UUID NOT NULL REFERENCES fournisseurs(id),
  depot_id        UUID REFERENCES depots(id),
  numero          VARCHAR(50) NOT NULL,
  type            VARCHAR(20) NOT NULL CHECK (type IN ('bon_commande','facture','avoir','retour')),
  statut          VARCHAR(20) NOT NULL DEFAULT 'brouillon'
                  CHECK (statut IN ('brouillon','confirme','recu','partiellement_recu','paye','annule')),
  date_achat      DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance   DATE,
  montant_ht      NUMERIC(15,2) DEFAULT 0,
  montant_tva     NUMERIC(15,2) DEFAULT 0,
  montant_ttc     NUMERIC(15,2) DEFAULT 0,
  montant_paye    NUMERIC(15,2) DEFAULT 0,
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (tenant_id, numero)
);

CREATE TABLE achat_lignes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  achat_id        UUID NOT NULL REFERENCES achats(id) ON DELETE CASCADE,
  produit_id      UUID REFERENCES produits(id),
  designation     VARCHAR(250) NOT NULL,
  quantite        NUMERIC(15,3) NOT NULL DEFAULT 1,
  prix_unitaire   NUMERIC(15,2) NOT NULL DEFAULT 0,
  tva_taux        NUMERIC(5,2) DEFAULT 18.00,
  montant_ht      NUMERIC(15,2) DEFAULT 0,
  montant_ttc     NUMERIC(15,2) DEFAULT 0,
  ordre           INT DEFAULT 0
);

-- ============================================================
-- 6. DÉPENSES & RH
-- ============================================================

CREATE TABLE categories_depenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nom           VARCHAR(150) NOT NULL,
  compte_syscohada VARCHAR(10),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE depenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  categorie_id    UUID REFERENCES categories_depenses(id),
  montant         NUMERIC(15,2) NOT NULL,
  description     TEXT NOT NULL,
  date_depense    DATE NOT NULL DEFAULT CURRENT_DATE,
  mode_paiement   VARCHAR(20) DEFAULT 'cash',
  beneficiaire    VARCHAR(200),
  justificatif_url VARCHAR(500),
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE employes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  nom_complet     VARCHAR(200) NOT NULL,
  telephone       VARCHAR(20),
  poste           VARCHAR(150),
  salaire_base    NUMERIC(15,2) DEFAULT 0,
  date_embauche   DATE,
  type_contrat    VARCHAR(20) DEFAULT 'cdi' CHECK (type_contrat IN ('cdi','cdd','freelance','stagiaire')),
  numero_cnss     VARCHAR(50),
  is_actif        BOOLEAN DEFAULT true,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE paies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employe_id      UUID NOT NULL REFERENCES employes(id),
  periode         VARCHAR(7) NOT NULL, -- format: 2025-03
  salaire_base    NUMERIC(15,2) NOT NULL,
  primes          NUMERIC(15,2) DEFAULT 0,
  retenues        NUMERIC(15,2) DEFAULT 0,
  cotisation_cnss NUMERIC(15,2) DEFAULT 0,
  net_a_payer     NUMERIC(15,2) NOT NULL,
  date_paiement   DATE,
  statut          VARCHAR(20) DEFAULT 'brouillon' CHECK (statut IN ('brouillon','valide','paye')),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (tenant_id, employe_id, periode)
);

-- ============================================================
-- 7. COMPTABILITÉ SYSCOHADA
-- ============================================================

CREATE TABLE plan_comptable (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero        VARCHAR(10) NOT NULL,
  intitule      VARCHAR(250) NOT NULL,
  classe        INT NOT NULL CHECK (classe BETWEEN 1 AND 9),
  type          VARCHAR(20) NOT NULL CHECK (type IN ('actif','passif','charge','produit','bilan','resultat')),
  sens_normal   VARCHAR(6) NOT NULL CHECK (sens_normal IN ('debit','credit')),
  is_systeme    BOOLEAN DEFAULT false,
  is_actif      BOOLEAN DEFAULT true,
  UNIQUE (tenant_id, numero)
);

CREATE TABLE exercices_comptables (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  libelle       VARCHAR(100) NOT NULL,
  date_debut    DATE NOT NULL,
  date_fin      DATE NOT NULL,
  statut        VARCHAR(20) DEFAULT 'ouvert' CHECK (statut IN ('ouvert','clos')),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ecritures_comptables (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  exercice_id     UUID REFERENCES exercices_comptables(id),
  compte_id       UUID NOT NULL REFERENCES plan_comptable(id),
  journal         VARCHAR(20) NOT NULL CHECK (journal IN ('VT','AC','CA','BQ','OD','SA','IM')),
  date_ecriture   DATE NOT NULL,
  libelle         VARCHAR(300) NOT NULL,
  debit           NUMERIC(15,2) NOT NULL DEFAULT 0,
  credit          NUMERIC(15,2) NOT NULL DEFAULT 0,
  piece_ref       VARCHAR(100),
  lot_ecriture    UUID,
  is_lettre       BOOLEAN DEFAULT false,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (debit >= 0 AND credit >= 0),
  CHECK (NOT (debit > 0 AND credit > 0))
);

-- ============================================================
-- 8. ABONNEMENTS, AUDIT & NOTIFICATIONS
-- ============================================================

CREATE TABLE abonnements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan          VARCHAR(20) NOT NULL CHECK (plan IN ('starter','pro','business')),
  date_debut    DATE NOT NULL,
  date_fin      DATE NOT NULL,
  montant       NUMERIC(15,2) NOT NULL,
  statut        VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif','expire','suspendu','annule')),
  mode_paiement VARCHAR(20) CHECK (mode_paiement IN ('wave','orange_money','virement','cash')),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id),
  action        VARCHAR(30) NOT NULL CHECK (action IN ('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT')),
  table_name    VARCHAR(100) NOT NULL,
  record_id     UUID,
  ancien_val    JSONB,
  nouveau_val   JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id),
  type          VARCHAR(30) NOT NULL CHECK (type IN ('stock','paiement','rappel','systeme','abonnement')),
  titre         VARCHAR(200) NOT NULL,
  message       TEXT NOT NULL,
  data          JSONB,
  lu            BOOLEAN DEFAULT false,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 9. INDEX PERFORMANCES
-- ============================================================

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_produits_tenant ON produits(tenant_id);
CREATE INDEX idx_stocks_tenant_produit ON stocks(tenant_id, produit_id);
CREATE INDEX idx_ventes_tenant ON ventes(tenant_id);
CREATE INDEX idx_ventes_tenant_date ON ventes(tenant_id, date_vente);
CREATE INDEX idx_ventes_tenant_statut ON ventes(tenant_id, statut);
CREATE INDEX idx_vente_lignes_vente ON vente_lignes(vente_id);
CREATE INDEX idx_achats_tenant ON achats(tenant_id);
CREATE INDEX idx_mouvements_tenant ON mouvements_stock(tenant_id);
CREATE INDEX idx_mouvements_produit ON mouvements_stock(produit_id);
CREATE INDEX idx_ecritures_tenant ON ecritures_comptables(tenant_id);
CREATE INDEX idx_ecritures_date ON ecritures_comptables(tenant_id, date_ecriture);
CREATE INDEX idx_ecritures_compte ON ecritures_comptables(compte_id);
CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
CREATE INDEX idx_notifications_user ON notifications(tenant_id, user_id, lu);

-- ============================================================
-- 10. ROW LEVEL SECURITY (Multi-tenant isolation)
-- ============================================================

ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits               ENABLE ROW LEVEL SECURITY;
ALTER TABLE depots                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mouvements_stock       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients                ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE vente_lignes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE fournisseurs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE achats                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE achat_lignes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories_depenses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE depenses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE employes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE paies                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_comptable         ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercices_comptables   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecritures_comptables   ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonnements            ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;

-- Politique générique (à répliquer par table)
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON produits
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON ventes
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON vente_lignes
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON stocks
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON ecritures_comptables
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);
CREATE POLICY tenant_isolation ON audit_logs
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- ============================================================
-- 11. SEED PLAN COMPTABLE SYSCOHADA (classes 1-8)
-- ============================================================

-- Cette fonction insère le plan de base pour un nouveau tenant
CREATE OR REPLACE FUNCTION seed_plan_comptable(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO plan_comptable (tenant_id, numero, intitule, classe, type, sens_normal, is_systeme) VALUES
  -- CLASSE 1 — COMPTES DE RESSOURCES DURABLES
  (p_tenant_id,'10','Capital et réserves',1,'passif','credit',true),
  (p_tenant_id,'101000','Capital social',1,'passif','credit',true),
  (p_tenant_id,'12','Résultat net de l''exercice',1,'passif','credit',true),
  (p_tenant_id,'16','Emprunts et dettes financières',1,'passif','credit',true),
  -- CLASSE 2 — COMPTES D'ACTIF IMMOBILISÉ
  (p_tenant_id,'21','Immobilisations incorporelles',2,'actif','debit',true),
  (p_tenant_id,'22','Terrains',2,'actif','debit',true),
  (p_tenant_id,'24','Matériel',2,'actif','debit',true),
  (p_tenant_id,'28','Amortissements',2,'actif','credit',true),
  -- CLASSE 3 — COMPTES DE STOCKS
  (p_tenant_id,'31','Marchandises',3,'actif','debit',true),
  (p_tenant_id,'32','Matières premières',3,'actif','debit',true),
  (p_tenant_id,'35','Produits finis',3,'actif','debit',true),
  -- CLASSE 4 — COMPTES DE TIERS
  (p_tenant_id,'401000','Fournisseurs',4,'passif','credit',true),
  (p_tenant_id,'411000','Clients',4,'actif','debit',true),
  (p_tenant_id,'421000','Personnel — rémunérations dues',4,'passif','credit',true),
  (p_tenant_id,'431000','Sécurité sociale — CNSS',4,'passif','credit',true),
  (p_tenant_id,'441000','État — impôts et taxes',4,'passif','credit',true),
  (p_tenant_id,'445000','État — TVA à décaisser',4,'passif','credit',true),
  (p_tenant_id,'445600','TVA déductible',4,'actif','debit',true),
  (p_tenant_id,'445700','TVA collectée',4,'passif','credit',true),
  -- CLASSE 5 — COMPTES DE TRÉSORERIE
  (p_tenant_id,'521000','Banque',5,'actif','debit',true),
  (p_tenant_id,'571000','Caisse principale',5,'actif','debit',true),
  (p_tenant_id,'572000','Caisse Wave',5,'actif','debit',true),
  (p_tenant_id,'573000','Caisse Orange Money',5,'actif','debit',true),
  -- CLASSE 6 — COMPTES DE CHARGES
  (p_tenant_id,'601000','Achats de marchandises',6,'charge','debit',true),
  (p_tenant_id,'602000','Achats de matières premières',6,'charge','debit',true),
  (p_tenant_id,'604000','Achats stockés — approvisionnements',6,'charge','debit',true),
  (p_tenant_id,'613000','Locations et charges locatives',6,'charge','debit',true),
  (p_tenant_id,'621000','Personnel extérieur',6,'charge','debit',true),
  (p_tenant_id,'641000','Rémunérations du personnel',6,'charge','debit',true),
  (p_tenant_id,'658000','Charges diverses de gestion courante',6,'charge','debit',true),
  -- CLASSE 7 — COMPTES DE PRODUITS
  (p_tenant_id,'701000','Ventes de marchandises',7,'produit','credit',true),
  (p_tenant_id,'706000','Services vendus',7,'produit','credit',true),
  (p_tenant_id,'707000','Produits accessoires',7,'produit','credit',true),
  (p_tenant_id,'758000','Produits divers de gestion courante',7,'produit','credit',true),
  -- CLASSE 8 — COMPTES DES AUTRES CHARGES ET PRODUITS
  (p_tenant_id,'82','Produits des cessions d''immobilisations',8,'produit','credit',true),
  (p_tenant_id,'85','Dotations aux amortissements',8,'charge','debit',true);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 12. TRIGGER — numérotation automatique des ventes
-- ============================================================

CREATE OR REPLACE FUNCTION generate_numero_vente()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  seq INT;
BEGIN
  prefix := CASE NEW.type
    WHEN 'facture'        THEN 'FAC'
    WHEN 'devis'          THEN 'DEV'
    WHEN 'bon_livraison'  THEN 'BL'
    WHEN 'ticket_caisse'  THEN 'TK'
    WHEN 'avoir'          THEN 'AV'
    ELSE 'DOC'
  END;

  SELECT COUNT(*) + 1 INTO seq
  FROM ventes
  WHERE tenant_id = NEW.tenant_id AND type = NEW.type;

  NEW.numero := prefix || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(seq::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_numero_vente
  BEFORE INSERT ON ventes
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION generate_numero_vente();

-- Même logique pour les achats
CREATE OR REPLACE FUNCTION generate_numero_achat()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  seq INT;
BEGIN
  prefix := CASE NEW.type
    WHEN 'bon_commande' THEN 'BC'
    WHEN 'facture'      THEN 'FA'
    WHEN 'avoir'        THEN 'AA'
    WHEN 'retour'       THEN 'RT'
    ELSE 'AC'
  END;
  SELECT COUNT(*) + 1 INTO seq
  FROM achats WHERE tenant_id = NEW.tenant_id AND type = NEW.type;
  NEW.numero := prefix || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(seq::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_numero_achat
  BEFORE INSERT ON achats
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION generate_numero_achat();

-- ============================================================
-- 13. TRIGGER — mise à jour automatique du stock
-- ============================================================

CREATE OR REPLACE FUNCTION maj_stock_apres_vente()
RETURNS TRIGGER AS $$
BEGIN
  -- Décrémenter le stock du dépôt principal au moment de la validation
  IF NEW.statut = 'valide' AND OLD.statut = 'brouillon' THEN
    INSERT INTO mouvements_stock (
      tenant_id, produit_id, depot_id, type,
      quantite, quantite_avant, quantite_apres,
      reference_doc, created_by
    )
    SELECT
      vl.tenant_id,
      vl.produit_id,
      COALESCE(NEW.depot_id, (SELECT id FROM depots WHERE tenant_id = NEW.tenant_id AND is_principal = true LIMIT 1)),
      'sortie',
      vl.quantite,
      COALESCE((SELECT quantite FROM stocks WHERE produit_id = vl.produit_id AND depot_id = COALESCE(NEW.depot_id, (SELECT id FROM depots WHERE tenant_id = NEW.tenant_id AND is_principal = true LIMIT 1))), 0),
      COALESCE((SELECT quantite FROM stocks WHERE produit_id = vl.produit_id AND depot_id = COALESCE(NEW.depot_id, (SELECT id FROM depots WHERE tenant_id = NEW.tenant_id AND is_principal = true LIMIT 1))), 0) - vl.quantite,
      NEW.numero,
      NEW.created_by
    FROM vente_lignes vl
    WHERE vl.vente_id = NEW.id AND vl.produit_id IS NOT NULL;

    -- Mettre à jour la table stocks
    UPDATE stocks s
    SET quantite = s.quantite - vl.quantite
    FROM vente_lignes vl
    WHERE vl.vente_id = NEW.id
      AND vl.produit_id IS NOT NULL
      AND s.produit_id = vl.produit_id
      AND s.depot_id = COALESCE(NEW.depot_id, (SELECT id FROM depots WHERE tenant_id = NEW.tenant_id AND is_principal = true LIMIT 1));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_vente
  AFTER UPDATE ON ventes
  FOR EACH ROW
  EXECUTE FUNCTION maj_stock_apres_vente();

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
