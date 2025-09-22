import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/db";
import Bid from "@/lib/models/Bid";
import Load from "@/lib/models/Load";
import Wallet from "@/lib/models/Wallet";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bid = await Bid.findById(params.id).populate(
    "driverId",
    "name userName photoUrl rating reviewsCount"
  );
  if (!bid) {
    return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  }

  const load = await Load.findById(bid.loadId);
  if (!load) {
    return NextResponse.json({ error: "Load not found" }, { status: 404 });
  }

  // Only the load owner or admin can cancel
  if (
    load.userId.toString() !== session.user.id &&
    session.user.role !== "admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only accepted bids can be canceled
  if (bid.status !== "accepted") {
    return NextResponse.json(
      { error: "Only accepted bids can be canceled" },
      { status: 400 }
    );
  }

  // Refund escrow to client
  const clientWallet = await Wallet.findOne({ userId: load.userId });
  if (clientWallet && clientWallet.escrow >= bid.price) {
    await Wallet.findByIdAndUpdate(
      clientWallet._id,
      {
        $inc: { escrow: -bid.price, balance: bid.price },
        $push: {
          transactions: {
            amount: bid.price,
            type: "credit",
            description: `Escrow refunded for canceled bid ${bid._id} on load ${load._id}`,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );
  }

  bid.status = "canceled";
  load.status = "Aktivan";
  load.assignedBidId = undefined;

  await Promise.all([
    bid.save(),
    load.save(),
    Bid.updateMany(
      { loadId: load._id, _id: { $ne: bid._id }, status: "rejected" },
      { status: "pending" }
    ),
  ]);

  return NextResponse.json({ message: "Bid canceled successfully", bid, load });
}
