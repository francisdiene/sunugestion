'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PLANS = [
  { key: 'starter', label: 'Starter', prix: '5 000 XOF/mois', desc: '1 utilisateur · Ventes & Stock', color: '#888' },
  { key: 'pro', label: 'Pro', prix: '15 000 XOF/mois', desc: '10 utilisateurs · Tous modules', color: '#1d9e75' },
  { key: 'business', label: 'Business', prix: '35 000 XOF/mois', desc: 'Illimité · Multi-boutiques + API', color: '#534AB7' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nom_boutique: '', prenom: '', nom: '', email: '',
    password: '', confirm_password: '', telephone: '', ninea: '', plan: 'pro',
  })

  const inp = { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }
  const lbl = { fontSize: 13, fontWeight: 500 as const, color: '#444', display: 'block' as const, marginBottom: 6 }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    if (step === 2) { setStep(3); return }

    // Step 3 — soumettre
    if (form.password !== form.confirm_password) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur'); return }
      router.push('/dashboard')
    } catch { setError('Erreur réseau') }
    finally { setLoading(false) }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', background: '#f8f9fa', fontFamily: 'Inter, sans-serif' }}>

      {/* Panel gauche */}
      <div style={{ width: 420, background: '#0a1628', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#1d9e75,#0f6e56)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>S</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>SunuGestion</div>
            <div style={{ color: '#5de3b0', fontSize: 11 }}>PME · Sénégal</div>
          </div>
        </div>

        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 12px', lineHeight: 1.3 }}>
          Gérez votre boutique intelligemment
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, margin: '0 0 40px' }}>
          Ventes, stock, comptabilité SYSCOHADA et analytics — tout en un seul outil conçu pour les PME du Sénégal.
        </p>

        {[
          { icon: '◎', label: 'Facturation & caisse', desc: 'Factures PDF, tickets, Wave/OM' },
          { icon: '▤', label: 'Stock multi-dépôts', desc: 'Alertes, mouvements, inventaire' },
          { icon: '≡', label: 'Comptabilité SYSCOHADA', desc: 'Journal automatique, bilan' },
          { icon: '◈', label: 'Analytics temps réel', desc: 'CA, marges, top produits' },
        ].map(f => (
          <div key={f.label} style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(29,158,117,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#5de3b0', flexShrink: 0 }}>{f.icon}</div>
            <div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{f.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Panel droit */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* Steps indicator */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
            {['Boutique', 'Plan', 'Compte'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: step > i + 1 ? '#1d9e75' : step === i + 1 ? '#0a1628' : '#e8e8e8', color: step >= i + 1 ? '#fff' : '#aaa' }}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? '#1a1a1a' : '#aaa' }}>{s}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 1, background: step > i + 1 ? '#1d9e75' : '#e8e8e8', margin: '0 12px' }} />}
              </div>
            ))}
          </div>

          {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#faece7', color: '#D85A30', fontSize: 13, marginBottom: 20 }}>{error}</div>}

          <form onSubmit={handleSubmit}>

            {/* STEP 1 — Boutique */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Votre boutique</h2>
                <p style={{ fontSize: 14, color: '#888', margin: '0 0 28px' }}>Informations sur votre commerce</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={lbl}>Nom de la boutique *</label>
                    <input required value={form.nom_boutique} onChange={e => setForm({ ...form, nom_boutique: e.target.value })} placeholder="Ex: Boutique Diallo, Superette Sandaga..." style={inp} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={lbl}>Téléphone</label>
                      <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="+221 77 000 00 00" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>NINEA</label>
                      <input value={form.ninea} onChange={e => setForm({ ...form, ninea: e.target.value })} placeholder="Optionnel" style={inp} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 — Plan */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Choisissez votre plan</h2>
                <p style={{ fontSize: 14, color: '#888', margin: '0 0 28px' }}>Commencez gratuitement pendant 14 jours</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {PLANS.map(p => (
                    <div key={p.key} onClick={() => setForm({ ...form, plan: p.key })} style={{
                      padding: '16px 20px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${form.plan === p.key ? p.color : '#e8e8e8'}`,
                      background: form.plan === p.key ? p.color + '08' : '#fff',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'all .15s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${p.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {form.plan === p.key && <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: p.color }}>{p.label}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>{p.desc}</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: p.color }}>{p.prix}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3 — Compte */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Créez votre compte</h2>
                <p style={{ fontSize: 14, color: '#888', margin: '0 0 28px' }}>Vous serez le propriétaire de la boutique</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={lbl}>Prénom *</label>
                      <input required value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Nom *</label>
                      <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={inp} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Email *</label>
                    <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Mot de passe *</label>
                    <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 caractères" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Confirmer le mot de passe *</label>
                    <input required type="password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} style={inp} />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
              {step > 1 ? (
                <button type="button" onClick={() => setStep(step - 1)} style={{ padding: '11px 20px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', fontSize: 14, cursor: 'pointer', color: '#666' }}>← Retour</button>
              ) : (
                <Link href="/auth/login" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>Déjà un compte ?</Link>
              )}
              <button type="submit" disabled={loading} style={{ padding: '11px 28px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#1d9e75,#0f6e56)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Création...' : step < 3 ? 'Continuer →' : 'Créer mon compte'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
