import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { dbConnect } from "@/lib/db/db";
import Load from "@/lib/models/Load";

export async function GET(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;


  const minPrice = url.searchParams.get("minPrice");
  const maxPrice = url.searchParams.get("maxPrice");
  const pickupCountry = url.searchParams.get("pickupCountry");
  const pickupState = url.searchParams.get("pickupState");
  const pickupCity = url.searchParams.get("pickupCity");
  const deliveryCountry = url.searchParams.get("deliveryCountry");
  const deliveryState = url.searchParams.get("deliveryState");
  const deliveryCity = url.searchParams.get("deliveryCity");
  const minWidth = url.searchParams.get("minWidth");
  const maxWidth = url.searchParams.get("maxWidth");
  const minLength = url.searchParams.get("minLength");
  const maxLength = url.searchParams.get("maxLength");
  const minHeight = url.searchParams.get("minHeight");
  const maxHeight = url.searchParams.get("maxHeight");
  const minWeight = url.searchParams.get("minWeight");
  const maxWeight = url.searchParams.get("maxWeight");
  const minPickupDate = url.searchParams.get("minPickupDate");
  const maxPickupDate = url.searchParams.get("maxPickupDate");
  const minDeliveryDate = url.searchParams.get("minDeliveryDate");
  const maxDeliveryDate = url.searchParams.get("maxDeliveryDate");

  
  let query: any = { status: "Aktivan" }; 

  if (minPrice || maxPrice) {
    query.fixedPrice = {};
    if (minPrice) query.fixedPrice.$gte = parseFloat(minPrice);
    if (maxPrice) query.fixedPrice.$lte = parseFloat(maxPrice);
  }


  if (pickupCountry) query.pickupCountry = pickupCountry;
  if (pickupState) query.pickupState = pickupState;
  if (pickupCity) query.pickupCity = { $regex: pickupCity, $options: "i" };
  
  if (deliveryCountry) query.deliveryCountry = deliveryCountry;
  if (deliveryState) query.deliveryState = deliveryState;
  if (deliveryCity) query.deliveryCity = { $regex: deliveryCity, $options: "i" };


  if (minWidth || maxWidth) {
    query.cargoWidth = {};
    if (minWidth) query.cargoWidth.$gte = parseFloat(minWidth);
    if (maxWidth) query.cargoWidth.$lte = parseFloat(maxWidth);
  }

  if (minLength || maxLength) {
    query.cargoLength = {};
    if (minLength) query.cargoLength.$gte = parseFloat(minLength);
    if (maxLength) query.cargoLength.$lte = parseFloat(maxLength);
  }

  if (minHeight || maxHeight) {
    query.cargoHeight = {};
    if (minHeight) query.cargoHeight.$gte = parseFloat(minHeight);
    if (maxHeight) query.cargoHeight.$lte = parseFloat(maxHeight);
  }


  if (minWeight || maxWeight) {
    query.cargoWeight = {};
    if (minWeight) query.cargoWeight.$gte = parseFloat(minWeight);
    if (maxWeight) query.cargoWeight.$lte = parseFloat(maxWeight);
  }

  if (minPickupDate) {
    query.preferredPickupDate = { ...query.preferredPickupDate, $gte: new Date(minPickupDate) };
  }
  if (maxPickupDate) {
    query.preferredPickupDate = { ...query.preferredPickupDate, $lte: new Date(maxPickupDate) };
  }

  if (minDeliveryDate) {
    query.preferredDeliveryDate = { ...query.preferredDeliveryDate, $gte: new Date(minDeliveryDate) };
  }
  if (maxDeliveryDate) {
    query.preferredDeliveryDate = { ...query.preferredDeliveryDate, $lte: new Date(maxDeliveryDate) };
  }

  try {
    const total = await Load.countDocuments(query);
    const loads = await Load.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({ 
      data: loads, 
      total, 
      page, 
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error("Failed to fetch filtered loads:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}