import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

interface RouteContext {
  params: Promise<{ filename: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { filename } = await context.params;

  try {
    const filePath = path.join(process.cwd(), 'uploads', 'cms', filename);

    // Check if file exists
    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }
    const fileBuffer = await readFile(filePath);

    const bodyUint8 = new Uint8Array(fileBuffer);

    const getContentType = (filename: string) => {
      const ext = filename.split('.').pop()?.toLowerCase();
      const contentTypes: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif',
      };
      return contentTypes[ext || ''] || 'image/jpeg';
    };

    const contentType = getContentType(filename);
    return new NextResponse(bodyUint8, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000', 
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Error serving file', { status: 500 });
  }
}