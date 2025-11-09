import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/lib/models/User"; 
import { dbConnect } from "@/lib/db/db";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;


    const query: any = {};

    
    const search = url.searchParams.get("search");
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const role = url.searchParams.get("role");
    if (role) query.role = role;

    

    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-password")
      .lean();

    return NextResponse.json({ 
      data: users, 
      total, 
      page, 
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// POST create new user 
export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, email, role } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const password = await bcrypt.hash("password123", 10); // default password

    const user = await User.create({
      name,
      email,
      role,
      password,
      isDeleted: false,
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
