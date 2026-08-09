'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, useEffect, useRef } from 'react'

interface Tenant { id: string; nom: string; slug: string; plan: string; telephone: string; email: string; adresse: string; ninea: string; rccm: string; devise: string; nb_users: number; nb_produits: number }

const TABS = [
  { key: 'boutique',      label: '🏪 Ma boutique' },
  { key: 'facturation',   label: '🧾 Facturation' },
  { key: 'compte',        label: '👤 Mon compte' },
  { key: 'notifications', label: '🔔 Notifications' },
  { key: 'abonnement',    label: '💳 Abonnement' },
]

const PLANS = [
  { key: 'starter',  label: 'Starter',  prix: '5 000 XOF/mois',  color: '#5F5E5A', features: ['2 utilisateurs', 'Ventes & Stock', 'Facturation PDF', 'Support email'] },
  { key: 'pro',      label: 'Pro',      prix: '15 000 XOF/mois', color: '#0f6e56', features: ['10 utilisateurs', 'Tous les modules', 'SYSCOHADA', 'Analytics', 'Support prioritaire'] },
  { key: 'business', label: 'Business', prix: '35 000 XOF/mois', color: '#534AB7', features: ['Illimité', 'Multi-boutiques', 'API access', 'Export DGI', 'Support dédié'] },
]

