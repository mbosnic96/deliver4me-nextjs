import { NextResponse } from 'next/server';
import { userService } from '@/lib/services/UserService';
import { FullUserDto } from '@/lib/types/user';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await userService.getUserById(params.id);
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}