import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  try {
    const rows = await query(tenantId, `
      SELECT id, nom_complet, email, role, telephone, is_active, last_login_at
      FROM users WHERE tenant_id = $1 ORDER BY role ASC, nom_complet ASC
    `, [tenantId])
    return NextResponse.json({ data: rows })
  } catch { return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  const role = request.headers.get('x-user-role')!
  if (!['owner', 'manager'].includes(role)) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  try {
    const { nom_complet, email, password, role: userRole, telephone } = await request.json()
    if (!nom_complet || !email || !password) return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    const existing = await query(tenantId, 'SELECT id FROM users WHERE email = $1 AND tenant_id = $2', [email, tenantId])
    if (existing.length > 0) return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 })
    const hash = await bcrypt.hash(password, 10)
    const res = await query(tenantId, `
      INSERT INTO users (tenant_id, email, password_hash, nom_complet, role, telephone)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, nom_complet, email, role
    `, [tenantId, email, hash, nom_complet, userRole || 'vendeur', telephone || null])
    return NextResponse.json({ data: res[0] }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
}
