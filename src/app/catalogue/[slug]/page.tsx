'use client'
import { useEffect, useState, use } from 'react'

interface Boutique { nom: string; telephone: string; email: string; adresse: string }
interface Produit { id: string; nom: string; description: string; prix_vente: number; unite: string; image_url: string; stock_total: number; is_service: boolean }

export default function CataloguePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [boutique, setBoutique] = useState<Boutique | null>(null)
  const [produits, setProduits] = useState<Produit[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [panier, setPanier] = useState<{ produit: Produit; qte: number }[]>([])
  const [showPanier, setShowPanier] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/public/catalogue?slug=${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setBoutique(d.boutique)
        setProduits(d.produits)
        setLoading(false)
      })
      .catch(() => { setError('Erreur de chargement'); setLoading(false) })
  }, [slug])

  function ajouterPanier(produit: Produit) {
    setPanier(prev => {
      const exist = prev.find(p => p.produit.id === produit.id)
      if (exist) return prev.map(p => p.produit.id === produit.id ? { ...p, qte: p.qte + 1 } : p)
      return [...prev, { produit, qte: 1 }]
    })
  }

  function retirerPanier(produitId: string) {
    setPanier(prev => prev.filter(p => p.produit.id !== produitId))
  }

  function commanderWhatsApp() {
    if (!boutique?.telephone) return
    const tel = boutique.telephone.replace(/\s/g, '').replace('+', '')
    const lignes = panier.map(p => `• ${p.produit.nom} x${p.qte} — ${(p.produit.prix_vente * p.qte).toLocaleString('fr-FR')} XOF`)
    const total = panier.reduce((s, p) => s + p.produit.prix_vente * p.qte, 0)
    const msg = encodeURIComponent(
      `Bonjour ${boutique.nom} 👋\n\nJe voudrais commander :\n${lignes.join('\n')}\n\n*Total : ${total.toLocaleString('fr-FR')} XOF*\n\nMerci !`
    )
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank')
  }

  function partagerCatalogue() {
    if (navigator.share) {
      navigator.share({ title: boutique?.nom || 'Catalogue', url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Lien copié !')
    }
  }

  const produitsFiltres = produits.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase())
  )

  const totalPanier = panier.reduce((s, p) => s + p.produit.prix_vente * p.qte, 0)
  const nbPanier = panier.reduce((s, p) => s + p.qte, 0)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', color: '#aaa' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>S</div>
        <p>Chargement du catalogue…</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', color: '#aaa' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>◌</div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#888' }}>Boutique introuvable</p>
        <p style={{ fontSize: 13 }}>{error}</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'Inter, sans-serif' }}>

      {/* Header boutique */}
      <div style={{ background: '#0a1628', padding: '24px 20px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#1d9e75,#0f6e56)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>
                {boutique?.nom?.[0] || 'S'}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{boutique?.nom}</div>
                {boutique?.adresse && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{boutique.adresse}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={partagerCatalogue} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
                🔗 Partager
              </button>
              {nbPanier > 0 && (
                <button onClick={() => setShowPanier(!showPanier)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                  🛒 {nbPanier} — {totalPanier.toLocaleString('fr-FR')} XOF
                </button>
              )}
            </div>
          </div>

          {/* Recherche */}
          <input
            placeholder="🔍 Rechercher un produit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: 'none', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>

        {/* Panier */}
        {showPanier && panier.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', display: 'flex', justifyContent: 'space-between' }}>
              🛒 Mon panier
              <button onClick={() => setShowPanier(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa' }}>×</button>
            </h3>
            {panier.map(p => (
              <div key={p.produit.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.produit.nom}</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>x{p.qte} × {p.produit.prix_vente.toLocaleString('fr-FR')} XOF</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1d9e75' }}>{(p.produit.prix_vente * p.qte).toLocaleString('fr-FR')} XOF</span>
                  <button onClick={() => retirerPanier(p.produit.id)} style={{ border: 'none', background: '#faece7', color: '#D85A30', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '2px solid #f0f0f0' }}>
              <div>
                <div style={{ fontSize: 13, color: '#aaa' }}>Total</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#1d9e75' }}>{totalPanier.toLocaleString('fr-FR')} XOF</div>
              </div>
              <button onClick={commanderWhatsApp} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#25D366', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📱</span> Commander sur WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
          {produitsFiltres.length} produit(s) disponible(s)
        </div>

        {/* Grille produits */}
        {produitsFiltres.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#ccc' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>◌</div>
            <p style={{ fontSize: 16 }}>Aucun produit disponible</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {produitsFiltres.map(p => {
              const enPanier = panier.find(x => x.produit.id === p.id)
              const dispo = Number(p.stock_total) > 0 || p.is_service
              return (
                <div key={p.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', opacity: dispo ? 1 : 0.6 }}>
                  {/* Image */}
                  <div style={{ height: 170, background: '#f7f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ fontSize: 48, color: '#e0e0e0' }}>▣</div>
                    )}
                    {!dispo && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ background: '#e24b4a', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>RUPTURE</span>
                      </div>
                    )}
                    {enPanier && (
                      <div style={{ position: 'absolute', top: 8, right: 8, background: '#1d9e75', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
                        ×{enPanier.qte}
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#1a1a1a', lineHeight: 1.3 }}>{p.nom}</div>
                    {p.description && <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8, lineHeight: 1.4 }}>{p.description}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#1d9e75' }}>{Number(p.prix_vente).toLocaleString('fr-FR')} XOF</span>
                      {dispo && <span style={{ fontSize: 10, color: '#1d9e75', background: '#e8f8f2', padding: '2px 8px', borderRadius: 20 }}>Disponible</span>}
                    </div>
                    <button
                      onClick={() => dispo && ajouterPanier(p)}
                      disabled={!dispo}
                      style={{
                        width: '100%', padding: '10px', borderRadius: 8, border: 'none',
                        background: !dispo ? '#f0f0f0' : enPanier ? '#0f6e56' : '#1d9e75',
                        color: !dispo ? '#aaa' : '#fff',
                        fontSize: 13, fontWeight: 600, cursor: dispo ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {!dispo ? 'Indisponible' : enPanier ? `✓ Dans le panier (${enPanier.qte})` : '+ Ajouter'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 48, padding: '24px 0', borderTop: '1px solid #e8e8e8' }}>
          {boutique?.telephone && (
            <a href={`https://wa.me/${boutique.telephone.replace(/\s/g, '').replace('+', '')}`} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, background: '#25D366', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
              <span style={{ fontSize: 18 }}>📱</span> Contacter sur WhatsApp
            </a>
          )}
          <div style={{ fontSize: 11, color: '#ccc', marginTop: 12 }}>
            Propulsé par <strong style={{ color: '#1d9e75' }}>SunuGestion</strong> · sunugestion.sn
          </div>
        </div>
      </div>

      {/* Bouton panier flottant */}
      {nbPanier > 0 && !showPanier && (
        <div
          onClick={() => setShowPanier(true)}
          style={{
            position: 'fixed', bottom: 24, right: 24,
            background: '#1d9e75', color: '#fff',
            padding: '14px 20px', borderRadius: 50,
            boxShadow: '0 4px 20px rgba(29,158,117,0.4)',
            cursor: 'pointer', fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8, zIndex: 100,
          }}
        >
          🛒 {nbPanier} article(s) — {totalPanier.toLocaleString('fr-FR')} XOF
        </div>
      )}
    </div>
  )
}
