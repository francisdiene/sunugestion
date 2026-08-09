'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect } from 'react'

interface Produit { id: string; nom: string; code_barre: string; unite: string; stock_total: number; prix_achat: number }

export default function InventairePage() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [comptages, setComptages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/produits').then(r => r.json()).then(d => {
      if (d.data) {
        setProduits(d.data)
        const init: Record<string, string> = {}
        d.data.forEach((p: Produit) => { init[p.id] = '' })
        setComptages(init)
      }
    })
  }, [])

  const produitsFiltres = produits.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    (p.code_barre || '').includes(search)
  )

  const valeurTheorique = produits.reduce((s, p) => s + Number(p.stock_total || 0) * Number(p.prix_achat || 0), 0)
  const valeurReelle = produits.reduce((s, p) => {
    const c = parseFloat(comptages[p.id] || '')
    return s + (isNaN(c) ? Number(p.stock_total || 0) : c) * Number(p.prix_achat || 0)
  }, 0)
  const nbAjustements = Object.entries(comptages).filter(([id, v]) => {
    if (v === '') return false
    const p = produits.find(x => x.id === id)
    return p && parseFloat(v) !== Number(p.stock_total)
  }).length

  async function validerInventaire() {
    const ajustements = Object.entries(comptages)
      .filter(([id, v]) => {
        if (v === '') return false
        const p = produits.find(x => x.id === id)
        return p && parseFloat(v) !== Number(p.stock_total)
      })
      .map(([id, v]) => ({ produit_id: id, quantite_reelle: parseFloat(v) }))
    if (ajustements.length === 0) { setMsg('Aucun ajustement'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/stock/ajustement', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ajustements }) })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error); return }
      setMsg(`✓ ${ajustements.length} ajustement(s) effectué(s)`)
      const init: Record<string, string> = {}
      produits.forEach(p => { init[p.id] = '' })
      setComptages(init)
    } catch { setMsg('Erreur réseau') }
    finally { setLoading(false) }
  }

  const inp = { padding: '7px 10px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const }

  return (
    <DashboardLayout title="Inventaire" subtitle="Comptage physique et ajustement du stock">
      {msg && <div style={{ padding: '10px 16px', borderRadius: 8, background: msg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: msg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: '3px solid #185FA5' }}>
          <div style={{ fontSize: 11, color: '#aaa' }}>Valeur stock théorique</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#185FA5' }}>{valeurTheorique.toLocaleString('fr-FR')} XOF</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: '3px solid #1d9e75' }}>
          <div style={{ fontSize: 11, color: '#aaa' }}>Valeur stock réel</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1d9e75' }}>{valeurReelle.toLocaleString('fr-FR')} XOF</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
        <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, maxWidth: 260 }} />
        {nbAjustements > 0 && (
          <button onClick={validerInventaire} disabled={loading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {loading ? 'Validation...' : `✓ Valider (${nbAjustements} ajust.)`}
          </button>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              {['Produit', 'Théorique', 'Compté', 'Écart'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#999', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {produitsFiltres.map(p => {
              const compte = comptages[p.id]
              const compteNum = compte !== '' ? parseFloat(compte) : null
              const ecart = compteNum !== null ? compteNum - Number(p.stock_total) : null
              const hasEcart = ecart !== null && ecart !== 0
              return (
                <tr key={p.id} style={{ borderTop: '1px solid #f7f7f7', background: hasEcart ? (ecart! > 0 ? '#f0fdf4' : '#fef2f2') : '#fff' }}>
                  <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600 }}>{p.nom}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#185FA5' }}>{Number(p.stock_total)}</td>
                  <td style={{ padding: '10px 12px', width: 100 }}>
                    <input type="number" min="0" value={comptages[p.id] || ''} onChange={e => setComptages(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder={String(Number(p.stock_total))}
                      style={{ ...inp, borderColor: hasEcart ? (ecart! > 0 ? '#1d9e75' : '#D85A30') : '#e0e0e0' }} />
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: ecart === null ? '#ccc' : ecart > 0 ? '#1d9e75' : ecart < 0 ? '#D85A30' : '#1d9e75' }}>
                    {ecart === null ? '—' : ecart > 0 ? `+${ecart}` : String(ecart)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
