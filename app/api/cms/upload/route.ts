import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'uploads', 'cms');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating uploads directory:', error);
    }

    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    await writeFile(filePath, buffer);

    const fileUrl = `/api/uploads/cms/${uniqueFilename}`;

    return NextResponse.json({
      id: uuidv4(),
      filename: uniqueFilename,
      originalName: file.name,
      url: fileUrl,
      size: file.size,
      mimetype: file.type,
      uploadedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'cms');
    
    try {
      if (!existsSync(uploadsDir)) {
        return NextResponse.json([]);
      }

      const files = await readdir(uploadsDir);
      
      const fileDetails = await Promise.all(
        files.map(async (filename) => {
          const filePath = path.join(uploadsDir, filename);
          const fileStat = await stat(filePath);
          
          const getMimeType = (filename: string) => {
            const ext = filename.split('.').pop()?.toLowerCase();
            const mimeTypes: { [key: string]: string } = {
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg',
              'png': 'image/png',
              'webp': 'image/webp',
              'gif': 'image/gif',
            };
            return mimeTypes[ext || ''] || 'image/jpeg';
          };

          return {
            id: filename,
            filename,
            originalName: filename,
            url: `/api/uploads/cms/${filename}`,
            size: fileStat.size,
            mimetype: getMimeType(filename),
            uploadedAt: fileStat.birthtime.toISOString(),
          };
        })
      );

      return NextResponse.json(fileDetails);
    } catch (error) {
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error reading uploads:', error);
    return NextResponse.json({ error: 'Failed to read uploads' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename required' }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'uploads', 'cms');
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists before deleting
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    await unlink(filePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}