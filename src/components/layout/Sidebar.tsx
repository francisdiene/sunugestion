'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { type Role, type Module, canView } from '@/lib/auth/roles'

const ALL_NAV = [
  {
    group: 'Principal',
    items: [
      { href: '/dashboard', label: 'Tableau de bord', icon: '⊞', module: 'dashboard' as Module },
      { href: '/dashboard/analytics', label: 'Analytics', icon: '◈', module: 'analytics' as Module },
    ],
  },
  {
    group: 'Commerce',
    items: [
      { href: '/dashboard/ventes', label: 'Ventes & Caisse', icon: '◎', module: 'ventes' as Module },
      { href: '/dashboard/clients', label: 'Clients', icon: '◉', module: 'clients' as Module },
      { href: '/dashboard/produits', label: 'Produits', icon: '▣', module: 'produits' as Module },
      { href: '/dashboard/stock', label: 'Stock', icon: '▤', module: 'stock' as Module },
    ],
  },
  {
    group: 'Achats',
    items: [
      { href: '/dashboard/fournisseurs', label: 'Fournisseurs', icon: '◐', module: 'fournisseurs' as Module },
      { href: '/dashboard/achats', label: 'Achats', icon: '◑', module: 'achats' as Module },
    ],
  },
  {
    group: 'Finances',
    items: [
      { href: '/dashboard/depenses', label: 'Dépenses', icon: '◒', module: 'depenses' as Module },
      { href: '/dashboard/employes', label: 'Employés & Paie', icon: '◓', module: 'employes' as Module },
      { href: '/dashboard/comptabilite', label: 'Comptabilité SYSCOHADA', icon: '≡', module: 'comptabilite' as Module },
    ],
  },
  {
    group: 'Gestion',
    items: [
      { href: '/dashboard/equipe', label: 'Équipe', icon: '◫', module: 'equipe' as Module },
      { href: '/dashboard/parametres', label: 'Paramètres', icon: '◬', module: 'parametres' as Module },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [role, setRole] = useState<Role | null>(null)
  const [nomComplet, setNomComplet] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setRole(d.user.role as Role)
          setNomComplet(d.user.nom)
        }
      })
      .catch(() => setRole('vendeur'))
  }, [])

  const nav = role ? ALL_NAV.map(section => ({
    ...section,
    items: section.items.filter(item => canView(role, item.module)),
  })).filter(section => section.items.length > 0) : []

  return (
    <aside style={{
      width: 240, minHeight: '100vh', background: '#0a1628',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, bottom: 0,
      zIndex: 50, overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1d9e75, #0f6e56)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0 }}>S</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>SunuGestion</div>
          <div style={{ color: '#5de3b0', fontSize: 10, letterSpacing: '.05em' }}>PME · Sénégal</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {role === null ? (
          <div style={{ padding: '20px 8px', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
            Chargement…
          </div>
        ) : (
          nav.map((section) => (
            <div key={section.group} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.12em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', padding: '12px 8px 6px' }}>
                {section.group}
              </div>
              {section.items.map((item) => {
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 8, marginBottom: 2,
                    textDecoration: 'none',
                    background: active ? 'rgba(29,158,117,0.18)' : 'transparent',
                    color: active ? '#5de3b0' : 'rgba(255,255,255,0.55)',
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    borderLeft: active ? '2px solid #1d9e75' : '2px solid transparent',
                  }}>
                    <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500, marginBottom: 2 }}>{nomComplet}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Francis Tech © 2025</div>
      </div>
    </aside>
  )
}
