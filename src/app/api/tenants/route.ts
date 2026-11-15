import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  try {
    const rows = await query(tenantId, `
      SELECT t.*,
        (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as nb_users,
        (SELECT COUNT(*) FROM produits WHERE tenant_id = t.id) as nb_produits
      FROM tenants t WHERE t.id = $1
    `, [tenantId])
    return NextResponse.json({ data: rows[0] })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  const role = request.headers.get('x-user-role')!
  if (role !== 'owner') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  try {
    const { nom, telephone, email, adresse, ninea, rccm, devise } = await request.json()
    const res = await query(tenantId, `
      UPDATE tenants SET nom=$1, telephone=$2, email=$3, adresse=$4, ninea=$5, rccm=$6, devise=$7, updated_at=NOW()
      WHERE id=$8 RETURNING *
    `, [nom, telephone||null, email||null, adresse||null, ninea||null, rccm||null, devise||'XOF', tenantId])
    return NextResponse.json({ data: res[0] })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
