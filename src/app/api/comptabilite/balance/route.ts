import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  const role = request.headers.get('x-user-role')!
  if (!['owner', 'manager', 'comptable'].includes(role)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }
  try {
    const rows = await query(tenantId, `
      SELECT pc.numero, pc.intitule, pc.classe, pc.type,
             COALESCE(SUM(e.debit), 0)::numeric  as total_debit,
             COALESCE(SUM(e.credit), 0)::numeric as total_credit,
             (COALESCE(SUM(e.debit), 0) - COALESCE(SUM(e.credit), 0))::numeric as solde
      FROM plan_comptable pc
      LEFT JOIN ecritures_comptables e ON e.compte_id = pc.id AND e.tenant_id = $1
      WHERE pc.tenant_id = $1
      GROUP BY pc.id, pc.numero, pc.intitule, pc.classe, pc.type
      HAVING COALESCE(SUM(e.debit), 0) > 0 OR COALESCE(SUM(e.credit), 0) > 0
      ORDER BY pc.numero ASC
    `, [tenantId])
    return NextResponse.json({ data: rows })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
