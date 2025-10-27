import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/db";
import Bid from "@/lib/models/Bid";
import Load from "@/lib/models/Load";
import Wallet from "@/lib/models/Wallet";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

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

  if (
    load.userId.toString() !== session.user.id &&
    session.user.role !== "admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (status === "accepted") {
    const clientWallet = await Wallet.findOne({ userId: session.user.id });
    if (!clientWallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (clientWallet.balance < bid.price) {
      return NextResponse.json(
        { error: "Insufficient balance. Please add funds to your wallet." },
        { status: 400 }
      );
    }

    try {
      // Update client wallet - move funds from balance to escrow
      await Wallet.findByIdAndUpdate(clientWallet._id, {
        $inc: { balance: -bid.price, escrow: +bid.price },
        $push: {
          transactions: {
            amount: -bid.price,
            type: "escrow_deposit",
            description: `Escrow deposit for accepted bid on load "${load.title}"`,
            createdAt: new Date(),
          },
        },
      });

      // Add driver escrow so driver can see pending earnings
      const driverWallet = await Wallet.findOne({ userId: bid.driverId._id });
      if (driverWallet) {
        await Wallet.findByIdAndUpdate(driverWallet._id, {
          $inc: { escrow: +bid.price },
          $push: {
            transactions: {
              amount: +bid.price,
              type: "escrow_pending",
              description: `Escrow reserved for your accepted bid on load "${load.title}"`,
              createdAt: new Date(),
            },
          },
        });
      }
      
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
    } catch (error) {
      console.error("Error accepting bid:", error);
      return NextResponse.json(
        {
          error: "Failed to accept bid",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } else {
    bid.status = "rejected";
    await bid.save();
  }

  return NextResponse.json(bid);
}