import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const tenantId = request.headers.get('x-tenant-id')!
  const { id } = await context.params
  try {
    const { nom_complet, telephone, poste, salaire_base, type_contrat, numero_cnss, is_actif } = await request.json()
    const res = await query(tenantId, `
      UPDATE employes SET
        nom_complet  = COALESCE($1, nom_complet),
        telephone    = COALESCE($2, telephone),
        poste        = COALESCE($3, poste),
        salaire_base = COALESCE($4, salaire_base),
        type_contrat = COALESCE($5, type_contrat),
        numero_cnss  = COALESCE($6, numero_cnss),
        is_actif     = COALESCE($7, is_actif)
      WHERE id = $8 AND tenant_id = $9 RETURNING *
    `, [
      nom_complet || null, telephone || null, poste || null,
      salaire_base || null, type_contrat || null, numero_cnss || null,
      is_actif !== undefined ? is_actif : null, id, tenantId
    ])
    if (!res[0]) return NextResponse.json({ error: 'Employé introuvable' }, { status: 404 })
    return NextResponse.json({ data: res[0] })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}