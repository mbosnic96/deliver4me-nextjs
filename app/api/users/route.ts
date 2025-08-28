import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/lib/models/User"; 
import { dbConnect } from "@/lib/db/db";

export async function GET() {
  try {
    await dbConnect();
    const users = await User.find();
    return NextResponse.json(users);
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
    const { name, userName, email, role } = body;

    if (!name || !userName || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const password = await bcrypt.hash("d4meadministrator", 10); // default password

    const user = await User.create({
      name,
      userName,
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
