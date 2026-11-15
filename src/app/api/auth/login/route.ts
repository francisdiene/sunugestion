
import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { z } from 'zod'

// Validation des données
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// Configuration JWT sécurisée
const jwtSecret = process.env.JWT_SECRET

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET absent ou trop court')
}

const JWT_SECRET = new TextEncoder().encode(jwtSecret)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Chercher l'utilisateur
    const result = await pool.query(
      `SELECT u.*, t.slug as tenant_slug, t.nom as tenant_nom, t.plan
       FROM users u
       JOIN tenants t ON t.id = u.tenant_id
       WHERE u.email = $1 AND u.is_active = true`,
      [email]
    )

    const user = result.rows[0]

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    )

    if (!validPassword) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Générer le JWT
    const token = await new SignJWT({
      userId: user.id,
      tenantId: user.tenant_id,
      tenantSlug: user.tenant_slug,
      role: user.role,
      email: user.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    // Mettre à jour last_login
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    )

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nom: user.nom_complet,
        email: user.email,
        role: user.role,
        tenant: {
          id: user.tenant_id,
          slug: user.tenant_slug,
          nom: user.tenant_nom,
          plan: user.plan,
        },
      },
    })

    // Cookie HttpOnly sécurisé
    response.cookies.set('sg_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Login error:', error)

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
