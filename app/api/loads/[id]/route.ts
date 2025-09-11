import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db/db";
import Load from "@/lib/models/Load";
import Bid from "@/lib/models/Bid";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const load = await Load.findById(id);
  if (!load) return NextResponse.json({ error: "Not found" }, { status: 404 });
/*
  if (session.user.role !== "admin" && load.userId.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
*/
  return NextResponse.json(load);
}
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  try {
    const bodyText = await request.text();
    const data = bodyText.length ? JSON.parse(bodyText) : {};

    const existing = await Load.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const userRole = session.user.role;
    const isOwner = existing.userId.toString() === session.user.id;

    
    if (userRole === "admin" || isOwner) {
      if (
        ["Poslan", "Otkazan"].includes(existing.status) &&
        data.status === "Aktivan"
      ) {
        await Bid.updateMany(
          { loadId: existing._id, status: { $ne: "rejected" } },
          { status: "pending" }
        );
        data.assignedBidId = undefined; 
      }

      const updated = await Load.findByIdAndUpdate(id, data, { new: true });
      return NextResponse.json(updated);
    }

   
    if (userRole === "driver") {
      if (!("status" in data)) {
        return NextResponse.json(
          { error: "Drivers can only update status" },
          { status: 403 }
        );
      }

      const updated = await Load.findByIdAndUpdate(
        id,
        { status: data.status },
        { new: true }
      );
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("Error in PATCH:", error);
    return NextResponse.json({ error: "Invalid JSON data" }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await Load.findById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role !== "admin" && existing.userId.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Load.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
