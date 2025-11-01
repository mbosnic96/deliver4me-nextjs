import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { dbConnect } from "@/lib/db/db";
import Report from "@/lib/models/Report";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const data = await request.json();

  if (!data.status) {
    return NextResponse.json({ error: "Status je obavezan" }, { status: 400 });
  }

  const validStatuses = ["pending", "under_review", "resolved", "dismissed"];
  if (!validStatuses.includes(data.status)) {
    return NextResponse.json({ error: "Nevažeći status" }, { status: 400 });
  }

  const report = await Report.findById(id);
  if (!report) {
    return NextResponse.json({ error: "Prijava nije pronađena" }, { status: 404 });
  }

  report.status = data.status;
  report.adminNotes = data.adminNotes || report.adminNotes;
  
  if (data.status === "resolved" || data.status === "dismissed") {
    report.resolvedAt = new Date();
    report.resolvedBy = new (require("mongoose").Types.ObjectId)(session.user.id);
  }

  await report.save();

  const populatedReport = await Report.findById(id)
    .populate("reporterId", "name")
    .populate("reportedUserId", "name")
    .populate("loadId", "title");

  return NextResponse.json(populatedReport);
}
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params; 

  const report = await Report.findById(id)
    .populate("reporterId", "name email")
    .populate("reportedUserId", "name email")
    .populate("loadId", "title");

  if (!report) {
    return NextResponse.json({ error: "Prijava nije pronađena" }, { status: 404 });
  }

  return NextResponse.json(report);
}
