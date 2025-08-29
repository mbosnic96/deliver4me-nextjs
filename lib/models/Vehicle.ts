import { Schema, model, models } from "mongoose";

const VehicleSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  brand: String,
  model: String,
  plateNumber: String,
  volume: Number,
  width: Number,
  length: Number,
  height: Number,
  vehicleTypeId: { type: Schema.Types.ObjectId, ref: "VehicleType" },
  images: [String],
  cargoPercentage: { type: Number, default: 0 },
}, { timestamps: { createdAt: true, updatedAt: false } });

const Vehicle = models.Vehicle || model("Vehicle", VehicleSchema);
export default Vehicle;  
