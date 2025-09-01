import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { dbConnect } from "@/lib/db/db";
import Load from "@/lib/models/Load";


export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const loadId = params.id
    const formData = await request.formData()
    const images = formData.getAll('images') as File[]
    
    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      )
    }

    // Find the load
    const load = await Load.findById(loadId)
    if (!load) {
      return NextResponse.json(
        { error: 'Load not found' },
        { status: 404 }
      )
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'loads', loadId)
    
    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const imageUrls: string[] = []

    // Process each image
    for (const image of images) {
      const bytes = await image.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Generate unique filename
      const timestamp = Date.now()
      const originalName = image.name.replace(/\s+/g, '-')
      const filename = `${timestamp}-${originalName}`
      const filepath = path.join(uploadDir, filename)
      
      // Write file to disk
      await writeFile(filepath, buffer)
      
      // Store relative path in database
      const imageUrl = `/uploads/loads/${loadId}/${filename}`
      imageUrls.push(imageUrl)
    }

    // Update load with new images
    load.images = [...(load.images || []), ...imageUrls]
    await load.save()

    return NextResponse.json({
      message: 'Images uploaded successfully',
      images: imageUrls
    })

  } catch (error) {
    console.error('Error uploading images:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
// Optional: Add DELETE endpoint to remove images
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect()
    
    const loadId = params.id
    const { imageUrl } = await request.json()
    
    const load = await Load.findById(loadId)
    if (!load) {
      return NextResponse.json(
        { error: 'Load not found' },
        { status: 404 }
      )
    }

    // Remove image from array
    load.images = load.images.filter((img: string) => img !== imageUrl)
    await load.save()

    // Optional: Delete the actual file from disk
     const filepath = path.join(process.cwd(), 'public', imageUrl)
     if (existsSync(filepath)) {
      await unlink(filepath)
    }

    return NextResponse.json({
      message: 'Image deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function unlink(filepath: string) {
    throw new Error('Function not implemented.');
}
