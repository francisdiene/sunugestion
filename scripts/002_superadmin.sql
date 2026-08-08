-- Table superadmin séparée des tenants
CREATE TABLE IF NOT EXISTS admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nom_complet   VARCHAR(255) NOT NULL,
  is_active     BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer le superadmin (password: FrancisTech2025)
INSERT INTO admins (email, password_hash, nom_complet) VALUES (
  'admin@francistech.sn',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lF36',
  'François Codé DIENE'
) ON CONFLICT (email) DO NOTHING;

-- Vue globale stats tenants
CREATE OR REPLACE VIEW admin_tenants_stats AS
SELECT 
  t.id, t.nom, t.slug, t.plan, t.email, t.telephone, t.created_at,
  (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id)::int as nb_users,
  (SELECT COUNT(*) FROM produits p WHERE p.tenant_id = t.id)::int as nb_produits,
  (SELECT COUNT(*) FROM ventes v WHERE v.tenant_id = t.id)::int as nb_ventes,
  (SELECT COALESCE(SUM(montant_ttc),0) FROM ventes v WHERE v.tenant_id = t.id AND v.statut = 'paye') as ca_total
FROM tenants t
ORDER BY t.created_at DESC;
