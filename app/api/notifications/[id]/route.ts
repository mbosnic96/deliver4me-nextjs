import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/db";
import { Notification } from "@/lib/models/Notification";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    await dbConnect();
    const { id } = await context.params;

    const deleted = await Notification.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}