'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect, useRef } from 'react'

interface Produit { id: string; nom: string; categorie_nom: string; prix_vente: number; prix_achat: number; tva_taux: number; code_barre: string; unite: string; stock_total: number; is_actif: boolean; image_url: string }

export default function ProduitsPage() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const imageUrlRef = useRef<string>('')
  const [form, setForm] = useState({
    nom: '', prix_vente: '', prix_achat: '', tva_taux: '18',
    unite: 'pcs', code_barre: '', description: '',
    stock_initial: '0', seuil_alerte: '0',
    is_service: false, image_url: '',
  })

  function load() {
    fetch('/api/produits?search=' + search)
      .then(r => r.json())
      .then(d => d.data && setProduits(d.data))
  }

  useEffect(() => { load() }, [search])

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error); return }
      imageUrlRef.current = data.url
      setForm(f => ({ ...f, image_url: data.url }))
      setPreview(data.url)
    } catch { setMsg('Erreur upload') }
    finally { setUploading(false) }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg('')
    try {
      const payload = {
        nom: form.nom,
        prix_vente: parseFloat(form.prix_vente),
        prix_achat: parseFloat(form.prix_achat),
        tva_taux: parseFloat(form.tva_taux),
        unite: form.unite,
        code_barre: form.code_barre,
        description: form.description,
        stock_initial: parseFloat(form.stock_initial),
        seuil_alerte: parseFloat(form.seuil_alerte),
        is_service: form.is_service,
        image_url: imageUrlRef.current || form.image_url,
      }
      const res = await fetch('/api/produits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error); return }
      setMsg('✓ Produit créé : ' + data.data.nom)
      setShowForm(false)
      setPreview(null)
      imageUrlRef.current = ''
      setForm({ nom: '', prix_vente: '', prix_achat: '', tva_taux: '18', unite: 'pcs', code_barre: '', description: '', stock_initial: '0', seuil_alerte: '0', is_service: false, image_url: '' })
      load()
    } catch { setMsg('Erreur réseau') } finally { setLoading(false) }
  }

  const inp = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { fontSize: 12, fontWeight: 500 as const, color: '#555', display: 'block' as const, marginBottom: 4 }

  return (
    <DashboardLayout title="Produits" subtitle="Catalogue et gestion des produits">
      {msg && <div style={{ padding: '10px 16px', borderRadius: 8, background: msg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: msg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
        <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, maxWidth: 280 }} />
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {showForm ? '✕ Fermer' : '+ Nouveau produit'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Nouveau produit</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, marginBottom: 20 }}>
            {/* Zone upload image */}
            <div>
              <label style={lbl}>Image du produit</label>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  width: 200, height: 200, borderRadius: 10,
                  border: '2px dashed #e0e0e0', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: preview ? 'transparent' : '#fafafa',
                  overflow: 'hidden', position: 'relative',
                }}
              >
                {preview ? (
                  <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                    <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center' }}>
                      {uploading ? 'Upload en cours...' : 'Cliquer pour ajouter une image'}
                    </div>
                  </>
                )}
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#1d9e75' }}>
                    Envoi…
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleImage} />
              {preview && (
                <button type="button" onClick={() => { setPreview(null); imageUrlRef.current = ''; setForm(f => ({ ...f, image_url: '' })) }} style={{ marginTop: 8, width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #e8e8e8', background: '#fff', fontSize: 11, cursor: 'pointer', color: '#D85A30' }}>
                  ✕ Supprimer
                </button>
              )}
              <div style={{ fontSize: 10, color: '#bbb', marginTop: 6 }}>JPG, PNG, WEBP — max 2MB</div>
            </div>

            {/* Champs produit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Nom du produit *</label><input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Code barre</label><input value={form.code_barre} onChange={e => setForm({ ...form, code_barre: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Prix de vente (XOF) *</label><input required type="number" min="0" value={form.prix_vente} onChange={e => setForm({ ...form, prix_vente: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Prix d'achat (XOF)</label><input type="number" min="0" value={form.prix_achat} onChange={e => setForm({ ...form, prix_achat: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>TVA</label>
                <select value={form.tva_taux} onChange={e => setForm({ ...form, tva_taux: e.target.value })} style={inp}>
                  <option value="0">0% (Exonéré)</option>
                  <option value="18">18% (Standard)</option>
                </select>
              </div>
              <div><label style={lbl}>Unité</label>
                <select value={form.unite} onChange={e => setForm({ ...form, unite: e.target.value })} style={inp}>
                  <option value="pcs">Pièce</option><option value="kg">Kilogramme</option>
                  <option value="l">Litre</option><option value="m">Mètre</option><option value="carton">Carton</option>
                </select>
              </div>
              <div><label style={lbl}>Stock initial</label><input type="number" min="0" value={form.stock_initial} onChange={e => setForm({ ...form, stock_initial: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Seuil alerte</label><input type="number" min="0" value={form.seuil_alerte} onChange={e => setForm({ ...form, seuil_alerte: e.target.value })} style={inp} /></div>
            </div>
          </div>

          {form.prix_vente && form.prix_achat && parseFloat(form.prix_achat) > 0 && (
            <div style={{ background: '#e8f8f2', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#0f6e56' }}>
              Marge : {Math.round(((parseFloat(form.prix_vente) - parseFloat(form.prix_achat)) / parseFloat(form.prix_vente)) * 100)}% · Bénéfice unitaire : {(parseFloat(form.prix_vente) - parseFloat(form.prix_achat)).toLocaleString()} XOF
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={() => { setShowForm(false); setPreview(null); imageUrlRef.current = '' }} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
            <button type="submit" disabled={loading || uploading} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: uploading ? '#aaa' : '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {uploading ? 'Upload en cours...' : loading ? 'Enregistrement...' : 'Créer le produit'}
            </button>
          </div>
        </form>
      )}

      {/* Liste produits en grille */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {produits.length === 0 ? (
          <div style={{ gridColumn: '1/-1', background: '#fff', borderRadius: 12, padding: '60px', textAlign: 'center', color: '#ccc', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>◌</div>
            <p>Aucun produit — cliquez sur "+ Nouveau produit"</p>
          </div>
        ) : produits.map(p => {
          const marge = p.prix_achat > 0 ? Math.round(((p.prix_vente - p.prix_achat) / p.prix_vente) * 100) : null
          return (
            <div key={p.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 160, background: '#f7f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {p.image_url ? (
                  <img src={p.image_url} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ fontSize: 40, color: '#e0e0e0' }}>▣</div>
                )}
                {Number(p.stock_total) <= 0 && (
                  <div style={{ position: 'absolute', top: 8, right: 8, background: '#e24b4a', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 20 }}>RUPTURE</div>
                )}
              </div>
              <div style={{ padding: '14px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#1a1a1a' }}>{p.nom}</div>
                <div style={{ fontSize: 11, color: '#bbb', marginBottom: 10 }}>{p.code_barre || 'Sans code barre'} · {p.unite}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1d9e75' }}>{Number(p.prix_vente).toLocaleString()} XOF</span>
                  {marge !== null && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: marge >= 20 ? '#0f6e56' : '#D85A30', background: marge >= 20 ? '#e8f8f2' : '#faece7', padding: '2px 8px', borderRadius: 20 }}>
                      {marge}%
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: Number(p.stock_total) <= 0 ? '#e24b4a' : '#666' }}>
                    Stock : {Number(p.stock_total)} {p.unite}
                  </span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: p.is_actif ? '#e8f8f2' : '#f1efe8', color: p.is_actif ? '#0f6e56' : '#888' }}>
                    {p.is_actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </DashboardLayout>
  )
}
