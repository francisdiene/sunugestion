'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface AnalyticsData {
  ca_par_jour: { date: string; ca: number; nb_ventes: number }[]
  top_produits: { nom: string; qte: number; ca: number }[]
  depenses_par_categorie: { categorie: string; total: number }[]
  resume: { ca_total: number; nb_ventes: number; panier_moyen: number; total_depenses: number }
}

const COLORS = ['#1d9e75', '#185FA5', '#534AB7', '#D85A30', '#BA7517', '#0f6e56']

function fmt(n: number) { return Number(n || 0).toLocaleString('fr-FR') }
function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) }
  catch { return d }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [periode, setPeriode] = useState('mois')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?periode=${periode}`)
      .then(r => r.json())
      .then(d => {
        if (d) {
          const depenses = d.depenses_par_categorie || []
          const totalDepenses = depenses.reduce((s: number, c: any) => s + parseFloat(c.total || 0), 0)
          const nbVentes = d.resume_mois?.nb_ventes || 0
          const caMois = parseFloat(d.resume_mois?.ca_mois || 0)

          setData({
            ca_par_jour: (d.ca_par_jour || []).map((j: any) => ({
              date: j.date,
              ca: parseFloat(j.ca || 0),
              nb_ventes: parseInt(j.nb || 0),
            })),
            top_produits: (d.top_produits || []).map((p: any) => ({
              nom: p.nom,
              qte: parseFloat(p.qte || 0),
              ca: parseFloat(p.ca || 0),
            })),
            depenses_par_categorie: depenses.map((c: any) => ({
              categorie: c.categorie || 'Divers',
              total: parseFloat(c.total || 0),
            })),
            resume: {
              ca_total: caMois,
              nb_ventes: nbVentes,
              panier_moyen: nbVentes > 0 ? caMois / nbVentes : 0,
              total_depenses: totalDepenses,
            }
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [periode])

  const PERIODES = [
    { key: 'semaine', label: 'Semaine' },
    { key: 'mois',   label: 'Mois' },
    { key: 'annee',  label: 'Année' },
  ]

  if (loading) return (
    <DashboardLayout title="Analytics" subtitle="Statistiques et performances">
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>◌</div>
        <p>Chargement des données...</p>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Analytics" subtitle="Statistiques et performances">

      {/* Sélecteur période */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {PERIODES.map(p => (
          <button key={p.key} onClick={() => setPeriode(p.key)} style={{
            padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 500,
            background: periode === p.key ? '#0a1628' : '#fff',
            color: periode === p.key ? '#fff' : '#666',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}>{p.label}</button>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Chiffre d\'affaires', value: `${fmt(data?.resume?.ca_total || 0)} XOF`, color: '#1d9e75' },
          { label: 'Nombre de ventes',    value: data?.resume?.nb_ventes || 0,              color: '#185FA5' },
          { label: 'Panier moyen',        value: `${fmt(data?.resume?.panier_moyen || 0)} XOF`, color: '#534AB7' },
          { label: 'Total dépenses',      value: `${fmt(data?.resume?.total_depenses || 0)} XOF`, color: '#D85A30' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 12, padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Graphique CA */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px', color: '#0a1628' }}>Évolution du chiffre d'affaires</h3>
        {data?.ca_par_jour && data.ca_par_jour.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.ca_par_jour}>
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`${fmt(v)} XOF`, 'CA']} labelFormatter={fmtDate} />
              <Line type="monotone" dataKey="ca" stroke="#1d9e75" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#ccc', fontSize: 13 }}>Aucune donnée pour cette période</div>
        )}
      </div>

      {/* Top produits + Dépenses */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16 }}>

        {/* Top produits */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px', color: '#0a1628' }}>Top produits</h3>
          {data?.top_produits && data.top_produits.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.top_produits.slice(0, 5)} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="nom" tick={{ fontSize: 9 }} width={80} />
                  <Tooltip formatter={(v: number) => [`${fmt(v)} XOF`, 'CA']} />
                  <Bar dataKey="ca" fill="#1d9e75" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12 }}>
                {data.top_produits.slice(0, 5).map((p, i) => (
                  <div key={p.nom} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f7f7f7', fontSize: 12 }}>
                    <span style={{ color: '#555' }}>{i + 1}. {p.nom}</span>
                    <span style={{ fontWeight: 700, color: '#1d9e75' }}>{fmt(p.ca)} XOF</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ccc', fontSize: 13 }}>Aucune vente enregistrée</div>
          )}
        </div>

        {/* Dépenses par catégorie */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px', color: '#0a1628' }}>Dépenses par catégorie</h3>
          {data?.depenses_par_categorie && data.depenses_par_categorie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={data.depenses_par_categorie} dataKey="total" nameKey="categorie"
                    cx="50%" cy="50%" outerRadius={70}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {data.depenses_par_categorie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${fmt(v)} XOF`]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12 }}>
                {data.depenses_par_categorie.map((d, i) => (
                  <div key={d.categorie} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f7f7f7', fontSize: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#555' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                      {d.categorie}
                    </span>
                    <span style={{ fontWeight: 700, color: '#D85A30' }}>{fmt(d.total)} XOF</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ccc', fontSize: 13 }}>Aucune dépense enregistrée</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
