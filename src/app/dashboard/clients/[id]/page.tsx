'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

interface Client { id: string; nom: string; telephone: string; email: string; adresse: string; solde_credit: number; total_achats: number; nb_commandes: number }
interface Vente { id: string; numero: string; montant_ttc: number; montant_paye: number; statut: string; date_vente: string }

const STATUT: Record<string, { bg: string; color: string; label: string }> = {
  paye:      { bg: '#e8f8f2', color: '#0f6e56', label: 'Payé' },
  valide:    { bg: '#e6f1fb', color: '#185FA5', label: 'Validé' },
  brouillon: { bg: '#f1efe8', color: '#5F5E5A', label: 'Brouillon' },
  annule:    { bg: '#fcebeb', color: '#791F1F', label: 'Annulé' },
}

function fmt(n: number) { return Number(n || 0).toLocaleString('fr-FR') }
function fmtDate(d: string) { if (!d) return '—'; try { return new Date(d).toLocaleDateString('fr-FR') } catch { return d } }

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [ventes, setVentes] = useState<Vente[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', adresse: '' })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/clients/${id}`).then(r => r.json()),
      fetch(`/api/ventes?client_id=${id}`).then(r => r.json()),
    ]).then(([c, v]) => {
      if (c.data) { setClient(c.data); setForm({ nom: c.data.nom, telephone: c.data.telephone || '', email: c.data.email || '', adresse: c.data.adresse || '' }) }
      if (v.data) setVentes(v.data)
      setLoading(false)
    })
  }, [id])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(`/api/clients/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (!res.ok) { setMsg(data.error); return }
    setClient(prev => prev ? { ...prev, ...form } : prev)
    setEditing(false)
    setMsg('✓ Client mis à jour')
    setTimeout(() => setMsg(''), 3000)
  }

  const totalDu = ventes.reduce((s, v) => s + (Number(v.montant_ttc) - Number(v.montant_paye || 0)), 0)
  const inp = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { fontSize: 12, fontWeight: 500 as const, color: '#555', display: 'block' as const, marginBottom: 4 }

  if (loading) return <DashboardLayout title="Client" subtitle="Fiche client"><div style={{ textAlign: 'center', padding: '80px', color: '#ccc' }}>Chargement…</div></DashboardLayout>

  return (
    <DashboardLayout title={client?.nom || 'Client'} subtitle="Fiche client détaillée">
      {msg && <div style={{ padding: '10px 16px', borderRadius: 8, background: msg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: msg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      <button onClick={() => router.push('/dashboard/clients')} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#666', marginBottom: 16 }}>← Retour clients</button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total achats', value: `${fmt(client?.total_achats || 0)} XOF`, color: '#1d9e75' },
          { label: 'Commandes', value: client?.nb_commandes || 0, color: '#185FA5' },
          { label: 'Solde dû', value: `${fmt(totalDu)} XOF`, color: totalDu > 0 ? '#D85A30' : '#1d9e75' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 10, padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Informations</h3>
          <button onClick={() => setEditing(!editing)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 12, cursor: 'pointer' }}>{editing ? '✕ Annuler' : '✏ Modifier'}</button>
        </div>
        {editing ? (
          <form onSubmit={save}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              <div><label style={lbl}>Nom *</label><input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Téléphone</label><input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Adresse</label><input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} style={inp} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button type="submit" style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>💾 Sauvegarder</button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[{ label: 'Nom', value: client?.nom }, { label: 'Téléphone', value: client?.telephone || '—' }, { label: 'Email', value: client?.email || '—' }, { label: 'Adresse', value: client?.adresse || '—' }].map(f => (
              <div key={f.label}><div style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>{f.label}</div><div style={{ fontSize: 13, fontWeight: 500 }}>{f.value}</div></div>
            ))}
          </div>
        )}
      </div>

      {totalDu > 0 && (
        <div style={{ background: '#faece7', border: '1px solid #f5c6a0', borderRadius: 10, padding: '14px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontSize: 14, fontWeight: 700, color: '#D85A30' }}>⚠ Solde impayé</div><div style={{ fontSize: 12, color: '#a05020' }}>Ce client a des factures en attente</div></div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#D85A30' }}>{fmt(totalDu)} XOF</div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f7f7f7', display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Historique des achats</h3>
          <span style={{ fontSize: 12, color: '#aaa' }}>{ventes.length} transaction(s)</span>
        </div>
        {ventes.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#ccc' }}><div style={{ fontSize: 36 }}>◌</div><p>Aucune transaction</p></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#fafafa' }}>
              {['N° Facture', 'Date', 'Montant', 'Payé', 'Reste dû', 'Statut'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#999', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {ventes.map(v => {
                const reste = Number(v.montant_ttc) - Number(v.montant_paye || 0)
                const s = STATUT[v.statut] || STATUT.brouillon
                return (
                  <tr key={v.id} style={{ borderTop: '1px solid #f7f7f7' }}>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600 }}>{v.numero}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#888' }}>{fmtDate(v.date_vente)}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700 }}>{fmt(v.montant_ttc)} XOF</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#1d9e75' }}>{fmt(v.montant_paye || 0)} XOF</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: reste > 0 ? '#D85A30' : '#1d9e75' }}>{reste > 0 ? `${fmt(reste)} XOF` : '✓'}</td>
                    <td style={{ padding: '11px 14px' }}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span></td>
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