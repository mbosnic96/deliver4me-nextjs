import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const io = (req as any).socket.server.io;
  if (!io.attached) {
    io.attach((req as any).socket.server);
    io.attached = true;
  }
  return NextResponse.json({ success: true });
}