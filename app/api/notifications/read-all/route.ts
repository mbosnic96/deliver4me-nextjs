import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/db";
import { Notification } from "@/lib/models/Notification";

export async function PATCH(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const result = await Notification.updateMany(
    { userId, seen: false },
    { $set: { seen: true } }
  );

  return NextResponse.json({ success: true, updated: result.modifiedCount });
}
