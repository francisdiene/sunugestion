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
  const [showCaisse, setShowCaisse] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/produits').then(r => r.json()).then(d => d.data && setProduits(d.data))
    fetch('/api/clients').then(r => r.json()).then(d => d.data && setClients(d.data))
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
  }

  function modifierQte(id: string, delta: number) {
    setPanier(prev => prev.map(l => l.produit.id === id ? { ...l, quantite: Math.max(1, l.quantite + delta) } : l))
  }

  function retirerDuPanier(id: string) {
    setPanier(prev => prev.filter(l => l.produit.id !== id))
  }

  const total = panier.reduce((s, l) => s + l.produit.prix_vente * l.quantite, 0)
  const nbArticles = panier.reduce((s, l) => s + l.quantite, 0)
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
            produit_id: l.produit.id, designation: l.produit.nom,
            quantite: l.quantite, prix_unitaire: l.produit.prix_vente,
            remise_pct: 0, tva_taux: 18, ordre: i,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error || 'Erreur'); return }
      setMsg(`✓ ${data.data?.numero || 'Vente enregistrée'} — ${total.toLocaleString('fr-FR')} XOF`)
      setPanier([]); setMontantRecu(''); setMontantCredit(''); setClientId(''); setShowCaisse(false)
      setTimeout(() => setMsg(''), 4000)
    } catch { setMsg('Erreur réseau') }
    finally { setLoading(false) }
  }

  const btn = (bg: string, color = '#fff') => ({
    border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color,
    background: bg, padding: '12px', fontSize: 14,
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#0a1628', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/dashboard')} style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13 }}>← Retour</button>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Point de vente</div>
        </div>
        {nbArticles > 0 && (
          <button onClick={() => setShowCaisse(true)} style={{ background: '#1d9e75', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            🛒 {nbArticles} — {total.toLocaleString('fr-FR')} XOF
          </button>
        )}
      </div>

      {/* Message succès */}
      {msg && (
        <div style={{ padding: '12px 16px', background: msg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: msg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
          {msg}
        </div>
      )}

      {/* Recherche */}
      <div style={{ padding: '12px 14px', background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 56, zIndex: 30 }}>
        <input
          ref={searchRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher un produit..."
          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }}
        />
      </div>

      {/* Grille produits */}
      <div style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {produitsFiltres.map(p => {
            const dispo = Number(p.stock_total) > 0
            const enPanier = panier.find(l => l.produit.id === p.id)
            return (
              <div key={p.id} onClick={() => ajouterAuPanier(p)} style={{
                background: '#fff', borderRadius: 12, overflow: 'hidden',
                cursor: dispo ? 'pointer' : 'not-allowed', opacity: dispo ? 1 : 0.5,
                boxShadow: enPanier ? '0 0 0 2px #1d9e75' : '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'box-shadow 0.15s',
              }}>
                {/* Image */}
                <div style={{ height: 120, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ fontSize: 36, color: '#ddd' }}>▣</div>
                  }
                  {enPanier && (
                    <div style={{ position: 'absolute', top: 8, right: 8, background: '#1d9e75', color: '#fff', fontSize: 12, fontWeight: 800, width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {enPanier.quantite}
                    </div>
                  )}
                  {!dispo && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ background: '#e24b4a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>RUPTURE</span>
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 4, lineHeight: 1.3 }}>{p.nom}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1d9e75' }}>{Number(p.prix_vente).toLocaleString('fr-FR')} XOF</div>
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>Stock : {Number(p.stock_total)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bouton caisse flottant */}
      {nbArticles > 0 && !showCaisse && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
          <button onClick={() => setShowCaisse(true)} style={{ background: '#1d9e75', border: 'none', color: '#fff', borderRadius: 50, padding: '16px 32px', cursor: 'pointer', fontSize: 16, fontWeight: 800, boxShadow: '0 6px 24px rgba(29,158,117,0.4)', whiteSpace: 'nowrap' }}>
            🛒 {nbArticles} article(s) — {total.toLocaleString('fr-FR')} XOF
          </button>
        </div>
      )}

      {/* Modal caisse */}
      {showCaisse && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {/* Overlay */}
          <div onClick={() => setShowCaisse(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />

          {/* Panel caisse */}
          <div style={{ position: 'relative', background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 16px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -8px 32px rgba(0,0,0,0.15)' }}>
            {/* Poignée */}
            <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 16px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>🧾 Récapitulatif</h3>
              <button onClick={() => setShowCaisse(false)} style={{ border: 'none', background: '#f5f5f5', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: '#666' }}>Fermer</button>
            </div>

            {/* Lignes panier */}
            <div style={{ marginBottom: 16 }}>
              {panier.map(l => (
                <div key={l.produit.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.produit.nom}</div>
                    <div style={{ fontSize: 12, color: '#aaa' }}>{l.produit.prix_vente.toLocaleString('fr-FR')} XOF</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => modifierQte(l.produit.id, -1)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{l.quantite}</span>
                    <button onClick={() => modifierQte(l.produit.id, 1)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1d9e75', minWidth: 80, textAlign: 'right' }}>{(l.produit.prix_vente * l.quantite).toLocaleString('fr-FR')} XOF</div>
                  <button onClick={() => retirerDuPanier(l.produit.id)} style={{ border: 'none', background: 'none', color: '#D85A30', cursor: 'pointer', fontSize: 18 }}>✕</button>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#1d9e75' }}>{total.toLocaleString('fr-FR')} XOF</span>
            </div>

            {/* Client */}
            <select value={clientId} onChange={e => setClientId(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e0e0e0', fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' as const }}>
              <option value="">Client comptoir</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>

            {/* Modes paiement */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
              {[
                { key: 'cash', label: '💵 Cash' },
                { key: 'wave', label: '📱 Wave' },
                { key: 'orange_money', label: '🔶 OM' },
                { key: 'credit', label: '📋 Crédit' },
                { key: 'virement', label: '🏦 Virement' },
                { key: 'cheque', label: '📄 Chèque' },
              ].map(m => (
                <button key={m.key} onClick={() => setModePaiement(m.key)} style={{
                  padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: modePaiement === m.key ? '#0a1628' : '#f5f5f5',
                  color: modePaiement === m.key ? '#fff' : '#555',
                }}>{m.label}</button>
              ))}
            </div>

            {/* Montant reçu (cash) */}
            {modePaiement === 'cash' && (
              <div style={{ marginBottom: 12 }}>
                <input type="number" placeholder="Montant reçu du client" value={montantRecu} onChange={e => setMontantRecu(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
                {montantRecu && parseFloat(montantRecu) >= total && (
                  <div style={{ marginTop: 8, padding: '12px', background: '#e8f8f2', borderRadius: 10, fontSize: 16, fontWeight: 700, color: '#0f6e56', textAlign: 'center' }}>
                    Monnaie à rendre : {monnaie.toLocaleString('fr-FR')} XOF
                  </div>
                )}
              </div>
            )}

            {/* Crédit partiel */}
            {modePaiement === 'credit' && (
              <div style={{ marginBottom: 12 }}>
                <input type="number" placeholder="Montant versé maintenant" value={montantCredit} onChange={e => setMontantCredit(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, marginBottom: 8 }} />
                {montantCredit && (
                  <div style={{ padding: '12px', background: '#faece7', borderRadius: 10, fontSize: 15, fontWeight: 700, color: '#D85A30', textAlign: 'center' }}>
                    Reste dû : {resteCredit.toLocaleString('fr-FR')} XOF
                  </div>
                )}
              </div>
            )}

            {/* Bouton encaisser */}
            <button onClick={encaisser} disabled={loading || panier.length === 0} style={{
              width: '100%', padding: '18px', borderRadius: 14, border: 'none',
              background: '#1d9e75', color: '#fff', fontSize: 17, fontWeight: 800,
              cursor: 'pointer', letterSpacing: '.03em',
              opacity: loading || panier.length === 0 ? 0.6 : 1,
            }}>
              {loading ? 'Enregistrement…' : `✓ ENCAISSER — ${total.toLocaleString('fr-FR')} XOF`}
            </button>

            {panier.length > 0 && (
              <button onClick={() => { setPanier([]); setShowCaisse(false) }} style={{ width: '100%', marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid #e0e0e0', background: '#fff', fontSize: 14, cursor: 'pointer', color: '#888' }}>
                🗑 Vider le panier
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
