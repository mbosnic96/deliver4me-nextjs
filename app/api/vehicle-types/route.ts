import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import VehicleType from "@/lib/models/VehicleType";
import { dbConnect } from "@/lib/db/db";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const search = url.searchParams.get("search")?.trim() || "";

    const filters: any = {};
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } } 
      ];
    }

    const total = await VehicleType.countDocuments(filters);

    
    let query = VehicleType.find(filters).sort({ createdAt: -1 });

    if (pageParam || limitParam) {
      const page = parseInt(pageParam || "1", 10);
      const limit = parseInt(limitParam || "10", 10);
      const skip = (page - 1) * limit;
      
      query = query.skip(skip).limit(limit);
    }

    const types = await query.lean();

    // Return appropriate response format
    if (pageParam || limitParam) {
      const page = parseInt(pageParam || "1", 10);
      const limit = parseInt(limitParam || "10", 10);
      
      return NextResponse.json({
        data: types,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } else {
      return NextResponse.json({
        data: types,
        total: types.length
      });
    }
  } catch (error: any) {
    console.error("Failed to fetch vehicle types:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  const type = await VehicleType.create(data);
  return NextResponse.json(type, { status: 201 });
}