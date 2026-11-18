'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { type Role, type Module, canView } from '@/lib/auth/roles'

const ALL_NAV = [
  { group: 'Principal', items: [
    { href: '/dashboard', label: 'Tableau de bord', icon: '⊞', module: 'dashboard' as Module },
    { href: '/dashboard/analytics', label: 'Analytics', icon: '◈', module: 'analytics' as Module },
  ]},
  { group: 'Commerce', items: [
    { href: '/dashboard/pos', label: 'Point de vente', icon: '⊡', module: 'ventes' as Module },
    { href: '/dashboard/ventes', label: 'Ventes & Factures', icon: '◎', module: 'ventes' as Module },
    { href: '/dashboard/clients', label: 'Clients', icon: '◉', module: 'clients' as Module },
    { href: '/dashboard/produits', label: 'Produits', icon: '▣', module: 'produits' as Module },
  ]},
  { group: 'Stock', items: [
    { href: '/dashboard/stock', label: 'Stock & Mouvements', icon: '▤', module: 'stock' as Module },
    { href: '/dashboard/inventaire', label: 'Inventaire', icon: '▦', module: 'stock' as Module },
  ]},
  { group: 'Achats', items: [
    { href: '/dashboard/fournisseurs', label: 'Fournisseurs', icon: '◐', module: 'fournisseurs' as Module },
    { href: '/dashboard/achats', label: 'Achats', icon: '◑', module: 'achats' as Module },
  ]},
  { group: 'Finances', items: [
    { href: '/dashboard/depenses', label: 'Dépenses', icon: '◒', module: 'depenses' as Module },
    { href: '/dashboard/employes', label: 'Employés & Paie', icon: '◓', module: 'employes' as Module },
  ]},
  { group: 'Gestion', items: [
    { href: '/dashboard/equipe', label: 'Équipe', icon: '◫', module: 'equipe' as Module },
    { href: '/dashboard/parametres', label: 'Paramètres', icon: '◬', module: 'parametres' as Module },
  ]},
]

interface SidebarProps { onClose?: () => void }

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const [role, setRole] = useState<Role | null>(null)
  const [nomComplet, setNomComplet] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) { setRole(d.user.role as Role); setNomComplet(d.user.nom) }
    }).catch(() => setRole('vendeur'))
  }, [])

  const nav = role ? ALL_NAV.map(s => ({
    ...s, items: s.items.filter(i => canView(role, i.module))
  })).filter(s => s.items.length > 0) : []

  return (
    <aside style={{
      width: 240, height: '100%', background: '#0a1628',
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      {/* Logo + bouton fermer */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#1d9e75,#0f6e56)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff', flexShrink: 0 }}><img src="/terangagestion-icon.svg" alt="" width="34" height="34" /></div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>TerangaGestion</div>
            <div style={{ color: '#5de3b0', fontSize: 10 }}>PME · Sénégal</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ border: 'none', background: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20, padding: 4 }}>✕</button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '10px 8px' }}>
        {role === null ? (
          <div style={{ padding: '20px 8px', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Chargement…</div>
        ) : nav.map(section => (
          <div key={section.group} style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.12em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', padding: '8px 8px 4px' }}>
              {section.group}
            </div>
            {section.items.map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href + item.label} href={item.href}
                  onClick={onClose}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 8, marginBottom: 1,
                    textDecoration: 'none',
                    background: active ? 'rgba(29,158,117,0.18)' : 'transparent',
                    color: active ? '#5de3b0' : 'rgba(255,255,255,0.6)',
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    borderLeft: active ? '2px solid #1d9e75' : '2px solid transparent',
                  }}>
                  <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{nomComplet}</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>Francis Tech © 2025</div>
      </div>
    </aside>
  )
}
