'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect } from 'react'

interface Tenant { id: string; nom: string; slug: string; plan: string; telephone: string; email: string; adresse: string; ninea: string; rccm: string; devise: string; nb_users: number; nb_produits: number }

const PLANS: Record<string, { label: string; color: string; bg: string }> = {
  starter:  { label: 'Starter',  color: '#888',    bg: '#f1efe8' },
  pro:      { label: 'Pro',      color: '#1d9e75', bg: '#e8f8f2' },
  business: { label: 'Business', color: '#534AB7', bg: '#eeedfe' },
}

export default function ParametresPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', adresse: '', ninea: '', rccm: '', devise: 'XOF' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [activeTab, setActiveTab] = useState<'boutique' | 'compte' | 'abonnement'>('boutique')

  useEffect(() => {
    fetch('/api/tenants')
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setTenant(d.data)
          setForm({
            nom: d.data.nom || '',
            telephone: d.data.telephone || '',
            email: d.data.email || '',
            adresse: d.data.adresse || '',
            ninea: d.data.ninea || '',
            rccm: d.data.rccm || '',
            devise: d.data.devise || 'XOF',
          })
        }
      })
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg('')
    try {
      const res = await fetch('/api/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error); return }
      setMsg('✓ Paramètres sauvegardés')
      setTenant({ ...tenant!, ...data.data })
    } catch { setMsg('Erreur réseau') }
    finally { setLoading(false) }
  }

  const inp = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { fontSize: 13, fontWeight: 500 as const, color: '#444', display: 'block' as const, marginBottom: 6 }
  const tabs = [
    { key: 'boutique', label: 'Ma boutique' },
    { key: 'compte', label: 'Mon compte' },
    { key: 'abonnement', label: 'Abonnement' },
  ] as const

  return (
    <DashboardLayout title="Paramètres" subtitle="Configuration de votre boutique">
      {msg && <div style={{ padding: '10px 16px', borderRadius: 8, background: msg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: msg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#fff', padding: 6, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '8px 20px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: activeTab === t.key ? '#0a1628' : 'transparent',
            color: activeTab === t.key ? '#fff' : '#666',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab Boutique */}
      {activeTab === 'boutique' && (
        <form onSubmit={save}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Infos principales */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 20px' }}>Informations générales</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={lbl}>Nom de la boutique *</label>
                  <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Téléphone</label>
                  <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="+221 77 000 00 00" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Adresse</label>
                  <input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} placeholder="Ex: Dakar, Plateau" style={inp} />
                </div>
              </div>
            </div>

            {/* Infos légales */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 20px' }}>Informations légales</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={lbl}>NINEA</label>
                  <input value={form.ninea} onChange={e => setForm({ ...form, ninea: e.target.value })} placeholder="Numéro d'identification fiscale" style={inp} />
                </div>
                <div>
                  <label style={lbl}>RCCM</label>
                  <input value={form.rccm} onChange={e => setForm({ ...form, rccm: e.target.value })} placeholder="Registre du commerce" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Devise</label>
                  <select value={form.devise} onChange={e => setForm({ ...form, devise: e.target.value })} style={inp}>
                    <option value="XOF">XOF — Franc CFA (UEMOA)</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="USD">USD — Dollar américain</option>
                  </select>
                </div>

                {/* Slug (lecture seule) */}
                <div>
                  <label style={lbl}>URL de votre boutique</label>
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fafafa', border: '1px solid #e8e8e8', fontSize: 13, color: '#888', fontFamily: 'monospace' }}>
                    sunugestion.sn/{tenant?.slug || '…'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 20 }}>
            {[
              { label: 'Plan actif', value: PLANS[tenant?.plan || 'starter']?.label || '—', color: PLANS[tenant?.plan || 'starter']?.color, bg: PLANS[tenant?.plan || 'starter']?.bg },
              { label: 'Utilisateurs', value: tenant?.nb_users || 0, color: '#185FA5', bg: '#e6f1fb' },
              { label: 'Produits', value: tenant?.nb_produits || 0, color: '#534AB7', bg: '#eeedfe' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#666' }}>{s.label}</span>
                <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, background: s.bg, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="submit" disabled={loading} style={{ padding: '11px 28px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {loading ? 'Sauvegarde...' : '💾 Sauvegarder'}
            </button>
          </div>
        </form>
      )}

      {/* Tab Compte */}
      {activeTab === 'compte' && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', maxWidth: 500 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 20px' }}>Changer le mot de passe</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><label style={lbl}>Ancien mot de passe</label><input type="password" style={inp} /></div>
            <div><label style={lbl}>Nouveau mot de passe</label><input type="password" style={inp} /></div>
            <div><label style={lbl}>Confirmer</label><input type="password" style={inp} /></div>
            <button style={{ padding: '11px', borderRadius: 8, border: 'none', background: '#0a1628', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Mettre à jour</button>
          </div>
        </div>
      )}

      {/* Tab Abonnement */}
      {activeTab === 'abonnement' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            { key: 'starter', label: 'Starter', prix: '5 000 XOF/mois', features: ['1 utilisateur', 'Ventes & Stock', 'Facturation PDF', 'Support email'] },
            { key: 'pro', label: 'Pro', prix: '15 000 XOF/mois', features: ['10 utilisateurs', 'Tous les modules', 'Comptabilité SYSCOHADA', 'Analytics avancés', 'Support prioritaire'] },
            { key: 'business', label: 'Business', prix: '35 000 XOF/mois', features: ['Utilisateurs illimités', 'Multi-boutiques', 'API access', 'Export DGI', 'Support dédié'] },
          ].map(p => {
            const actif = tenant?.plan === p.key
            return (
              <div key={p.key} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: actif ? '2px solid #1d9e75' : '2px solid transparent', position: 'relative' }}>
                {actif && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#1d9e75', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>PLAN ACTUEL</div>}
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: actif ? '#1d9e75' : '#1a1a1a' }}>{p.label}</h3>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#666', margin: '0 0 20px' }}>{p.prix}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
                  {p.features.map(f => (
                    <li key={f} style={{ fontSize: 13, color: '#555', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#1d9e75', fontWeight: 700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button style={{ width: '100%', padding: '10px', borderRadius: 8, border: actif ? '2px solid #1d9e75' : '1px solid #e0e0e0', background: actif ? '#e8f8f2' : '#fff', color: actif ? '#0f6e56' : '#666', fontSize: 13, fontWeight: 600, cursor: actif ? 'default' : 'pointer' }}>
                  {actif ? 'Plan actuel' : 'Changer de plan'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
