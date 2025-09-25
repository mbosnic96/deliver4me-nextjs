import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db/db";
import Report from "@/lib/models/Report";
import User from "@/lib/models/User";
import Load from "@/lib/models/Load";
import { createNotification } from "@/lib/notifications";


export async function GET(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const status = url.searchParams.get("status") || "";
  const skip = (page - 1) * limit;

  let query = {};

  if (status) {
    query = { status };
  }

  const total = await Report.countDocuments(query);
  const reports = await Report.find(query)
    .populate("reporterId", "name userName email")
    .populate("reportedUserId", "name userName email")
    .populate("loadId", "title")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return NextResponse.json({ data: reports, total, page, limit });
}

export async function POST(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  const requiredFields = [
    "reportedUserId",
    "reportType", 
    "description"
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      return NextResponse.json({ error: `Sva polja su obavezna!` }, { status: 400 });
    }
  }

  const validReportTypes = [
    "spam",
    "inappropriate_content", 
    "fraud",
    "harassment",
    "fake_profile",
    "other"
  ];

  if (!validReportTypes.includes(data.reportType)) {
    return NextResponse.json({ error: "Nevažeći tip prijave" }, { status: 400 });
  }

  // Check if user is reporting themselves
  if (data.reportedUserId === session.user.id) {
    return NextResponse.json({ error: "Ne možete prijaviti sami sebe" }, { status: 400 });
  }

  // Check if reported user exists
  const reportedUser = await User.findById(data.reportedUserId);
  if (!reportedUser) {
    return NextResponse.json({ error: "Korisnik koji se prijavljuje nije pronađen" }, { status: 404 });
  }

  // Check if load exists if provided
  if (data.loadId) {
    const load = await Load.findById(data.loadId);
    if (!load) {
      return NextResponse.json({ error: "Teret nije pronađen" }, { status: 404 });
    }
  }

  // Check for duplicate recent report (same user reporting same user for same reason within 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existingReport = await Report.findOne({
    reporterId: session.user.id,
    reportedUserId: data.reportedUserId,
    reportType: data.reportType,
    createdAt: { $gte: twentyFourHoursAgo }
  });

  if (existingReport) {
    return NextResponse.json({ 
      error: "Već ste prijavili ovog korisnika za isti razlog u posljednjih 24 sata" 
    }, { status: 400 });
  }

  const reportData = {
    reporterId: session.user.id,
    reportedUserId: data.reportedUserId,
    loadId: data.loadId || null,
    reportType: data.reportType,
    description: data.description.trim(),
    evidence: data.evidence || [],
    status: "pending"
  };

  const newReport = await Report.create(reportData);


  const populatedReport = await Report.findById(newReport._id)
    .populate("reporterId", "name userName")
    .populate("reportedUserId", "name userName")
    .populate("loadId", "title");

  return NextResponse.json(populatedReport, { status: 201 });
}