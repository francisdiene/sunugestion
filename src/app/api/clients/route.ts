import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  const search = new URL(request.url).searchParams.get('search') || ''
  try {
    const clients = await query(tenantId, `
      SELECT c.*,
        COUNT(v.id) as nb_commandes,
        COALESCE(SUM(v.montant_ttc), 0) as total_achats
      FROM clients c
      LEFT JOIN ventes v ON v.client_id = c.id AND v.statut IN ('valide','paye')
      WHERE c.tenant_id = $1
        AND ($2 = '' OR c.nom ILIKE '%' || $2 || '%' OR c.telephone ILIKE '%' || $2 || '%')
      GROUP BY c.id ORDER BY c.nom ASC
    `, [tenantId, search])
    return NextResponse.json({ data: clients })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  const userId = request.headers.get('x-user-id')!
  try {
    const { nom, telephone, email, adresse, type, ninea, notes } = await request.json()
    const res = await query(tenantId, `
      INSERT INTO clients (tenant_id, nom, telephone, email, adresse, type, ninea, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [tenantId, nom, telephone || null, email || null, adresse || null, type || 'particulier', ninea || null, notes || null])
    return NextResponse.json({ data: res[0] }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
