import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  message: string;
  seen: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema: Schema<INotification> = new Schema({
  userId: { type: String, required: true },
  message: { type: String, required: true },
  seen: { type: Boolean, default: false },
  link: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
