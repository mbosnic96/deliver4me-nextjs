import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/db";
import { Notification } from "@/lib/models/Notification";
import { PushSubscription } from "@/lib/models/PushSubscription";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body.userId || !body.message) {
      return NextResponse.json({ error: "UserId and message required" }, { status: 400 });
    }

    const notification = await Notification.create({
      userId: body.userId,
      message: body.message,
      type: body.type || "info",
      link: body.link,
    });

    try {
      const io = (global as any).io;
      if (io) io.to(body.userId).emit("new-notification", notification);
    } catch (err) {
      console.warn("Socket.io not available:", err);
    }

    try {
      const subs = await PushSubscription.find({ userId: body.userId });
      for (const sub of subs) {
        try {
          await webpush.sendNotification(sub.subscription, JSON.stringify(notification));
        } catch {}
      }
    } catch {}

    return NextResponse.json(notification);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  await dbConnect();
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "No userId" }, { status: 400 });

  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json(notifications);
}
