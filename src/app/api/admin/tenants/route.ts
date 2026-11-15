
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Configuration PostgreSQL
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL est manquante')
}

const pool = new Pool({
  connectionString: databaseUrl
})

// Vérification du rôle (à remplacer par une validation JWT serveur)
function isSuperAdmin(request: NextRequest): boolean {
  return request.headers.get('x-admin-role') === 'superadmin'
}

export async function GET(request: NextRequest) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json(
      { error: 'Accès refusé' },
      { status: 403 }
    )
  }

  try {
    const res = await pool.query(
      'SELECT * FROM admin_tenants_stats'
    )

    return NextResponse.json({
      data: res.rows
    })

  } catch (error) {
    console.error('Erreur récupération statistiques boutiques:', error)

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json(
      { error: 'Accès refusé' },
      { status: 403 }
    )
  }

  try {
    const { tenant_id, action } = await request.json()

    if (!tenant_id || !['suspendre', 'activer'].includes(action)) {
      return NextResponse.json(
        { error: 'Paramètres invalides' },
        { status: 400 }
      )
    }

    if (action === 'suspendre') {
      await pool.query(
        'UPDATE tenants SET is_active = false WHERE id = $1',
        [tenant_id]
      )
    } else if (action === 'activer') {
      await pool.query(
        'UPDATE tenants SET is_active = true WHERE id = $1',
        [tenant_id]
      )
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Erreur modification boutique:', error)

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
