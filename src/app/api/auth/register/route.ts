
import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'

// Configuration JWT sécurisée
const jwtSecret = process.env.JWT_SECRET

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET absent ou trop court')
}

const JWT_SECRET = new TextEncoder().encode(jwtSecret)

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  let transactionStarted = false

  try {
    const {
      nom_boutique,
      prenom,
      nom,
      email,
      password,
      telephone,
      ninea,
      plan
    } = await request.json()

    // Validation
    if (!nom_boutique || !email || !password || !prenom || !nom) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Mot de passe minimum 6 caractères' },
        { status: 400 }
      )
    }

    // Vérifier email unique
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      )
    }

    await client.query('BEGIN')
    transactionStarted = true

    // Générer slug unique
    const slug =
      nom_boutique.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' + Date.now().toString(36)

    // Créer le tenant
    const tenantRes = await client.query(`
      INSERT INTO tenants (slug, nom, plan, ninea, telephone, email, devise)
      VALUES ($1,$2,$3,$4,$5,$6,'XOF')
      RETURNING *
    `, [
      slug,
      nom_boutique,
      plan || 'starter',
      ninea || null,
      telephone || null,
      email
    ])

    const tenant = tenantRes.rows[0]

    // Créer le dépôt principal
    await client.query(`
      INSERT INTO depots (tenant_id, nom, is_principal)
      VALUES ($1, 'Dépôt principal', true)
    `, [tenant.id])

    // Hash du mot de passe
    const passwordHash = await bcrypt.hash(password, 10)

    // Créer l'utilisateur owner
    const userRes = await client.query(`
      INSERT INTO users (
        tenant_id, email, password_hash, nom_complet, role
      )
      VALUES ($1,$2,$3,$4,'owner')
      RETURNING *
    `, [
      tenant.id,
      email,
      passwordHash,
      `${prenom} ${nom}`
    ])

    const user = userRes.rows[0]

    // Initialiser le plan comptable SYSCOHADA
    await client.query(
      'SELECT seed_plan_comptable($1)',
      [tenant.id]
    )

    await client.query('COMMIT')
    transactionStarted = false

    // Générer JWT
    const token = await new SignJWT({
      userId: user.id,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      role: 'owner',
      email: user.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    const response = NextResponse.json({
      success: true,
      message: 'Compte créé avec succès',
      user: {
        id: user.id,
        nom: user.nom_complet,
        email: user.email,
        role: 'owner',
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          nom: tenant.nom,
          plan: tenant.plan
        },
      },
    }, { status: 201 })

    response.cookies.set('sg_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response

  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK')
    }

    console.error('Register error:', error)

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )

  } finally {
    client.release()
  }
}
