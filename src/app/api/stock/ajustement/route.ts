import { NextRequest, NextResponse } from 'next/server'
import { transaction } from '@/lib/db'

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  const userId   = request.headers.get('x-user-id')!
  const role     = request.headers.get('x-user-role')!
  if (!['owner', 'manager', 'magasinier'].includes(role)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }
  try {
    const { ajustements } = await request.json()
    await transaction(tenantId, async (client) => {
      const depotRes = await client.query('SELECT id FROM depots WHERE tenant_id = $1 AND is_principal = true LIMIT 1', [tenantId])
      const depotId = depotRes.rows[0]?.id
      if (!depotId) throw new Error('Dépôt principal introuvable')
      for (const aj of ajustements) {
        const stockRes = await client.query('SELECT quantite FROM stocks WHERE tenant_id=$1 AND produit_id=$2 AND depot_id=$3', [tenantId, aj.produit_id, depotId])
        const qteAvant = Number(stockRes.rows[0]?.quantite || 0)
        const qteApres = Number(aj.quantite_reelle)
        await client.query(`INSERT INTO stocks (tenant_id, produit_id, depot_id, quantite) VALUES ($1,$2,$3,$4) ON CONFLICT (tenant_id, produit_id, depot_id) DO UPDATE SET quantite = $4`, [tenantId, aj.produit_id, depotId, qteApres])
        await client.query(`INSERT INTO mouvements_stock (tenant_id, produit_id, depot_id, type, quantite, quantite_avant, quantite_apres, reference_doc, created_by) VALUES ($1,$2,$3,'ajustement',$4,$5,$6,'INV-' || to_char(NOW(),'YYYYMMDD'),$7)`, [tenantId, aj.produit_id, depotId, Math.abs(qteApres - qteAvant), qteAvant, qteApres, userId])
      }
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
