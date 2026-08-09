import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const tenantId = request.headers.get('x-tenant-id')!
  const { id } = await context.params
  try {
    const rows = await query(tenantId, `
      SELECT c.*,
        COUNT(v.id)::int as nb_commandes,
        COALESCE(SUM(v.montant_ttc), 0) as total_achats,
        COALESCE(SUM(v.montant_ttc) - SUM(COALESCE(v.montant_paye, 0)), 0) as solde_credit
      FROM clients c
      LEFT JOIN ventes v ON v.client_id = c.id AND v.tenant_id = c.tenant_id
      WHERE c.id = $1 AND c.tenant_id = $2
      GROUP BY c.id
    `, [id, tenantId])
    if (!rows[0]) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
    return NextResponse.json({ data: rows[0] })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const tenantId = request.headers.get('x-tenant-id')!
  const { id } = await context.params
  try {
    const { nom, telephone, email, adresse } = await request.json()
    const res = await query(tenantId, `
      UPDATE clients SET nom=$1, telephone=$2, email=$3, adresse=$4, updated_at=NOW()
      WHERE id=$5 AND tenant_id=$6 RETURNING *
    `, [nom, telephone || null, email || null, adresse || null, id, tenantId])
    if (!res[0]) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
    return NextResponse.json({ data: res[0] })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}