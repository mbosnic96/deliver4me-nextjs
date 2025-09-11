import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db/db";
import Load from "@/lib/models/Load";
import Bid from "@/lib/models/Bid";

export async function GET() {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let loads;

  if (session.user.role === "admin") {
    // Admin sees all
    loads = await Load.find().sort({ createdAt: -1 });
  } else if (session.user.role === "client") {
    // Client sees only their own loads
    loads = await Load.find({ userId: session.user.id }).sort({ createdAt: -1 });
  } else if (session.user.role === "driver") {
    // Driver sees only loads where he has an accepted bid
    const acceptedBids = await Bid.find({
      driverId: session.user.id,
      status: "accepted",
    }).select("loadId");

    const loadIds = acceptedBids.map(bid => bid.loadId);
    loads = await Load.find({ _id: { $in: loadIds } }).sort({ createdAt: -1 });
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(loads);
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
