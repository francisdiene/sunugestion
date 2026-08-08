import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { type Role, type Module, canView } from '@/lib/auth/roles'

const PUBLIC_PATHS = [
  '/auth/login', '/auth/register', '/auth/admin',
  '/api/auth/login', '/api/auth/register', '/api/admin/login',
  '/catalogue', '/api/public'
]

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'sunugestion-secret-key-2025-francis-tech')

const PAGE_MODULE: Record<string, Module> = {
  '/dashboard/analytics':    'analytics',
  '/dashboard/ventes':       'ventes',
  '/dashboard/pos':          'ventes',
  '/dashboard/clients':      'clients',
  '/dashboard/produits':     'produits',
  '/dashboard/stock':        'stock',
  '/dashboard/inventaire':   'stock',
  '/dashboard/fournisseurs': 'fournisseurs',
  '/dashboard/achats':       'achats',
  '/dashboard/depenses':     'depenses',
  '/dashboard/employes':     'employes',
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

  // ─── SUPERADMIN ───────────────────────────────────────────────
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const adminToken = request.cookies.get('sg_admin_token')?.value
    if (!adminToken) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
      return NextResponse.redirect(new URL('/auth/admin', request.url))
    }
    try {
      const { payload } = await jwtVerify(adminToken, JWT_SECRET)
      if (payload.role !== 'superadmin') throw new Error('Not superadmin')
      const headers = new Headers(request.headers)
      headers.set('x-admin-role', 'superadmin')
      headers.set('x-admin-id', payload.adminId as string)
      return NextResponse.next({ request: { headers } })
    } catch {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
      return NextResponse.redirect(new URL('/auth/admin', request.url))
    }
  }

  // ─── TENANT USERS ─────────────────────────────────────────────
  const token = request.cookies.get('sg_token')?.value
  let tenantId = ''; let userId = ''; let role: Role = 'owner'

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      tenantId = payload.tenantId as string
      userId   = payload.userId as string
      role     = payload.role as Role
    } catch {
      if (!pathname.startsWith('/api/')) return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  } else {
    if (!pathname.startsWith('/api/')) return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Vérification permissions pages
  if (!pathname.startsWith('/api/') && pathname.startsWith('/dashboard/')) {
    const mod = getModule(pathname, PAGE_MODULE)
    if (mod && !canView(role, mod)) {
      return NextResponse.redirect(new URL('/dashboard/ventes', request.url))
    }
  }

  // Vérification permissions API
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const mod = getModule(pathname, API_MODULE)
    if (mod && !canView(role, mod)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
  }

  const headers = new Headers(request.headers)
  headers.set('x-tenant-id', tenantId)
  headers.set('x-user-id', userId)
  headers.set('x-user-role', role)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
