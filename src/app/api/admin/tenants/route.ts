import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Tl03092002@localhost:5432/sunugestion' })

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-admin-role')
  if (role !== 'superadmin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  try {
    const res = await pool.query('SELECT * FROM admin_tenants_stats')
    return NextResponse.json({ data: res.rows })
  } catch (e) { return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
}

export async function POST(request: NextRequest) {
  const role = request.headers.get('x-admin-role')
  if (role !== 'superadmin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  try {
    const { tenant_id, action } = await request.json()
    if (action === 'suspendre') await pool.query('UPDATE tenants SET is_active = false WHERE id = $1', [tenant_id])
    else if (action === 'activer') await pool.query('UPDATE tenants SET is_active = true WHERE id = $1', [tenant_id])
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
}
