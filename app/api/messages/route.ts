import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import MessageModel from '@/lib/models/Message';
import UserModel from '@/lib/models/User';
import { dbConnect } from '@/lib/db/db';
import { Types } from 'mongoose';
import { broadcastNewMessage } from './stream/route';
import { PushSubscription } from '@/lib/models/PushSubscription';
import webpush from 'web-push';

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId, content, subject } = await req.json();

    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      );
    }

    const receiver = await UserModel.findById(receiverId);
    if (!receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    const sender = await UserModel.findById(session.user.id);
    if (!sender) {
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      );
    }

    const users = [session.user.id, receiverId].sort();
    const conversationId = `${users[0]}-${users[1]}`;

    const messageData = {
      sender: new Types.ObjectId(session.user.id),
      receiver: new Types.ObjectId(receiverId),
      content: content.trim(),
      subject: subject || 'Privatna poruka', 
      conversationId: conversationId,
      isRead: false
    };

    const message = new MessageModel(messageData);
    const savedMessage = await message.save();

    await savedMessage.populate('sender', 'name userName photoUrl');
    await savedMessage.populate('receiver', 'name userName photoUrl');

    await UserModel.findByIdAndUpdate(receiverId, {
      $inc: { unreadMessagesCount: 1 }
    });

    await broadcastNewMessage(savedMessage.toObject());

    await sendMessagePushNotification({
      receiverId,
      senderName: sender.name,
      messageContent: content.trim(),
      subject: subject || 'Privatna poruka', 
      conversationId,
      messageId: savedMessage._id.toString()
    });

    return NextResponse.json(savedMessage);

  } catch (error: any) {
    console.error('Error sending message:', error);
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: Object.values(error.errors).map((err: any) => ({
            field: err.path,
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

async function sendMessagePushNotification({
  receiverId,
  senderName,
  messageContent,
  subject,
  conversationId,
  messageId
}: {
  receiverId: string;
  senderName: string;
  messageContent: string;
  subject?: string; 
  conversationId: string;
  messageId: string;
}) {
  try {
    const subscriptions = await PushSubscription.find({ userId: receiverId });
    
    console.log(`Found ${subscriptions.length} push subscriptions for user ${receiverId}`);
    
    const expiredSubscriptions: string[] = [];
    const users = conversationId.split('-');
    const senderId = users.find(id => id !== receiverId) || users[0];

    const notificationPromises = subscriptions.map(async (sub) => {
      try {
        const notificationPayload = {
          title:`Nova poruka od ${senderName} za ${subject || 'Privatna poruka'}`,
          body: messageContent.length > 100 
            ? `${messageContent.substring(0, 100)}...` 
            : messageContent,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: `message-${conversationId}`,
          data: {
            url: `/messages?with=${senderId}`,
            type: 'new_message',
            messageId: messageId,
            conversationId: conversationId,
            senderName: senderName,
            senderId: senderId,
            subject: subject
          },
          actions: [
            {
              action: 'pogledaj',  
              title: 'Pogledaj'
            },
            {
              action: 'zatvori', 
              title: 'Zatvori'
            }
          ]
        };

        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify(notificationPayload)
        );
        
        console.log(`Push notification sent for message from ${senderName} to user ${receiverId}`);
      } catch (err: any) {
        console.error("Error sending push notification:", err);
        if (err.statusCode === 410 || err.statusCode === 404 || err.statusCode === 400) {
          expiredSubscriptions.push(String(sub._id));
          console.log(`Push subscription expired/invalid, marking for deletion: ${sub.subscription.endpoint}`);
        }
      }
    });

    await Promise.allSettled(notificationPromises);

    if (expiredSubscriptions.length > 0) {
      await PushSubscription.deleteMany({ 
        _id: { $in: expiredSubscriptions } 
      });
      console.log(`Removed ${expiredSubscriptions.length} expired push subscriptions`);
    }

  } catch (err) {
    console.error("Error processing push notifications for message:", err);
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationWith = searchParams.get('with');

    if (conversationWith) {
      const users = [session.user.id, conversationWith].sort();
      const conversationId = `${users[0]}-${users[1]}`;

      const messages = await MessageModel.find({ conversationId })
        .populate('sender', 'name userName photoUrl')
        .populate('receiver', 'name userName photoUrl')
        .sort({ createdAt: 1 }) 
        .lean();

      await MessageModel.updateMany(
        { 
          conversationId, 
          receiver: new Types.ObjectId(session.user.id), 
          isRead: false 
        },
        { isRead: true }
      );

      await UserModel.findByIdAndUpdate(session.user.id, {
        $inc: { unreadMessagesCount: -1 }
      });

      return NextResponse.json(messages);
    } else {
      const conversations = await MessageModel.aggregate([
        {
          $match: {
            $or: [
              { sender: new Types.ObjectId(session.user.id) },
              { receiver: new Types.ObjectId(session.user.id) }
            ]
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: '$conversationId',
            lastMessage: { $first: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: [
                  { 
                    $and: [
                      { $eq: ['$receiver', new Types.ObjectId(session.user.id)] },
                      { $eq: ['$isRead', false] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'lastMessage.sender',
            foreignField: '_id',
            as: 'senderInfo'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'lastMessage.receiver',
            foreignField: '_id',
            as: 'receiverInfo'
          }
        },
        {
          $project: {
            conversationId: '$_id',
            lastMessage: 1,
            unreadCount: 1,
            otherUser: {
              $cond: [
                { $ne: ['$lastMessage.sender', new Types.ObjectId(session.user.id)] },
                { $arrayElemAt: ['$senderInfo', 0] },
                { $arrayElemAt: ['$receiverInfo', 0] }
              ]
            }
          }
        },
        {
          $project: {
            'otherUser.password': 0,
            'otherUser.__v': 0
          }
        },
        {
          $sort: { 'lastMessage.createdAt': -1 }
        }
      ]);

      return NextResponse.json(conversations);
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}