'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Stats { nb_tenants: number; nb_pro: number; nb_starter: number; nb_users: number; nb_ventes: number; ca_global: number }
interface Tenant { id: string; nom: string; slug: string; plan: string; email: string; telephone: string; created_at: string; nb_users: number; nb_produits: number; nb_ventes: number; ca_total: number }

const PLANS: Record<string, { label: string; bg: string; color: string }> = {
  starter:  { label: 'Starter',  bg: '#f1efe8', color: '#5F5E5A' },
  pro:      { label: 'Pro',      bg: '#e8f8f2', color: '#0f6e56' },
  business: { label: 'Business', bg: '#eeedfe', color: '#534AB7' },
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [search, setSearch] = useState('')
  const [adminNom, setAdminNom] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then(r => r.json()),
      fetch('/api/admin/tenants').then(r => r.json()),
    ]).then(([s, t]) => {
      if (s.error) { router.push('/auth/admin'); return }
      if (s.data) setStats(s.data)
      if (t.data) setTenants(t.data)
      setLoading(false)
    }).catch(() => router.push('/auth/admin'))
  }, [])

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/auth/admin')
  }

  async function toggleTenant(id: string, actif: boolean) {
    await fetch('/api/admin/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: id, action: actif ? 'suspendre' : 'activer' }),
    })
    const res = await fetch('/api/admin/tenants').then(r => r.json())
    if (res.data) setTenants(res.data)
  }

  const tenantsFiltres = tenants.filter(t =>
    t.nom.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Arial' }}>
      Chargement du panneau admin…
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0a1628', padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#1d9e75,#0f6e56)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>S</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>SunuGestion — Admin</div>
            <div style={{ color: '#5de3b0', fontSize: 10 }}>Francis Tech · Panneau superadmin</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/auth/login" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textDecoration: 'none' }}>← Vue boutique</a>
          <button onClick={logout} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
            ⏻ Déconnexion
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0a1628', marginBottom: 20 }}>
          Tableau de bord — {tenants.length} boutique(s) cliente(s)
        </h2>

        {/* KPIs */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Boutiques', value: stats.nb_tenants, color: '#0a1628', bg: '#e8ecf2' },
              { label: 'Plan Pro', value: stats.nb_pro, color: '#0f6e56', bg: '#e8f8f2' },
              { label: 'Plan Starter', value: stats.nb_starter, color: '#5F5E5A', bg: '#f1efe8' },
              { label: 'Utilisateurs', value: stats.nb_users, color: '#185FA5', bg: '#e6f1fb' },
              { label: 'CA Global', value: `${Number(stats.ca_global).toLocaleString('fr-FR')} XOF`, color: '#1d9e75', bg: '#e8f8f2' },
            ].map(k => (
              <div key={k.label} style={{ background: '#fff', borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: `3px solid ${k.color}` }}>
                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Recherche */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
          <input placeholder="🔍 Rechercher une boutique..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13, outline: 'none', width: 300 }} />
          <div style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center' }}>
            {tenantsFiltres.length} boutique(s)
          </div>
        </div>

        {/* Table tenants */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a1628' }}>
                {['Boutique', 'Plan', 'Email', 'Utilisateurs', 'Produits', 'Ventes', 'CA Total', 'Date création', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenantsFiltres.map((t, i) => {
                const plan = PLANS[t.plan] || PLANS.starter
                return (
                  <tr key={t.id} style={{ borderTop: '1px solid #f7f7f7', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0a1628' }}>{t.nom}</div>
                      <div style={{ fontSize: 10, color: '#aaa', fontFamily: 'monospace' }}>{t.slug}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: plan.bg, color: plan.color }}>{plan.label}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#666' }}>{t.email || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#185FA5', textAlign: 'center' }}>{t.nb_users}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#534AB7', textAlign: 'center' }}>{t.nb_produits}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#1d9e75', textAlign: 'center' }}>{t.nb_ventes}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#0f6e56' }}>{Number(t.ca_total).toLocaleString('fr-FR')} XOF</td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: '#aaa' }}>{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <a href={`/catalogue/${t.slug}`} target="_blank" rel="noreferrer"
                          style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', fontSize: 11, cursor: 'pointer', color: '#185FA5', textDecoration: 'none' }}>
                          Catalogue
                        </a>
                        <button
                          onClick={() => toggleTenant(t.id, true)}
                          style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#faece7', color: '#D85A30', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                          Suspendre
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {tenantsFiltres.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center', color: '#ccc' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>◌</div>
              <p>Aucune boutique trouvée</p>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#ccc' }}>
          SunuGestion Admin · Francis Tech · Dakar, Sénégal
        </div>
      </div>
    </div>
  )
}
