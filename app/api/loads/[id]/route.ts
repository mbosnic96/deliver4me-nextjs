import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db/db";
import Load from "@/lib/models/Load";
import Bid from "@/lib/models/Bid";
import Wallet from "@/lib/models/Wallet";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const load = await Load.findById(id);
  if (!load) return NextResponse.json({ error: "Not found" }, { status: 404 });
  
  return NextResponse.json(load);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const authSession = await getServerSession(authOptions);
  if (!authSession?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const bodyText = await request.text();
    const data = bodyText.length ? JSON.parse(bodyText) : {};

    const existing = await Load.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const userRole = authSession.user.role;
    const isOwner = existing.userId.toString() === authSession.user.id;

    if (userRole === "admin" || isOwner) {
      try {
        if (existing.assignedBidId && data.status === "Otkazan") {
          const winningBid = await Bid.findById(existing.assignedBidId);

          const clientWallet = await Wallet.findOne({ userId: existing.userId });

          if (clientWallet && clientWallet.escrow >= winningBid.price) {
            const updatedWallet = await Wallet.findByIdAndUpdate(clientWallet._id, {
              $inc: { escrow: -winningBid.price, balance: winningBid.price },
              $push: {
                transactions: {
                  amount: winningBid.price,
                  type: "credit",
                  description: `Escrow refunded for canceled load ${existing._id}`,
                  createdAt: new Date(),
                },
              },
            }, { new: true });
            console.log("Wallet after refund:", updatedWallet);
          } else {
            console.log("No sufficient escrow to refund");
          }
        }

        if (["Poslan", "Otkazan"].includes(existing.status) && data.status === "Aktivan") {
          await Bid.updateMany(
            { loadId: existing._id, status: { $ne: "rejected" } },
            { status: "pending" }
          );
          data.assignedBidId = undefined;
        }

        const updated = await Load.findByIdAndUpdate(id, data, { new: true });
        return NextResponse.json(updated);

      } catch (error) {
        return NextResponse.json({ error: "Failed to update load" }, { status: 500 });
      }
    }

    if (userRole === "driver") {
      if (!("status" in data)) {
        return NextResponse.json({ error: "Drivers can only update status" }, { status: 403 });
      }
      
      if (data.status === "delivered"|| data.status === "Dostavljen") {
        const clientWallet = await Wallet.findOne({ userId: existing.userId });
        const driverWallet = await Wallet.findOne({ userId: authSession.user.id });

        if (!clientWallet || !driverWallet) {
          return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
        }

        if (!existing.assignedBidId) {
          return NextResponse.json({ error: "No assigned bid found" }, { status: 400 });
        }

        const winningBid = await Bid.findById(existing.assignedBidId);

        if (!winningBid) {
          return NextResponse.json({ error: "Assigned bid not found" }, { status: 404 });
        }

        const amount = winningBid.price;

        if ((clientWallet.escrow || 0) < amount) {
          return NextResponse.json({ error: "Escrow insufficient" }, { status: 400 });
        }

        try {
          const clientUpdate = await Wallet.findByIdAndUpdate(clientWallet._id, {
            $inc: { escrow: -amount },
            $push: {
              transactions: {
                amount: -amount,
                type: "debit",
                description: `Released payment for load ${existing._id} (bid ${winningBid._id})`,
                createdAt: new Date(),
              },
            },
          }, { new: true });

          const driverUpdate = await Wallet.findByIdAndUpdate(driverWallet._id, {
            $inc: {balance:+amount, escrow: -amount },
            $push: {
              transactions: {
                amount: -amount,
                type: "credit",
                description: `Payment received for load ${existing._id} (bid ${winningBid._id})`,
                createdAt: new Date(),
              },
            },
          }, { new: true });

          const updatedLoad = await Load.findByIdAndUpdate(id, { status: data.status }, { new: true });

          return NextResponse.json({
            load: updatedLoad,
            driverWallet: driverUpdate,
            message: "Funds transferred successfully",
          });
        } catch (error) {
          return NextResponse.json({ error: "Fund transfer failed", details: error instanceof Error ? error.message : error }, { status: 500 });
        }
      }

      const updated = await Load.findByIdAndUpdate(id, { status: data.status }, { new: true });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON data" }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await Load.findById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role !== "admin" && existing.userId.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Load.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}