import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPushSubscription extends Document {
  userId: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  createdAt: Date;
}

const PushSubscriptionSchema: Schema<IPushSubscription> = new Schema({
  userId: { type: String, required: true },
  subscription: {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    }
  },
  createdAt: { type: Date, default: Date.now }
});

export const PushSubscription: Model<IPushSubscription> =
  mongoose.models.PushSubscription || mongoose.model('PushSubscription', PushSubscriptionSchema);