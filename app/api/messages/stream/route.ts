import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import MessageModel from '@/lib/models/Message';
import { dbConnect } from '@/lib/db/db';
import { Types } from 'mongoose';

const clients = new Map();

export async function GET(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const conversationWith = searchParams.get('with');

  if (!conversationWith) {
    return new Response('Conversation partner ID required', { status: 400 });
  }

  const users = [session.user.id, conversationWith].sort();
  const conversationId = `${users[0]}-${users[1]}`;
  const clientId = `${session.user.id}-${conversationId}`;

  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache, no-transform',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`));

      clients.set(clientId, controller);

      sendRecentMessages(conversationId, controller);
    },
    cancel() {
      clients.delete(clientId);
      console.log(`Client disconnected: ${clientId}`);
    },
  });

  return new Response(stream, { headers });
}

async function sendRecentMessages(conversationId: string, controller: ReadableStreamDefaultController) {
  try {
    const messages = await MessageModel.find({ conversationId })
      .populate('sender', 'name userName photoUrl')
      .populate('receiver', 'name userName photoUrl')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const encoder = new TextEncoder();
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({ 
          type: 'recent_messages', 
          messages: messages.reverse() 
        })}\n\n`
      )
    );
  } catch (error) {
    console.error('Error sending recent messages:', error);
  }
}

export async function broadcastNewMessage(message: any) {
  const conversationId = message.conversationId;
  const senderId = message.sender._id?.toString() || message.sender.toString();
  const receiverId = message.receiver._id?.toString() || message.receiver.toString();

  const senderClientId = `${senderId}-${conversationId}`;
  const receiverClientId = `${receiverId}-${conversationId}`;

  const encoder = new TextEncoder();
  const data = `data: ${JSON.stringify({ type: 'new_message', message })}\n\n`;

  if (clients.has(senderClientId)) {
    const senderController = clients.get(senderClientId);
    try {
      senderController.enqueue(encoder.encode(data));
    } catch (error) {
      console.error('Error sending to sender:', error);
      clients.delete(senderClientId);
    }
  }

  if (clients.has(receiverClientId)) {
    const receiverController = clients.get(receiverClientId);
    try {
      receiverController.enqueue(encoder.encode(data));
    } catch (error) {
      console.error('Error sending to receiver:', error);
      clients.delete(receiverClientId);
    }
  }
}

export async function broadcastMessageRead(conversationId: string, userId: string, messageIds: string[]) {
  const clientId = `${userId}-${conversationId}`;
  
  if (clients.has(clientId)) {
    const controller = clients.get(clientId);
    const encoder = new TextEncoder();
    
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({ 
          type: 'messages_read', 
          messageIds 
        })}\n\n`
      )
    );
  }
}