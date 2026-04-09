'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface AnalyticsData {
  ca_par_jour: { date: string; ca: number; nb: number }[]
  ca_par_mois: { mois: string; ca: number; ca_ht: number; nb: number }[]
  top_produits: { nom: string; qte: number; ca: number }[]
  depenses_par_categorie: { categorie: string; total: number }[]
  ventes_par_type: { type: string; nb: number; ca: number }[]
  resume_mois: { ca_mois: number; nb_ventes: number; nb_brouillons: number; nb_clients: number }
}

const COLORS = ['#1d9e75', '#534AB7', '#D85A30', '#185FA5', '#BA7517', '#0f6e56', '#3C3489', '#993C1D']

const MOIS_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Aoû',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
}

function formatMois(m: string) {
  const [, mm] = m.split('-')
  return MOIS_LABELS[mm] || m
}

function formatXOF(v: number) {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M'
  if (v >= 1000) return (v / 1000).toFixed(0) + 'k'
  return v.toString()
}

const TooltipXOF = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0a1628', borderRadius: 8, padding: '10px 14px', border: 'none' }}>
      <p style={{ color: '#aaa', fontSize: 11, margin: '0 0 6px' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, fontSize: 13, fontWeight: 600, margin: '2px 0' }}>
          {p.value?.toLocaleString('fr-FR')} XOF
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <DashboardLayout title="Analytics" subtitle="Analyse des performances">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: '#ccc', fontSize: 14 }}>Chargement des données…</div>
    </DashboardLayout>
  )

  const noData = !data || (data.ca_par_jour.length === 0 && data.ca_par_mois.length === 0)

  return (
    <DashboardLayout title="Analytics" subtitle="Analyse des performances commerciales">

      {/* Résumé du mois */}
      {data?.resume_mois && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'CA ce mois', value: Number(data.resume_mois.ca_mois).toLocaleString('fr-FR') + ' XOF', color: '#1d9e75', bg: '#e8f8f2' },
            { label: 'Ventes validées', value: data.resume_mois.nb_ventes, color: '#534AB7', bg: '#eeedfe' },
            { label: 'Brouillons', value: data.resume_mois.nb_brouillons, color: '#BA7517', bg: '#faeeda' },
            { label: 'Clients distincts', value: data.resume_mois.nb_clients, color: '#185FA5', bg: '#e6f1fb' },
          ].map(k => (
            <div key={k.label} style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `3px solid ${k.color}` }}>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {noData ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: '80px', textAlign: 'center', color: '#ccc', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>◌</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#aaa', margin: '0 0 8px' }}>Aucune donnée disponible</p>
          <p style={{ fontSize: 13 }}>Enregistre des ventes pour voir les graphiques apparaître ici.</p>
        </div>
      ) : (
        <>
          {/* Courbe CA 30 jours */}
          {data!.ca_par_jour.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 20px' }}>Chiffre d'affaires — 30 derniers jours</h2>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data!.ca_par_jour.map(d => ({ ...d, ca: Number(d.ca), date: d.date.slice(5) }))}>
                  <defs>
                    <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d9e75" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1d9e75" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#aaa' }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={formatXOF} tick={{ fontSize: 11, fill: '#aaa' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<TooltipXOF />} />
                  <Area type="monotone" dataKey="ca" stroke="#1d9e75" strokeWidth={2.5} fill="url(#caGrad)" dot={false} activeDot={{ r: 4, fill: '#1d9e75' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* CA par mois */}
            {data!.ca_par_mois.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 20px' }}>CA mensuel (6 mois)</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data!.ca_par_mois.map(d => ({ ...d, ca: Number(d.ca), ca_ht: Number(d.ca_ht), mois: formatMois(d.mois) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#aaa' }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={formatXOF} tick={{ fontSize: 11, fill: '#aaa' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<TooltipXOF />} />
                    <Bar dataKey="ca" fill="#1d9e75" radius={[4, 4, 0, 0]} name="CA TTC" />
                    <Bar dataKey="ca_ht" fill="#9FE1CB" radius={[4, 4, 0, 0]} name="CA HT" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Dépenses par catégorie */}
            {data!.depenses_par_categorie.length > 0 ? (
              <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 20px' }}>Dépenses par catégorie (ce mois)</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={data!.depenses_par_categorie.map(d => ({ ...d, value: Number(d.total) }))} dataKey="value" nameKey="categorie" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                        {data!.depenses_par_categorie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => v.toLocaleString('fr-FR') + ' XOF'} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1 }}>
                    {data!.depenses_par_categorie.slice(0, 5).map((d, i) => (
                      <div key={d.categorie} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#555' }}>{d.categorie}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#D85A30' }}>{Number(d.total).toLocaleString('fr-FR')} XOF</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ddd', fontSize: 13 }}>
                Aucune dépense ce mois
              </div>
            )}
          </div>

          {/* Top produits */}
          {data!.top_produits.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 20px' }}>Top produits — 30 derniers jours</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data!.top_produits.map(d => ({ ...d, ca: Number(d.ca), qte: Number(d.qte) }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatXOF} tick={{ fontSize: 11, fill: '#aaa' }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="nom" tick={{ fontSize: 11, fill: '#555' }} tickLine={false} axisLine={false} width={120} />
                  <Tooltip formatter={(v: any) => v.toLocaleString('fr-FR') + ' XOF'} />
                  <Bar dataKey="ca" fill="#534AB7" radius={[0, 4, 4, 0]} name="CA TTC" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
