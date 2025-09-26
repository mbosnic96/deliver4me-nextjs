// app/api/notifications/route.ts
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

    // REMOVE SOCKET.IO CODE COMPLETELY - No real-time push needed
    // The client will fetch new notifications via polling

    try {
      const subscriptions = await PushSubscription.find({ userId: body.userId });
      
      console.log(`Found ${subscriptions.length} subscriptions for user ${body.userId}`);
      
      const expiredSubscriptions: string[] = [];

      const notificationPromises = subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            sub.subscription,
            JSON.stringify({
              _id: notification._id,
              message: notification.message,
              link: notification.link || '/notifications',
              createdAt: notification.createdAt,
            })
          );
          console.log(`Push notification sent successfully to ${sub.subscription.endpoint}`);
        } catch (err: any) {
          console.error("Error sending to subscription:", err);
         
          if (err.statusCode === 410 || err.statusCode === 404 || err.statusCode === 400) {
            expiredSubscriptions.push(String(sub._id));
            console.log(`Subscription expired/invalid, marking for deletion: ${sub.subscription.endpoint}`);
          }
        }
      });

      await Promise.allSettled(notificationPromises);

      if (expiredSubscriptions.length > 0) {
        await PushSubscription.deleteMany({ 
          _id: { $in: expiredSubscriptions } 
        });
        console.log(`Removed ${expiredSubscriptions.length} expired subscriptions`);
      }

    } catch (err) {
      console.error("Error processing push subscriptions:", err);
    }

    return NextResponse.json(notification);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "No userId" }, { status: 400 });

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json(notifications);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}