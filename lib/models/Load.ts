import { Schema, model, models } from 'mongoose';

const LoadSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,

  pickupCountry: String,
  pickupState: String,
  pickupCity: String,
  pickupAddress: String,
  preferredPickupDate: Date,
  pickupTime: String,

  deliveryCountry: String,
  deliveryState: String,
  deliveryCity: String,
  deliveryAddress: String,
  preferredDeliveryDate: Date,

  contactPerson: String,
  contactPhone: String,
  maxDeliveryTime: String,
  cargoWeight: Number,
  cargoVolume: Number,
  cargoWidth: Number,
  cargoHeight: Number,
  cargoLength: Number,

  pickupLatitude: Number,
  pickupLongitude: Number,
  deliveryLatitude: Number,
  deliveryLongitude: Number,

  fixedPrice: Number,
  status: String,
  assignedBidId: { type: Schema.Types.ObjectId, ref: 'Bid' },

  images: [String],
  
  driverConfirmedDelivery: { type: Boolean, default: false },
  driverConfirmedAt: { type: Date },
  clientConfirmedDelivery: { type: Boolean, default: false },
  clientConfirmedAt: { type: Date },
}, { timestamps: true });

export default models.Load || model('Load', LoadSchema);
