import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import MessageModel from '@/lib/models/Message';
import { dbConnect } from '@/lib/db/db';
import { broadcastGlobalUnreadUpdate } from '../global-unread-stream/route';

const clients = new Map<string, ReadableStreamDefaultController>();

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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`)
      );

      clients.set(clientId, controller);

      await sendRecentMessages(conversationId, controller);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
          clients.delete(clientId);
        }
      }, 5000);

      (controller as any).heartbeat = heartbeat;
    },

    cancel() {
      const controller = clients.get(clientId);
      if (controller) {
        const heartbeat = (controller as any).heartbeat;
        if (heartbeat) clearInterval(heartbeat);
      }
      clients.delete(clientId);
      console.log(`SSE client disconnected: ${clientId}`);
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
          messages: messages.reverse(),
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

  [senderClientId, receiverClientId].forEach((id) => {
    const controller = clients.get(id);
    if (!controller) return;

    try {
      controller.enqueue(encoder.encode(data));
    } catch (err) {
      console.error(`Error sending to ${id}:`, err);
      clients.delete(id);
    }
  });
   await broadcastGlobalUnreadUpdate(receiverId); 
}

export async function broadcastMessageRead(conversationId: string, userId: string, messageIds: string[]) {
  const clientId = `${userId}-${conversationId}`;
  const controller = clients.get(clientId);
  if (!controller) return;

  const encoder = new TextEncoder();
  try {
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: 'messages_read',
          messageIds,
        })}\n\n`
      )
    );
    await broadcastGlobalUnreadUpdate(userId);
  } catch (err) {
    console.error('Error broadcasting message read:', err);
    clients.delete(clientId);
  }
}
