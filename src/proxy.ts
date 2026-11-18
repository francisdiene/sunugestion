
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { type Role, type Module, canView } from '@/lib/auth/roles'

// Configuration JWT
const jwtSecret = process.env.JWT_SECRET

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET absent ou trop court')
}

const JWT_SECRET = new TextEncoder().encode(jwtSecret)

// Routes publiques
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/admin',
  '/api/auth/login',
  '/api/auth/register',
  '/api/admin/login',
  '/catalogue',
  '/api/public',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  )
}

const PAGE_MODULE: Record<string, Module> = {
  '/dashboard/analytics': 'analytics',
  '/dashboard/ventes': 'ventes',
  '/dashboard/pos': 'ventes',
  '/dashboard/clients': 'clients',
  '/dashboard/produits': 'produits',
  '/dashboard/stock': 'stock',
  '/dashboard/inventaire': 'stock',
  '/dashboard/fournisseurs': 'fournisseurs',
  '/dashboard/achats': 'achats',
  '/dashboard/depenses': 'depenses',
  '/dashboard/employes': 'employes',
  '/dashboard/equipe': 'equipe',
  '/dashboard/parametres': 'parametres',
}

const API_MODULE: Record<string, Module> = {
  '/api/analytics': 'analytics',
  '/api/ventes': 'ventes',
  '/api/clients': 'clients',
  '/api/produits': 'produits',
  '/api/stock': 'stock',
  '/api/fournisseurs': 'fournisseurs',
  '/api/achats': 'achats',
  '/api/depenses': 'depenses',
  '/api/employes': 'employes',
  '/api/equipe': 'equipe',
  '/api/tenants': 'parametres',
}

function getModule(
  pathname: string,
  map: Record<string, Module>
): Module | null {
  for (const [path, mod] of Object.entries(map)) {
    if (pathname === path || pathname.startsWith(`${path}/`)) {
      return mod
    }
  }

  return null
}

function unauthorized(pathname: string, request: NextRequest) {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    )
  }

  return NextResponse.redirect(
    new URL('/auth/login', request.url)
  )
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ressources publiques Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/icon-192.png' ||
    pathname === '/icon-512.png' ||
    pathname === '/manifest.json' ||
    pathname === '/terangagestion-icon.svg' ||
    pathname === '/terangagestion-logo.png' ||
    pathname === '/terangagestion-logo.svg'
  ) {
    return NextResponse.next()
  }

  // Routes publiques
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // SUPERADMIN
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/admin')
  ) {
    const adminToken =
      request.cookies.get('sg_admin_token')?.value

    if (!adminToken) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Non autorisé' },
          { status: 401 }
        )
      }

      return NextResponse.redirect(
        new URL('/auth/admin', request.url)
      )
    }

    try {
      const { payload } = await jwtVerify(
        adminToken,
        JWT_SECRET
      )

      if (
        payload.role !== 'superadmin' ||
        typeof payload.adminId !== 'string'
      ) {
        throw new Error('Token administrateur invalide')
      }

      // Remplacement des en-têtes entrants
      const headers = new Headers(request.headers)

      headers.set('x-admin-role', 'superadmin')
      headers.set('x-admin-id', payload.adminId)

      return NextResponse.next({
        request: { headers },
      })

    } catch {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Session administrateur invalide' },
          { status: 401 }
        )
      }

      return NextResponse.redirect(
        new URL('/auth/admin', request.url)
      )
    }
  }

  // UTILISATEURS DES BOUTIQUES
  const token = request.cookies.get('sg_token')?.value

  if (!token) {
    return unauthorized(pathname, request)
  }

  let tenantId: string
  let userId: string
  let role: Role

  try {
    const { payload } = await jwtVerify(
      token,
      JWT_SECRET
    )

    if (
      typeof payload.tenantId !== 'string' ||
      typeof payload.userId !== 'string' ||
      typeof payload.role !== 'string'
    ) {
      throw new Error('Token utilisateur invalide')
    }

    tenantId = payload.tenantId
    userId = payload.userId
    role = payload.role as Role

  } catch {
    return unauthorized(pathname, request)
  }

  // Permissions des pages
  if (
    !pathname.startsWith('/api/') &&
    pathname.startsWith('/dashboard/')
  ) {
    const mod = getModule(pathname, PAGE_MODULE)

    if (mod && !canView(role, mod)) {
      return NextResponse.redirect(
        new URL('/dashboard/ventes', request.url)
      )
    }
  }

  // Permissions des API
  if (
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/auth')
  ) {
    const mod = getModule(pathname, API_MODULE)

    if (mod && !canView(role, mod)) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      )
    }
  }

  // En-têtes transmis aux routes API
  const headers = new Headers(request.headers)

  headers.set('x-tenant-id', tenantId)
  headers.set('x-user-id', userId)
  headers.set('x-user-role', role)

  return NextResponse.next({
    request: { headers },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
