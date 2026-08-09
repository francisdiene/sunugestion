'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect } from 'react'

interface Employe { id: string; nom_complet: string; telephone: string; poste: string; salaire_base: number; date_embauche: string; type_contrat: string; is_actif: boolean; numero_cnss: string }

const CONTRATS: Record<string, string> = { cdi: 'CDI', cdd: 'CDD', freelance: 'Freelance', stagiaire: 'Stagiaire' }

function fmtDate(d: string) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('fr-FR') } catch { return d }
}

export default function EmployesPage() {
  const [employes, setEmployes] = useState<Employe[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editEmploye, setEditEmploye] = useState<Employe | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ nom_complet: '', telephone: '', poste: '', salaire_base: '', date_embauche: '', type_contrat: 'cdi', numero_cnss: '' })
  const [editForm, setEditForm] = useState({ nom_complet: '', telephone: '', poste: '', salaire_base: '', type_contrat: '', numero_cnss: '', is_actif: true })

  function showMsg(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000) }
  function load() { fetch('/api/employes').then(r => r.json()).then(d => d.data && setEmployes(d.data)) }
  useEffect(() => { load() }, [])

  async function creer(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch('/api/employes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, salaire_base: parseFloat(form.salaire_base) || 0 }) })
      const data = await res.json()
      if (!res.ok) { showMsg(data.error); return }
      showMsg('✓ Employé ajouté : ' + data.data.nom_complet)
      setShowForm(false)
      setForm({ nom_complet: '', telephone: '', poste: '', salaire_base: '', date_embauche: '', type_contrat: 'cdi', numero_cnss: '' })
      load()
    } catch { showMsg('Erreur réseau') } finally { setLoading(false) }
  }

  async function modifier(id: string) {
    try {
      const res = await fetch(`/api/employes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editForm, salaire_base: parseFloat(editForm.salaire_base) || 0 }) })
      if (!res.ok) { showMsg('Erreur modification'); return }
      showMsg('✓ Employé mis à jour')
      setEditEmploye(null)
      load()
    } catch { showMsg('Erreur réseau') }
  }

  const masse = employes.reduce((s, e) => s + Number(e.salaire_base || 0), 0)
  const inp = { width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { fontSize: 12, fontWeight: 500 as const, color: '#555', display: 'block' as const, marginBottom: 4 }

  return (
    <DashboardLayout title="Employés & Paie" subtitle="Gestion du personnel et des salaires">
      {msg && <div style={{ padding: '10px 16px', borderRadius: 8, background: msg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: msg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: '3px solid #534AB7' }}>
          <div style={{ fontSize: 11, color: '#aaa' }}>Effectif</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#534AB7' }}>{employes.length}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: '3px solid #D85A30' }}>
          <div style={{ fontSize: 11, color: '#aaa' }}>Masse salariale</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#D85A30' }}>{masse.toLocaleString('fr-FR')} XOF</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button onClick={() => { setShowForm(!showForm); setEditEmploye(null) }} style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {showForm ? '✕ Fermer' : '+ Ajouter'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={creer} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Nouvel employé</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Nom complet *</label><input required value={form.nom_complet} onChange={e => setForm({ ...form, nom_complet: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Téléphone</label><input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Poste</label><input value={form.poste} onChange={e => setForm({ ...form, poste: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Salaire (XOF)</label><input type="number" min="0" value={form.salaire_base} onChange={e => setForm({ ...form, salaire_base: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Contrat</label>
              <select value={form.type_contrat} onChange={e => setForm({ ...form, type_contrat: e.target.value })} style={inp}>
                <option value="cdi">CDI</option><option value="cdd">CDD</option>
                <option value="freelance">Freelance</option><option value="stagiaire">Stagiaire</option>
              </select>
            </div>
            <div><label style={lbl}>Date embauche</label><input type="date" value={form.date_embauche} onChange={e => setForm({ ...form, date_embauche: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>N° CNSS</label><input value={form.numero_cnss} onChange={e => setForm({ ...form, numero_cnss: e.target.value })} style={inp} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{loading ? '...' : 'Ajouter'}</button>
          </div>
        </form>
      )}

      {/* Modal modifier */}
      {editEmploye && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setEditEmploye(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 16, padding: 24, width: '90%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Modifier {editEmploye.nom_complet}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Nom complet</label><input value={editForm.nom_complet} onChange={e => setEditForm({ ...editForm, nom_complet: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Téléphone</label><input value={editForm.telephone} onChange={e => setEditForm({ ...editForm, telephone: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Poste</label><input value={editForm.poste} onChange={e => setEditForm({ ...editForm, poste: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Salaire (XOF)</label><input type="number" value={editForm.salaire_base} onChange={e => setEditForm({ ...editForm, salaire_base: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Contrat</label>
                <select value={editForm.type_contrat} onChange={e => setEditForm({ ...editForm, type_contrat: e.target.value })} style={inp}>
                  <option value="cdi">CDI</option><option value="cdd">CDD</option>
                  <option value="freelance">Freelance</option><option value="stagiaire">Stagiaire</option>
                </select>
              </div>
              <div><label style={lbl}>N° CNSS</label><input value={editForm.numero_cnss} onChange={e => setEditForm({ ...editForm, numero_cnss: e.target.value })} style={inp} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8f9fa', borderRadius: 8, marginTop: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Employé actif</span>
              <div onClick={() => setEditForm({ ...editForm, is_actif: !editForm.is_actif })} style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', background: editForm.is_actif ? '#1d9e75' : '#ddd', position: 'relative' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: editForm.is_actif ? 23 : 3, transition: 'left 0.2s' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setEditEmploye(null)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => modifier(editEmploye.id)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>💾 Sauvegarder</button>
            </div>
          </div>
        </div>
      )}

      {/* Liste employés */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {employes.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#ccc' }}><div style={{ fontSize: 40, marginBottom: 12 }}>◌</div><p>Aucun employé</p></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#fafafa' }}>
              {['Employé', 'Poste', 'Contrat', 'Salaire', 'Embauche', 'Statut', ''].map(h => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#999', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {employes.map(e => (
                <tr key={e.id} style={{ borderTop: '1px solid #f7f7f7' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eeedfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#534AB7' }}>{e.nom_complet[0]}</div>
                      <div><div style={{ fontSize: 13, fontWeight: 600 }}>{e.nom_complet}</div><div style={{ fontSize: 11, color: '#bbb' }}>{e.telephone || '—'}</div></div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#666' }}>{e.poste || '—'}</td>
                  <td style={{ padding: '12px 14px' }}><span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: '#f1efe8', color: '#5F5E5A' }}>{CONTRATS[e.type_contrat] || e.type_contrat}</span></td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#534AB7' }}>{Number(e.salaire_base).toLocaleString('fr-FR')} XOF</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: '#aaa' }}>{fmtDate(e.date_embauche)}</td>
                  <td style={{ padding: '12px 14px' }}><span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: e.is_actif ? '#e8f8f2' : '#f1efe8', color: e.is_actif ? '#0f6e56' : '#888' }}>{e.is_actif ? 'Actif' : 'Inactif'}</span></td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => { setEditEmploye(e); setEditForm({ nom_complet: e.nom_complet, telephone: e.telephone || '', poste: e.poste || '', salaire_base: String(e.salaire_base), type_contrat: e.type_contrat, numero_cnss: e.numero_cnss || '', is_actif: e.is_actif }) }}
                      style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', fontSize: 11, cursor: 'pointer', color: '#555' }}>✏ Modifier</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  )
}
