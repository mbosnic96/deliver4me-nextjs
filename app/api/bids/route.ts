import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/db";
import Bid from "@/lib/models/Bid";
import Vehicle from "@/lib/models/Vehicle";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";

// Helper za mapiranje bid-a
function formatBid(bid: any) {
  return {
    ...bid,
    id: bid._id.toString(),
    driver: bid.driverId,
    driverId: bid.driverId?._id?.toString(),
    vehicle: bid.vehicleId,
    vehicleId: bid.vehicleId?._id?.toString(),
  };
}

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const loadId = searchParams.get("loadId");

  if (!loadId) {
    return NextResponse.json({ error: "loadId is required" }, { status: 400 });
  }

  const bids = await Bid.find({ loadId })
    .sort({ createdAt: -1 })
    .populate({
      path: "driverId",
      select: "name photoUrl rating reviewsCount",
      strictPopulate: false,
    })
    .populate({
      path: "vehicleId",
      select: "brand model plateNumber volume width length height",
      strictPopulate: false,
    })
    .lean();

  const formatted = bids.map(formatBid);

  return NextResponse.json(formatted);
}

export async function POST(req: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { loadId, price, message, vehicleId } = await req.json();

    if (!loadId || !price || !vehicleId) {
      return NextResponse.json(
        { error: "loadId, price and vehicleId are required" },
        { status: 400 }
      );
    }

   
    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId: session.user.id });
    if (!vehicle) {
      return NextResponse.json({ error: "Invalid vehicle" }, { status: 400 });
    }

    const newBid = await Bid.create({
      loadId,
      driverId: session.user.id,
      vehicleId,
      price,
      message,
      status: "pending",
    });

    // Populate odvojeno jer baguje oko vozila kad je skupa
    await newBid.populate({
      path: "driverId",
      select: "name photoUrl rating reviewsCount",
      strictPopulate: false,
    });
    await newBid.populate({
      path: "vehicleId",
      select: "brand model plateNumber volume width length height",
      strictPopulate: false,
    });

    const response = formatBid(newBid.toObject());

    return NextResponse.json(response, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
