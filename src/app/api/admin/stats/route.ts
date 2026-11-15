
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

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-admin-role')

  if (role !== 'superadmin') {
    return NextResponse.json(
      { error: 'Accès refusé' },
      { status: 403 }
    )
  }

  try {
    const [tenants, users, ventes] = await Promise.all([
      pool.query(
        "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE plan='pro') as pro, COUNT(*) FILTER (WHERE plan='starter') as starter FROM tenants"
      ),
      pool.query(
        'SELECT COUNT(*) as total FROM users'
      ),
      pool.query(
        "SELECT COUNT(*) as total, COALESCE(SUM(montant_ttc),0) as ca FROM ventes WHERE statut='paye'"
      )
    ])

    return NextResponse.json({
      data: {
        nb_tenants: parseInt(tenants.rows[0].total),
        nb_pro: parseInt(tenants.rows[0].pro),
        nb_starter: parseInt(tenants.rows[0].starter),
        nb_users: parseInt(users.rows[0].total),
        nb_ventes: parseInt(ventes.rows[0].total),
        ca_global: parseFloat(ventes.rows[0].ca)
      }
    })

  } catch (error) {
    console.error('Erreur statistiques administrateur:', error)

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
