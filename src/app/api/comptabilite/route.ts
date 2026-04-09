import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  const role = request.headers.get('x-user-role')!
  const { searchParams } = new URL(request.url)

  if (!['owner', 'manager', 'comptable'].includes(role)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const journal   = searchParams.get('journal') || null
  const dateDebut = searchParams.get('date_debut') || null
  const dateFin   = searchParams.get('date_fin') || null
  const compteId  = searchParams.get('compte_id') || null

  try {
    let where = 'WHERE e.tenant_id = $1'
    const params: any[] = [tenantId]
    let idx = 2

    if (journal)   { where += ` AND e.journal = $${idx++}`;        params.push(journal) }
    if (dateDebut) { where += ` AND e.date_ecriture >= $${idx++}`; params.push(dateDebut) }
    if (dateFin)   { where += ` AND e.date_ecriture <= $${idx++}`; params.push(dateFin) }
    if (compteId)  { where += ` AND e.compte_id = $${idx++}`;      params.push(compteId) }

    const ecritures = await query(tenantId, `
      SELECT e.*, pc.numero as compte_numero, pc.intitule as compte_intitule
      FROM ecritures_comptables e
      JOIN plan_comptable pc ON pc.id = e.compte_id
      ${where}
      ORDER BY e.date_ecriture ASC, e.created_at ASC
    `, params)

    return NextResponse.json({ data: ecritures })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
