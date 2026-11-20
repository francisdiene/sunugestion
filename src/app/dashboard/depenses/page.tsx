'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect } from 'react'

interface Depense { id: string; montant: number; description: string; categorie: string; date_depense: string; mode_paiement: string; beneficiaire: string }

const CATEGORIES = ['Loyer', 'Électricité / Eau', 'Transport', 'Fournitures', 'Communication', 'Marketing', 'Alimentation', 'Salaires', 'Entretien', 'Impôts & Taxes', 'Divers']

export default function DepensesPage() {
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ montant: '', description: '', categorie: 'Divers', date_depense: new Date().toISOString().split('T')[0], mode_paiement: 'cash', beneficiaire: '' })

  function load() { fetch('/api/depenses').then(r => r.json()).then(d => d.data && setDepenses(d.data)) }
  useEffect(() => { load() }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg('')
    try {
      const res = await fetch('/api/depenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, montant: parseFloat(form.montant) }) })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error); return }
      setMsg('✓ Dépense enregistrée')
      setShowForm(false)
      setForm({ montant: '', description: '', categorie: 'Divers', date_depense: new Date().toISOString().split('T')[0], mode_paiement: 'cash', beneficiaire: '' })
      load()
    } catch { setMsg('Erreur réseau') } finally { setLoading(false) }
  }

  const total = depenses.reduce((s, d) => s + Number(d.montant), 0)
  const inp = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { fontSize: 12, fontWeight: 500 as const, color: '#555', display: 'block' as const, marginBottom: 4 }

  return (
    <DashboardLayout title="Dépenses" subtitle="Suivi des charges et dépenses">
      {msg && <div style={{ padding: '10px 16px', borderRadius: 8, background: msg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: msg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 14, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: '3px solid #D85A30' }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Total dépenses</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#D85A30' }}>{total.toLocaleString('fr-FR')} XOF</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: '3px solid #888' }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Nombre de dépenses</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{depenses.length}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#D85A30', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{showForm ? '✕ Fermer' : '+ Saisie rapide'}</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Nouvelle dépense</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 16 }}>
            <div><label style={lbl}>Montant (XOF) *</label><input required type="number" min="1" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Catégorie</label><select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} style={inp}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label style={lbl}>Date</label><input type="date" value={form.date_depense} onChange={e => setForm({ ...form, date_depense: e.target.value })} style={inp} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Description *</label><input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Mode paiement</label><select value={form.mode_paiement} onChange={e => setForm({ ...form, mode_paiement: e.target.value })} style={inp}><option value="cash">Cash</option><option value="wave">Wave</option><option value="orange_money">Orange Money</option><option value="virement">Virement</option></select></div>
            <div style={{ gridColumn: 'span 3' }}><label style={lbl}>Bénéficiaire</label><input value={form.beneficiaire} onChange={e => setForm({ ...form, beneficiaire: e.target.value })} placeholder="Nom du fournisseur / personne" style={inp} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#D85A30', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{loading ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      )}

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
        {depenses.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#ccc' }}><div style={{ fontSize: 40, marginBottom: 12 }}>◌</div><p>Aucune dépense enregistrée</p></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#fafafa' }}>{['Description', 'Catégorie', 'Montant', 'Date', 'Mode', 'Bénéficiaire'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
            <tbody>
              {depenses.map((d, i) => (
                <tr key={d.id} style={{ borderTop: '1px solid #f7f7f7' }}>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 500 }}>{d.description}</td>
                  <td style={{ padding: '13px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: '#f1efe8', color: '#5F5E5A' }}>{d.categorie}</span></td>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: '#D85A30' }}>{Number(d.montant).toLocaleString('fr-FR')} XOF</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#aaa' }}>{d.date_depense}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#888' }}>{d.mode_paiement}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#888' }}>{d.beneficiaire || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  )
}
