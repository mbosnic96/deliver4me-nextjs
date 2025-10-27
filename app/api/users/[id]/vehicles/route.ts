import { NextResponse } from "next/server";
import Vehicle from "@/lib/models/Vehicle";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  req: Request,
  context: RouteContext
) {
  try {
    const { id: userId } = await context.params;

    const vehicles = await Vehicle.find({ userId }).lean().exec();
    return NextResponse.json(vehicles);
  } catch (err: any) {
    console.error("Failed to fetch vehicles:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}