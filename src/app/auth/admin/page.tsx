'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/admin')
    } catch { setError('Erreur réseau') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#1d9e75,#0f6e56)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 auto 12px' }}>S</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0a1628', margin: '0 0 4px' }}>Administration</h1>
          <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>Espace réservé à Francis Tech</p>
        </div>

        {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#faece7', color: '#D85A30', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Email</label>
            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="admin@francistech.sn"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Mot de passe</label>
            <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#0a1628', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            {loading ? 'Connexion...' : 'Accéder au panneau admin'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#ccc' }}>
          <a href="/auth/login" style={{ color: '#1d9e75', textDecoration: 'none' }}>← Retour login boutiques</a>
        </div>
      </div>
    </div>
  )
}
