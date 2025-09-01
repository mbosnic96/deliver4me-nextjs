import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db/db";
import Load from "@/lib/models/Load";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const load = await Load.findById(id);
  if (!load) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role !== "admin" && load.userId.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(load);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  try {
    const bodyText = await request.text();
    const data = bodyText.length ? JSON.parse(bodyText) : {};

    const existing = await Load.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (session.user.role !== "admin" && existing.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await Load.findByIdAndUpdate(id, data, { new: true });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in PATCH:', error);
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
