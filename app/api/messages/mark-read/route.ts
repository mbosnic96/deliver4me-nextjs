import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import MessageModel from '@/lib/models/Message';
import UserModel from '@/lib/models/User';
import { dbConnect } from '@/lib/db/db';
import { Types } from 'mongoose';
import { broadcastGlobalUnreadUpdate } from '../global-unread-stream/route';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await req.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const users = conversationId.split('-');
    const otherUserId = users.find((id: string) => id !== session.user.id);

    const result = await MessageModel.updateMany(
      { 
        conversationId, 
        receiver: new Types.ObjectId(session.user.id), 
        isRead: false 
      },
      { isRead: true }
    );

    if (result.modifiedCount > 0) {
       const unreadCount = await MessageModel.countDocuments({
        receiver: new Types.ObjectId(session.user.id),
        isRead: false
      });
      await UserModel.findByIdAndUpdate(session.user.id, {
        unreadMessagesCount: unreadCount
      });

      await broadcastGlobalUnreadUpdate(session.user.id); 
      if (otherUserId) {
        await broadcastGlobalUnreadUpdate(otherUserId);
      }
    }
    return NextResponse.json({ 
      success: true, 
      markedRead: result.modifiedCount
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}