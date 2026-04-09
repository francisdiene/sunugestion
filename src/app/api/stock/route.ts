import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  try {
    const stocks = await query(tenantId, `
      SELECT s.*, p.nom as produit_nom, p.code_barre, p.unite,
             d.nom as depot_nom, p.prix_vente, p.prix_achat
      FROM stocks s
      JOIN produits p ON p.id = s.produit_id
      JOIN depots d ON d.id = s.depot_id
      WHERE s.tenant_id = $1 ORDER BY p.nom ASC
    `, [tenantId])
    const mouvements = await query(tenantId, `
      SELECT m.*, p.nom as produit_nom, d.nom as depot_nom
      FROM mouvements_stock m
      JOIN produits p ON p.id = m.produit_id
      JOIN depots d ON d.id = m.depot_id
      WHERE m.tenant_id = $1 ORDER BY m.created_at DESC LIMIT 20
    `, [tenantId])
    return NextResponse.json({ data: stocks, mouvements })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  const userId = request.headers.get('x-user-id')!
  try {
    const { produit_id, depot_id, type, quantite, motif } = await request.json()
    await transaction(tenantId, async (client) => {
      const stock = await client.query(`SELECT quantite FROM stocks WHERE tenant_id=$1 AND produit_id=$2 AND depot_id=$3`, [tenantId, produit_id, depot_id])
      const qteAvant = stock.rows[0]?.quantite || 0
      const qteApres = type === 'entree' ? parseFloat(qteAvant) + parseFloat(quantite) : parseFloat(qteAvant) - parseFloat(quantite)
      await client.query(`
        INSERT INTO stocks (tenant_id, produit_id, depot_id, quantite)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (tenant_id, produit_id, depot_id) DO UPDATE SET quantite = $4
      `, [tenantId, produit_id, depot_id, qteApres])
      await client.query(`
        INSERT INTO mouvements_stock (tenant_id, produit_id, depot_id, type, quantite, quantite_avant, quantite_apres, motif, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `, [tenantId, produit_id, depot_id, type, quantite, qteAvant, qteApres, motif || null, userId])
    })
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