export default function ParametresPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [activeTab, setActiveTab] = useState('boutique')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  const [boutique, setBoutique] = useState({ nom: '', telephone: '', email: '', adresse: '', ninea: '', rccm: '', devise: 'XOF' })
  const [facturation, setFacturation] = useState({ mention_legale: '', pied_page: '', prefixe_facture: 'FAC', tva_defaut: '18', conditions_paiement: 'Paiement à réception' })
  const [compte, setCompte] = useState({ nom_complet: '', email: '', ancien_mdp: '', nouveau_mdp: '', confirmer_mdp: '' })
  const [notifs, setNotifs] = useState({ alerte_stock: true, seuil_global: '5', whatsapp: '' })

  useEffect(() => {
    fetch('/api/tenants').then(r => r.json()).then(d => {
      if (d.data) {
        setTenant(d.data)
        setBoutique({ nom: d.data.nom || '', telephone: d.data.telephone || '', email: d.data.email || '', adresse: d.data.adresse || '', ninea: d.data.ninea || '', rccm: d.data.rccm || '', devise: d.data.devise || 'XOF' })
      }
    })
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setCompte(prev => ({ ...prev, nom_complet: d.user.nom, email: d.user.email }))
    })
  }, [])

  function showMsg(m: string) { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { showMsg(data.error); return }
      setLogoPreview(data.url)
    } catch { showMsg('Erreur upload') }
    finally { setUploading(false) }
  }

  async function saveBoutique(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch('/api/tenants', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(boutique) })
      const data = await res.json()
      if (!res.ok) { showMsg(data.error); return }
      showMsg('✓ Boutique mise à jour')
      setTenant(prev => prev ? { ...prev, ...data.data } : prev)
    } catch { showMsg('Erreur réseau') }
    finally { setLoading(false) }
  }

  const inp = { width: '100%', padding: '11px 14px', borderRadius: 9, border: '1px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, background: '#fff' }
  const lbl = { fontSize: 13, fontWeight: 500 as const, color: '#444', display: 'block' as const, marginBottom: 6 }
  const card = { background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 14 }

  return (
    <DashboardLayout title="Paramètres" subtitle="Configuration de votre boutique">
      {msg && <div style={{ padding: '12px 16px', borderRadius: 10, background: msg.startsWith('✓') ? '#e8f8f2' : '#faece7', color: msg.startsWith('✓') ? '#0f6e56' : '#D85A30', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{msg}</div>}

      {/* Tabs scrollable */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '9px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
            background: activeTab === t.key ? '#0a1628' : '#fff',
            color: activeTab === t.key ? '#fff' : '#666',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* BOUTIQUE */}
      {activeTab === 'boutique' && (
        <form onSubmit={saveBoutique}>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', color: '#0a1628' }}>Logo de la boutique</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div onClick={() => logoRef.current?.click()} style={{ width: 90, height: 90, borderRadius: 14, border: '2px dashed #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: '#fafafa', flexShrink: 0 }}>
                {logoPreview ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <div style={{ textAlign: 'center', color: '#bbb' }}><div style={{ fontSize: 26 }}>📷</div><div style={{ fontSize: 10 }}>{uploading ? '...' : 'Cliquer'}</div></div>}
              </div>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadLogo} />
              <div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>Apparaît sur vos factures et tickets de caisse</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>PNG, JPG, WEBP — max 2MB</div>
                {logoPreview && <button type="button" onClick={() => setLogoPreview(null)} style={{ marginTop: 8, padding: '5px 10px', borderRadius: 6, border: '1px solid #e8e8e8', background: '#fff', fontSize: 11, cursor: 'pointer', color: '#D85A30' }}>✕ Supprimer</button>}
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', color: '#0a1628' }}>Informations générales</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={lbl}>Nom de la boutique *</label><input required value={boutique.nom} onChange={e => setBoutique({ ...boutique, nom: e.target.value })} style={inp} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>Téléphone</label><input value={boutique.telephone} onChange={e => setBoutique({ ...boutique, telephone: e.target.value })} placeholder="+221 77 000 00 00" style={inp} /></div>
                <div><label style={lbl}>Email</label><input type="email" value={boutique.email} onChange={e => setBoutique({ ...boutique, email: e.target.value })} style={inp} /></div>
              </div>
              <div><label style={lbl}>Adresse</label><input value={boutique.adresse} onChange={e => setBoutique({ ...boutique, adresse: e.target.value })} placeholder="Ex: Dakar, Plateau" style={inp} /></div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', color: '#0a1628' }}>Informations légales</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>NINEA</label><input value={boutique.ninea} onChange={e => setBoutique({ ...boutique, ninea: e.target.value })} placeholder="Numéro fiscal" style={inp} /></div>
                <div><label style={lbl}>RCCM</label><input value={boutique.rccm} onChange={e => setBoutique({ ...boutique, rccm: e.target.value })} placeholder="Registre commerce" style={inp} /></div>
              </div>
              <div><label style={lbl}>Devise</label>
                <select value={boutique.devise} onChange={e => setBoutique({ ...boutique, devise: e.target.value })} style={inp}>
                  <option value="XOF">XOF — Franc CFA (UEMOA)</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="USD">USD — Dollar</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Lien catalogue public</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ ...inp, background: '#fafafa', color: '#888', fontFamily: 'monospace', fontSize: 12, flex: 1, padding: '11px 12px' }}>sunugestion.sn/{tenant?.slug}</div>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(`https://sunugestion.sn/${tenant?.slug}`); showMsg('✓ Lien copié !') }}
                    style={{ padding: '11px 14px', borderRadius: 9, border: 'none', background: '#1d9e75', color: '#fff', cursor: 'pointer', fontSize: 12 }}>📋</button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
            {[{ label: 'Plan', value: tenant?.plan?.toUpperCase() || '—', color: '#1d9e75' },
              { label: 'Utilisateurs', value: tenant?.nb_users || 0, color: '#185FA5' },
              { label: 'Produits', value: tenant?.nb_produits || 0, color: '#534AB7' }].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#aaa', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={loading} style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {loading ? 'Sauvegarde...' : '💾 Sauvegarder'}
            </button>
          </div>
        </form>
      )}

      {/* FACTURATION */}
      {activeTab === 'facturation' && (
        <form onSubmit={e => { e.preventDefault(); showMsg('✓ Paramètres facturation sauvegardés') }}>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>Numérotation des factures</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lbl}>Préfixe</label>
                <input value={facturation.prefixe_facture} onChange={e => setFacturation({ ...facturation, prefixe_facture: e.target.value })} style={inp} />
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Ex: {facturation.prefixe_facture}-2026-00001</div>
              </div>
              <div>
                <label style={lbl}>TVA par défaut</label>
                <select value={facturation.tva_defaut} onChange={e => setFacturation({ ...facturation, tva_defaut: e.target.value })} style={inp}>
                  <option value="0">0% — Exonéré</option>
                  <option value="18">18% — Standard Sénégal</option>
                </select>
              </div>
            </div>
          </div>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>Contenu des factures</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Conditions de paiement</label>
                <select value={facturation.conditions_paiement} onChange={e => setFacturation({ ...facturation, conditions_paiement: e.target.value })} style={inp}>
                  <option>Paiement à réception</option>
                  <option>Paiement sous 7 jours</option>
                  <option>Paiement sous 15 jours</option>
                  <option>Paiement sous 30 jours</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Mentions légales</label>
                <textarea value={facturation.mention_legale} onChange={e => setFacturation({ ...facturation, mention_legale: e.target.value })}
                  placeholder="Ex: TVA non applicable..." rows={3} style={{ ...inp, resize: 'vertical' as const }} />
              </div>
              <div>
                <label style={lbl}>Pied de page</label>
                <textarea value={facturation.pied_page} onChange={e => setFacturation({ ...facturation, pied_page: e.target.value })}
                  placeholder="Ex: Merci de votre confiance !" rows={2} style={{ ...inp, resize: 'vertical' as const }} />
              </div>
            </div>
          </div>
          {/* Aperçu */}
          <div style={{ ...card, border: '2px dashed #e0e0e0', background: '#fafafa' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px', color: '#888' }}>Aperçu facture</h3>
            <div style={{ background: '#fff', borderRadius: 8, padding: 14, border: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  {logoPreview && <img src={logoPreview} alt="logo" style={{ height: 36, marginBottom: 6 }} />}
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{boutique.nom || 'Nom boutique'}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{boutique.adresse || 'Adresse'} · {boutique.telephone}</div>
                  {boutique.ninea && <div style={{ fontSize: 10, color: '#aaa' }}>NINEA: {boutique.ninea}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0a1628' }}>FACTURE</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{facturation.prefixe_facture}-2026-00001</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>💾 Sauvegarder</button>
          </div>
        </form>
      )}

      {/* COMPTE */}
      {activeTab === 'compte' && (
        <form onSubmit={e => { e.preventDefault(); if (compte.nouveau_mdp && compte.nouveau_mdp !== compte.confirmer_mdp) { showMsg('Les mots de passe ne correspondent pas'); return } showMsg('✓ Compte mis à jour') }}>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>Informations personnelles</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={lbl}>Nom complet</label><input value={compte.nom_complet} onChange={e => setCompte({ ...compte, nom_complet: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Email</label><input type="email" value={compte.email} onChange={e => setCompte({ ...compte, email: e.target.value })} style={inp} /></div>
            </div>
          </div>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>Changer le mot de passe</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={lbl}>Ancien mot de passe</label><input type="password" value={compte.ancien_mdp} onChange={e => setCompte({ ...compte, ancien_mdp: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Nouveau mot de passe</label><input type="password" value={compte.nouveau_mdp} onChange={e => setCompte({ ...compte, nouveau_mdp: e.target.value })} style={inp} /></div>
              <div>
                <label style={lbl}>Confirmer</label>
                <input type="password" value={compte.confirmer_mdp} onChange={e => setCompte({ ...compte, confirmer_mdp: e.target.value })}
                  style={{ ...inp, borderColor: compte.nouveau_mdp && compte.confirmer_mdp && compte.nouveau_mdp !== compte.confirmer_mdp ? '#D85A30' : '#e0e0e0' }} />
                {compte.nouveau_mdp && compte.confirmer_mdp && compte.nouveau_mdp !== compte.confirmer_mdp && <div style={{ fontSize: 11, color: '#D85A30', marginTop: 4 }}>Ne correspondent pas</div>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>💾 Mettre à jour</button>
          </div>
        </form>
      )}

      {/* NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <form onSubmit={e => { e.preventDefault(); showMsg('✓ Notifications sauvegardées') }}>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>Alertes stock</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8f9fa', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Alerte rupture de stock</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>Notifier quand un produit est en rupture</div>
                </div>
                <div onClick={() => setNotifs({ ...notifs, alerte_stock: !notifs.alerte_stock })} style={{ width: 48, height: 26, borderRadius: 13, cursor: 'pointer', background: notifs.alerte_stock ? '#1d9e75' : '#ddd', position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: notifs.alerte_stock ? 25 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
              <div>
                <label style={lbl}>Seuil d'alerte global</label>
                <input type="number" min="0" value={notifs.seuil_global} onChange={e => setNotifs({ ...notifs, seuil_global: e.target.value })} style={inp} />
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Alerter quand le stock passe sous cette quantité</div>
              </div>
            </div>
          </div>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>WhatsApp Business</h3>
            <div>
              <label style={lbl}>Numéro WhatsApp pour les commandes</label>
              <input value={notifs.whatsapp} onChange={e => setNotifs({ ...notifs, whatsapp: e.target.value })} placeholder="+221 77 000 00 00" style={inp} />
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>Les clients cliquent sur ce numéro depuis votre catalogue public</div>
            </div>
          </div>
          <div style={card}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>Support Francis Tech</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
              <a href="https://wa.me/221770000000" target="_blank" rel="noreferrer" style={{ padding: '10px 16px', borderRadius: 9, background: '#25D366', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>📱 WhatsApp</a>
              <a href="mailto:francis@francistech.sn" style={{ padding: '10px 16px', borderRadius: 9, background: '#0a1628', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>✉ Email</a>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: '#1d9e75', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>💾 Sauvegarder</button>
          </div>
        </form>
      )}

      {/* ABONNEMENT */}
      {activeTab === 'abonnement' && (
        <div>
          <div style={{ ...card, borderLeft: '4px solid #1d9e75' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>Plan actuel</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0a1628' }}>{tenant?.plan?.charAt(0).toUpperCase()}{tenant?.plan?.slice(1)}</div>
              </div>
              <span style={{ padding: '6px 14px', borderRadius: 20, background: '#e8f8f2', color: '#0f6e56', fontSize: 13, fontWeight: 700 }}>ACTIF</span>
            </div>
            <div style={{ marginTop: 10, padding: '10px 12px', background: '#f8f9fa', borderRadius: 8, fontSize: 12, color: '#666' }}>
              Prochain renouvellement : <strong>09/09/2026</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {PLANS.map(p => {
              const actif = tenant?.plan === p.key
              return (
                <div key={p.key} style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: actif ? `2px solid ${p.color}` : '2px solid transparent', position: 'relative' as const }}>
                  {actif && <div style={{ position: 'absolute' as const, top: -10, left: '50%', transform: 'translateX(-50%)', background: p.color, color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' as const }}>PLAN ACTUEL</div>}
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#0a1628', marginBottom: 2 }}>{p.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: p.color, marginBottom: 12 }}>{p.prix}</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px' }}>
                    {p.features.map(f => <li key={f} style={{ fontSize: 12, color: '#555', marginBottom: 5, display: 'flex', gap: 6 }}><span style={{ color: p.color }}>✓</span>{f}</li>)}
                  </ul>
                  {!actif && <button onClick={() => showMsg('Contactez Francis Tech sur WhatsApp pour changer de plan')} style={{ width: '100%', padding: '9px', borderRadius: 8, border: `1px solid ${p.color}`, background: '#fff', color: p.color, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Changer pour ce plan</button>}
                </div>
              )
            })}
          </div>

          <div style={{ ...card, marginTop: 14, textAlign: 'center' as const, background: '#0a1628' }}>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Besoin d'un plan personnalisé ?</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 12 }}>Contactez Francis Tech pour une offre sur mesure</div>
            <a href="https://wa.me/221770000000" target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 10, background: '#25D366', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>📱 WhatsApp</a>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
