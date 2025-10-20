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

// Prevent multiple Socket.IO instances - inace memory leaks
let ioInstance: Server | null = null;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  if (!ioInstance) {
    ioInstance = new Server(httpServer, {
      perMessageDeflate: false,
      cors: { origin: '*' },
    });

    ioInstance.on('connection', (socket: Socket) => {
      console.log(`Socket connected: ${socket.id}`);
      const userId = socket.handshake.query.userId as string;
      if (!userId) return;

      socket.join(userId); // personal room
      console.log(`User ${userId} joined personal room`);

      socket.on("get_conversations", async (_data, callback) => {
        try {
          await dbConnect();
          const messages = await MessageModel.find({
            $or: [{ sender: userId }, { receiver: userId }],
          })
            .populate("sender receiver", "name userName photoUrl")
            .sort({ createdAt: -1 })
            .lean();

          const convMap = new Map<string, any>();

          messages.forEach(msg => {
            const convId = msg.conversationId;
            if (!convMap.has(convId)) {
              const otherUser =
                msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
              const unreadCount =
                msg.receiver._id.toString() === userId && !msg.isRead ? 1 : 0;
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
          console.error("Get conversations error:", err);
          callback([]);
        }
      });


socket.on("mark_read", async ({ conversationId }) => {
  if (!conversationId) return;
  try {
    await dbConnect();
    await MessageModel.updateMany(
      { conversationId, receiver: userId, isRead: false },
      { $set: { isRead: true } }
    );

    const messages = await MessageModel.find({ conversationId })
      .populate("sender receiver", "name userName photoUrl")
      .sort({ createdAt: 1 })
      .lean();

    ioInstance!.to(conversationId).emit(
      "recent_messages",
      messages.map(msg => ({ ...msg, status: "sent" }))
    );

    // Update unread count for this user
    const unreadCount = await MessageModel.countDocuments({
      receiver: userId,
      isRead: false,
    });

    ioInstance!.to(userId).emit("global_unread_update", { unreadCount });

  } catch (err) {
    console.error("Mark read error:", err);
  }
});


  
      socket.on('join_conversation', async (conversationId: string) => {
        socket.join(conversationId);
        console.log(`${socket.id} joined conversation ${conversationId}`);

        try {
          await dbConnect();
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

      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(conversationId);
        console.log(`${socket.id} left conversation ${conversationId}`);
      });


    socket.on('send_message', async ({ receiverId, content, subject, conversationId }) => {
  if (!content || !conversationId || !receiverId) return;

  try {
    await dbConnect();
    const message = await MessageModel.create({
      sender: new Types.ObjectId(userId),
      receiver: new Types.ObjectId(receiverId),
      content,
      subject,
      conversationId,
      isRead: false,
    });

    const populated = await message.populate('sender receiver', 'name userName photoUrl');

    // Emit to conversation
    ioInstance!.to(conversationId).emit('new_message', populated.toObject());

    // Count unread for receiver
    const unreadCount = await MessageModel.countDocuments({
      receiver: receiverId,
      isRead: false,
    });

    // Emit unread count
    ioInstance!.to(receiverId).emit('global_unread_update', { unreadCount });
  } catch (err) {
    console.error('Send message error:', err);
  }
});


      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  (httpServer as any).io = ioInstance;

  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
