import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  const userId = request.headers.get('x-user-id')!
  try {
    const rows = await query(tenantId, `
      SELECT u.nom_complet as nom, u.email, u.role, t.nom as tenant_nom
      FROM users u
      JOIN tenants t ON t.id = u.tenant_id
      WHERE u.id = $1 AND u.tenant_id = $2
    `, [userId, tenantId])
    if (!rows[0]) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
    return NextResponse.json({ user: rows[0] })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
