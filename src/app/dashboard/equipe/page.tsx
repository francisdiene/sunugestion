'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect } from 'react'

interface User { id: string; nom_complet: string; email: string; role: string; telephone: string; is_active: boolean; last_login_at: string }

const ROLES: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  owner:      { label: 'Propriétaire', color: '#0f6e56', bg: '#e8f8f2', desc: 'Accès total' },
  manager:    { label: 'Manager',      color: '#185FA5', bg: '#e6f1fb', desc: 'Gestion complète sauf salaires' },
  comptable:  { label: 'Comptable',    color: '#534AB7', bg: '#eeedfe', desc: 'Comptabilité et dépenses' },
  caissier:   { label: 'Caissier',     color: '#BA7517', bg: '#faeeda', desc: 'Ventes et encaissements' },
  vendeur:    { label: 'Vendeur',      color: '#5F5E5A', bg: '#f1efe8', desc: 'Ventes et stock (lecture)' },
  magasinier: { label: 'Magasinier',   color: '#D85A30', bg: '#faece7', desc: 'Stock et inventaire' },
}

const PERMISSIONS = [
  { module: 'Dashboard & Analytics', owner: true, manager: true, comptable: true, caissier: false, vendeur: false, magasinier: false },
  { module: 'Point de vente', owner: true, manager: true, comptable: false, caissier: true, vendeur: true, magasinier: false },
  { module: 'Ventes & Factures', owner: true, manager: true, comptable: '👁', caissier: true, vendeur: true, magasinier: false },
  { module: 'Clients', owner: true, manager: true, comptable: '👁', caissier: '👁', vendeur: true, magasinier: false },
  { module: 'Produits', owner: true, manager: true, comptable: false, caissier: false, vendeur: '👁', magasinier: '👁' },
  { module: 'Stock & Inventaire', owner: true, manager: true, comptable: false, caissier: false, vendeur: '👁', magasinier: true },
  { module: 'Fournisseurs & Achats', owner: true, manager: true, comptable: '👁', caissier: false, vendeur: false, magasinier: '👁' },
  { module: 'Dépenses', owner: true, manager: true, comptable: true, caissier: false, vendeur: false, magasinier: false },
  { module: 'Employés & Paie', owner: true, manager: false, comptable: false, caissier: false, vendeur: false, magasinier: false },
  { module: 'Équipe', owner: true, manager: true, comptable: false, caissier: false, vendeur: false, magasinier: false },
  { module: 'Paramètres', owner: true, manager: false, comptable: false, caissier: false, vendeur: false, magasinier: false },
]

