'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  title: string
  subtitle?: string
  onMenuClick?: () => void
  showMenuButton?: boolean
}

interface SessionUser { nom: string; role: string; tenant_nom: string }

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propriétaire', manager: 'Manager', comptable: 'Comptable',
  caissier: 'Caissier', vendeur: 'Vendeur', magasinier: 'Magasinier',
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  owner:      { bg: '#e8f8f2', color: '#0f6e56' },
  manager:    { bg: '#e6f1fb', color: '#185FA5' },
  comptable:  { bg: '#eeedfe', color: '#534AB7' },
  caissier:   { bg: '#faeeda', color: '#BA7517' },
  vendeur:    { bg: '#f1efe8', color: '#5F5E5A' },
  magasinier: { bg: '#faece7', color: '#D85A30' },
}

export default function Header({ title, subtitle, onMenuClick, showMenuButton }: HeaderProps) {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setUser(d.user) }).catch(() => {})
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
  }

  const initiale = user?.nom?.[0]?.toUpperCase() || '?'
  const roleStyle = ROLE_COLORS[user?.role || ''] || { bg: '#f1efe8', color: '#888' }

  return (
    <header style={{
      height: 60, background: '#fff', borderBottom: '1px solid #f0f0f0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', position: 'sticky', top: 0, zIndex: 30,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {/* Bouton hamburger mobile */}
        {showMenuButton && (
          <button onClick={onMenuClick} style={{
            width: 36, height: 36, borderRadius: 8, border: 'none',
            background: '#f5f5f5', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            fontSize: 18,
          }}>☰</button>
        )}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 11, color: '#999', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</p>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Badge rôle — caché sur très petit écran */}
        <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: roleStyle.bg, color: roleStyle.color, display: showMenuButton ? 'none' : 'inline' }}>
          {ROLE_LABELS[user?.role || ''] || user?.role || '…'}
        </span>

        {/* Menu utilisateur */}
        <div style={{ position: 'relative' }}>
          <div onClick={() => setShowMenu(!showMenu)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px',
            borderRadius: 8, background: '#f5f5f5', cursor: 'pointer',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg,#1d9e75,#0f6e56)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{initiale}</div>
            <div style={{ display: showMenuButton ? 'none' : 'block' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.3 }}>{user?.nom || '…'}</div>
              <div style={{ fontSize: 10, color: '#999' }}>{user?.tenant_nom || '…'}</div>
            </div>
            <span style={{ fontSize: 10, color: '#aaa' }}>▾</span>
          </div>

          {showMenu && (
            <div style={{
              position: 'absolute', right: 0, top: '110%',
              background: '#fff', borderRadius: 10, padding: 8,
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              border: '1px solid #f0f0f0', minWidth: 180, zIndex: 100,
            }}>
              <div style={{ padding: '8px 12px', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.nom}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{user?.tenant_nom}</div>
                <div style={{ fontSize: 10, marginTop: 2, padding: '2px 8px', borderRadius: 20, background: roleStyle.bg, color: roleStyle.color, display: 'inline-block' }}>
                  {ROLE_LABELS[user?.role || ''] || user?.role}
                </div>
              </div>
              <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
              <button onClick={logout} style={{
                width: '100%', padding: '9px 12px', borderRadius: 7,
                border: 'none', background: 'transparent', cursor: 'pointer',
                textAlign: 'left', fontSize: 13, color: '#D85A30', fontWeight: 500,
              }}>⏻ Se déconnecter</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
