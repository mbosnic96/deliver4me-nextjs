import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import MessageModel from "@/lib/models/Message";
import { dbConnect } from "@/lib/db/db";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await req.json();
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    // Mark all messages as read for this user
    await MessageModel.updateMany(
      { conversationId, receiver: session.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    // Emit socket event to conversation room
    const io = (req as any).socket?.server?.io;
    if (io) {
      io.to(conversationId).emit("messages_read", {
        conversationId,
        userId: session.user.id,
      });

      // Optional: update global unread count for this user
      const unreadCount = await MessageModel.countDocuments({
        receiver: session.user.id,
        isRead: false,
      });
      io.to(session.user.id).emit("global_unread_update", { unreadCount });
    } else {
      console.warn("⚠️ Socket.IO not initialized, skipping real-time update");
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Mark-read error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}
