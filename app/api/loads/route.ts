import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db/db";
import Load from "@/lib/models/Load";

export async function GET() {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filter: any = {};
  if (session.user.role !== "admin") {
    filter.userId = session.user.id;
  }

  const loads = await Load.find(filter).sort({ createdAt: -1 });
  return NextResponse.json(loads);
}

export async function POST(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  data.userId = session.user.id; // ensure it's always owned by current user unless admin overrides

  const newLoad = await Load.create(data);
  return NextResponse.json(newLoad, { status: 201 });
}
