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
const dev = process.env.NODE_ENV !== 'production';
const app = (0, next_1.default)({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;
let ioInstance = null;
app.prepare().then(async () => {
    await (0, db_1.dbConnect)();
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
            if (!userId)
                return;
            socket.join(userId);
            console.log(`User ${userId} joined personal room`);
            socket.on('get_conversations', async (_data, callback) => {
                try {
                    const messages = await Message_1.default.find({
                        $or: [{ sender: userId }, { receiver: userId }],
                    })
                        .populate('sender receiver', 'name userName photoUrl')
                        .sort({ createdAt: -1 })
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
                        .populate('sender receiver', 'name userName photoUrl')
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
                        .populate('sender receiver', 'name userName photoUrl')
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
                if (!content || !conversationId || !receiverId)
                    return;
                try {
                    const message = await Message_1.default.create({
                        sender: new mongoose_1.Types.ObjectId(userId),
                        receiver: new mongoose_1.Types.ObjectId(receiverId),
                        content,
                        subject,
                        conversationId,
                        isRead: false,
                    });
                    const populated = await message.populate('sender receiver', 'name userName photoUrl');
                    ioInstance.to(conversationId).emit('new_message', populated.toObject());
                    const unreadCount = await Message_1.default.countDocuments({
                        receiver: receiverId,
                        isRead: false,
                    });
                    ioInstance.to(receiverId).emit('global_unread_update', {
                        unreadCount,
                    });
                }
                catch (err) {
                    console.error('Send message error:', err);
                }
            });
            socket.on('disconnect', () => {
                console.log(`Socket disconnected: ${socket.id}`);
            });
        });
    }
    httpServer.io = ioInstance;
    httpServer.listen(PORT, () => {
        console.log(`> Ready on http://localhost:${PORT}`);
    });
});
