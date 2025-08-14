// app/api/users/email/[id]/route.ts
import { NextResponse } from 'next/server';
import { userService } from '@/lib/services/UserService';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { email } = await request.json();

    // Basic validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Simple email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Update the email
    await userService.updateEmail(params.id, email);

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Failed to update email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update email' },
      { status: 500 }
    );
  }
}