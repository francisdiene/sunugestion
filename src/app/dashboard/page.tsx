'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useEffect, useState, useCallback } from 'react'

const modules = [
  { label: 'Nouvelle vente', href: '/dashboard/ventes', color: '#1d9e75', icon: '◎' },
  { label: 'Ajouter produit', href: '/dashboard/produits', color: '#534AB7', icon: '▣' },
  { label: 'Voir le stock', href: '/dashboard/stock', color: '#D85A30', icon: '▤' },
  { label: 'Nouveau client', href: '/dashboard/clients', color: '#185FA5', icon: '◉' },
  { label: 'Saisir dépense', href: '/dashboard/depenses', color: '#BA7517', icon: '◒' },
  { label: 'Comptabilité', href: '/dashboard/comptabilite', color: '#444', icon: '≡' },
]

interface Kpis {
  ca_total: number
  nb_ventes: number
  nb_clients: number
  ruptures_stock: number
  total_depenses: number
  benefice_brut: number
}

interface VenteRecente {
  numero: string
  client_nom: string
  montant_ttc: number
  date_vente: string
  statut: string
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [ventes, setVentes] = useState<VenteRecente[]>([])
  const [periode, setPeriode] = useState('mois')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const loadData = useCallback(() => {
    fetch(`/api/analytics/dashboard?periode=${periode}`)
      .then(r => r.json())
      .then(d => {
        if (d.kpis) setKpis(d.kpis)
        if (d.ventes_par_jour) setVentes(d.ventes_par_jour)
        setLastUpdate(new Date())
      })
      .catch(() => {})
  }, [periode])

  useEffect(() => {
    loadData()
    // Rafraîchissement automatique toutes les 30 secondes
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  // Rafraîchir aussi quand l'onglet redevient visible
  useEffect(() => {
    const onFocus = () => loadData()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [loadData])

  const fmt = (n: number) => n.toLocaleString('fr-FR') + ' XOF'

  const cards = [
    { label: "Chiffre d'affaires", value: kpis ? fmt(kpis.ca_total) : '…', sub: `${kpis?.nb_ventes ?? 0} vente(s)`, color: '#1d9e75', bg: '#e8f8f2', icon: '◎' },
    { label: 'Clients actifs', value: kpis ? String(kpis.nb_clients) : '…', sub: 'ce mois', color: '#534AB7', bg: '#eeedfe', icon: '◈' },
    { label: 'Alertes stock', value: kpis ? String(kpis.ruptures_stock) : '…', sub: 'produits en rupture', color: '#D85A30', bg: '#faece7', icon: '▤' },
    { label: 'Bénéfice brut', value: kpis ? fmt(kpis.benefice_brut) : '…', sub: 'CA - Dépenses', color: '#185FA5', bg: '#e6f1fb', icon: '◉' },
  ]

  return (
    <DashboardLayout title="Tableau de bord" subtitle={today}>

      {/* Filtre période + refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { key: 'jour', label: "Aujourd'hui" },
            { key: 'semaine', label: 'Semaine' },
            { key: 'mois', label: 'Mois' },
            { key: 'annee', label: 'Année' },
          ].map(p => (
            <button key={p.key} onClick={() => setPeriode(p.key)} style={{
              padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12,
              background: periode === p.key ? '#0a1628' : '#fff',
              color: periode === p.key ? '#fff' : '#666',
              boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
            }}>{p.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: '#bbb' }}>
            Mis à jour : {lastUpdate?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button onClick={loadData} style={{
            padding: '7px 14px', borderRadius: 7, border: '1px solid #e0e0e0',
            background: '#fff', fontSize: 12, cursor: 'pointer', color: '#666',
          }}>↻ Actualiser</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {cards.map(k => (
          <div key={k.label} style={{
            background: '#fff', borderRadius: 12, padding: '20px 24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            borderTop: `3px solid ${k.color}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p style={{ fontSize: 12, color: '#999', margin: '0 0 10px' }}>{k.label}</p>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: k.color }}>{k.icon}</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: k.color, margin: '0 0 4px' }}>{k.value}</p>
            <p style={{ fontSize: 11, color: '#bbb', margin: 0 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Accès rapide */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px' }}>Accès rapide</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {modules.map(m => (
              <a key={m.label} href={m.href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', borderRadius: 8,
                background: '#fafafa', border: '1px solid #f0f0f0',
                textDecoration: 'none', color: '#1a1a1a', fontSize: 12, fontWeight: 500,
              }}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: m.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: m.color, flexShrink: 0 }}>{m.icon}</span>
                {m.label}
              </a>
            ))}
          </div>
        </div>

        {/* Résumé financier */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: '0 0 16px' }}>Résumé financier</h2>
          {kpis ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: "Chiffre d'affaires TTC", value: fmt(kpis.ca_total), color: '#1d9e75' },
                { label: 'Total dépenses', value: fmt(kpis.total_depenses), color: '#D85A30' },
                { label: 'Bénéfice brut estimé', value: fmt(kpis.benefice_brut), color: kpis.benefice_brut >= 0 ? '#185FA5' : '#e24b4a' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#fafafa', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: '#666' }}>{r.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: r.color }}>{r.value}</span>
                </div>
              ))}
              <div style={{ padding: '10px 14px', background: kpis.benefice_brut >= 0 ? '#e8f8f2' : '#faece7', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 600, color: kpis.benefice_brut >= 0 ? '#0f6e56' : '#D85A30' }}>
                {kpis.benefice_brut >= 0 ? '✓ Période rentable' : '⚠ Dépenses supérieures au CA'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: '#ddd', fontSize: 13 }}>
              Chargement…
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
