import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import VehicleType from "@/lib/models/VehicleType";
import Vehicle from "@/lib/models/Vehicle";
import { dbConnect } from "@/lib/db/db";

export async function GET(request: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const pageParam = url.searchParams.get("page");
  const limitParam = url.searchParams.get("limit");
  const search = url.searchParams.get("search")?.trim().toLowerCase(); 

  const page = pageParam ? parseInt(pageParam, 10) : null;
  const limit = limitParam ? parseInt(limitParam, 10) : null;
  const skip = page && limit ? (page - 1) * limit : 0;

  const query: any = { userId: session.user.id };


  if (search) {
    query.$or = [
      { brand: { $regex: search, $options: "i" } },
      { model: { $regex: search, $options: "i" } },
      { plateNumber: { $regex: search, $options: "i" } },
    ];
  }

  const total = await Vehicle.countDocuments(query);

  let vehiclesQuery = Vehicle.find(query)
    .sort({ createdAt: -1 })
    .lean();

  if (page && limit) {
    vehiclesQuery = vehiclesQuery.skip(skip).limit(limit);
  }

  const vehicles = await vehiclesQuery;

  const mappedVehicles = vehicles.map((v: any) => ({
    ...v,
    _id: (v._id as any).toString(),
    id: (v._id as any).toString(),
    createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : null,
  }));

  if (page && limit) {
    return NextResponse.json({
      data: mappedVehicles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  return NextResponse.json({ data: mappedVehicles, total });
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
