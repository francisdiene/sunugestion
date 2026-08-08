import { PoolClient } from 'pg'

// Récupère les comptes SYSCOHADA du tenant (numéros à 3 chiffres)
export async function getComptes(client: PoolClient, tenantId: string) {
  const res = await client.query(`
    SELECT numero, id FROM plan_comptable WHERE tenant_id = $1
  `, [tenantId])
  const map: Record<string, string> = {}
  res.rows.forEach((r: any) => { map[r.numero] = r.id })
  return {
    get: (num: string) => map[num],
    // Cherche par préfixe si exact pas trouvé
    find: (prefix: string) => {
      const exact = map[prefix]
      if (exact) return exact
      const key = Object.keys(map).find(k => k.startsWith(prefix))
      return key ? map[key] : undefined
    }
  }
}

// Insérer une écriture
export async function insererEcriture(
  client: PoolClient,
  tenantId: string,
  userId: string,
  data: {
    compteId: string
    journal: string
    date: string
    libelle: string
    debit?: number
    credit?: number
    pieceRef?: string
    lotId?: string
  }
) {
  await client.query(`
    INSERT INTO ecritures_comptables
      (tenant_id, compte_id, journal, date_ecriture, libelle, debit, credit, piece_ref, lot_ecriture, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
  `, [
    tenantId,
    data.compteId,
    data.journal,
    data.date,
    data.libelle,
    data.debit || 0,
    data.credit || 0,
    data.pieceRef || null,
    data.lotId || null,
    userId
  ])
}

// ─── VENTE VALIDÉE ──────────────────────────────────────────
// Débit 411 (Clients) / Crédit 701 (Ventes) + 445 (TVA)
export async function ecritureVenteValidee(
  client: PoolClient, tenantId: string, userId: string, vente: any
) {
  const comptes = await getComptes(client, tenantId)
  const lotId   = crypto.randomUUID()
  const date    = vente.date_vente
  const ref     = vente.numero
  const lib     = `${vente.type === 'facture' ? 'Facture' : vente.type} ${vente.numero}`

  const c411 = comptes.find('411')
  const c701 = comptes.find('701')
  const c445 = comptes.find('445')

  if (c411) await insererEcriture(client, tenantId, userId, { compteId: c411, journal: 'VT', date, libelle: lib, debit: Number(vente.montant_ttc), pieceRef: ref, lotId })
  if (c701) await insererEcriture(client, tenantId, userId, { compteId: c701, journal: 'VT', date, libelle: lib, credit: Number(vente.montant_ht), pieceRef: ref, lotId })
  if (c445 && Number(vente.montant_tva) > 0) {
    await insererEcriture(client, tenantId, userId, { compteId: c445, journal: 'VT', date, libelle: `TVA ${ref}`, credit: Number(vente.montant_tva), pieceRef: ref, lotId })
  }
}

// ─── VENTE PAYÉE ────────────────────────────────────────────
// Débit 57x/52 (Trésorerie) / Crédit 411 (Clients)
export async function ecritureVentePayee(
  client: PoolClient, tenantId: string, userId: string, vente: any
) {
  const comptes = await getComptes(client, tenantId)
  const lotId   = crypto.randomUUID()
  const date    = vente.date_vente
  const ref     = vente.numero
  const lib     = `Encaissement ${vente.numero}`

 const modeMap: Record<string, string | undefined> = {
  cash:         comptes.find('571'),
  wave:         comptes.find('572'),
  orange_money: comptes.find('573'),
  virement:     comptes.find('521'),
  cheque:       comptes.find('521'),
  credit:       comptes.find('411'),
}
const compteTreso = modeMap[vente.mode_paiement || 'cash'] || comptes.find('571')

const c411 = comptes.find('411')

  if (compteTreso) await insererEcriture(client, tenantId, userId, { compteId: compteTreso, journal: 'CA', date, libelle: lib, debit: Number(vente.montant_ttc), pieceRef: ref, lotId })
  if (c411)        await insererEcriture(client, tenantId, userId, { compteId: c411,        journal: 'CA', date, libelle: lib, credit: Number(vente.montant_ttc), pieceRef: ref, lotId })
}

// ─── ACHAT REÇU ─────────────────────────────────────────────
// Débit 601 (Achats marchandises) + 445 (TVA déductible) / Crédit 401 (Fournisseurs)
export async function ecritureAchatRecu(
  client: PoolClient, tenantId: string, userId: string, achat: any
) {
  const comptes = await getComptes(client, tenantId)
  const lotId   = crypto.randomUUID()
  const date    = achat.date_achat
  const ref     = achat.numero
  const lib     = `Achat ${achat.numero}`

  const c601 = comptes.find('601')
  const c445d = comptes.find('4456') || comptes.find('445') // TVA déductible
  const c401 = comptes.find('401')

  if (c601) await insererEcriture(client, tenantId, userId, { compteId: c601, journal: 'AC', date, libelle: lib, debit: Number(achat.montant_ht), pieceRef: ref, lotId })
  if (c445d && Number(achat.montant_tva) > 0) {
    await insererEcriture(client, tenantId, userId, { compteId: c445d, journal: 'AC', date, libelle: `TVA déd. ${ref}`, debit: Number(achat.montant_tva), pieceRef: ref, lotId })
  }
  if (c401) await insererEcriture(client, tenantId, userId, { compteId: c401, journal: 'AC', date, libelle: lib, credit: Number(achat.montant_ttc), pieceRef: ref, lotId })
}

