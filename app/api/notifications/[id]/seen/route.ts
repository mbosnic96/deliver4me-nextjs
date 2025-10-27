import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/db";
import { Notification } from "@/lib/models/Notification";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await dbConnect();
    const { id } = await context.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { seen: true },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error marking notification as seen:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}