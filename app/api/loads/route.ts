import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db/db";
import Load from "@/lib/models/Load";
import Bid from "@/lib/models/Bid";

export async function GET(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  let query = {};

  if (session.user.role === "admin") {
    query = {};
  } else if (session.user.role === "client") {
    query = { userId: session.user.id };
  } else if (session.user.role === "driver") {
    const acceptedBids = await Bid.find({
      driverId: session.user.id,
      status: "accepted",
    }).select("loadId");

    const loadIds = acceptedBids.map(bid => bid.loadId);
    query = { _id: { $in: loadIds } };
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const total = await Load.countDocuments(query);
  const loads = await Load.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return NextResponse.json({ data: loads, total, page, limit });
}


export async function POST(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  data.userId = session.user.id;

  const newLoad = await Load.create(data);
  return NextResponse.json(newLoad, { status: 201 });
}
