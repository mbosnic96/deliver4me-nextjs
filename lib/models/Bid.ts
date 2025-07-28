import { Schema, model, models } from 'mongoose';

const BidSchema = new Schema({
  loadId: { type: Schema.Types.ObjectId, ref: 'Load' },
  driverId: { type: Schema.Types.ObjectId, ref: 'User' },
  price: Number,
  message: String,
  status: String
}, { timestamps: { createdAt: true, updatedAt: false } });

export default models.Bid || model('Bid', BidSchema);
