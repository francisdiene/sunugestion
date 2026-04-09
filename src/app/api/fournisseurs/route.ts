import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  const search = new URL(request.url).searchParams.get('search') || ''
  try {
    const rows = await query(tenantId, `
      SELECT f.*, COUNT(a.id) as nb_achats, COALESCE(SUM(a.montant_ttc),0) as total_achats
      FROM fournisseurs f
      LEFT JOIN achats a ON a.fournisseur_id = f.id
      WHERE f.tenant_id = $1 AND ($2 = '' OR f.nom ILIKE '%' || $2 || '%')
      GROUP BY f.id ORDER BY f.nom ASC
    `, [tenantId, search])
    return NextResponse.json({ data: rows })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  try {
    const { nom, telephone, email, adresse, ninea, rccm, notes } = await request.json()
    const res = await query(tenantId, `
      INSERT INTO fournisseurs (tenant_id, nom, telephone, email, adresse, ninea, rccm, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [tenantId, nom, telephone||null, email||null, adresse||null, ninea||null, rccm||null, notes||null])
    return NextResponse.json({ data: res[0] }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
