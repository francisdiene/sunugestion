'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect } from 'react'

interface Client { id: string; nom: string; telephone: string }
interface Produit { id: string; nom: string; prix_vente: number; tva_taux: number; code_barre: string }
interface Ligne { produit_id: string; designation: string; quantite: number; prix_unitaire: number; remise_pct: number; tva_taux: number }
interface Vente { id: string; numero: string; client_nom: string; montant_ttc: number; statut: string; type: string; date_vente: string }

const STATUT: Record<string, { bg: string; color: string; label: string }> = {
  paye:      { bg: '#e8f8f2', color: '#0f6e56', label: 'Payé' },
  valide:    { bg: '#e6f1fb', color: '#185FA5', label: 'Validé' },
  brouillon: { bg: '#f1efe8', color: '#5F5E5A', label: 'Brouillon' },
  annule:    { bg: '#fcebeb', color: '#791F1F', label: 'Annulé' },
}

export default function VentesPage() {
  const [ventes, setVentes] = useState<Vente[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ client_id: '', type: 'facture', mode_paiement: 'cash', notes: '', date_vente: new Date().toISOString().split('T')[0] })
  const [lignes, setLignes] = useState<Ligne[]>([{ produit_id: '', designation: '', quantite: 1, prix_unitaire: 0, remise_pct: 0, tva_taux: 18 }])

  function loadVentes() {
    fetch('/api/ventes').then(r => r.json()).then(d => d.data && setVentes(d.data))
  }

  useEffect(() => {
    loadVentes()
    fetch('/api/clients').then(r => r.json()).then(d => d.data && setClients(d.data))
    fetch('/api/produits').then(r => r.json()).then(d => d.data && setProduits(d.data))
  }, [])

  function selectProduit(idx: number, produitId: string) {
    const p = produits.find(x => x.id === produitId)
    if (!p) return
    const nl = [...lignes]
    nl[idx] = { ...nl[idx], produit_id: p.id, designation: p.nom, prix_unitaire: p.prix_vente, tva_taux: p.tva_taux }
    setLignes(nl)
  }

  function updateLigne(idx: number, field: string, value: any) {
    const nl = [...lignes]; nl[idx] = { ...nl[idx], [field]: value }; setLignes(nl)
  }

  const totaux = lignes.reduce((acc, l) => {
    const ht = l.quantite * l.prix_unitaire * (1 - l.remise_pct / 100)
    return { ht: acc.ht + ht, tva: acc.tva + ht * l.tva_taux / 100 }
  }, { ht: 0, tva: 0 })

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg('')
    try {
      const res = await fetch('/api/ventes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, lignes }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error || 'Erreur'); return }
      setMsg('✓ Vente créée — ' + data.data.numero)
      setShowForm(false)
      setLignes([{ produit_id: '', designation: '', quantite: 1, prix_unitaire: 0, remise_pct: 0, tva_taux: 18 }])
      loadVentes()
    } catch { setMsg('Erreur réseau') } finally { setLoading(false) }
  }

  async function validerVente(venteId: string) {
    try {
      const res = await fetch(`/api/ventes/${venteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'valide' }),
      })
      if (res.ok) { setMsg('✓ Vente validée'); loadVentes() }
    } catch { setMsg('Erreur validation') }
  }

  async function payerVente(venteId: string) {
    try {
      const res = await fetch(`/api/ventes/${venteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'paye' }),
      })
      if (res.ok) { setMsg('✓ Vente marquée payée'); loadVentes() }
    } catch { setMsg('Erreur') }
  }

  async function telechargerPDF(venteId: string) {
    setPdfLoading(venteId)
    try {
      const res = await fetch(`/api/ventes/${venteId}`)
      const data = await res.json()
      if (!res.ok) { alert('Erreur chargement vente'); return }
      const v = data.data
      const { telechargerFacture } = await import('@/lib/utils/pdf')
      telechargerFacture(
        {
          numero: v.numero, type: v.type, date_vente: v.date_vente,
          mode_paiement: v.mode_paiement || 'cash', statut: v.statut,
          montant_ht: Number(v.montant_ht), montant_tva: Number(v.montant_tva), montant_ttc: Number(v.montant_ttc),
          client_nom: v.client_nom, client_telephone: v.client_telephone, client_adresse: v.client_adresse,
          lignes: v.lignes.map((l: any) => ({
            designation: l.designation, quantite: Number(l.quantite),
            prix_unitaire: Number(l.prix_unitaire), remise_pct: Number(l.remise_pct),
            tva_taux: Number(l.tva_taux), montant_ttc: Number(l.montant_ttc),
          })),
        },
        { nom: v.tenant_nom, adresse: v.tenant_adresse, telephone: v.tenant_telephone, email: v.tenant_email, ninea: v.tenant_ninea }
      )
    } catch (e) { console.error(e); alert('Erreur PDF') }
    finally { setPdfLoading(null) }
  }

  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: 12, fontWeight: 500 as const, color: '#555', display: 'block' as const, marginBottom: 4 }

  return (
    <DashboardLayout title="Ventes & Caisse" subtitle="Factures, devis, tickets de caisse">
      {msg && <div style={{ padding: '10px 16px', borderRadius: 8, background: msg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: msg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#666' }}>{ventes.length} document(s) · {ventes.filter(v => v.statut === 'brouillon').length} brouillon(s)</div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {showForm ? '✕ Fermer' : '+ Nouvelle vente'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Nouvelle vente</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div><label style={labelStyle}>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                <option value="facture">Facture</option><option value="devis">Devis</option>
                <option value="bon_livraison">Bon de livraison</option><option value="ticket_caisse">Ticket caisse</option>
              </select></div>
            <div><label style={labelStyle}>Client</label>
              <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} style={inputStyle}>
                <option value="">Client comptoir</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select></div>
            <div><label style={labelStyle}>Paiement</label>
              <select value={form.mode_paiement} onChange={e => setForm({ ...form, mode_paiement: e.target.value })} style={inputStyle}>
                <option value="cash">Cash</option><option value="wave">Wave</option>
                <option value="orange_money">Orange Money</option><option value="virement">Virement</option><option value="credit">Crédit</option>
              </select></div>
            <div><label style={labelStyle}>Date</label>
              <input type="date" value={form.date_vente} onChange={e => setForm({ ...form, date_vente: e.target.value })} style={inputStyle} /></div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 0.8fr 0.8fr 32px', gap: 8, marginBottom: 8 }}>
              {['Produit / Désignation', 'Qté', 'Prix unitaire', 'Remise %', 'TVA %', ''].map(h => (
                <div key={h} style={{ fontSize: 11, color: '#aaa', fontWeight: 600 }}>{h}</div>
              ))}
            </div>
            {lignes.map((l, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 0.8fr 0.8fr 32px', gap: 8, marginBottom: 8 }}>
                <select value={l.produit_id} onChange={e => selectProduit(i, e.target.value)} style={inputStyle}>
                  <option value="">-- Sélectionner --</option>
                  {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
                <input type="number" min="0.01" step="0.01" value={l.quantite} onChange={e => updateLigne(i, 'quantite', parseFloat(e.target.value) || 0)} style={inputStyle} />
                <input type="number" min="0" value={l.prix_unitaire} onChange={e => updateLigne(i, 'prix_unitaire', parseFloat(e.target.value) || 0)} style={inputStyle} />
                <input type="number" min="0" max="100" value={l.remise_pct} onChange={e => updateLigne(i, 'remise_pct', parseFloat(e.target.value) || 0)} style={inputStyle} />
                <input type="number" min="0" value={l.tva_taux} onChange={e => updateLigne(i, 'tva_taux', parseFloat(e.target.value) || 0)} style={inputStyle} />
                <button type="button" onClick={() => setLignes(lignes.filter((_, j) => j !== i))} style={{ border: 'none', background: '#faece7', color: '#D85A30', borderRadius: 7, cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => setLignes([...lignes, { produit_id: '', designation: '', quantite: 1, prix_unitaire: 0, remise_pct: 0, tva_taux: 18 }])} style={{ padding: '7px 14px', borderRadius: 7, border: '1px dashed #ccc', background: '#fafafa', fontSize: 12, cursor: 'pointer', color: '#888' }}>
              + Ajouter une ligne
            </button>
          </div>

          <div style={{ background: '#fafafa', borderRadius: 8, padding: '14px 16px', marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 32 }}>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, color: '#aaa' }}>Total HT</div><div style={{ fontSize: 16, fontWeight: 700 }}>{totaux.ht.toLocaleString('fr-FR')} XOF</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, color: '#aaa' }}>TVA</div><div style={{ fontSize: 16, fontWeight: 700 }}>{totaux.tva.toLocaleString('fr-FR')} XOF</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, color: '#aaa' }}>Total TTC</div><div style={{ fontSize: 20, fontWeight: 800, color: '#1d9e75' }}>{(totaux.ht + totaux.tva).toLocaleString('fr-FR')} XOF</div></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {loading ? 'Enregistrement...' : 'Enregistrer la vente'}
            </button>
          </div>
        </form>
      )}

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {ventes.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#ccc' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>◌</div>
            <p style={{ fontSize: 14 }}>Aucune vente enregistrée</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['N° Document', 'Client', 'Type', 'Montant TTC', 'Statut', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventes.map((v) => {
                const s = STATUT[v.statut] || STATUT.brouillon
                return (
                  <tr key={v.id} style={{ borderTop: '1px solid #f7f7f7' }}>
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600 }}>{v.numero}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#555' }}>{v.client_nom || 'Client comptoir'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: '#888' }}>{v.type}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: '#1d9e75' }}>{Number(v.montant_ttc).toLocaleString('fr-FR')} XOF</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: '#aaa' }}>{v.date_vente}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {v.statut === 'brouillon' && (
                          <button onClick={() => validerVente(v.id)} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#e6f1fb', color: '#185FA5', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                            ✓ Valider
                          </button>
                        )}
                        {v.statut === 'valide' && (
                          <button onClick={() => payerVente(v.id)} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#e8f8f2', color: '#0f6e56', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                            💰 Payer
                          </button>
                        )}
                        <button onClick={() => telechargerPDF(v.id)} disabled={pdfLoading === v.id} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e8e8e8', background: '#fff', fontSize: 11, cursor: 'pointer', color: '#D85A30', fontWeight: 600 }}>
                          {pdfLoading === v.id ? '...' : '⬇ PDF'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  )
}
