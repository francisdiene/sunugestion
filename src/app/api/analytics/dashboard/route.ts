import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/analytics/dashboard
// Retourne tous les KPIs pour le dashboard propriétaire
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  const role = request.headers.get('x-user-role')!
  const { searchParams } = new URL(request.url)
  const periode = searchParams.get('periode') || 'mois' // jour | semaine | mois | annee

  // Seul le owner/manager voit toutes les analytics
  if (!['owner', 'manager', 'comptable'].includes(role)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const dateFilter = {
      jour:    "AND date_vente = CURRENT_DATE",
      semaine: "AND date_vente >= CURRENT_DATE - INTERVAL '7 days'",
      mois:    "AND date_vente >= DATE_TRUNC('month', CURRENT_DATE)",
      annee:   "AND date_vente >= DATE_TRUNC('year', CURRENT_DATE)",
    }[periode] || "AND date_vente >= DATE_TRUNC('month', CURRENT_DATE)"

    const [caData, stockData, topProduits, ventesParJour, depensesData] = await Promise.all([
      // Chiffre d'affaires
      query(tenantId, `
        SELECT
          COALESCE(SUM(montant_ttc), 0) as ca_total,
          COALESCE(SUM(montant_ht), 0) as ca_ht,
          COALESCE(SUM(montant_tva), 0) as tva_total,
          COUNT(*) as nb_ventes,
          COUNT(DISTINCT client_id) as nb_clients
        FROM ventes
        WHERE tenant_id = $1 AND statut IN ('valide','paye') ${dateFilter}
      `, [tenantId]),

      // Alertes stock
      query(tenantId, `
        SELECT COUNT(*) as ruptures
        FROM stocks s
        JOIN produits p ON p.id = s.produit_id
        WHERE s.tenant_id = $1
          AND s.quantite <= s.seuil_alerte
          AND p.is_actif = true
      `, [tenantId]),

      // Top 5 produits
      query(tenantId, `
        SELECT p.nom, SUM(vl.quantite) as qte_vendue,
               SUM(vl.montant_ttc) as ca_produit
        FROM vente_lignes vl
        JOIN ventes v ON v.id = vl.vente_id
        JOIN produits p ON p.id = vl.produit_id
        WHERE v.tenant_id = $1
          AND v.statut IN ('valide','paye') ${dateFilter}
        GROUP BY p.id, p.nom
        ORDER BY ca_produit DESC
        LIMIT 5
      `, [tenantId]),

      // Ventes par jour (30 derniers jours)
      query(tenantId, `
        SELECT date_vente::text as date,
               COALESCE(SUM(montant_ttc), 0) as total,
               COUNT(*) as nb
        FROM ventes
        WHERE tenant_id = $1
          AND statut IN ('valide','paye')
          AND date_vente >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY date_vente
        ORDER BY date_vente ASC
      `, [tenantId]),

      // Dépenses du mois
      query(tenantId, `
        SELECT COALESCE(SUM(montant), 0) as total_depenses
        FROM depenses
        WHERE tenant_id = $1
          AND date_depense >= DATE_TRUNC('month', CURRENT_DATE)
      `, [tenantId]),
    ])

    const ca = caData[0]
    const depenses = depensesData[0].total_depenses
    const benefice = parseFloat(ca.ca_ht) - parseFloat(depenses)

    return NextResponse.json({
      kpis: {
        ca_total: parseFloat(ca.ca_total),
        ca_ht: parseFloat(ca.ca_ht),
        tva_total: parseFloat(ca.tva_total),
        nb_ventes: parseInt(ca.nb_ventes),
        nb_clients: parseInt(ca.nb_clients),
        total_depenses: parseFloat(depenses),
        benefice_brut: benefice,
        ruptures_stock: parseInt(stockData[0].ruptures),
      },
      top_produits: topProduits,
      ventes_par_jour: ventesParJour,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
