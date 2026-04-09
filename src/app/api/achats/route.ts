import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'
import { ecritureAchatRecu } from '@/lib/syscohada/ecritures'

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  try {
    const rows = await query(tenantId, `
      SELECT a.*, f.nom as fournisseur_nom
      FROM achats a JOIN fournisseurs f ON f.id = a.fournisseur_id
      WHERE a.tenant_id = $1 ORDER BY a.created_at DESC
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
    const { fournisseur_id, type, date_achat, lignes, notes } = await request.json()

    const achat = await transaction(tenantId, async (client) => {
      let ht = 0, tva = 0
      for (const l of lignes) {
        const lht = l.quantite * l.prix_unitaire
        ht  += lht
        tva += lht * (l.tva_taux || 18) / 100
      }
      const ttc = ht + tva

      const res = await client.query(`
        INSERT INTO achats (tenant_id, fournisseur_id, type, statut, date_achat, montant_ht, montant_tva, montant_ttc, notes, created_by)
        VALUES ($1,$2,$3,'confirme',$4,$5,$6,$7,$8,$9) RETURNING *
      `, [tenantId, fournisseur_id, type || 'facture',
          date_achat || new Date().toISOString().split('T')[0],
          ht, tva, ttc, notes || null, userId])

      const achatId = res.rows[0].id

      for (let i = 0; i < lignes.length; i++) {
        const l = lignes[i]
        const lht = l.quantite * l.prix_unitaire
        await client.query(`
          INSERT INTO achat_lignes (tenant_id, achat_id, produit_id, designation, quantite, prix_unitaire, tva_taux, montant_ht, montant_ttc, ordre)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        `, [tenantId, achatId, l.produit_id || null, l.designation,
            l.quantite, l.prix_unitaire, l.tva_taux || 18,
            lht, lht * (1 + (l.tva_taux || 18) / 100), i])

        // Mettre à jour le stock à la réception
        if (l.produit_id) {
          const depotRes = await client.query(
            'SELECT id FROM depots WHERE tenant_id = $1 AND is_principal = true LIMIT 1', [tenantId]
          )
          const depotId = depotRes.rows[0]?.id
          if (depotId) {
            const stockRes = await client.query(
              'SELECT quantite FROM stocks WHERE tenant_id=$1 AND produit_id=$2 AND depot_id=$3',
              [tenantId, l.produit_id, depotId]
            )
            const qteAvant = Number(stockRes.rows[0]?.quantite || 0)
            const qteApres = qteAvant + Number(l.quantite)

            await client.query(`
              INSERT INTO stocks (tenant_id, produit_id, depot_id, quantite)
              VALUES ($1,$2,$3,$4)
              ON CONFLICT (tenant_id, produit_id, depot_id) DO UPDATE SET quantite = $4
            `, [tenantId, l.produit_id, depotId, qteApres])

            await client.query(`
              INSERT INTO mouvements_stock (tenant_id, produit_id, depot_id, type, quantite, quantite_avant, quantite_apres, reference_doc, created_by)
              VALUES ($1,$2,$3,'entree',$4,$5,$6,$7,$8)
            `, [tenantId, l.produit_id, depotId, l.quantite, qteAvant, qteApres, res.rows[0].numero, userId])
          }
        }
      }

      // Générer écritures SYSCOHADA
      await ecritureAchatRecu(client, tenantId, userId, res.rows[0])

      return res.rows[0]
    })

    return NextResponse.json({ data: achat }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
