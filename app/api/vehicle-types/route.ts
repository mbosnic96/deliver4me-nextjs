import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import VehicleType from "@/lib/models/VehicleType";
import { dbConnect } from "@/lib/db/db";

export async function GET() {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const types = await VehicleType.find().lean();
  return NextResponse.json(types);
}

export async function POST(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  const type = await VehicleType.create(data);
  return NextResponse.json(type, { status: 201 });
}
