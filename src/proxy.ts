import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { type Role, type Module, canView } from '@/lib/auth/roles'

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/api/auth/login', '/api/auth/register', '/catalogue', '/api/public']
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'sunugestion-secret-key-2025-francis-tech')
const DEV_TENANT = 'a0000000-0000-0000-0000-000000000001'
const DEV_USER   = 'a0000000-0000-0000-0000-000000000001'

// Mapping URL → module
const PAGE_MODULE: Record<string, Module> = {
  '/dashboard/analytics':    'analytics',
  '/dashboard/ventes':       'ventes',
  '/dashboard/clients':      'clients',
  '/dashboard/produits':     'produits',
  '/dashboard/stock':        'stock',
  '/dashboard/fournisseurs': 'fournisseurs',
  '/dashboard/achats':       'achats',
  '/dashboard/depenses':     'depenses',
  '/dashboard/employes':     'employes',
  '/dashboard/comptabilite': 'comptabilite',
  '/dashboard/equipe':       'equipe',
  '/dashboard/parametres':   'parametres',
}

const API_MODULE: Record<string, Module> = {
  '/api/analytics':    'analytics',
  '/api/ventes':       'ventes',
  '/api/clients':      'clients',
  '/api/produits':     'produits',
  '/api/stock':        'stock',
  '/api/fournisseurs': 'fournisseurs',
  '/api/achats':       'achats',
  '/api/depenses':     'depenses',
  '/api/employes':     'employes',
  '/api/comptabilite': 'comptabilite',
  '/api/equipe':       'equipe',
  '/api/tenants':      'parametres',
}

function getModule(pathname: string, map: Record<string, Module>): Module | null {
  for (const [path, mod] of Object.entries(map)) {
    if (pathname.startsWith(path)) return mod
  }
  return null
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return NextResponse.next()

  const token = request.cookies.get('sg_token')?.value
    || request.headers.get('authorization')?.replace('Bearer ', '')

  let tenantId = DEV_TENANT
  let userId   = DEV_USER
  let role: Role = 'owner'
  let authenticated = false

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      tenantId      = payload.tenantId as string
      userId        = payload.userId as string
      role          = payload.role as Role
      authenticated = true
    } catch {
      if (!pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
    }
  } else {
    if (!pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // Vérification des permissions sur les pages UI
  if (!pathname.startsWith('/api/') && pathname.startsWith('/dashboard/')) {
    const mod = getModule(pathname, PAGE_MODULE)
    if (mod && !canView(role, mod)) {
      // Rediriger vers la première page accessible
      return NextResponse.redirect(new URL('/dashboard/ventes', request.url))
    }
  }

  // Vérification des permissions sur les API
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const mod = getModule(pathname, API_MODULE)
    if (mod && !canView(role, mod)) {
      return NextResponse.json({ error: 'Accès refusé — permissions insuffisantes' }, { status: 403 })
    }
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-id', tenantId)
  requestHeaders.set('x-user-id', userId)
  requestHeaders.set('x-user-role', role)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
