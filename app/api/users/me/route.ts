import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route'; 
import { userService } from '@/lib/services/UserService';
import { EditUserDto } from '@/lib/types/user';

export async function GET(req: Request) {
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

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions); 

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dto: EditUserDto = await req.json();
    await userService.updateUser(session.user.id, dto);
    return NextResponse.json({}, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
