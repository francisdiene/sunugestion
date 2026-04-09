import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Slug manquant' }, { status: 400 })

  try {
    // Récupérer le tenant par slug — sans RLS (public)
    const tenantRes = await pool.query(
      `SELECT id, nom, telephone, email, adresse, ninea FROM tenants WHERE slug = $1`,
      [slug]
    )
    if (!tenantRes.rows[0]) return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
    const tenant = tenantRes.rows[0]

    // Produits visibles dans le catalogue
    const produitsRes = await pool.query(`
      SELECT p.id, p.nom, p.description, p.prix_vente, p.unite,
             p.image_url, p.tva_taux, p.is_service,
             COALESCE(SUM(s.quantite), 0) as stock_total
      FROM produits p
      LEFT JOIN stocks s ON s.produit_id = p.id
      WHERE p.tenant_id = $1
        AND p.partage_catalogue = true
        AND p.is_actif = true
      GROUP BY p.id
      ORDER BY p.nom ASC
    `, [tenant.id])

    return NextResponse.json({
      boutique: tenant,
      produits: produitsRes.rows,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
