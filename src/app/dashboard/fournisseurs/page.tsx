'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect } from 'react'

interface Fournisseur { id: string; nom: string; telephone: string; ninea: string; total_achats: number; nb_achats: number; solde_du: number }

export default function FournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', adresse: '', ninea: '', rccm: '', notes: '' })

  function load() {
    fetch('/api/fournisseurs?search=' + search)
      .then(r => r.json())
      .then(d => d.data && setFournisseurs(d.data))
  }

  useEffect(() => { load() }, [search])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg('')
    try {
      const res = await fetch('/api/fournisseurs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error); return }
      setMsg('✓ Fournisseur créé')
      setShowForm(false)
      setForm({ nom: '', telephone: '', email: '', adresse: '', ninea: '', rccm: '', notes: '' })
      load()
    } catch { setMsg('Erreur réseau') } finally { setLoading(false) }
  }

  const inp = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { fontSize: 12, fontWeight: 500 as const, color: '#555', display: 'block' as const, marginBottom: 4 }

  return (
    <DashboardLayout title="Fournisseurs" subtitle="Gestion des fournisseurs et achats">
      {msg && <div style={{ padding: '10px 16px', borderRadius: 8, background: msg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: msg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
        <input placeholder="Rechercher un fournisseur..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inp, maxWidth: 280 }} />
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {showForm ? '✕ Fermer' : '+ Nouveau fournisseur'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Nouveau fournisseur</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Nom *</label><input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Téléphone</label><input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>NINEA</label><input value={form.ninea} onChange={e => setForm({ ...form, ninea: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>RCCM</label><input value={form.rccm} onChange={e => setForm({ ...form, rccm: e.target.value })} style={inp} /></div>
            <div style={{ gridColumn: 'span 3' }}><label style={lbl}>Adresse</label><input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} style={inp} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{loading ? 'Enregistrement...' : 'Créer'}</button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fournisseurs.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: '60px', textAlign: 'center', color: '#ccc', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>◌</div>
            <p style={{ fontSize: 14 }}>Aucun fournisseur enregistré</p>
          </div>
        ) : fournisseurs.map(f => (
          <div key={f.id} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eeedfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#534AB7', fontWeight: 700 }}>{f.nom[0]}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{f.nom}</div>
                <div style={{ fontSize: 12, color: '#aaa' }}>{f.telephone || '—'} {f.ninea ? `· NINEA: ${f.ninea}` : ''}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#aaa' }}>Total achats</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#534AB7' }}>{Number(f.total_achats || 0).toLocaleString('fr-FR')} XOF</div>
              </div>
              {Number(f.solde_du) > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#aaa' }}>Solde dû</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#D85A30' }}>{Number(f.solde_du).toLocaleString('fr-FR')} XOF</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #e8e8e8', background: '#fff', fontSize: 12, cursor: 'pointer' }}>Dossier</button>
                <button style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: '#0a1628', color: '#fff', fontSize: 12, cursor: 'pointer' }}>Bon d'achat</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
