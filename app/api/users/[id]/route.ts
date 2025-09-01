import { NextResponse } from 'next/server';
import { userService } from '@/lib/services/UserService';

// GET
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await userService.getUserById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err: any) {
    console.error("GET /api/users/[id] error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

// full user update
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    await userService.updateUser(id, body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// location update only
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    await userService.updateLocation(id, body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update location:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params; 
    await userService.requestAccountDeletion(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
