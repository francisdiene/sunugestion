'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect } from 'react'

interface Stock { id: string; produit_nom: string; depot_nom: string; quantite: number; seuil_alerte: number; unite: string; prix_vente: number; prix_achat: number }
interface Mouvement { produit_nom: string; depot_nom: string; type: string; quantite: number; reference_doc: string; created_at: string }

export default function StockPage() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [mouvements, setMouvements] = useState<Mouvement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stock')
      .then(r => r.json())
      .then(d => {
        if (d.data) setStocks(d.data)
        if (d.mouvements) setMouvements(d.mouvements)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const alertes = stocks.filter(s => Number(s.quantite) <= Number(s.seuil_alerte) && Number(s.seuil_alerte) > 0)

  return (
    <DashboardLayout title="Stock" subtitle="État des stocks et mouvements">

      {alertes.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>⚠</span>
          <div style={{ fontSize: 13, color: '#92400e' }}>
            <strong>{alertes.length} produit(s) en alerte</strong> — {alertes.map(a => a.produit_nom).join(', ')}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>

        {/* Tableau stock */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>État du stock</h2>
            <span style={{ fontSize: 12, color: '#aaa' }}>{stocks.length} produit(s)</span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#ccc', fontSize: 13 }}>Chargement…</div>
          ) : stocks.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#ccc' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>◌</div>
              <p style={{ fontSize: 14 }}>Aucun produit en stock</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Ajoutez des produits avec un stock initial</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['Produit', 'Dépôt', 'Quantité', 'Seuil', 'Valeur stock', 'État'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#aaa', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stocks.map((s, i) => {
                  const qte = Number(s.quantite)
                  const seuil = Number(s.seuil_alerte)
                  const pct = seuil > 0 ? Math.min((qte / (seuil * 3)) * 100, 100) : 100
                  const couleur = qte === 0 ? '#e24b4a' : seuil > 0 && qte <= seuil ? '#D85A30' : '#1d9e75'
                  const valeur = qte * Number(s.prix_achat || s.prix_vente || 0)
                  return (
                    <tr key={s.id} style={{ borderTop: '1px solid #f7f7f7' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500 }}>{s.produit_nom}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#888' }}>{s.depot_nom}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: couleur }}>{qte} {s.unite}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#aaa' }}>{seuil || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#666' }}>{valeur > 0 ? valeur.toLocaleString('fr-FR') + ' XOF' : '—'}</td>
                      <td style={{ padding: '12px 16px', minWidth: 100 }}>
                        <div style={{ background: '#f0f0f0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: couleur, borderRadius: 4, transition: 'width .3s' }} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Derniers mouvements */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Derniers mouvements</h2>
          </div>
          <div style={{ padding: '8px 0' }}>
            {mouvements.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#ccc', fontSize: 13 }}>Aucun mouvement</div>
            ) : mouvements.map((m, i) => (
              <div key={i} style={{ padding: '12px 20px', borderBottom: i < mouvements.length - 1 ? '1px solid #f7f7f7' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{m.produit_nom}</div>
                  <div style={{ fontSize: 11, color: '#bbb' }}>{m.reference_doc || m.type} · {new Date(m.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: m.type === 'entree' ? '#1d9e75' : '#D85A30' }}>
                  {m.type === 'entree' ? '+' : '-'}{Number(m.quantite)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
