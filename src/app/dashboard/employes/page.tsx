'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect } from 'react'

interface Employe { id: string; nom_complet: string; telephone: string; poste: string; salaire_base: number; date_embauche: string; type_contrat: string; is_actif: boolean }

const CONTRATS: Record<string, string> = { cdi: 'CDI', cdd: 'CDD', freelance: 'Freelance', stagiaire: 'Stagiaire' }

export default function EmployesPage() {
  const [employes, setEmployes] = useState<Employe[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ nom_complet: '', telephone: '', poste: '', salaire_base: '', date_embauche: '', type_contrat: 'cdi', numero_cnss: '' })

  function load() { fetch('/api/employes').then(r => r.json()).then(d => d.data && setEmployes(d.data)) }
  useEffect(() => { load() }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg('')
    try {
      const res = await fetch('/api/employes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, salaire_base: parseFloat(form.salaire_base) || 0 }) })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error); return }
      setMsg('✓ Employé ajouté : ' + data.data.nom_complet)
      setShowForm(false)
      setForm({ nom_complet: '', telephone: '', poste: '', salaire_base: '', date_embauche: '', type_contrat: 'cdi', numero_cnss: '' })
      load()
    } catch { setMsg('Erreur réseau') } finally { setLoading(false) }
  }

  const masse_salariale = employes.reduce((s, e) => s + Number(e.salaire_base || 0), 0)
  const inp = { width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { fontSize: 12, fontWeight: 500 as const, color: '#555', display: 'block' as const, marginBottom: 4 }

  return (
    <DashboardLayout title="Employés & Paie" subtitle="Gestion du personnel et des salaires">
      {msg && <div style={{ padding: '10px 16px', borderRadius: 8, background: msg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: msg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: '3px solid #534AB7' }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Effectif total</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#534AB7' }}>{employes.length}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: '3px solid #D85A30' }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Masse salariale</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#D85A30' }}>{masse_salariale.toLocaleString('fr-FR')} XOF</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {showForm ? '✕ Fermer' : '+ Ajouter un employé'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Nouvel employé</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Nom complet *</label><input required value={form.nom_complet} onChange={e => setForm({ ...form, nom_complet: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Téléphone</label><input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Poste</label><input value={form.poste} onChange={e => setForm({ ...form, poste: e.target.value })} placeholder="Ex: Caissier, Vendeur..." style={inp} /></div>
            <div><label style={lbl}>Salaire de base (XOF)</label><input type="number" min="0" value={form.salaire_base} onChange={e => setForm({ ...form, salaire_base: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Type de contrat</label>
              <select value={form.type_contrat} onChange={e => setForm({ ...form, type_contrat: e.target.value })} style={inp}>
                <option value="cdi">CDI</option><option value="cdd">CDD</option>
                <option value="freelance">Freelance</option><option value="stagiaire">Stagiaire</option>
              </select>
            </div>
            <div><label style={lbl}>Date d'embauche</label><input type="date" value={form.date_embauche} onChange={e => setForm({ ...form, date_embauche: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>N° CNSS</label><input value={form.numero_cnss} onChange={e => setForm({ ...form, numero_cnss: e.target.value })} style={inp} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{loading ? 'Enregistrement...' : 'Ajouter'}</button>
          </div>
        </form>
      )}

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {employes.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#ccc' }}><div style={{ fontSize: 40, marginBottom: 12 }}>◌</div><p>Aucun employé enregistré</p></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#fafafa' }}>{['Employé', 'Poste', 'Contrat', 'Salaire de base', 'Date embauche', 'Statut'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
            <tbody>
              {employes.map((e, i) => (
                <tr key={e.id} style={{ borderTop: '1px solid #f7f7f7' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eeedfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#534AB7' }}>{e.nom_complet[0]}</div>
                      <div><div style={{ fontSize: 13, fontWeight: 600 }}>{e.nom_complet}</div><div style={{ fontSize: 11, color: '#bbb' }}>{e.telephone || '—'}</div></div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#666' }}>{e.poste || '—'}</td>
                  <td style={{ padding: '13px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#f1efe8', color: '#5F5E5A' }}>{CONTRATS[e.type_contrat] || e.type_contrat}</span></td>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: '#534AB7' }}>{Number(e.salaire_base).toLocaleString('fr-FR')} XOF</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#aaa' }}>{e.date_embauche ? new Date(e.date_embauche).toLocaleDateString('fr-FR') : '—'}</td>
                  <td style={{ padding: '13px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: e.is_actif ? '#e8f8f2' : '#f1efe8', color: e.is_actif ? '#0f6e56' : '#888' }}>{e.is_actif ? 'Actif' : 'Inactif'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  )
}
