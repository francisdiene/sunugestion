'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Produit { id: string; nom: string; prix_vente: number; stock_total: number; image_url: string; code_barre: string }
interface Ligne { produit: Produit; quantite: number }

export default function POSPage() {
  const router = useRouter()
  const [produits, setProduits] = useState<Produit[]>([])
  const [search, setSearch] = useState('')
  const [panier, setPanier] = useState<Ligne[]>([])
  const [modePaiement, setModePaiement] = useState('cash')
  const [montantRecu, setMontantRecu] = useState('')
  const [montantCredit, setMontantCredit] = useState('')
  const [clientId, setClientId] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/produits').then(r => r.json()).then(d => d.data && setProduits(d.data))
    fetch('/api/clients').then(r => r.json()).then(d => d.data && setClients(d.data))
    searchRef.current?.focus()
  }, [])

  const produitsFiltres = produits.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    (p.code_barre || '').includes(search)
  )

  function ajouterAuPanier(p: Produit) {
    if (Number(p.stock_total) <= 0) return
    setPanier(prev => {
      const exist = prev.find(l => l.produit.id === p.id)
      if (exist) return prev.map(l => l.produit.id === p.id ? { ...l, quantite: l.quantite + 1 } : l)
      return [...prev, { produit: p, quantite: 1 }]
    })
    setSearch('')
    searchRef.current?.focus()
  }

  function modifierQte(id: string, delta: number) {
    setPanier(prev => prev.map(l => l.produit.id === id ? { ...l, quantite: Math.max(1, l.quantite + delta) } : l))
  }

  function retirerDuPanier(id: string) {
    setPanier(prev => prev.filter(l => l.produit.id !== id))
  }

  const total = panier.reduce((s, l) => s + l.produit.prix_vente * l.quantite, 0)
  const monnaie = montantRecu ? Math.max(0, parseFloat(montantRecu) - total) : 0
  const resteCredit = montantCredit ? Math.max(0, total - parseFloat(montantCredit)) : total

  async function encaisser() {
    if (panier.length === 0) return
    setLoading(true); setMsg('')
    try {
      const montantPaye = modePaiement === 'credit' ? (parseFloat(montantCredit) || 0) : total
      const res = await fetch('/api/ventes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId || null,
          type: 'ticket_caisse',
          mode_paiement: modePaiement,
          statut: 'paye',
          montant_paye: montantPaye,
          date_vente: new Date().toISOString().split('T')[0],
          lignes: panier.map((l, i) => ({
            produit_id: l.produit.id,
            designation: l.produit.nom,
            quantite: l.quantite,
            prix_unitaire: l.produit.prix_vente,
            remise_pct: 0,
            tva_taux: 18,
            ordre: i,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error || 'Erreur'); return }
      setMsg(`✓ ${data.data?.numero || 'Vente enregistrée'} — ${total.toLocaleString('fr-FR')} XOF`)
      setPanier([]); setMontantRecu(''); setMontantCredit(''); setClientId('')
      setTimeout(() => setMsg(''), 4000)
    } catch { setMsg('Erreur réseau') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'Arial, sans-serif', flexDirection: 'row' }}>
      {/* Zone produits */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8f9fa', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', background: '#0a1628', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/dashboard')} style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13 }}>← Retour</button>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>⊡ Point de vente</div>
        </div>

        {/* Recherche */}
        <div style={{ padding: '10px 12px', background: '#fff', borderBottom: '1px solid #eee' }}>
          <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher ou scanner un code barre..."
            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '2px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
        </div>

        {/* Grille produits */}
        <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
            {produitsFiltres.map(p => {
              const dispo = Number(p.stock_total) > 0
              const enPanier = panier.find(l => l.produit.id === p.id)
              return (
                <div key={p.id} onClick={() => ajouterAuPanier(p)} style={{
                  background: '#fff', borderRadius: 10, overflow: 'hidden', cursor: dispo ? 'pointer' : 'not-allowed',
                  opacity: dispo ? 1 : 0.5, boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  border: enPanier ? '2px solid #1d9e75' : '2px solid transparent',
                }}>
                  <div style={{ height: 90, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                    {p.image_url ? <img src={p.image_url} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 28, color: '#ddd' }}>▣</div>}
                    {enPanier && <div style={{ position: 'absolute', top: 5, right: 5, background: '#1d9e75', color: '#fff', fontSize: 10, fontWeight: 700, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{enPanier.quantite}</div>}
                    {!dispo && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ background: '#e24b4a', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20 }}>RUPTURE</span></div>}
                  </div>
                  <div style={{ padding: '7px 8px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#1a1a1a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1d9e75' }}>{Number(p.prix_vente).toLocaleString('fr-FR')} XOF</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Zone caisse */}
      <div style={{ width: 300, background: '#fff', borderLeft: '1px solid #eee', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '12px 14px', background: '#0a1628', borderBottom: '1px solid #1a2940' }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>🧾 Caisse</div>
          {msg && <div style={{ fontSize: 11, color: '#5de3b0', marginTop: 4 }}>{msg}</div>}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
          {panier.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#ccc', paddingTop: 40 }}>
              <div style={{ fontSize: 36 }}>🛒</div>
              <p style={{ fontSize: 12 }}>Cliquez sur un produit</p>
            </div>
          ) : panier.map(l => (
            <div key={l.produit.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 0', borderBottom: '1px solid #f5f5f5' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.produit.nom}</div>
                <div style={{ fontSize: 10, color: '#aaa' }}>{l.produit.prix_vente.toLocaleString('fr-FR')} × {l.quantite}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <button onClick={() => modifierQte(l.produit.id, -1)} style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ fontSize: 13, fontWeight: 600, minWidth: 16, textAlign: 'center' }}>{l.quantite}</span>
                <button onClick={() => modifierQte(l.produit.id, 1)} style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1d9e75', minWidth: 60, textAlign: 'right', flexShrink: 0 }}>{(l.produit.prix_vente * l.quantite).toLocaleString('fr-FR')}</div>
              <button onClick={() => retirerDuPanier(l.produit.id)} style={{ border: 'none', background: 'none', color: '#D85A30', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>

        <div style={{ padding: 12, borderTop: '2px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#1d9e75' }}>{total.toLocaleString('fr-FR')} XOF</span>
          </div>

          <select value={clientId} onChange={e => setClientId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 12, marginBottom: 8, outline: 'none', boxSizing: 'border-box' as const }}>
            <option value="">Client comptoir</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
            {[{ key: 'cash', label: '💵 Cash' }, { key: 'wave', label: '📱 Wave' }, { key: 'orange_money', label: '🔶 OM' }, { key: 'credit', label: '📋 Crédit' }, { key: 'virement', label: '🏦 Virement' }, { key: 'cheque', label: '📄 Chèque' }].map(m => (
              <button key={m.key} onClick={() => setModePaiement(m.key)} style={{ padding: '7px 2px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 500, background: modePaiement === m.key ? '#0a1628' : '#f5f5f5', color: modePaiement === m.key ? '#fff' : '#666' }}>{m.label}</button>
            ))}
          </div>

          {modePaiement === 'cash' && (
            <div style={{ marginBottom: 8 }}>
              <input type="number" placeholder="Montant reçu" value={montantRecu} onChange={e => setMontantRecu(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
              {montantRecu && parseFloat(montantRecu) >= total && (
                <div style={{ marginTop: 6, padding: '7px 10px', background: '#e8f8f2', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#0f6e56' }}>Monnaie : {monnaie.toLocaleString('fr-FR')} XOF</div>
              )}
            </div>
          )}

          {modePaiement === 'credit' && (
            <div style={{ marginBottom: 8 }}>
              <input type="number" placeholder="Montant versé" value={montantCredit} onChange={e => setMontantCredit(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, marginBottom: 6 }} />
              {montantCredit && <div style={{ padding: '7px 10px', background: '#faece7', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#D85A30' }}>Reste dû : {resteCredit.toLocaleString('fr-FR')} XOF</div>}
            </div>
          )}

          <button onClick={encaisser} disabled={loading || panier.length === 0} style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: panier.length === 0 ? '#ddd' : '#1d9e75', color: '#fff', fontSize: 14, fontWeight: 800, cursor: panier.length === 0 ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Enregistrement…' : `✓ ENCAISSER — ${total.toLocaleString('fr-FR')} XOF`}
          </button>
          {panier.length > 0 && <button onClick={() => setPanier([])} style={{ width: '100%', marginTop: 6, padding: '9px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#888' }}>🗑 Vider</button>}
        </div>
      </div>
    </div>
  )
}
