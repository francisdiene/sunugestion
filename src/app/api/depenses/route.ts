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
    const { montant, description, date_depense, mode_paiement, beneficiaire } = await request.json()

    const depense = await transaction(tenantId, async (client) => {
      const res = await client.query(`
        INSERT INTO depenses (tenant_id, montant, description, date_depense, mode_paiement, beneficiaire, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
      `, [tenantId, montant, description,
          date_depense || new Date().toISOString().split('T')[0],
          mode_paiement || 'cash',
          beneficiaire || null, userId])
      return res.rows[0]
    })

    return NextResponse.json({ data: depense }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
