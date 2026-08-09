'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Client { id: string; nom: string; telephone: string; email: string; adresse: string; type: string; nb_commandes: number; total_achats: number; solde_credit: number }

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', adresse: '', type: 'particulier' })

  function load() {
    fetch('/api/clients?search=' + search).then(r => r.json()).then(d => d.data && setClients(d.data))
  }

  useEffect(() => { load() }, [search])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg('')
    try {
      const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error); return }
      setMsg('✓ Client créé : ' + data.data.nom)
      setShowForm(false)
      setForm({ nom: '', telephone: '', email: '', adresse: '', type: 'particulier' })
      load()
    } catch { setMsg('Erreur réseau') } finally { setLoading(false) }
  }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { fontSize: 12, fontWeight: 500 as const, color: '#555', display: 'block' as const, marginBottom: 4 }

  return (
    <DashboardLayout title="Clients" subtitle="Gestion des clients et dossiers">
      {msg && <div style={{ padding: '10px 16px', borderRadius: 8, background: msg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: msg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
        <input placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, maxWidth: 280 }} />
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {showForm ? '✕ Fermer' : '+ Nouveau client'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Nouveau client</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Nom *</label><input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Téléphone</label><input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Adresse</label><input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inp}>
                <option value="particulier">Particulier</option>
                <option value="entreprise">Entreprise</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{loading ? 'Création...' : 'Créer'}</button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {clients.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: '60px', textAlign: 'center', color: '#ccc', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>◌</div>
            <p>Aucun client enregistré</p>
          </div>
        ) : clients.map(c => (
          <div key={c.id} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
            onClick={() => router.push(`/dashboard/clients/${c.id}`)}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e6f1fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#185FA5', flexShrink: 0 }}>
              {c.nom[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{c.nom}</div>
              <div style={{ fontSize: 12, color: '#aaa' }}>{c.telephone || '—'}</div>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#aaa' }}>Total achats</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1d9e75' }}>{Number(c.total_achats || 0).toLocaleString('fr-FR')} XOF</div>
              </div>
              {Number(c.solde_credit) > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#aaa' }}>Solde dû</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#D85A30' }}>{Number(c.solde_credit).toLocaleString('fr-FR')} XOF</div>
                </div>
              )}
              <div style={{ fontSize: 12, color: '#aaa' }}>{c.nb_commandes || 0} cmd</div>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, background: '#e6f1fb', color: '#185FA5' }}>
                {c.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
              </span>
              <span style={{ fontSize: 16, color: '#ccc' }}>›</span>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
