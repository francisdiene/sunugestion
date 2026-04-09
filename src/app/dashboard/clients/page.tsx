'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect } from 'react'

interface Client { id: string; nom: string; telephone: string; email: string; type: string; total_achats: number; nb_commandes: number; solde_credit: number }

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', adresse: '', type: 'particulier', ninea: '', notes: '' })

  function load() { fetch('/api/clients?search=' + search).then(r => r.json()).then(d => d.data && setClients(d.data)) }
  useEffect(() => { load() }, [search])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg('')
    try {
      const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error); return }
      setMsg('✓ Client créé : ' + data.data.nom)
      setShowForm(false)
      setForm({ nom: '', telephone: '', email: '', adresse: '', type: 'particulier', ninea: '', notes: '' })
      load()
    } catch { setMsg('Erreur réseau') } finally { setLoading(false) }
  }

  const inp = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { fontSize: 12, fontWeight: 500 as const, color: '#555', display: 'block' as const, marginBottom: 4 }

  return (
    <DashboardLayout title="Clients" subtitle="Gestion des clients et dossiers">
      {msg && <div style={{ padding: '10px 16px', borderRadius: 8, background: msg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: msg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, marginBottom: 16 }}>{msg}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
        <input placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, maxWidth: 280 }} />
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{showForm ? '✕ Fermer' : '+ Nouveau client'}</button>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Nouveau client</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Nom complet *</label><input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inp}><option value="particulier">Particulier</option><option value="entreprise">Entreprise</option></select></div>
            <div><label style={lbl}>Téléphone</label><input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="+221 77 000 00 00" style={inp} /></div>
            <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>NINEA (entreprise)</label><input value={form.ninea} onChange={e => setForm({ ...form, ninea: e.target.value })} style={inp} /></div>
            <div style={{ gridColumn: 'span 3' }}><label style={lbl}>Adresse</label><input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} style={inp} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{loading ? 'Enregistrement...' : 'Créer le client'}</button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {clients.length === 0 ? (
          <div style={{ gridColumn: '1/-1', padding: '60px', textAlign: 'center', color: '#ccc', background: '#fff', borderRadius: 12 }}><div style={{ fontSize: 40, marginBottom: 12 }}>◌</div><p>Aucun client enregistré</p></div>
        ) : clients.map(c => (
          <div key={c.id} style={{ background: '#fff', borderRadius: 12, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: c.type === 'entreprise' ? '#eeedfe' : '#e6f1fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: c.type === 'entreprise' ? '#534AB7' : '#185FA5' }}>{c.nom[0]}</div>
                <div><div style={{ fontSize: 14, fontWeight: 600 }}>{c.nom}</div><div style={{ fontSize: 11, color: '#aaa' }}>{c.telephone || '—'}</div></div>
              </div>
              <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: c.type === 'entreprise' ? '#eeedfe' : '#e6f1fb', color: c.type === 'entreprise' ? '#534AB7' : '#185FA5', height: 'fit-content' }}>{c.type === 'entreprise' ? 'Entreprise' : 'Particulier'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#fafafa', borderRadius: 8, padding: '10px 12px' }}><div style={{ fontSize: 10, color: '#bbb', marginBottom: 2 }}>Total achats</div><div style={{ fontSize: 14, fontWeight: 700, color: '#1d9e75' }}>{Number(c.total_achats).toLocaleString()} XOF</div></div>
              <div style={{ background: '#fafafa', borderRadius: 8, padding: '10px 12px' }}><div style={{ fontSize: 10, color: '#bbb', marginBottom: 2 }}>Commandes</div><div style={{ fontSize: 14, fontWeight: 700 }}>{c.nb_commandes}</div></div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
