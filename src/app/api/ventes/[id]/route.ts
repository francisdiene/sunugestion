import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'
import { ecritureVenteValidee, ecritureVentePayee } from '@/lib/syscohada/ecritures'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const tenantId = request.headers.get('x-tenant-id')!
  const { id } = await context.params
  try {
    const ventes = await query(tenantId, `
      SELECT v.*, c.nom as client_nom, c.telephone as client_telephone,
             c.adresse as client_adresse, t.nom as tenant_nom,
             t.adresse as tenant_adresse, t.telephone as tenant_telephone,
             t.email as tenant_email, t.ninea as tenant_ninea
      FROM ventes v
      LEFT JOIN clients c ON c.id = v.client_id
      JOIN tenants t ON t.id = v.tenant_id
      WHERE v.id = $1 AND v.tenant_id = $2
    `, [id, tenantId])
    if (!ventes[0]) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
    const lignes = await query(tenantId, `
      SELECT * FROM vente_lignes WHERE vente_id = $1 ORDER BY ordre ASC
    `, [id])
    return NextResponse.json({ data: { ...ventes[0], lignes } })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const tenantId = request.headers.get('x-tenant-id')!
  const userId   = request.headers.get('x-user-id')!
  const role     = request.headers.get('x-user-role')!
  const { id }   = await context.params

  if (!['owner', 'manager', 'comptable'].includes(role)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const { statut } = await request.json()

    const result = await transaction(tenantId, async (client) => {
      const venteRes = await client.query(
       'SELECT * FROM ventes WHERE id = $1 AND tenant_id = $2 FOR UPDATE', [id, tenantId]
      )
      const vente = venteRes.rows[0]
      if (!vente) throw new Error('Vente introuvable')
      const ancienStatut = vente.statut

      if (statut === 'valide' && ancienStatut !== 'brouillon') {
  throw new Error('Cette vente a déjà été validée.')
}

if (statut === 'paye' && ancienStatut !== 'valide') {
  throw new Error('La vente doit être validée avant le paiement.')
}

      // Mettre à jour statut
      const updated = await client.query(`
        UPDATE ventes SET statut = $1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3 RETURNING *
      `, [statut, id, tenantId])

      // VALIDATION → écritures VT + stock
      if (statut === 'valide' && ancienStatut === 'brouillon') {
        await ecritureVenteValidee(client, tenantId, userId, vente)

        // Décrémenter stock
        const lignes = await client.query(
          'SELECT * FROM vente_lignes WHERE vente_id = $1 AND produit_id IS NOT NULL', [id]
        )
        const depotRes = await client.query(
          'SELECT id FROM depots WHERE tenant_id = $1 AND is_principal = true LIMIT 1', [tenantId]
        )
        const depotId = vente.depot_id || depotRes.rows[0]?.id

        if (depotId) {
          for (const ligne of lignes.rows) {
            const stockRes = await client.query(
             'SELECT quantite FROM stocks WHERE tenant_id=$1 AND produit_id=$2 AND depot_id=$3 FOR UPDATE',
              [tenantId, ligne.produit_id, depotId]
            )
            const qteAvant = Number(stockRes.rows[0]?.quantite || 0)
            const qteApres = qteAvant - Number(ligne.quantite)

            await client.query(`
              INSERT INTO stocks (tenant_id, produit_id, depot_id, quantite)
              VALUES ($1,$2,$3,$4)
              ON CONFLICT (tenant_id, produit_id, depot_id) DO UPDATE SET quantite = $4
            `, [tenantId, ligne.produit_id, depotId, qteApres])

            await client.query(`
              INSERT INTO mouvements_stock (tenant_id, produit_id, depot_id, type, quantite, quantite_avant, quantite_apres, reference_doc, created_by)
              VALUES ($1,$2,$3,'sortie',$4,$5,$6,$7,$8)
            `, [tenantId, ligne.produit_id, depotId, ligne.quantite, qteAvant, qteApres, vente.numero, userId])
          }
        }
      }

      // PAIEMENT → écritures CA
      if (statut === 'paye') {
        if (ancienStatut === 'brouillon') {
          await ecritureVenteValidee(client, tenantId, userId, vente)
        }
        await ecritureVentePayee(client, tenantId, userId, vente)
        await client.query(`UPDATE ventes SET montant_paye = montant_ttc WHERE id = $1`, [id])
      }

      return updated.rows[0]
    })

    return NextResponse.json({ data: result })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 })
  }
}
