import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/db";
import { Notification } from "@/lib/models/Notification";

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


export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();

  const notification = new Notification({
    userId: body.userId,
    message: body.message,
    link: body.link,
  });

  await notification.save();


  return NextResponse.json(notification);
}