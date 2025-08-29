import { NextResponse } from 'next/server';
import { userService } from '@/lib/services/UserService';


export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await userService.getUserById(params.id);
    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
}

// full user update
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    await userService.updateUser(params.id, body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// location update only
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    await userService.updateLocation(params.id, body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update location:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await userService.requestAccountDeletion(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}