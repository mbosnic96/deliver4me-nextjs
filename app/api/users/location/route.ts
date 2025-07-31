import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { userService } from '@/lib/services/UserService';
import { UpdateUserLocationDto } from '@/lib/types/user';

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dto: UpdateUserLocationDto = await request.json();
    await userService.updateLocation(session.user.id, dto);
    return NextResponse.json({ message: 'Location updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}