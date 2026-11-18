'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@maboutique.sn')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur de connexion')
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Erreur réseau — vérifiez votre connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f8f9fa', fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '48px 40px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 4px 32px rgba(0,0,0,0.10)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src="/terangagestion-logo.png" alt="TerangaGestion" style={{ width: 230, maxWidth: "100%", height: "auto", objectFit: "contain", margin: "0 auto 14px", display: "block" }} />
          <p style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>Connectez-vous à votre espace</p>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{
            background: '#faece7', border: '1px solid #f5c4b3',
            borderRadius: 8, padding: '10px 14px',
            fontSize: 13, color: '#712B13', marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#444', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@boutique.sn"
              required
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 8,
                border: '1px solid #e0e0e0', fontSize: 14, outline: 'none',
                boxSizing: 'border-box', transition: 'border .15s',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#444', display: 'block', marginBottom: 6 }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 8,
                border: '1px solid #e0e0e0', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#aaa' : 'linear-gradient(135deg, #1d9e75, #0f6e56)',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '13px', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8,
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#ccc', marginTop: 28 }}>
          SunuGestion © 2025 · Francis Tech · Dakar, Sénégal
        </p>
      </div>
    </main>
  )
}
