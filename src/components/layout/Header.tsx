'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  title: string
  subtitle?: string
}

interface SessionUser {
  nom: string
  role: string
  tenant_nom: string
}

const ROLE_LABELS: Record<string, string> = {
  owner:      'Propriétaire',
  manager:    'Manager',
  comptable:  'Comptable',
  caissier:   'Caissier',
  vendeur:    'Vendeur',
  magasinier: 'Magasinier',
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  owner:      { bg: '#e8f8f2', color: '#0f6e56' },
  manager:    { bg: '#e6f1fb', color: '#185FA5' },
  comptable:  { bg: '#eeedfe', color: '#534AB7' },
  caissier:   { bg: '#faeeda', color: '#BA7517' },
  vendeur:    { bg: '#f1efe8', color: '#5F5E5A' },
  magasinier: { bg: '#faece7', color: '#D85A30' },
}

export default function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user) })
      .catch(() => {})
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
  }

  const initiale = user?.nom?.[0]?.toUpperCase() || '?'
  const roleStyle = ROLE_COLORS[user?.role || ''] || { bg: '#f1efe8', color: '#888' }

  return (
    <header style={{
      height: 64, background: '#fff',
      borderBottom: '1px solid #f0f0f0',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px', position: 'sticky', top: 0, zIndex: 40,
    }}>
      <div>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 12, color: '#999', margin: 0 }}>{subtitle}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Badge rôle */}
        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: roleStyle.bg, color: roleStyle.color }}>
          {ROLE_LABELS[user?.role || ''] || user?.role || '…'}
        </span>

        {/* Menu utilisateur */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowMenu(!showMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderRadius: 8, background: '#f5f5f5', cursor: 'pointer' }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1d9e75, #0f6e56)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{initiale}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.3 }}>{user?.nom || '…'}</div>
              <div style={{ fontSize: 11, color: '#999', lineHeight: 1.2 }}>{user?.tenant_nom || '…'}</div>
            </div>
            <span style={{ fontSize: 10, color: '#aaa', marginLeft: 4 }}>▾</span>
          </div>

          {/* Dropdown */}
          {showMenu && (
            <div style={{
              position: 'absolute', right: 0, top: '110%',
              background: '#fff', borderRadius: 10, padding: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              border: '1px solid #f0f0f0', minWidth: 180, zIndex: 100,
            }}>
              <div style={{ padding: '8px 12px', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{user?.nom}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{user?.tenant_nom}</div>
              </div>
              <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
              <button
                onClick={logout}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 7,
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  textAlign: 'left', fontSize: 13, color: '#D85A30', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                ⏻ Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
