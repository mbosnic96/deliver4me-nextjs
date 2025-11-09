"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const url_1 = require("url");
const next_1 = __importDefault(require("next"));
const socket_io_1 = require("socket.io");
const db_1 = require("./lib/db/db");
const Message_1 = __importDefault(require("./lib/models/Message"));
const mongoose_1 = require("mongoose");
const web_push_1 = __importDefault(require("web-push"));
const PushSubscription_1 = require("./lib/models/PushSubscription");
if (global.gc) {
    let previousHeap = 0;
    setInterval(() => {
        const usage = process.memoryUsage();
        const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
        const externalMB = Math.round(usage.external / 1024 / 1024);
        const heapPercent = (usage.heapUsed / usage.heapTotal) * 100;
        const heapGrowth = heapUsedMB - previousHeap;
        previousHeap = heapUsedMB;
        if (heapPercent > 70 && global.gc) {
            global.gc();
        }
    }, 15000);
}
else {
    console.warn('Garbage collection not exposed. Run with --expose-gc flag.');
}
const dev = process.env.NODE_ENV !== 'production';
const app = (0, next_1.default)({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;
let ioInstance = null;
async function sendPushNotification(userId, notification) {
    try {
        const subscriptions = await PushSubscription_1.PushSubscription.find({ userId });
        if (subscriptions.length === 0) {
            console.log(`No push subscriptions found for user: ${userId}`);
            return;
        }
        const payload = JSON.stringify({
            type: 'message',
            message: notification.message,
            preview: notification.preview,
            senderName: notification.senderName,
            conversationId: notification.conversationId,
            link: notification.link,
            _id: notification._id,
            timestamp: new Date().toISOString()
        });
        const sendPromises = subscriptions.map(async (sub) => {
            try {
                await web_push_1.default.sendNotification(sub.subscription, payload);
                console.log('Push notification sent successfully to:', userId);
            }
            catch (error) {
                console.error('Error sending push to subscription:', error);
                if (error.statusCode === 410 || error.statusCode === 404) {
                    await PushSubscription_1.PushSubscription.findByIdAndDelete(sub._id);
                    console.log('Removed invalid subscription');
                }
            }
        });
        await Promise.all(sendPromises);
    }
    catch (error) {
        console.error('Error in sendPushNotification:', error);
    }
}
app.prepare().then(async () => {
    await (0, db_1.dbConnect)();
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        web_push_1.default.setVapidDetails('mailto:your-email@example.com', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
        console.log('Web Push configured successfully');
    }
    else {
        console.warn('VAPID keys not found - push notifications will not work');
    }
    const httpServer = (0, http_1.createServer)((req, res) => {
        const parsedUrl = (0, url_1.parse)(req.url, true);
        handle(req, res, parsedUrl);
    });
    if (!ioInstance) {
        ioInstance = new socket_io_1.Server(httpServer, {
            cors: { origin: '*' },
            perMessageDeflate: false,
        });
        ioInstance.on('connection', (socket) => {
            console.log(`Socket connected: ${socket.id}`);
            const userId = socket.handshake.query.userId;
            if (!userId) {
                console.log('Socket connected without userId');
                return;
            }
            socket.join(userId);
            console.log(`User ${userId} joined personal room`);
            socket.on('get_conversations', async (_data, callback) => {
                try {
                    const messages = await Message_1.default.find({
                        $or: [{ sender: userId }, { receiver: userId }],
                    })
                        .populate('sender receiver', 'name photoUrl')
                        .sort({ createdAt: -1 })
                        .limit(100)
                        .lean();
                    const convMap = new Map();
                    messages.forEach(msg => {
                        const convId = msg.conversationId;
                        const otherUser = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
                        const unreadCount = msg.receiver._id.toString() === userId && !msg.isRead ? 1 : 0;
                        if (!convMap.has(convId)) {
                            convMap.set(convId, {
                                conversationId: convId,
                                lastMessage: msg,
                                unreadCount,
                                otherUser,
                            });
                        }
                        else {
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
                }
                catch (err) {
                    console.error('Get conversations error:', err);
                    callback([]);
                }
            });
            socket.on('mark_read', async ({ conversationId }) => {
                if (!conversationId)
                    return;
                try {
                    await Message_1.default.updateMany({ conversationId, receiver: userId, isRead: false }, { $set: { isRead: true } });
                    const messages = await Message_1.default.find({ conversationId })
                        .populate('sender receiver', 'name photoUrl')
                        .sort({ createdAt: 1 })
                        .lean();
                    ioInstance.to(conversationId).emit('recent_messages', messages.map(msg => ({ ...msg, status: 'sent' })));
                    const unreadCount = await Message_1.default.countDocuments({
                        receiver: userId,
                        isRead: false,
                    });
                    ioInstance.to(userId).emit('global_unread_update', { unreadCount });
                }
                catch (err) {
                    console.error('Mark read error:', err);
                }
            });
            socket.on('join_conversation', async (conversationId) => {
                socket.join(conversationId);
                console.log(`${socket.id} joined conversation ${conversationId}`);
                try {
                    const messages = await Message_1.default.find({ conversationId })
                        .populate('sender receiver', 'name photoUrl')
                        .sort({ createdAt: 1 })
                        .limit(50)
                        .lean();
                    socket.emit('recent_messages', messages);
                }
                catch (err) {
                    console.error('Fetch recent messages failed:', err);
                }
            });
            socket.on('leave_conversation', (conversationId) => {
                socket.leave(conversationId);
                console.log(`${socket.id} left conversation ${conversationId}`);
            });
            socket.on('send_message', async ({ receiverId, content, subject, conversationId }) => {
                if (!content || !conversationId || !receiverId) {
                    console.log('Invalid message data received');
                    return;
                }
                try {
                    const message = await Message_1.default.create({
                        sender: new mongoose_1.Types.ObjectId(userId),
                        receiver: new mongoose_1.Types.ObjectId(receiverId),
                        content,
                        subject,
                        conversationId,
                        isRead: false,
                    });
                    const populated = await message.populate('sender receiver', 'name photoUrl');
                    ioInstance.to(conversationId).emit('new_message', populated.toObject());
                    const unreadCount = await Message_1.default.countDocuments({
                        receiver: receiverId,
                        isRead: false,
                    });
                    ioInstance.to(receiverId).emit('global_unread_update', {
                        unreadCount,
                    });
                    const senderName = populated.sender.name || 'Korisnik';
                    const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;
                    await sendPushNotification(receiverId, {
                        message: `Nova poruka od ${senderName}`,
                        preview: preview,
                        senderName: senderName,
                        conversationId: conversationId,
                        link: `/messages?with=${userId}`,
                        _id: message._id.toString()
                    });
                    console.log(`Message sent from ${userId} to ${receiverId}, push notification triggered`);
                }
                catch (err) {
                    console.error('Send message error:', err);
                }
            });
            socket.on('disconnect', () => {
                console.log(`Socket disconnected: ${socket.id}`);
                socket.removeAllListeners();
            });
        });
    }
    httpServer.io = ioInstance;
    httpServer.listen(PORT, () => {
        console.log(`> Ready on http://localhost:${PORT}`);
        console.log(`> Environment: ${dev ? 'development' : 'production'}`);
    });
});
