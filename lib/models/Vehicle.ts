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
   currentLoads: [{ 
    loadId: { type: Schema.Types.ObjectId, ref: "Load" },
    volumeUsed: Number,
    status: { type: String, enum: ["active", "delivered", "canceled"], default: "active" }
  }],
}, { timestamps: { createdAt: true, updatedAt: false } });

const Vehicle = models.Vehicle || model("Vehicle", VehicleSchema);
export default Vehicle;  
