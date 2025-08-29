import { NextResponse } from "next/server";
import Vehicle from "@/lib/models/Vehicle";

export async function GET(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    const vehicles = await Vehicle.find({ userId }).lean().exec();

    return NextResponse.json(vehicles);
  } catch (err: any) {
    console.error("Failed to fetch vehicles:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
