// api/socket/route.ts (or your socket handler)
import { NextRequest } from "next/server";
import { Server } from "socket.io";
import { NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  return NextResponse.json({ ok: true });
};

export const POST = async (req: NextRequest) => {
  return NextResponse.json({ ok: true });
};

export default function SocketHandler(req: any, res: any) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id);

     
      const { userId } = socket.handshake.query;
      if (userId) socket.join(userId as string);

      socket.on("disconnect", () => console.log("Socket disconnected:", socket.id));
    });
  }
  res.end();
}