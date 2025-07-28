import { Schema, model, models } from 'mongoose';

const ReviewSchema = new Schema({
  fromUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  toUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  loadId: { type: Schema.Types.ObjectId, ref: 'Load' },
  rating: Number,
  comment: String
}, { timestamps: { createdAt: true, updatedAt: false } });

export default models.Review || model('Review', ReviewSchema);
