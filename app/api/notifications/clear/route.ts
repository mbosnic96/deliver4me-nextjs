import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/db";
import { Notification } from "@/lib/models/Notification";

export async function DELETE(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const result = await Notification.deleteMany({ userId });

  return NextResponse.json({ success: true, deleted: result.deletedCount });
}
