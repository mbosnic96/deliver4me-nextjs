import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/db";
import Bid from "@/lib/models/Bid";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const loadId = searchParams.get("loadId");

  if (!loadId) {
    return NextResponse.json({ error: "loadId is required" }, { status: 400 });
  }

  const bids = await Bid.find({ loadId })
    .sort({ createdAt: -1 })
    .populate("driverId", "name userName photoUrl rating reviewsCount") 
    .lean();


  const formatted = bids.map((b: any) => ({
    ...b,
    id: b._id.toString(),
    driver: b.driverId,
    driverId: b.driverId._id.toString(),
  }));

  return NextResponse.json(formatted);
}


export async function POST(req: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { loadId, price, message } = await req.json();

    if (!loadId || !price) {
      return NextResponse.json(
        { error: "loadId and price are required" },
        { status: 400 }
      );
    }

    const newBid = await Bid.create({
      loadId,
      driverId: session.user.id, 
      price,
      message,
      status: "pending",
    });

    const populated = await newBid.populate(
      "driverId",
      "name userName photoUrl rating reviewsCount"
    );

    return NextResponse.json(
      {
        ...populated.toObject(),
        id: populated._id.toString(),
        driver: populated.driverId,
        driverId: populated.driverId._id.toString(),
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
