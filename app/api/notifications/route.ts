import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/db";
import { Notification } from "@/lib/models/Notification";
import { PushSubscription } from "@/lib/models/PushSubscription";
import webpush from 'web-push';

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body.userId || !body.message) {
      return NextResponse.json(
        { error: "UserId and message are required" },
        { status: 400 }
      );
    }

    const notification = new Notification({
      userId: body.userId,
      message: body.message,
      type: body.type || 'info',
      link: body.link,
    });

    await notification.save();

    // Send push notification
    try {
      const subscriptions = await PushSubscription.find({ userId: body.userId });
      
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            sub.subscription,
            JSON.stringify({
              _id: notification._id,
              message: notification.message,
              link: notification.link
            })
          );
        } catch (error) {
          console.error('Error sending push notification:', error);
         
        }
      }
    } catch (error) {
      console.error('Error with push notifications:', error);
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "No userId" }, { status: 400 });

  await dbConnect();
  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(notifications);
}

