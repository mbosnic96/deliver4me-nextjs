// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db/db';
import User from '@/lib/models/User';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const { 
      name,
      username,
      email,
      phone,
      address,
      country,
      state,
      city,
      postalCode,
      password,
      role
    } = await request.json();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }
    
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json(
        { message: 'Username is already taken' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      userName: username,
      email,
      phone,
      address,
      country,
      state,
      city,
      postalCode,
      password: hashedPassword,
      role: role || 'client',
    });

    await newUser.save();

    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}