import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server, Socket } from 'socket.io';
import { dbConnect } from './lib/db/db';
import MessageModel from './lib/models/Message';
import { Types } from 'mongoose';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;

// Singleton Socket.IO instance
let ioInstance: Server | null = null;

app.prepare().then(async () => {
  // Ensure DB connection once at server start
  await dbConnect();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  if (!ioInstance) {
    ioInstance = new Server(httpServer, {
      cors: { origin: '*' },
      perMessageDeflate: false,
    });

    ioInstance.on('connection', (socket: Socket) => {
      console.log(`Socket connected: ${socket.id}`);
      const userId = socket.handshake.query.userId as string;
      if (!userId) return;

      socket.join(userId); // Personal room
      console.log(`User ${userId} joined personal room`);

      // --- Fetch conversations ---
      socket.on('get_conversations', async (_data, callback) => {
        try {
          const messages = await MessageModel.find({
            $or: [{ sender: userId }, { receiver: userId }],
          })
            .populate('sender receiver', 'name userName photoUrl')
            .sort({ createdAt: -1 })
            .lean();

          const convMap = new Map<string, any>();

          messages.forEach(msg => {
            const convId = msg.conversationId;
            const otherUser =
              msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
            const unreadCount =
              msg.receiver._id.toString() === userId && !msg.isRead ? 1 : 0;

            if (!convMap.has(convId)) {
              convMap.set(convId, {
                conversationId: convId,
                lastMessage: msg,
                unreadCount,
                otherUser,
              });
            } else {
              const conv = convMap.get(convId);
              conv.lastMessage =
                new Date(msg.createdAt) > new Date(conv.lastMessage.createdAt)
                  ? msg
                  : conv.lastMessage;
              if (msg.receiver._id.toString() === userId && !msg.isRead) {
                conv.unreadCount += 1;
              }
            }
          });

          callback(Array.from(convMap.values()));
        } catch (err) {
          console.error('Get conversations error:', err);
          callback([]);
        }
      });

      // --- Mark messages as read ---
      socket.on('mark_read', async ({ conversationId }) => {
        if (!conversationId) return;
        try {
          await MessageModel.updateMany(
            { conversationId, receiver: userId, isRead: false },
            { $set: { isRead: true } }
          );

          const messages = await MessageModel.find({ conversationId })
            .populate('sender receiver', 'name userName photoUrl')
            .sort({ createdAt: 1 })
            .lean();

          ioInstance!.to(conversationId).emit(
            'recent_messages',
            messages.map(msg => ({ ...msg, status: 'sent' }))
          );

          const unreadCount = await MessageModel.countDocuments({
            receiver: userId,
            isRead: false,
          });

          ioInstance!.to(userId).emit('global_unread_update', { unreadCount });
        } catch (err) {
          console.error('Mark read error:', err);
        }
      });

      // --- Join conversation ---
      socket.on('join_conversation', async (conversationId: string) => {
        socket.join(conversationId);
        console.log(`${socket.id} joined conversation ${conversationId}`);

        try {
          const messages = await MessageModel.find({ conversationId })
            .populate('sender receiver', 'name userName photoUrl')
            .sort({ createdAt: 1 })
            .limit(50)
            .lean();
          socket.emit('recent_messages', messages);
        } catch (err) {
          console.error('Fetch recent messages failed:', err);
        }
      });

      // --- Leave conversation ---
      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(conversationId);
        console.log(`${socket.id} left conversation ${conversationId}`);
      });

      // --- Send message ---
      socket.on(
        'send_message',
        async ({ receiverId, content, subject, conversationId }) => {
          if (!content || !conversationId || !receiverId) return;

          try {
            const message = await MessageModel.create({
              sender: new Types.ObjectId(userId),
              receiver: new Types.ObjectId(receiverId),
              content,
              subject,
              conversationId,
              isRead: false,
            });

            const populated = await message.populate(
              'sender receiver',
              'name userName photoUrl'
            );

            ioInstance!.to(conversationId).emit(
              'new_message',
              populated.toObject()
            );

            const unreadCount = await MessageModel.countDocuments({
              receiver: receiverId,
              isRead: false,
            });

            ioInstance!.to(receiverId).emit('global_unread_update', {
              unreadCount,
            });
          } catch (err) {
            console.error('Send message error:', err);
          }
        }
      );

      // --- Disconnect ---
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  // Attach ioInstance to server
  (httpServer as any).io = ioInstance;

  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
