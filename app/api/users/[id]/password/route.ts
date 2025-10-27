import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/authOptions';
import { userService } from '@/lib/services/UserService';
import { ChangePasswordDto } from '@/lib/types/user';

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dto: ChangePasswordDto = await request.json();
    if (!dto.currentPassword || !dto.newPassword) {
      return NextResponse.json({ error: 'Both currentPassword and newPassword are required' }, { status: 400 });
    }

    await userService.changePassword(session.user.id, dto);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
