'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect } from 'react'

interface User { id: string; nom_complet: string; email: string; role: string; is_active: boolean; last_login_at: string }

const ROLES: Record<string, { label: string; color: string; bg: string }> = {
  owner:     { label: 'Propriétaire', color: '#0f6e56', bg: '#e8f8f2' },
  manager:   { label: 'Manager',      color: '#185FA5', bg: '#e6f1fb' },
  comptable: { label: 'Comptable',    color: '#534AB7', bg: '#eeedfe' },
  caissier:  { label: 'Caissier',     color: '#BA7517', bg: '#faeeda' },
  vendeur:   { label: 'Vendeur',      color: '#5F5E5A', bg: '#f1efe8' },
}

export default function EquipePage() {
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ nom_complet: '', email: '', password: '', role: 'vendeur', telephone: '' })

  function load() {
    fetch('/api/equipe').then(r => r.json()).then(d => d.data && setUsers(d.data))
  }

  useEffect(() => { load() }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg('')
    try {
      const res = await fetch('/api/equipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error); return }
      setMsg('✓ Utilisateur créé : ' + data.data.nom_complet)
      setShowForm(false)
      setForm({ nom_complet: '', email: '', password: '', role: 'vendeur', telephone: '' })
      load()
    } catch { setMsg('Erreur réseau') } finally { setLoading(false) }
  }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { fontSize: 12, fontWeight: 500 as const, color: '#555', display: 'block' as const, marginBottom: 4 }

  return (
    <DashboardLayout title="Équipe" subtitle="Gestion des utilisateurs et accès">
      {msg && <div style={{ padding: '10px 16px', borderRadius: 8, background: msg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: msg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#666' }}>{users.length} membre(s)</div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {showForm ? '✕ Fermer' : '+ Ajouter un membre'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Nouveau membre</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Nom complet *</label><input required value={form.nom_complet} onChange={e => setForm({ ...form, nom_complet: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Rôle</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inp}>
                <option value="manager">Manager</option>
                <option value="comptable">Comptable</option>
                <option value="caissier">Caissier</option>
                <option value="vendeur">Vendeur</option>
              </select>
            </div>
            <div><label style={lbl}>Email *</label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Mot de passe *</label><input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 caractères" style={inp} /></div>
            <div><label style={lbl}>Téléphone</label><input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} style={inp} /></div>
          </div>
          <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', marginTop: 14, fontSize: 12, color: '#92400e' }}>
            ⚠ Le propriétaire voit tout. Les caissiers et vendeurs n'ont accès qu'aux ventes et au stock.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{loading ? 'Création...' : 'Créer le compte'}</button>
          </div>
        </form>
      )}

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {users.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#ccc' }}><div style={{ fontSize: 40, marginBottom: 12 }}>◌</div><p>Aucun membre</p></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#fafafa' }}>{['Membre', 'Email', 'Rôle', 'Statut', 'Dernière connexion'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
            <tbody>
              {users.map((u, i) => {
                const r = ROLES[u.role] || ROLES.vendeur
                return (
                  <tr key={u.id} style={{ borderTop: '1px solid #f7f7f7' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: r.color }}>{u.nom_complet[0]}</div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{u.nom_complet}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#666' }}>{u.email}</td>
                    <td style={{ padding: '13px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: r.bg, color: r.color }}>{r.label}</span></td>
                    <td style={{ padding: '13px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: u.is_active ? '#e8f8f2' : '#f1efe8', color: u.is_active ? '#0f6e56' : '#888' }}>{u.is_active ? 'Actif' : 'Inactif'}</span></td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: '#aaa' }}>{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('fr-FR') : 'Jamais'}</td>
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
