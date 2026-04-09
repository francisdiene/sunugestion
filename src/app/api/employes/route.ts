import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  try {
    const rows = await query(tenantId, `SELECT * FROM employes WHERE tenant_id = $1 ORDER BY nom_complet ASC`, [tenantId])
    return NextResponse.json({ data: rows })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  try {
    const { nom_complet, telephone, poste, salaire_base, date_embauche, type_contrat, numero_cnss } = await request.json()
    const res = await query(tenantId, `
      INSERT INTO employes (tenant_id, nom_complet, telephone, poste, salaire_base, date_embauche, type_contrat, numero_cnss)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [tenantId, nom_complet, telephone||null, poste||null, salaire_base||0, date_embauche||null, type_contrat||'cdi', numero_cnss||null])
    return NextResponse.json({ data: res[0] }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
