import { NextResponse } from "next/server";
import Vehicle from "@/lib/models/Vehicle";

export async function GET(
  req: Request,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // Explicitly await if params is a Promise
    const { id: userId } = await context.params;

    const vehicles = await Vehicle.find({ userId }).lean().exec();
    return NextResponse.json(vehicles);
  } catch (err: any) {
    console.error("Failed to fetch vehicles:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
