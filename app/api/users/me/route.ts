import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { userService } from '@/lib/services/UserService';
import { FullUserDto, EditUserDto, ChangePasswordDto, UpdateUserLocationDto } from '@/lib/types/user';

// GET /api/users/me - Get current user
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await userService.getCurrentUser(session.user.id);
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

// PUT /api/users/me - Update current user
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dto: EditUserDto = await request.json();
    await userService.updateUser(session.user.id, dto);
    return NextResponse.json({}, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}