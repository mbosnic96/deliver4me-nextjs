import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { dbConnect } from "@/lib/db/db";
import Load from "@/lib/models/Load";
import Bid from "@/lib/models/Bid";
import Wallet from "@/lib/models/Wallet";
import Vehicle from "@/lib/models/Vehicle";
import User from "@/lib/models/User";

interface VehicleLoad {
  loadId: any;
  volumeUsed: number;
  status: "active" | "delivered" | "canceled";
}

interface Vehicle {
  id?: string;              
  _id?: string;             
  userId: string;
  brand: string;
  model: string;
  plateNumber: string;
  volume: number;
  width: number;
  length: number;
  height: number;
  vehicleType?: {
    name: string;
  };
  images: string[];         
  cargoPercentage: number;
  currentLoads: VehicleLoad[];
  createdAt: string;
}

async function recalculateVehicleCargoPercentage(vehicleId: string) {
  const vehicleDoc = await Vehicle.findById(vehicleId);
  if (!vehicleDoc) return;

  const vehicle = vehicleDoc.toObject() as Vehicle;
  
  const activeLoads = vehicle.currentLoads.filter((load: VehicleLoad) => load.status === "active");
  const totalActiveVolume = activeLoads.reduce((sum: number, load: VehicleLoad) => sum + load.volumeUsed, 0);
  
  const newCargoPercentage = vehicle.volume > 0 
    ? Math.min(100, (totalActiveVolume / vehicle.volume) * 100)
    : 0;

  await Vehicle.findByIdAndUpdate(
    vehicleId,
    { 
      cargoPercentage: Math.round(newCargoPercentage * 100) / 100
    }
  );
}

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

    if (existing.status === "Aktivan" && data.status && 
        data.status !== "Aktivan" && 
        data.status !== "Otkazan" && 
        data.status !== "otkazan" && 
        data.status !== "canceled") {
      return NextResponse.json({ 
        error: "Status tereta se može promijeniti samo putem prihvaćanja ponude ili otkazivanja" 
      }, { status: 400 });
    }

    if (["Dostavljen", "Otkazan", "dostavljen", "canceled", "otkazan"].includes(existing.status)) {
      return NextResponse.json({ 
        error: `Nemoguće ažurirati status tereta koji je već ${existing.status}` 
      }, { status: 400 });
    }

    if ((data.status === "Dostavljen" || data.status === "dostavljen" || data.status === "delivered") && isOwner && userRole !== "admin") {
      return NextResponse.json({ 
        error: "Klijent ne može označiti teret kao dostavljen. Samo vozač može potvrditi dostavu." 
      }, { status: 403 });
    }

    if (userRole === "admin" || isOwner) {
      if (data.status === "Dostavljen" || data.status === "dostavljen" || data.status === "delivered") {
        return NextResponse.json({ 
          error: "Samo vozač može označiti teret kao dostavljen." 
        }, { status: 403 });
      }

      // Handle cancelation with escrow refund
      if ((data.status === "Otkazan" || data.status === "otkazan" || data.status === "canceled") && existing.assignedBidId) {
        const winningBid = await Bid.findById(existing.assignedBidId);
        
        if (winningBid) {
          const clientWallet = await Wallet.findOne({ userId: existing.userId });
          const driverWallet = await Wallet.findOne({ userId: winningBid.driverId });
          const amount = winningBid.price;

          if (clientWallet && clientWallet.escrow >= amount) {
            // Refund from client escrow back to client balance
            await Wallet.findByIdAndUpdate(clientWallet._id, {
              $inc: { escrow: -amount, balance: +amount },
              $push: {
                transactions: {
                  amount: +amount,
                  type: "escrow_refund",
                  description: `Povrat sredstava za otkazani teret "${existing.title}"`,
                  createdAt: new Date(),
                },
              },
            });
          }

          // Remove from driver escrow if it exists
          if (driverWallet && driverWallet.escrow >= amount) {
            await Wallet.findByIdAndUpdate(driverWallet._id, {
              $inc: { escrow: -amount },
              $push: {
                transactions: {
                  amount: -amount,
                  type: "escrow_cancel",
                  description: `Escrow uklonjen za otkazani teret "${existing.title}"`,
                  createdAt: new Date(),
                },
              },
            });
          }

          // Update vehicle cargo percentage
          if (winningBid.vehicleId) {
            await Vehicle.findByIdAndUpdate(
              winningBid.vehicleId,
              { 
                $set: {
                  "currentLoads.$[elem].status": "canceled"
                }
              },
              {
                arrayFilters: [
                  { "elem.loadId": existing._id, "elem.status": "active" }
                ]
              }
            );

            await recalculateVehicleCargoPercentage(winningBid.vehicleId);
          }
        }
      }

      if ("fixedPrice" in data) {
        const wallet = await Wallet.findOne({ userId: existing.userId });
        if (!wallet || wallet.balance < data.fixedPrice) {
          return NextResponse.json({ 
            error: "Nemate dovoljno novca na računu za objavu ovog tereta." 
          }, { status: 400 });
        }
      }

      // Reset bids if going back to Aktivan from Poslan/Otkazan
      if (["Poslan", "Otkazan"].includes(existing.status) && data.status === "Aktivan") {
        await Bid.updateMany(
          { loadId: existing._id, status: { $ne: "rejected" } },
          { status: "pending" }
        );
        data.assignedBidId = undefined;
      }

      const updated = await Load.findByIdAndUpdate(id, data, { new: true });
      return NextResponse.json(updated);
    }

    // Driver logic
    if (userRole === "driver") {
      if (!("status" in data)) {
        return NextResponse.json({ 
          error: "Vozači mogu samo ažurirati status" 
        }, { status: 403 });
      }
      
      // Handle driver cancellation with escrow refund
      if (data.status === "Otkazan" || data.status === "otkazan" || data.status === "canceled") {
        if (!existing.assignedBidId) {
          return NextResponse.json({ error: "Nema dodijeljene ponude" }, { status: 400 });
        }

        const winningBid = await Bid.findById(existing.assignedBidId);
        if (!winningBid) {
          return NextResponse.json({ error: "Dodijeljena ponuda nije pronađena" }, { status: 404 });
        }

        if (winningBid.driverId.toString() !== authSession.user.id) {
          return NextResponse.json({ 
            error: "Niste dodijeljeni vozač za ovaj teret" 
          }, { status: 403 });
        }

        const clientWallet = await Wallet.findOne({ userId: existing.userId });
        const driverWallet = await Wallet.findOne({ userId: authSession.user.id });
        const amount = winningBid.price;

        // Refund client escrow back to client balance
        if (clientWallet && clientWallet.escrow >= amount) {
          await Wallet.findByIdAndUpdate(clientWallet._id, {
            $inc: { escrow: -amount, balance: +amount },
            $push: {
              transactions: {
                amount: +amount,
                type: "escrow_refund",
                description: `Povrat sredstava za otkazani teret "${existing.title}" od strane vozača`,
                createdAt: new Date(),
              },
            },
          });
        }

        // Remove from driver escrow
        if (driverWallet && driverWallet.escrow >= amount) {
          await Wallet.findByIdAndUpdate(driverWallet._id, {
            $inc: { escrow: -amount },
            $push: {
              transactions: {
                amount: -amount,
                type: "escrow_cancel",
                description: `Escrow uklonjen za otkazani teret "${existing.title}"`,
                createdAt: new Date(),
              },
            },
          });
        }

      
        if (winningBid.vehicleId) {
          await Vehicle.findByIdAndUpdate(
            winningBid.vehicleId,
            { 
              $set: {
                "currentLoads.$[elem].status": "canceled"
              }
            },
            {
              arrayFilters: [
                { "elem.loadId": existing._id, "elem.status": "active" }
              ]
            }
          );

          await recalculateVehicleCargoPercentage(winningBid.vehicleId);
        }

        // Update load status to canceled
        const updatedLoad = await Load.findByIdAndUpdate(
          id, 
          { status: "Otkazan" }, 
          { new: true }
        );

        return NextResponse.json({
          load: updatedLoad,
          message: "Teret uspješno otkazan i sredstva vraćena"
        });
      }
      
      // Handle delivery
      if (data.status === "Dostavljen" || data.status === "dostavljen" || data.status === "delivered") {
        const clientWallet = await Wallet.findOne({ userId: existing.userId });
        const driverWallet = await Wallet.findOne({ userId: authSession.user.id });

        if (!clientWallet || !driverWallet) {
          return NextResponse.json({ error: "Novčanik nije pronađen" }, { status: 404 });
        }

        if (!existing.assignedBidId) {
          return NextResponse.json({ error: "Nema dodijeljene ponude" }, { status: 400 });
        }

        const winningBid = await Bid.findById(existing.assignedBidId);

        if (!winningBid) {
          return NextResponse.json({ error: "Dodijeljena ponuda nije pronađena" }, { status: 404 });
        }

        // Verify this driver is the assigned driver
        if (winningBid.driverId.toString() !== authSession.user.id) {
          return NextResponse.json({ error: "Niste dodijeljeni vozač za ovaj teret" }, { status: 403 });
        }

        const amount = winningBid.price;
        const platformFee = amount * 0.02; // 2% fee
        const driverAmount = amount - platformFee;

        // Verify escrow funds
        if ((clientWallet.escrow || 0) < amount) {
          return NextResponse.json({ error: "Nedovoljno sredstava u escrow-u klijenta" }, { status: 400 });
        }

        if ((driverWallet.escrow || 0) < amount) {
          return NextResponse.json({ error: "Nedovoljno sredstava u escrow-u vozača" }, { status: 400 });
        }

        try {
          // Take from client escrow
          await Wallet.findByIdAndUpdate(clientWallet._id, {
            $inc: { escrow: -amount },
            $push: {
              transactions: {
                amount: -amount,
                type: "escrow_release",
                description: `Plaćanje za teret "${existing.title}"`,
                createdAt: new Date(),
              },
            },
          });

          // Transfer from driver escrow to driver balance 
          await Wallet.findByIdAndUpdate(driverWallet._id, {
            $inc: { escrow: -amount, balance: +driverAmount },
            $push: {
              transactions: {
                amount: +driverAmount,
                type: "credit",
                description: `Plaćanje za teret "${existing.title}" (nakon platform fee)`,
                createdAt: new Date(),
              },
            },
          });

          // Fee to admin wallet
          const adminUser = await User.findOne({ role: "admin" });
          if (adminUser) {
            let adminWallet = await Wallet.findOne({ userId: adminUser._id });
        
            await Wallet.findByIdAndUpdate(adminWallet._id, {
              $inc: { balance: +platformFee },
              $push: {
                transactions: {
                  amount: +platformFee,
                  type: "credit",
                  description: `Platform fee za teret "${existing.title}"`,
                  createdAt: new Date(),
                },
              },
            });
          } else {
            console.warn("Admin user not found - platform fee not collected");
          }

          
          if (winningBid.vehicleId) {
            await Vehicle.findByIdAndUpdate(
              winningBid.vehicleId,
              { 
                $set: {
                  "currentLoads.$[elem].status": "delivered"
                }
              },
              {
                arrayFilters: [
                  { "elem.loadId": existing._id, "elem.status": "active" }
                ]
              }
            );

            await recalculateVehicleCargoPercentage(winningBid.vehicleId);
          }

          // Update load status to delivered
          const updatedLoad = await Load.findByIdAndUpdate(
            id, 
            { status: "Dostavljen" }, 
            { new: true }
          );

          return NextResponse.json({
            load: updatedLoad,
            message: "Plaćanje uspješno izvršeno",
            driverAmount: driverAmount,
            platformFee: platformFee
          });

        } catch (error) {
          console.error("Greška pri transferu sredstava:", error);
          return NextResponse.json({ 
            error: "Greška pri transferu sredstava", 
            details: error instanceof Error ? error.message : error 
          }, { status: 500 });
        }
      }

      // For other status updates by driver
      const updated = await Load.findByIdAndUpdate(id, { status: data.status }, { new: true });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Zabranjeno" }, { status: 403 });

  } catch (error) {
    return NextResponse.json({ error: "Nevažeći JSON podaci" }, { status: 400 });
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

  if (existing.assignedBidId) {
    const winningBid = await Bid.findById(existing.assignedBidId);
    if (winningBid && winningBid.vehicleId) {
      await Vehicle.findByIdAndUpdate(
        winningBid.vehicleId,
        { 
          $pull: { currentLoads: { loadId: existing._id } }
        }
      );

      await recalculateVehicleCargoPercentage(winningBid.vehicleId);
    }
  }

  await Load.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}