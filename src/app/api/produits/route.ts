import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const categorieId = searchParams.get('categorie_id') || null

  try {
    const produits = await query(tenantId, `
      SELECT p.*, c.nom as categorie_nom,
        COALESCE(SUM(s.quantite), 0) as stock_total
      FROM produits p
      LEFT JOIN categories c ON c.id = p.categorie_id
      LEFT JOIN stocks s ON s.produit_id = p.id
      WHERE p.tenant_id = $1
        AND ($2 = '' OR p.nom ILIKE '%' || $2 || '%' OR p.code_barre ILIKE '%' || $2 || '%')
        ${categorieId ? 'AND p.categorie_id = $3' : ''}
      GROUP BY p.id, c.nom
      ORDER BY p.nom ASC
    `, categorieId ? [tenantId, search, categorieId] : [tenantId, search])
    return NextResponse.json({ data: produits })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  const userId = request.headers.get('x-user-id')!
  try {
    const body = await request.json()
    const { nom, categorie_id, code_barre, reference, prix_vente, prix_achat, tva_taux, unite, description, partage_catalogue, is_service, stock_initial, seuil_alerte } = body

    const produit = await transaction(tenantId, async (client) => {
      const res = await client.query(`
        INSERT INTO produits (tenant_id, nom, categorie_id, code_barre, reference, prix_vente, prix_achat, tva_taux, unite, description, partage_catalogue, is_service)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
      `, [tenantId, nom, categorie_id || null, code_barre || null, reference || null,
          prix_vente || 0, prix_achat || 0, tva_taux ?? 18, unite || 'pcs',
          description || null, partage_catalogue || false, is_service || false])

      const produitId = res.rows[0].id

      // Stock initial dans le dÃ©pÃ´t principal
      if (stock_initial && stock_initial > 0) {
        const depot = await client.query(`SELECT id FROM depots WHERE tenant_id = $1 AND is_principal = true LIMIT 1`, [tenantId])
        if (depot.rows[0]) {
          await client.query(`
            INSERT INTO stocks (tenant_id, produit_id, depot_id, quantite, seuil_alerte)
            VALUES ($1,$2,$3,$4,$5)
            ON CONFLICT (tenant_id, produit_id, depot_id) DO UPDATE SET quantite = $4
          `, [tenantId, produitId, depot.rows[0].id, stock_initial, seuil_alerte || 0])

          await client.query(`
            INSERT INTO mouvements_stock (tenant_id, produit_id, depot_id, type, quantite, quantite_avant, quantite_apres, motif, created_by)
            VALUES ($1,$2,$3,'entree',$4,0,$4,'Stock initial',  $5)
          `, [tenantId, produitId, depot.rows[0].id, stock_initial, userId])
        }
      }

      await client.query(`INSERT INTO audit_logs (tenant_id, user_id, action, table_name, record_id, nouveau_val) VALUES ($1,$2,'CREATE','produits',$3,$4)`,
        [tenantId, userId, produitId, JSON.stringify(res.rows[0])])

      return res.rows[0]
    })

    return NextResponse.json({ data: produit }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

