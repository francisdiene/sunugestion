import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'

// GET /api/ventes â€” liste des ventes du tenant
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit
  const type = searchParams.get('type') || null
  const statut = searchParams.get('statut') || null
  const dateDebut = searchParams.get('date_debut') || null
  const dateFin = searchParams.get('date_fin') || null

  try {
    let whereClause = 'WHERE v.tenant_id = $1'
    const params: any[] = [tenantId]
    let idx = 2

    if (type) { whereClause += ` AND v.type = $${idx++}`; params.push(type) }
    if (statut) { whereClause += ` AND v.statut = $${idx++}`; params.push(statut) }
    if (dateDebut) { whereClause += ` AND v.date_vente >= $${idx++}`; params.push(dateDebut) }
    if (dateFin) { whereClause += ` AND v.date_vente <= $${idx++}`; params.push(dateFin) }

    const [ventes, countResult] = await Promise.all([
      query(tenantId, `
        SELECT v.*, c.nom as client_nom, c.telephone as client_tel,
               u.nom_complet as createur
        FROM ventes v
        LEFT JOIN clients c ON c.id = v.client_id
        LEFT JOIN users u ON u.id = v.created_by
        ${whereClause}
        ORDER BY v.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...params, limit, offset]),
      query(tenantId, `SELECT COUNT(*) FROM ventes v ${whereClause}`, params),
    ])

    return NextResponse.json({
      data: ventes,
      pagination: {
        page,
        limit,
        total: parseInt(countResult[0].count),
        pages: Math.ceil(parseInt(countResult[0].count) / limit),
      },
    })
  } catch (error) {
    console.error('GET ventes error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/ventes â€” crÃ©er une vente avec ses lignes
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  const userId = request.headers.get('x-user-id')!

  try {
    const body = await request.json()
    const { client_id, depot_id, type, date_vente, date_echeance,
            remise_globale, mode_paiement, notes, lignes } = body

    if (!lignes || lignes.length === 0) {
      return NextResponse.json({ error: 'Au moins une ligne est requise' }, { status: 400 })
    }

    const vente = await transaction(tenantId, async (client) => {
      // Calculer les totaux
      let montant_ht = 0
      let montant_tva = 0

      for (const ligne of lignes) {
        const ht = ligne.quantite * ligne.prix_unitaire * (1 - (ligne.remise_pct || 0) / 100)
        const tva = ht * (ligne.tva_taux ?? 18) / 100
        montant_ht += ht
        montant_tva += tva
      }

      const remise = (remise_globale || 0) / 100
      montant_ht = montant_ht * (1 - remise)
      montant_tva = montant_tva * (1 - remise)
      const montant_ttc = montant_ht + montant_tva

      // CrÃ©er la vente
      const venteResult = await client.query(`
        INSERT INTO ventes (tenant_id, client_id, depot_id, type, statut,
          date_vente, date_echeance, montant_ht, montant_tva, montant_ttc,
          remise_globale, mode_paiement, notes, created_by)
        VALUES ($1,$2,$3,$4,'brouillon',$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING *
      `, [tenantId, client_id || null, depot_id || null, type,
          date_vente || new Date().toISOString().split('T')[0],
          date_echeance || null, montant_ht, montant_tva, montant_ttc,
          remise_globale || 0, mode_paiement || null, notes || null, userId])

      const venteId = venteResult.rows[0].id

      // InsÃ©rer les lignes
      for (let i = 0; i < lignes.length; i++) {
        const l = lignes[i]
        const ht = l.quantite * l.prix_unitaire * (1 - (l.remise_pct || 0) / 100) * (1 - remise)
        const tva = ht * (l.tva_taux ?? 18) / 100
        await client.query(`
          INSERT INTO vente_lignes (tenant_id, vente_id, produit_id, designation,
            quantite, prix_unitaire, remise_pct, tva_taux, montant_ht, montant_tva, montant_ttc, ordre)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        `, [tenantId, venteId, l.produit_id || null, l.designation,
            l.quantite, l.prix_unitaire, l.remise_pct || 0, l.tva_taux ?? 18,
            ht, tva, ht + tva, i])
      }

      // Log audit
      await client.query(`
        INSERT INTO audit_logs (tenant_id, user_id, action, table_name, record_id, nouveau_val)
        VALUES ($1,$2,'CREATE','ventes',$3,$4)
      `, [tenantId, userId, venteId, JSON.stringify(venteResult.rows[0])])

      return venteResult.rows[0]
    })

    return NextResponse.json({ data: vente }, { status: 201 })
  } catch (error) {
    console.error('POST vente error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

