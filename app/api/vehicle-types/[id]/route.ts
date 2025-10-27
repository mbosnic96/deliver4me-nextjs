import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import VehicleType from "@/lib/models/VehicleType";
import { dbConnect } from "@/lib/db/db";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const data = await request.json();
  const updated = await VehicleType.findByIdAndUpdate(id, data, { new: true });

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params; 
  const deleted = await VehicleType.findByIdAndDelete(id);

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

