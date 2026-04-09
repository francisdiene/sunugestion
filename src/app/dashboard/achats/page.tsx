'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect } from 'react'

interface Fournisseur { id: string; nom: string }
interface Produit { id: string; nom: string; prix_achat: number; tva_taux: number }
interface Ligne { produit_id: string; designation: string; quantite: number; prix_unitaire: number; tva_taux: number }
interface Achat { id: string; numero: string; fournisseur_nom: string; montant_ttc: number; statut: string; type: string; date_achat: string }

const STATUT: Record<string, { bg: string; color: string; label: string }> = {
  brouillon:          { bg: '#f1efe8', color: '#5F5E5A', label: 'Brouillon' },
  confirme:           { bg: '#e6f1fb', color: '#185FA5', label: 'Confirmé' },
  recu:               { bg: '#e8f8f2', color: '#0f6e56', label: 'Reçu' },
  partiellement_recu: { bg: '#faeeda', color: '#BA7517', label: 'Partiel' },
  paye:               { bg: '#eeedfe', color: '#534AB7', label: 'Payé' },
  annule:             { bg: '#fcebeb', color: '#791F1F', label: 'Annulé' },
}

export default function AchatsPage() {
  const [achats, setAchats] = useState<Achat[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ fournisseur_id: '', type: 'facture', date_achat: new Date().toISOString().split('T')[0], notes: '' })
  const [lignes, setLignes] = useState<Ligne[]>([{ produit_id: '', designation: '', quantite: 1, prix_unitaire: 0, tva_taux: 18 }])

  function load() { fetch('/api/achats').then(r => r.json()).then(d => d.data && setAchats(d.data)) }

  useEffect(() => {
    load()
    fetch('/api/fournisseurs').then(r => r.json()).then(d => d.data && setFournisseurs(d.data))
    fetch('/api/produits').then(r => r.json()).then(d => d.data && setProduits(d.data))
  }, [])

  function selectProduit(idx: number, produitId: string) {
    const p = produits.find(x => x.id === produitId)
    if (!p) return
    const nl = [...lignes]
    nl[idx] = { ...nl[idx], produit_id: p.id, designation: p.nom, prix_unitaire: p.prix_achat, tva_taux: p.tva_taux }
    setLignes(nl)
  }

  function updateLigne(idx: number, field: string, value: any) {
    const nl = [...lignes]; nl[idx] = { ...nl[idx], [field]: value }; setLignes(nl)
  }

  const totaux = lignes.reduce((acc, l) => {
    const ht = l.quantite * l.prix_unitaire
    return { ht: acc.ht + ht, tva: acc.tva + ht * l.tva_taux / 100 }
  }, { ht: 0, tva: 0 })

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg('')
    try {
      const res = await fetch('/api/achats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, lignes }) })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error || 'Erreur'); return }
      setMsg('✓ Achat créé — ' + data.data.numero)
      setShowForm(false)
      setLignes([{ produit_id: '', designation: '', quantite: 1, prix_unitaire: 0, tva_taux: 18 }])
      load()
    } catch { setMsg('Erreur réseau') } finally { setLoading(false) }
  }

  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: 12, fontWeight: 500 as const, color: '#555', display: 'block' as const, marginBottom: 4 }

  return (
    <DashboardLayout title="Achats" subtitle="Bons de commande et factures fournisseurs">
      {msg && <div style={{ padding: '10px 16px', borderRadius: 8, background: msg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: msg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#666' }}>{achats.length} bon(s) d'achat</div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#534AB7', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {showForm ? '✕ Fermer' : '+ Nouvel achat'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Nouvel achat fournisseur</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ gridColumn: 'span 1' }}>
              <label style={labelStyle}>Fournisseur *</label>
              <select required value={form.fournisseur_id} onChange={e => setForm({ ...form, fournisseur_id: e.target.value })} style={inputStyle}>
                <option value="">-- Sélectionner --</option>
                {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                <option value="bon_commande">Bon de commande</option>
                <option value="facture">Facture</option>
                <option value="avoir">Avoir</option>
                <option value="retour">Retour</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={form.date_achat} onChange={e => setForm({ ...form, date_achat: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 0.8fr 32px', gap: 8, marginBottom: 8 }}>
              {['Produit / Désignation', 'Qté', 'Prix achat', 'TVA %', ''].map(h => (
                <div key={h} style={{ fontSize: 11, color: '#aaa', fontWeight: 600 }}>{h}</div>
              ))}
            </div>
            {lignes.map((l, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 0.8fr 32px', gap: 8, marginBottom: 8 }}>
                <select value={l.produit_id} onChange={e => selectProduit(i, e.target.value)} style={inputStyle}>
                  <option value="">-- Sélectionner --</option>
                  {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
                <input type="number" min="1" value={l.quantite} onChange={e => updateLigne(i, 'quantite', parseFloat(e.target.value) || 0)} style={inputStyle} />
                <input type="number" min="0" value={l.prix_unitaire} onChange={e => updateLigne(i, 'prix_unitaire', parseFloat(e.target.value) || 0)} style={inputStyle} />
                <input type="number" min="0" value={l.tva_taux} onChange={e => updateLigne(i, 'tva_taux', parseFloat(e.target.value) || 0)} style={inputStyle} />
                <button type="button" onClick={() => setLignes(lignes.filter((_, j) => j !== i))} style={{ border: 'none', background: '#faece7', color: '#D85A30', borderRadius: 7, cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => setLignes([...lignes, { produit_id: '', designation: '', quantite: 1, prix_unitaire: 0, tva_taux: 18 }])} style={{ padding: '7px 14px', borderRadius: 7, border: '1px dashed #ccc', background: '#fafafa', fontSize: 12, cursor: 'pointer', color: '#888' }}>
              + Ajouter une ligne
            </button>
          </div>

          <div style={{ background: '#fafafa', borderRadius: 8, padding: '14px 16px', marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 32 }}>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, color: '#aaa' }}>Total HT</div><div style={{ fontSize: 16, fontWeight: 700 }}>{totaux.ht.toLocaleString('fr-FR')} XOF</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, color: '#aaa' }}>TVA</div><div style={{ fontSize: 16, fontWeight: 700 }}>{totaux.tva.toLocaleString('fr-FR')} XOF</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, color: '#aaa' }}>Total TTC</div><div style={{ fontSize: 20, fontWeight: 800, color: '#534AB7' }}>{(totaux.ht + totaux.tva).toLocaleString('fr-FR')} XOF</div></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#534AB7', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {achats.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#ccc' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>◌</div>
            <p style={{ fontSize: 14 }}>Aucun achat enregistré</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#fafafa' }}>{['N° Achat', 'Fournisseur', 'Type', 'Montant TTC', 'Statut', 'Date'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
            <tbody>
              {achats.map((a) => {
                const s = STATUT[a.statut] || STATUT.brouillon
                return (
                  <tr key={a.id} style={{ borderTop: '1px solid #f7f7f7' }}>
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600 }}>{a.numero}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#555' }}>{a.fournisseur_nom}</td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: '#888' }}>{a.type}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: '#534AB7' }}>{Number(a.montant_ttc).toLocaleString('fr-FR')} XOF</td>
                    <td style={{ padding: '13px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span></td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: '#aaa' }}>{a.date_achat}</td>
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