export default function EquipePage() {
  const [users, setUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<'equipe' | 'permissions'>('equipe')
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [form, setForm] = useState({ nom_complet: '', email: '', password: '', role: 'vendeur', telephone: '' })
  const [editForm, setEditForm] = useState({ role: '', is_active: true })
  const [newPassword, setNewPassword] = useState<Record<string, string>>({})

  function showMsg(m: string) { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  function load() {
    fetch('/api/equipe').then(r => r.json()).then(d => d.data && setUsers(d.data))
  }

  useEffect(() => { load() }, [])

  async function creerMembre(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch('/api/equipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { showMsg(data.error); return }
      showMsg('✓ Membre créé : ' + data.data.nom_complet)
      setShowForm(false)
      setForm({ nom_complet: '', email: '', password: '', role: 'vendeur', telephone: '' })
      load()
    } catch { showMsg('Erreur réseau') }
    finally { setLoading(false) }
  }

  async function modifierMembre(userId: string) {
    try {
      const res = await fetch(`/api/equipe/${userId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
      if (!res.ok) { showMsg('Erreur modification'); return }
      showMsg('✓ Membre mis à jour')
      setEditUser(null)
      load()
    } catch { showMsg('Erreur réseau') }
  }

  async function supprimerMembre(userId: string) {
    try {
      const res = await fetch(`/api/equipe/${userId}`, { method: 'DELETE' })
      if (!res.ok) { showMsg('Erreur suppression'); return }
      showMsg('✓ Membre supprimé')
      setConfirmDelete(null)
      load()
    } catch { showMsg('Erreur réseau') }
  }

  async function reinitPassword(userId: string) {
    const mdp = Math.random().toString(36).slice(2, 10).toUpperCase()
    try {
      const res = await fetch(`/api/equipe/${userId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reset_password: mdp }) })
      if (!res.ok) { showMsg('Erreur réinitialisation'); return }
      setNewPassword(prev => ({ ...prev, [userId]: mdp }))
      showMsg('✓ Mot de passe réinitialisé')
    } catch { showMsg('Erreur réseau') }
  }

  const inp = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { fontSize: 12, fontWeight: 500 as const, color: '#555', display: 'block' as const, marginBottom: 4 }

  return (
    <DashboardLayout title="Équipe" subtitle="Gestion des utilisateurs et accès">
      {msg && <div style={{ padding: '10px 16px', borderRadius: 8, background: msg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: msg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[{ key: 'equipe', label: '👥 Membres' }, { key: 'permissions', label: '🔐 Permissions' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{ padding: '9px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: activeTab === t.key ? '#0a1628' : '#fff', color: activeTab === t.key ? '#fff' : '#666', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>{t.label}</button>
        ))}
      </div>

      {/* ═══ MEMBRES ═══════════════════════════════════════════ */}
      {activeTab === 'equipe' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#666' }}>{users.length} membre(s) · {users.filter(u => u.is_active).length} actif(s)</div>
            <button onClick={() => { setShowForm(!showForm); setEditUser(null) }} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {showForm ? '✕ Fermer' : '+ Ajouter un membre'}
            </button>
          </div>

          {/* Formulaire création */}
          {showForm && (
            <form onSubmit={creerMembre} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#0a1628' }}>Nouveau membre</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Nom complet *</label><input required value={form.nom_complet} onChange={e => setForm({ ...form, nom_complet: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>Email *</label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>Téléphone</label><input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>Mot de passe *</label><input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 caractères" style={inp} /></div>
                <div><label style={lbl}>Rôle</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inp}>
                    {Object.entries(ROLES).filter(([k]) => k !== 'owner').map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              {/* Info rôle */}
              {form.role && ROLES[form.role] && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: ROLES[form.role].bg, borderRadius: 8, fontSize: 12, color: ROLES[form.role].color, fontWeight: 500 }}>
                  ℹ {ROLES[form.role].label} : {ROLES[form.role].desc}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                <button type="submit" disabled={loading} style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{loading ? 'Création...' : 'Créer le compte'}</button>
              </div>
            </form>
          )}

          {/* Modal modifier */}
          {editUser && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div onClick={() => setEditUser(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
              <div style={{ position: 'relative', background: '#fff', borderRadius: 16, padding: 'clamp(16px, 4vw, 24px)', width: 'calc(100% - 24px)', maxWidth: 400, maxHeight: 'calc(100dvh - 24px)', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Modifier {editUser.nom_complet}</h3>
                <div style={{ fontSize: 12, color: '#aaa', marginBottom: 18 }}>{editUser.email}</div>
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>Rôle</label>
                  <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} style={inp}>
                    {Object.entries(ROLES).filter(([k]) => k !== 'owner').map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8f9fa', borderRadius: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Compte actif</span>
                  <div onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })} style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', background: editForm.is_active ? '#1d9e75' : '#ddd', position: 'relative' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: editForm.is_active ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
                {/* Nouveau mot de passe affiché */}
                {newPassword[editUser.id] && (
                  <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
                    <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 4 }}>Nouveau mot de passe temporaire :</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: '#0a1628' }}>{newPassword[editUser.id]}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Communiquez ce mot de passe à l'utilisateur</div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => modifierMembre(editUser.id)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>💾 Sauvegarder</button>
                  <button onClick={() => reinitPassword(editUser.id)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#534AB7' }}>🔑 Réinit. MDP</button>
                  <button onClick={() => { setConfirmDelete(editUser.id); setEditUser(null) }} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#faece7', color: '#D85A30', fontSize: 13, cursor: 'pointer' }}>🗑</button>
                </div>
              </div>
            </div>
          )}

          {/* Modal confirmation suppression */}
          {confirmDelete && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div onClick={() => setConfirmDelete(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
              <div style={{ position: 'relative', background: '#fff', borderRadius: 16, padding: 'clamp(16px, 4vw, 24px)', width: 'calc(100% - 24px)', maxWidth: 360, maxHeight: 'calc(100dvh - 24px)', overflowY: 'auto', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Supprimer ce membre ?</h3>
                <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Cette action est irréversible. Le membre perdra tout accès à la plateforme.</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                  <button onClick={() => supprimerMembre(confirmDelete)} style={{ flex: 1, padding: '12px', borderRadius: 8, border: 'none', background: '#D85A30', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Supprimer</button>
                </div>
              </div>
            </div>
          )}

          {/* Liste membres */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {users.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 12, padding: '60px', textAlign: 'center', color: '#ccc' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>◌</div>
                <p>Aucun membre</p>
              </div>
            ) : users.map(u => {
              const r = ROLES[u.role] || ROLES.vendeur
              return (
                <div key={u.id} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: r.color, flexShrink: 0 }}>
                    {u.nom_complet[0]}
                  </div>
                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{u.nom_complet}</div>
                    <div style={{ fontSize: 12, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                    {u.telephone && <div style={{ fontSize: 11, color: '#bbb' }}>{u.telephone}</div>}
                  </div>
                  {/* Badges */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: r.bg, color: r.color }}>{r.label}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, background: u.is_active ? '#e8f8f2' : '#f1efe8', color: u.is_active ? '#0f6e56' : '#888' }}>
                      {u.is_active ? 'Actif' : 'Inactif'}
                    </span>
                    {u.last_login_at && <span style={{ fontSize: 10, color: '#ccc' }}>Connecté le {new Date(u.last_login_at).toLocaleDateString('fr-FR')}</span>}
                  </div>
                  {/* Bouton modifier */}
                  {u.role !== 'owner' && (
                    <button onClick={() => { setEditUser(u); setEditForm({ role: u.role, is_active: u.is_active }); setShowForm(false) }}
                      style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#555', flexShrink: 0 }}>
                      ✏ Modifier
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ═══ PERMISSIONS ════════════════════════════════════════ */}
      {activeTab === 'permissions' && (
        <div>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
            ✓ = Accès complet &nbsp;·&nbsp; 👁 = Lecture seule &nbsp;·&nbsp; — = Aucun accès
          </p>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ background: '#0a1628' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase' }}>Module</th>
                  {Object.entries(ROLES).map(([k, v]) => (
                    <th key={k} style={{ padding: '12px 8px', textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', minWidth: 70 }}>
                      <div style={{ padding: '2px 6px', borderRadius: 10, background: v.bg, color: v.color, display: 'inline-block', marginBottom: 2 }}>{v.label.slice(0, 6)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((p, i) => (
                  <tr key={p.module} style={{ borderTop: '1px solid #f7f7f7', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500, color: '#333' }}>{p.module}</td>
                    {['owner', 'manager', 'comptable', 'caissier', 'vendeur', 'magasinier'].map(role => {
                      const val = (p as any)[role]
                      return (
                        <td key={role} style={{ padding: '11px 8px', textAlign: 'center' }}>
                          {val === true ? <span style={{ color: '#1d9e75', fontSize: 16 }}>✓</span>
                            : val === '👁' ? <span style={{ fontSize: 14 }}>👁</span>
                            : <span style={{ color: '#ddd', fontSize: 14 }}>—</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
