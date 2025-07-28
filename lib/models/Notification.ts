import { Schema, model, models } from 'mongoose';

const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  title: String,
  message: String,
  isRead: { type: Boolean, default: false },
  loadId: { type: Schema.Types.ObjectId, ref: 'Load' }
}, { timestamps: { createdAt: true, updatedAt: false } });

export default models.Notification || model('Notification', NotificationSchema);
