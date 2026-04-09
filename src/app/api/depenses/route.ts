import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'
import { ecritureDepense } from '@/lib/syscohada/ecritures'

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  try {
    const rows = await query(tenantId, `
      SELECT d.*, u.nom_complet as createur
      FROM depenses d LEFT JOIN users u ON u.id = d.created_by
      WHERE d.tenant_id = $1 ORDER BY d.date_depense DESC
    `, [tenantId])
    return NextResponse.json({ data: rows })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  const userId   = request.headers.get('x-user-id')!
  try {
    const body = await request.json()
    const { montant, description, date_depense, categorie, mode_paiement, beneficiaire } = body

    const depense = await transaction(tenantId, async (client) => {
      const res = await client.query(`
        INSERT INTO depenses (tenant_id, montant, description, date_depense, categorie, mode_paiement, beneficiaire, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
      `, [tenantId, montant, description,
          date_depense || new Date().toISOString().split('T')[0],
          categorie || 'Divers', mode_paiement || 'cash',
          beneficiaire || null, userId])

      // Générer écritures SYSCOHADA automatiquement
      await ecritureDepense(client, tenantId, userId, res.rows[0])

      return res.rows[0]
    })

    return NextResponse.json({ data: depense }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
