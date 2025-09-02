import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { dbConnect } from '@/lib/db/db'
import Load from '@/lib/models/Load'

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const loadId = context.params.id

  await dbConnect()

  try {
    const formData = await req.formData()
    const files = formData.getAll('images') as File[]

    if (!files.length) return NextResponse.json({ error: 'No images uploaded' }, { status: 400 })

    const load = await Load.findById(loadId)
    if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 })

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'loads', loadId)
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true })

    const imageUrls: string[] = []

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
      const filepath = path.join(uploadDir, filename)
      await writeFile(filepath, buffer)
      imageUrls.push(`/uploads/loads/${loadId}/${filename}`)
    }

    load.images = [...(load.images || []), ...imageUrls]
    await load.save()

    return NextResponse.json({ message: 'Images uploaded', images: imageUrls })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to upload images' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const loadId = context.params.id
  await dbConnect()

  try {
    const { imageUrl } = await req.json()
    const load = await Load.findById(loadId)
    if (!load) return NextResponse.json({ error: 'Load not found' }, { status: 404 })

    load.images = load.images.filter((img: string) => img !== imageUrl)
    await load.save()

    const filepath = path.join(process.cwd(), 'public', imageUrl)
    if (existsSync(filepath)) await unlink(filepath)

    return NextResponse.json({ message: 'Image deleted' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
