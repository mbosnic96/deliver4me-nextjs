import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/db";
import Terms from "@/lib/models/Terms";
import { getServerSession } from "next-auth"; 
import { authOptions } from "@/lib/authOptions"; 

export async function GET() {
  await dbConnect();
  const terms = await Terms.findOne().sort({ updatedAt: -1 });
  return NextResponse.json(terms);
}

export async function PUT(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions); 

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const data = await req.json();
  let terms = await Terms.findOne();

  if (!terms) {
    terms = new Terms(data);
  } else {
    terms.title = data.title;
    terms.content = data.content;
  }

  await terms.save();
  return NextResponse.json({ success: true });
}
