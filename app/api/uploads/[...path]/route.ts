import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import mime from 'mime';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const params = await context.params;
    const filePath = path.join(process.cwd(), 'uploads', ...params.path);
    const fileBuffer = await fs.readFile(filePath);
    const contentType = mime.getType(filePath) || 'application/octet-stream';

    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    ) as ArrayBuffer;

    return new NextResponse(arrayBuffer, {
      headers: { 'Content-Type': contentType },
    });
  } catch {
    return new NextResponse('File not found', { status: 404 });
  }
}