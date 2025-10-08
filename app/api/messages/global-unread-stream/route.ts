import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import MessageModel from '@/lib/models/Message';
import { dbConnect } from '@/lib/db/db';
import { Types } from 'mongoose';

const globalUnreadClients = new Map<string, ReadableStreamDefaultController[]>();
const encoder = new TextEncoder();

export async function sendGlobalUnreadCount(userId: string) {
  const controllers = globalUnreadClients.get(userId);
  if (!controllers || controllers.length === 0) return;

  try {
    const count = await MessageModel.countDocuments({
      receiver: new Types.ObjectId(userId),
      isRead: false,
    });

    const payload = encoder.encode(
      `data: ${JSON.stringify({
        type: 'unread_count',
        unreadCount: count,
      })}\n\n`
    );

    for (const controller of controllers) {
      try {
        controller.enqueue(payload);
      } catch (err) {
        console.warn('Failed to send SSE payload to controller:', err);
      }
    }
  } catch (err) {
    console.error(`Error sending unread count for user ${userId}:`, err);
  }
}

export async function broadcastGlobalUnreadUpdate(userId: string) {
  await sendGlobalUnreadCount(userId);
}

function cleanup(userId: string, controller: ReadableStreamDefaultController) {
  const list = globalUnreadClients.get(userId) || [];
  const filtered = list.filter((c) => c !== controller);
  if (filtered.length === 0) {
    globalUnreadClients.delete(userId);
  } else {
    globalUnreadClients.set(userId, filtered);
  }
  console.log(`Cleaned up SSE client for ${userId}. Remaining: ${filtered.length}`);
}

export async function GET(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;

  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache, no-transform',
  };

  const stream = new ReadableStream({
    async start(controller) {
      if (!globalUnreadClients.has(userId)) {
        globalUnreadClients.set(userId, []);
      }
      globalUnreadClients.get(userId)!.push(controller);

      console.log(`SSE connected for ${userId}. Total connections: ${globalUnreadClients.get(userId)!.length}`);

      await sendGlobalUnreadCount(userId);
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
          cleanup(userId, controller);
        }
      }, 20000);

      (controller as any).heartbeat = heartbeat;
    },

    cancel() {
      const controller = (this as any).controller as ReadableStreamDefaultController;
      const heartbeat = (controller as any)?.heartbeat;
      if (heartbeat) clearInterval(heartbeat);
      cleanup(userId, controller);
    },
  });

  return new Response(stream, { headers });
}
