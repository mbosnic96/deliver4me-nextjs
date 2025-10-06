import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "../../auth/[...nextauth]/route";
import MessageModel from '@/lib/models/Message';
import { dbConnect } from '@/lib/db/db';
import { Types } from 'mongoose'; 

export async function GET() {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const unreadCount = await MessageModel.countDocuments({
      receiver: new Types.ObjectId(session.user.id),
      isRead: false
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}