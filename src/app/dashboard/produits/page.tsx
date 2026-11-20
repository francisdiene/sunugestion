'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect, useRef } from 'react'

interface Produit {
  id: string; nom: string; categorie_nom: string; prix_vente: number;
  prix_achat: number; tva_taux: number; code_barre: string; unite: string;
  stock_total: number; is_actif: boolean; image_url: string; description?: string;
  seuil_alerte?: number; is_service?: boolean;
}

type ModalMode = 'apercu' | 'modifier' | null

export default function ProduitsPage() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const editFileRef = useRef<HTMLInputElement>(null)
  const imageUrlRef = useRef<string>('')

  // Modal état
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editPreview, setEditPreview] = useState<string | null>(null)
  const editImageUrlRef = useRef<string>('')
  const [editUploading, setEditUploading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editMsg, setEditMsg] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const [form, setForm] = useState({
    nom: '', prix_vente: '', prix_achat: '', tva_taux: '18',
    unite: 'pcs', code_barre: '', description: '',
    stock_initial: '0', seuil_alerte: '0',
    is_service: false, image_url: '',
  })

  const [editForm, setEditForm] = useState({
    nom: '', prix_vente: '', prix_achat: '', tva_taux: '18',
    unite: 'pcs', code_barre: '', description: '',
    seuil_alerte: '0', is_service: false, image_url: '', is_actif: true,
  })

  function load() {
    fetch('/api/produits?search=' + search)
      .then(r => r.json())
      .then(d => d.data && setProduits(d.data))
  }

  useEffect(() => { load() }, [search])

  // Fermer modal avec Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function openApercu(p: Produit) {
    setSelectedProduit(p)
    setModalMode('apercu')
    setDeleteConfirm(false)
    setEditMsg('')
  }

  function openModifier(p: Produit) {
    setSelectedProduit(p)
    setModalMode('modifier')
    setDeleteConfirm(false)
    setEditMsg('')
    setEditPreview(p.image_url || null)
    editImageUrlRef.current = p.image_url || ''
    setEditForm({
      nom: p.nom,
      prix_vente: String(p.prix_vente),
      prix_achat: String(p.prix_achat),
      tva_taux: String(p.tva_taux),
      unite: p.unite,
      code_barre: p.code_barre || '',
      description: p.description || '',
      seuil_alerte: String(p.seuil_alerte || 0),
      is_service: p.is_service || false,
      image_url: p.image_url || '',
      is_actif: p.is_actif,
    })
  }

  function closeModal() {
    setSelectedProduit(null)
    setModalMode(null)
    setDeleteConfirm(false)
    setEditMsg('')
    setEditPreview(null)
    editImageUrlRef.current = ''
  }

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

  async function handleEditImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEditUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setEditMsg(data.error); return }
      editImageUrlRef.current = data.url
      setEditForm(f => ({ ...f, image_url: data.url }))
      setEditPreview(data.url)
    } catch { setEditMsg('Erreur upload') }
    finally { setEditUploading(false) }
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

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProduit) return
    setEditLoading(true); setEditMsg('')
    try {
      const payload = {
        nom: editForm.nom,
        prix_vente: parseFloat(editForm.prix_vente),
        prix_achat: parseFloat(editForm.prix_achat),
        tva_taux: parseFloat(editForm.tva_taux),
        unite: editForm.unite,
        code_barre: editForm.code_barre,
        description: editForm.description,
        seuil_alerte: parseFloat(editForm.seuil_alerte),
        is_service: editForm.is_service,
        is_actif: editForm.is_actif,
        image_url: editImageUrlRef.current || editForm.image_url,
      }
      const res = await fetch('/api/produits/' + selectedProduit.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setEditMsg(data.error || 'Erreur modification'); return }
      setEditMsg('✓ Produit modifié')
      load()
      // Mettre à jour le produit sélectionné
      setSelectedProduit({ ...selectedProduit, ...payload, stock_total: selectedProduit.stock_total })
      setTimeout(() => { setModalMode('apercu'); setEditMsg('') }, 800)
    } catch { setEditMsg('Erreur réseau') } finally { setEditLoading(false) }
  }

  async function deleteProduit() {
    if (!selectedProduit) return
    try {
      const res = await fetch('/api/produits/' + selectedProduit.id, { method: 'DELETE' })
      if (!res.ok) { setEditMsg('Erreur suppression'); return }
      setMsg('✓ Produit supprimé')
      closeModal()
      load()
    } catch { setEditMsg('Erreur réseau') }
  }

  const inp = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { fontSize: 12, fontWeight: 500 as const, color: '#555', display: 'block' as const, marginBottom: 4 }

  return (
    <DashboardLayout title="Produits" subtitle="Catalogue et gestion des produits">

      {/* Modal overlay */}
      {modalMode && selectedProduit && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640,
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            animation: 'fadeInUp 0.18s ease',
          }}>

            {/* Header modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #f0f0f0' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                {modalMode === 'apercu' ? '◈ Aperçu produit' : '✎ Modifier le produit'}
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {modalMode === 'apercu' && (
                  <button
                    onClick={() => openModifier(selectedProduit)}
                    style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    ✎ Modifier
                  </button>
                )}
                <button
                  onClick={closeModal}
                  style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#888' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* ── MODE APERÇU ── */}
            {modalMode === 'apercu' && (
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                  {/* Image */}
                  <div style={{ flexShrink: 0, width: 140, height: 140, borderRadius: 12, overflow: 'hidden', background: '#f7f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedProduit.image_url
                      ? <img src={selectedProduit.image_url} alt={selectedProduit.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ fontSize: 48, color: '#e0e0e0' }}>▣</div>
                    }
                  </div>
                  {/* Infos principales */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{selectedProduit.nom}</h3>
                      <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: selectedProduit.is_actif ? '#e8f8f2' : '#f1efe8', color: selectedProduit.is_actif ? '#0f6e56' : '#888', fontWeight: 600 }}>
                        {selectedProduit.is_actif ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>{selectedProduit.code_barre || 'Sans code barre'} · {selectedProduit.unite}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#1d9e75', marginBottom: 4 }}>
                      {Number(selectedProduit.prix_vente).toLocaleString()} XOF
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      Prix achat : {Number(selectedProduit.prix_achat).toLocaleString()} XOF · TVA {selectedProduit.tva_taux}%
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Stock disponible', value: `${Number(selectedProduit.stock_total)} ${selectedProduit.unite}`, color: Number(selectedProduit.stock_total) <= 0 ? '#e24b4a' : '#1d9e75' },
                    { label: 'Marge brute', value: selectedProduit.prix_achat > 0 ? `${Math.round(((selectedProduit.prix_vente - selectedProduit.prix_achat) / selectedProduit.prix_vente) * 100)}%` : '—', color: '#1a1a1a' },
                    { label: 'Bénéfice unitaire', value: `${(selectedProduit.prix_vente - selectedProduit.prix_achat).toLocaleString()} XOF`, color: '#1a1a1a' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: '#f9f9fb', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 10, color: '#aaa', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {selectedProduit.description && (
                  <div style={{ background: '#f9f9fb', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
                    <div style={{ fontSize: 10, color: '#aaa', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</div>
                    <p style={{ fontSize: 13, color: '#444', margin: 0, lineHeight: 1.6 }}>{selectedProduit.description}</p>
                  </div>
                )}

                {/* Supprimer */}
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                  {!deleteConfirm ? (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #fcd4cc', background: '#fff8f7', color: '#D85A30', fontSize: 12, cursor: 'pointer' }}
                    >
                      ✕ Supprimer ce produit
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, color: '#D85A30' }}>Confirmer la suppression ?</span>
                      <button onClick={deleteProduit} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: '#e24b4a', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Oui, supprimer</button>
                      <button onClick={() => setDeleteConfirm(false)} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #e0e0e0', background: '#fff', fontSize: 12, cursor: 'pointer' }}>Annuler</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── MODE MODIFIER ── */}
            {modalMode === 'modifier' && (
              <form onSubmit={submitEdit} style={{ padding: 24 }}>
                {editMsg && (
                  <div style={{ padding: '10px 16px', borderRadius: 8, background: editMsg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: editMsg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, marginBottom: 16 }}>
                    {editMsg}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 20, marginBottom: 20 }}>
                  {/* Image éditable */}
                  <div>
                    <label style={lbl}>Image</label>
                    <div
                      onClick={() => editFileRef.current?.click()}
                      style={{ width: 160, height: 160, borderRadius: 10, border: '2px dashed #e0e0e0', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: editPreview ? 'transparent' : '#fafafa', overflow: 'hidden', position: 'relative' }}
                    >
                      {editPreview
                        ? <img src={editPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <><div style={{ fontSize: 28, marginBottom: 6 }}>📷</div><div style={{ fontSize: 11, color: '#aaa', textAlign: 'center' }}>{editUploading ? 'Upload...' : 'Changer image'}</div></>
                      }
                      {editUploading && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#1d9e75' }}>Envoi…</div>
                      )}
                    </div>
                    <input ref={editFileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleEditImage} />
                  </div>

                  {/* Champs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12 }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={lbl}>Nom du produit *</label>
                      <input required value={editForm.nom} onChange={e => setEditForm({ ...editForm, nom: e.target.value })} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Prix de vente (XOF) *</label>
                      <input required type="number" min="0" value={editForm.prix_vente} onChange={e => setEditForm({ ...editForm, prix_vente: e.target.value })} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Prix d'achat (XOF)</label>
                      <input type="number" min="0" value={editForm.prix_achat} onChange={e => setEditForm({ ...editForm, prix_achat: e.target.value })} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>TVA</label>
                      <select value={editForm.tva_taux} onChange={e => setEditForm({ ...editForm, tva_taux: e.target.value })} style={inp}>
                        <option value="0">0% (Exonéré)</option>
                        <option value="18">18% (Standard)</option>
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Unité</label>
                      <select value={editForm.unite} onChange={e => setEditForm({ ...editForm, unite: e.target.value })} style={inp}>
                        <option value="pcs">Pièce</option>
                        <option value="kg">Kilogramme</option>
                        <option value="l">Litre</option>
                        <option value="m">Mètre</option>
                        <option value="carton">Carton</option>
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Code barre</label>
                      <input value={editForm.code_barre} onChange={e => setEditForm({ ...editForm, code_barre: e.target.value })} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Seuil alerte stock</label>
                      <input type="number" min="0" value={editForm.seuil_alerte} onChange={e => setEditForm({ ...editForm, seuil_alerte: e.target.value })} style={inp} />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Description</label>
                  <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} style={{ ...inp, resize: 'vertical' as const }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={editForm.is_actif} onChange={e => setEditForm({ ...editForm, is_actif: e.target.checked })} />
                    Produit actif
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={editForm.is_service} onChange={e => setEditForm({ ...editForm, is_service: e.target.checked })} />
                    C'est un service
                  </label>
                </div>

                {editForm.prix_vente && editForm.prix_achat && parseFloat(editForm.prix_achat) > 0 && (
                  <div style={{ background: '#e8f8f2', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#0f6e56' }}>
                    Marge : {Math.round(((parseFloat(editForm.prix_vente) - parseFloat(editForm.prix_achat)) / parseFloat(editForm.prix_vente)) * 100)}% · Bénéfice unitaire : {(parseFloat(editForm.prix_vente) - parseFloat(editForm.prix_achat)).toLocaleString()} XOF
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="button" onClick={() => setModalMode('apercu')} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#666' }}>
                    ← Retour aperçu
                  </button>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={closeModal} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                    <button type="submit" disabled={editLoading || editUploading} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: editUploading ? '#aaa' : '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      {editLoading ? 'Enregistrement...' : '✓ Sauvegarder'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Animation CSS */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {msg && (
        <div style={{ padding: '10px 16px', borderRadius: 8, background: msg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: msg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, marginBottom: 16 }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
        <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, maxWidth: 280 }} />
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {showForm ? '✕ Fermer' : '+ Nouveau produit'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Nouveau produit</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 24, marginBottom: 20 }}>
            <div>
              <label style={lbl}>Image du produit</label>
              <div onClick={() => fileRef.current?.click()} style={{ width: 200, height: 200, borderRadius: 10, border: '2px dashed #e0e0e0', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: preview ? 'transparent' : '#fafafa', overflow: 'hidden', position: 'relative' }}>
                {preview
                  ? <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <><div style={{ fontSize: 32, marginBottom: 8 }}>📷</div><div style={{ fontSize: 12, color: '#aaa', textAlign: 'center' }}>{uploading ? 'Upload en cours...' : 'Cliquer pour ajouter une image'}</div></>
                }
                {uploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#1d9e75' }}>Envoi…</div>}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleImage} />
              {preview && (
                <button type="button" onClick={() => { setPreview(null); imageUrlRef.current = ''; setForm(f => ({ ...f, image_url: '' })) }} style={{ marginTop: 8, width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #e8e8e8', background: '#fff', fontSize: 11, cursor: 'pointer', color: '#D85A30' }}>
                  ✕ Supprimer
                </button>
              )}
              <div style={{ fontSize: 10, color: '#bbb', marginTop: 6 }}>JPG, PNG, WEBP — max 2MB</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 14 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 14 }}>
        {produits.length === 0 ? (
          <div style={{ gridColumn: '1/-1', background: '#fff', borderRadius: 12, padding: '60px', textAlign: 'center', color: '#ccc', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>◌</div>
            <p>Aucun produit — cliquez sur "+ Nouveau produit"</p>
          </div>
        ) : produits.map(p => {
          const marge = p.prix_achat > 0 ? Math.round(((p.prix_vente - p.prix_achat) / p.prix_vente) * 100) : null
          return (
            <div
              key={p.id}
              onClick={() => openApercu(p)}
              style={{
                background: '#fff', borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                display: 'flex', flexDirection: 'column',
                cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ height: 160, background: '#f7f8fa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ fontSize: 40, color: '#e0e0e0' }}>▣</div>
                }
                {Number(p.stock_total) <= 0 && (
                  <div style={{ position: 'absolute', top: 8, right: 8, background: '#e24b4a', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 20 }}>RUPTURE</div>
                )}
                {/* Hover overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(29,158,117,0.08)', opacity: 0, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0' }}
                />
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
