import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/db/db"
import Bid from "@/lib/models/Bid"
import Load from "@/lib/models/Load"
import Wallet from "@/lib/models/Wallet"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"

export async function PUT(
  req: Request, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
    await dbConnect()

    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bid = await Bid.findById(params.id).populate(
      "driverId",
      "name photoUrl rating reviewsCount"
    )
    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 })
    }

    const load = await Load.findById(bid.loadId)
    if (!load) {
      return NextResponse.json({ error: "Load not found" }, { status: 404 })
    }

    if (
      load.userId.toString() !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (bid.status !== "accepted") {
      return NextResponse.json(
        { error: "Only accepted bids can be canceled" },
        { status: 400 }
      )
    }

    const clientWallet = await Wallet.findOne({ userId: load.userId })
    
    if (clientWallet && clientWallet.escrow >= bid.price) {
      await Wallet.findByIdAndUpdate(
        clientWallet._id,
        {
          $inc: { escrow: -bid.price, balance: +bid.price },
          $push: {
            transactions: {
              amount: +bid.price,
              type: "escrow_refund",
              description: `Escrow refunded for canceled bid on load "${load.title}"`,
              createdAt: new Date(),
            },
          },
        },
        { new: true }
      )
    } else {
      console.log('Client wallet not found or insufficient escrow');
    }

    const driverId = bid.driverId._id ? bid.driverId._id.toString() : bid.driverId.toString();
    
    const driverWallet = await Wallet.findOne({ userId: driverId })
    
    if (driverWallet) {
      if (driverWallet.escrow >= bid.price) {
        await Wallet.findByIdAndUpdate(
          driverWallet._id,
          {
            $inc: { escrow: -bid.price },
            $push: {
              transactions: {
                amount: -bid.price,
                type: "escrow_cancel",
                description: `Escrow removed - bid canceled for load "${load.title}"`,
                createdAt: new Date(),
              },
            },
          },
          { new: true }
        )
      } else {
        await Wallet.findByIdAndUpdate(
          driverWallet._id,
          {
            $push: {
              transactions: {
                amount: -bid.price,
                type: "escrow_cancel",
                description: `Escrow adjustment - bid canceled for load "${load.title}"`,
                createdAt: new Date(),
              },
            },
          },
          { new: true }
        )
      }
    } 

    bid.status = "canceled"
    load.status = "Aktivan"
    load.assignedBidId = undefined

    await Promise.all([
      bid.save(),
      load.save(),
      Bid.updateMany(
        { loadId: load._id, _id: { $ne: bid._id }, status: "rejected" },
        { status: "pending" }
      ),
    ])

    console.log('Bid cancel completed successfully');

    return NextResponse.json({ 
      message: "Bid canceled successfully", 
      bid, 
      load 
    })
  } catch (error) {
    console.error('Error in bid cancel:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}