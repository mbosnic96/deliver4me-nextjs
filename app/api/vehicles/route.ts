import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import Vehicle from "@/lib/models/Vehicle";
import { dbConnect } from "@/lib/db/db";

export async function GET(request: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  const query: any = { userId: session.user.id };

  const total = await Vehicle.countDocuments(query);

  const vehicles = await Vehicle.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("vehicleTypeId", "name") 
    .lean();

const mappedVehicles = vehicles.map((v: any) => ({
  ...v,
  vehicleType: v.vehicleTypeId
    ? { name: (v.vehicleTypeId as { name: string }).name }
    : null,
  _id: (v._id as any).toString(),
  id: (v._id as any).toString(),
  createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : null,
}));


  return NextResponse.json({
    data: mappedVehicles,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const vehicle = await Vehicle.create({
      ...body,
      userId: session.user.id,
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create vehicle:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
