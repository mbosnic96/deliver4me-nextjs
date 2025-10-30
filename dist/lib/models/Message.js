"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const MessageSchema = new mongoose_1.Schema({
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        default: 'Privatna poruka'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    conversationId: {
        type: String,
        index: true
    }
}, { timestamps: true });
const MessageModel = mongoose_1.models?.Message || (0, mongoose_1.model)('Message', MessageSchema);
exports.default = MessageModel;
