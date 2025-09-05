import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/db";
import Bid from "@/lib/models/Bid";
import Load from "@/lib/models/Load";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// PATCH /api/bids/:id → accept or reject
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { status } = await req.json();

  if (!["accepted", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the params from the context
  const params = await context.params;
  const { id } = params;
  
  const bid = await Bid.findById(id).populate("driverId", "name userName photoUrl rating reviewsCount");

  if (!bid) {
    return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  }

  const load = await Load.findById(bid.loadId);
  if (!load) {
    return NextResponse.json({ error: "Load not found" }, { status: 404 });
  }

  // Only load owner or admin can update
  if (
    load.userId.toString() !== session.user.id &&
    session.user.role !== "admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // If accepted → mark poslan and reject all other bids
  if (status === "accepted") {
    bid.status = "accepted";
    load.status = "Poslan";
    load.assignedBidId = bid._id;
    await Promise.all([
      bid.save(),
      load.save(),
      Bid.updateMany(
        { loadId: load._id, _id: { $ne: bid._id } },
        { status: "rejected" }
      ),
    ]);
  } else {
    bid.status = "rejected";
    await bid.save();
  }

  return NextResponse.json(bid);
}