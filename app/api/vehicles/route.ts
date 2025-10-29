import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Vehicle from "@/lib/models/Vehicle";
import { dbConnect } from "@/lib/db/db";

export async function GET(request: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    .populate({
      path: "currentLoads.loadId",
      model: "Load",
      select: "title pickupCity deliveryCity status fixedPrice createdAt",
    })
    .sort({ createdAt: -1 })
    .lean();

  if (page && limit) {
    vehiclesQuery = vehiclesQuery.skip(skip).limit(limit);
  }

  const vehicles = await vehiclesQuery;

  const mappedVehicles = vehicles.map((v: any) => ({
    ...v,
    _id: v._id.toString(),
    id: v._id.toString(),
    createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : null,
    currentLoads:
      v.currentLoads?.map((load: any) => ({
        _id: load._id?.toString?.() || null,
        loadId: load.loadId?._id?.toString?.() || load.loadId || null,
        title: load.loadId?.title || "",
        pickupCity: load.loadId?.pickupCity || "",
        deliveryCity: load.loadId?.deliveryCity || "",
        status: load.status || load.loadId?.status || "active",
        fixedPrice: load.loadId?.fixedPrice || 0,
        volumeUsed: load.volumeUsed || 0,
        createdAt: load.loadId?.createdAt
          ? new Date(load.loadId.createdAt).toISOString()
          : null,
      })) || [],
  }));

  const responseData = page && limit
    ? {
        data: mappedVehicles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    : { data: mappedVehicles, total };

  return NextResponse.json(responseData);
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
