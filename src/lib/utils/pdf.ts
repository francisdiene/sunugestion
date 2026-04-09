import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface LignePDF {
  designation: string
  quantite: number
  prix_unitaire: number
  remise_pct: number
  tva_taux: number
  montant_ttc: number
}

interface VentePDF {
  numero: string
  type: string
  date_vente: string
  mode_paiement: string
  statut: string
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  client_nom?: string
  client_telephone?: string
  client_adresse?: string
  lignes: LignePDF[]
}

interface TenantPDF {
  nom: string
  adresse?: string
  telephone?: string
  email?: string
  ninea?: string
}

const TYPE_LABELS: Record<string, string> = {
  facture: 'FACTURE',
  devis: 'DEVIS',
  bon_livraison: 'BON DE LIVRAISON',
  ticket_caisse: 'TICKET DE CAISSE',
  avoir: 'AVOIR',
}

const PAIEMENT_LABELS: Record<string, string> = {
  cash: 'Espèces', wave: 'Wave', orange_money: 'Orange Money',
  virement: 'Virement bancaire', credit: 'Crédit', cheque: 'Chèque',
}

export function genererFacturePDF(vente: VentePDF, tenant: TenantPDF): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const GREEN = [15, 110, 86] as [number, number, number]
  const DARK = [10, 22, 40] as [number, number, number]
  const GRAY = [120, 120, 120] as [number, number, number]

  // ── En-tête fond sombre ──────────────────────────────────
  doc.setFillColor(...DARK)
  doc.rect(0, 0, W, 38, 'F')

  doc.setFillColor(...GREEN)
  doc.rect(0, 38, W, 2, 'F')

  // Logo S
  doc.setFillColor(...GREEN)
  doc.roundedRect(14, 8, 20, 20, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('S', 24, 22, { align: 'center' })

  // Nom boutique
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(tenant.nom, 40, 18)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 220, 210)
  if (tenant.telephone) doc.text(tenant.telephone, 40, 24)
  if (tenant.email) doc.text(tenant.email, 40, 29)
  if (tenant.ninea) doc.text('NINEA : ' + tenant.ninea, 40, 34)

  // Type document
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(TYPE_LABELS[vente.type] || vente.type.toUpperCase(), W - 14, 20, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 220, 210)
  doc.text(vente.numero, W - 14, 28, { align: 'right' })
  doc.text('Date : ' + new Date(vente.date_vente).toLocaleDateString('fr-FR'), W - 14, 34, { align: 'right' })

  // ── Infos client ─────────────────────────────────────────
  let y = 50
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(14, y, 80, 30, 2, 2, 'F')
  doc.setFillColor(235, 245, 255)
  doc.roundedRect(W - 94, y, 80, 30, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.text('ÉMETTEUR', 18, y + 6)
  doc.setTextColor(...DARK)
  doc.setFontSize(9)
  doc.text(tenant.nom, 18, y + 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  if (tenant.adresse) doc.text(tenant.adresse, 18, y + 18)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.text('DESTINATAIRE', W - 90, y + 6)
  doc.setTextColor(...DARK)
  doc.setFontSize(9)
  doc.text(vente.client_nom || 'Client comptoir', W - 90, y + 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  if (vente.client_telephone) doc.text(vente.client_telephone, W - 90, y + 18)
  if (vente.client_adresse) doc.text(vente.client_adresse, W - 90, y + 24)

  // ── Tableau des lignes ───────────────────────────────────
  y += 38
  autoTable(doc, {
    startY: y,
    head: [['Désignation', 'Qté', 'P.U. HT', 'Remise', 'TVA', 'Montant TTC']],
    body: vente.lignes.map(l => [
      l.designation,
      l.quantite.toString(),
      l.prix_unitaire.toLocaleString('fr-FR') + ' XOF',
      l.remise_pct ? l.remise_pct + '%' : '—',
      l.tva_taux + '%',
      l.montant_ttc.toLocaleString('fr-FR') + ' XOF',
    ]),
    headStyles: {
      fillColor: DARK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: { fontSize: 8, textColor: DARK },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  })

  // ── Totaux ───────────────────────────────────────────────
  const finalY = (doc as any).lastAutoTable.finalY + 6
  const totX = W - 80

  doc.setDrawColor(230, 230, 230)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(totX - 4, finalY, 74, 32, 2, 2, 'F')

  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.text('Total HT', totX, finalY + 8)
  doc.text('TVA', totX, finalY + 15)

  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.text(vente.montant_ht.toLocaleString('fr-FR') + ' XOF', W - 18, finalY + 8, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.text(vente.montant_tva.toLocaleString('fr-FR') + ' XOF', W - 18, finalY + 15, { align: 'right' })

  // Total TTC
  doc.setFillColor(...GREEN)
  doc.roundedRect(totX - 4, finalY + 20, 74, 10, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('TOTAL TTC', totX, finalY + 27)
  doc.text(vente.montant_ttc.toLocaleString('fr-FR') + ' XOF', W - 18, finalY + 27, { align: 'right' })

  // Mode paiement
  const pyY = finalY + 36
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text('Mode de paiement : ' + (PAIEMENT_LABELS[vente.mode_paiement] || vente.mode_paiement), 14, pyY)

  // Statut
  if (vente.statut === 'paye') {
    doc.setFillColor(15, 110, 86)
    doc.roundedRect(14, pyY + 4, 26, 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('PAYÉ', 27, pyY + 9, { align: 'center' })
  }

  // ── Pied de page ─────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFillColor(...DARK)
  doc.rect(0, pageH - 14, W, 14, 'F')
  doc.setTextColor(150, 170, 160)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Généré par SunuGestion · Francis Tech · Dakar, Sénégal', W / 2, pageH - 6, { align: 'center' })

  return doc
}

export function telechargerFacture(vente: VentePDF, tenant: TenantPDF) {
  const doc = genererFacturePDF(vente, tenant)
  doc.save(`${vente.numero}.pdf`)
}
