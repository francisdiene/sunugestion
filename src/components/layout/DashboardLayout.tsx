'use client'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export default function DashboardLayout({ title, subtitle, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa', fontFamily: 'Arial, sans-serif' }}>

      {/* Overlay mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        transition: 'transform 0.25s ease',
        width: 240,
      }}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Contenu principal */}
      <div style={{ flex: 1, marginLeft: isMobile ? 0 : 240, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          showMenuButton={isMobile}
        />
        <main style={{ flex: 1, padding: isMobile ? '16px 12px' : '24px 28px', maxWidth: '100%', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
