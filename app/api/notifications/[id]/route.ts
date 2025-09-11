import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/db";
import { Notification } from "@/lib/models/Notification";

interface Params {
  params: { id: string };
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await dbConnect();
    const { id } = params;

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
