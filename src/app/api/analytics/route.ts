import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  const role = request.headers.get('x-user-role')!

  if (!['owner', 'manager', 'comptable'].includes(role)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const [caParJour, caParMois, topProduits, depensesParCategorie, ventesParType, resumeMois] = await Promise.all([

      // CA des 30 derniers jours
      query(tenantId, `
        SELECT date_vente::text as date,
               COALESCE(SUM(montant_ttc), 0)::numeric as ca,
               COUNT(*)::int as nb
        FROM ventes
        WHERE tenant_id = $1
          AND statut IN ('valide','paye')
          AND date_vente >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY date_vente ORDER BY date_vente ASC
      `, [tenantId]),

      // CA des 6 derniers mois
      query(tenantId, `
        SELECT TO_CHAR(date_vente, 'YYYY-MM') as mois,
               COALESCE(SUM(montant_ttc), 0)::numeric as ca,
               COALESCE(SUM(montant_ht), 0)::numeric as ca_ht,
               COUNT(*)::int as nb
        FROM ventes
        WHERE tenant_id = $1
          AND statut IN ('valide','paye')
          AND date_vente >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY TO_CHAR(date_vente, 'YYYY-MM')
        ORDER BY mois ASC
      `, [tenantId]),

      // Top 8 produits
      query(tenantId, `
        SELECT p.nom, SUM(vl.quantite)::numeric as qte,
               SUM(vl.montant_ttc)::numeric as ca
        FROM vente_lignes vl
        JOIN ventes v ON v.id = vl.vente_id
        JOIN produits p ON p.id = vl.produit_id
        WHERE v.tenant_id = $1 AND v.statut IN ('valide','paye')
          AND v.date_vente >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY p.id, p.nom
        ORDER BY ca DESC LIMIT 8
      `, [tenantId]),

      // Dépenses par catégorie
      query(tenantId, `
        SELECT categorie, SUM(montant)::numeric as total
        FROM depenses
        WHERE tenant_id = $1
          AND date_depense >= DATE_TRUNC('month', CURRENT_DATE)
        GROUP BY categorie ORDER BY total DESC
      `, [tenantId]),

      // Ventes par type
      query(tenantId, `
        SELECT type, COUNT(*)::int as nb, SUM(montant_ttc)::numeric as ca
        FROM ventes WHERE tenant_id = $1 AND statut IN ('valide','paye')
        GROUP BY type
      `, [tenantId]),

      // Résumé du mois
      query(tenantId, `
        SELECT
          COALESCE(SUM(CASE WHEN statut IN ('valide','paye') THEN montant_ttc END), 0)::numeric as ca_mois,
          COUNT(CASE WHEN statut IN ('valide','paye') THEN 1 END)::int as nb_ventes,
          COUNT(CASE WHEN statut = 'brouillon' THEN 1 END)::int as nb_brouillons,
          COUNT(DISTINCT client_id)::int as nb_clients
        FROM ventes
        WHERE tenant_id = $1 AND date_vente >= DATE_TRUNC('month', CURRENT_DATE)
      `, [tenantId]),
    ])

    return NextResponse.json({
      ca_par_jour: caParJour,
      ca_par_mois: caParMois,
      top_produits: topProduits,
      depenses_par_categorie: depensesParCategorie,
      ventes_par_type: ventesParType,
      resume_mois: resumeMois[0],
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