// ─── ACHAT PAYÉ ─────────────────────────────────────────────
// Débit 401 (Fournisseurs) / Crédit 57x (Trésorerie)
export async function ecritureAchatPaye(
  client: PoolClient, tenantId: string, userId: string, achat: any
) {
  const comptes = await getComptes(client, tenantId)
  const lotId   = crypto.randomUUID()
  const date    = achat.date_achat
  const ref     = achat.numero
  const lib     = `Paiement fournisseur ${ref}`

  const c401  = comptes.find('401')
  const cTreso = comptes.find('571')

  if (c401)  await insererEcriture(client, tenantId, userId, { compteId: c401, journal: 'CA', date, libelle: lib, debit: Number(achat.montant_ttc), pieceRef: ref, lotId })
  if (cTreso) await insererEcriture(client, tenantId, userId, { compteId: cTreso, journal: 'CA', date, libelle: lib, credit: Number(achat.montant_ttc), pieceRef: ref, lotId })
}

// ─── DÉPENSE ────────────────────────────────────────────────
// Débit 658 ou 613/621 (Charges) / Crédit 57x (Trésorerie)
export async function ecritureDepense(
  client: PoolClient, tenantId: string, userId: string, depense: any
) {
  const comptes = await getComptes(client, tenantId)
  const lotId   = crypto.randomUUID()
  const date    = depense.date_depense
  const lib     = depense.description

  // Compte de charge selon catégorie
  const compteCharge: Record<string, string> = {
    'Loyer':               '613',
    'Électricité / Eau':   '614',
    'Transport':           '624',
    'Communication':       '626',
    'Marketing':           '627',
    'Alimentation':        '625',
    'Salaires':            '641',
    'Entretien':           '615',
    'Impôts & Taxes':      '645',
    'Fournitures':         '604',
    'Personnel extérieur': '621',
  }

  const prefix = compteCharge[depense.categorie] || '658'
  const cCharge = comptes.find(prefix)

  const modeMap: Record<string, string | undefined> = {
    cash:         comptes.find('571'),
    wave:         comptes.find('572'),
    orange_money: comptes.find('573'),
    virement:     comptes.find('521'),
  }
  const compteTreso = modeMap[depense.mode_paiement || 'cash'] || comptes.find('571')

  if (cCharge)  await insererEcriture(client, tenantId, userId, { compteId: cCharge, journal: 'CA', date, libelle: lib, debit: Number(depense.montant), lotId })
  if (compteTreso) await insererEcriture(client, tenantId, userId, { compteId: compteTreso, journal: 'CA', date, libelle: lib, credit: Number(depense.montant), lotId })
}

// ─── SALAIRE ────────────────────────────────────────────────
// Débit 641 (Salaires) / Crédit 421 (Personnel) puis Débit 421 / Crédit 571
export async function ecritureSalaire(
  client: PoolClient, tenantId: string, userId: string, paie: any, employe: any
) {
  const comptes = await getComptes(client, tenantId)
  const lotId   = crypto.randomUUID()
  const date    = paie.date_paiement || new Date().toISOString().split('T')[0]
  const lib     = `Salaire ${employe.nom_complet} — ${paie.periode}`

  const c641 = comptes.find('641')
  const c421 = comptes.find('421')
  const c571 = comptes.find('571')
  const c431 = comptes.find('431') // CNSS

  // Constatation salaire brut
  if (c641) await insererEcriture(client, tenantId, userId, { compteId: c641, journal: 'SA', date, libelle: lib, debit: Number(paie.salaire_base), lotId })
  if (c421) await insererEcriture(client, tenantId, userId, { compteId: c421, journal: 'SA', date, libelle: lib, credit: Number(paie.net_a_payer), lotId })
  if (c431 && Number(paie.cotisation_cnss) > 0) {
    await insererEcriture(client, tenantId, userId, { compteId: c431, journal: 'SA', date, libelle: `CNSS ${employe.nom_complet}`, credit: Number(paie.cotisation_cnss), lotId })
  }

  // Paiement salaire
  if (c421) await insererEcriture(client, tenantId, userId, { compteId: c421, journal: 'CA', date, libelle: `Paiement ${lib}`, debit: Number(paie.net_a_payer), lotId })
  if (c571) await insererEcriture(client, tenantId, userId, { compteId: c571, journal: 'CA', date, libelle: `Paiement ${lib}`, credit: Number(paie.net_a_payer), lotId })
}
