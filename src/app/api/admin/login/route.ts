
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

// Configuration PostgreSQL
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL est manquante')
}

const pool = new Pool({
  connectionString: databaseUrl
})

// Configuration JWT
const jwtSecret = process.env.JWT_SECRET

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET absent ou trop court')
}

const SECRET = new TextEncoder().encode(jwtSecret)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Champs requis' },
        { status: 400 }
      )
    }

    const res = await pool.query(
      'SELECT * FROM admins WHERE email = $1 AND is_active = true',
      [email]
    )

    const admin = res.rows[0]

    if (!admin) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      )
    }

    const valid = await bcrypt.compare(password, admin.password_hash)

    if (!valid) {
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      )
    }

    await pool.query(
      'UPDATE admins SET last_login_at = NOW() WHERE id = $1',
      [admin.id]
    )

    const token = await new SignJWT({
      adminId: admin.id,
      email: admin.email,
      nom: admin.nom_complet,
      role: 'superadmin'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(SECRET)

    const response = NextResponse.json({
      success: true,
      admin: {
        nom: admin.nom_complet,
        email: admin.email
      }
    })

    response.cookies.set('sg_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Erreur connexion administrateur:', error)

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
