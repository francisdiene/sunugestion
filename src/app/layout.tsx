import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'TerangaGestion — Gestion PME Sénégal',
  description: 'Plateforme SaaS de gestion pour commerçants et PME au Sénégal',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, fontFamily: 'Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
