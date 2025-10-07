import { Schema, model, models, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  content: string;
  subject?: string;
  isRead: boolean;
  conversationId: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    receiver: { 
      type: Schema.Types.ObjectId, 
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
  },
  { timestamps: true }
);

const MessageModel = models?.Message || model<IMessage>('Message', MessageSchema);

export default MessageModel;