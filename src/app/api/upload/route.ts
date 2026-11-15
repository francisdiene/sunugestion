import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id')!
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 })

    // Vérification type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format non supporté — JPG, PNG, WEBP uniquement' }, { status: 400 })
    }

    // Vérification taille (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop lourd — 2MB maximum' }, { status: 400 })
    }

    // Créer le dossier tenant
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', tenantId)
    await mkdir(uploadDir, { recursive: true })

    // Nom unique
    const mimeToExt: Record<string, string> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
   }
    const ext = mimeToExt[file.type] || file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const filepath = path.join(uploadDir, filename)

    // Écrire le fichier
    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    const url = `/uploads/${tenantId}/${filename}`
    return NextResponse.json({ url }, { status: 201 })
  } catch (e) {
    console.error('Upload error:', e)
    return NextResponse.json({ error: 'Erreur upload' }, { status: 500 })
  }
}
