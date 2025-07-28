import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { userService } from '@/lib/services/UserService';
import { ChangePasswordDto } from '@/lib/types/user';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dto: ChangePasswordDto = await request.json();
    await userService.changePassword(session.user.id, dto);
    return NextResponse.json({}, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}