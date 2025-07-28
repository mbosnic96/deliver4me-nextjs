import { Schema, model, models } from 'mongoose';

const VehicleTypeSchema = new Schema({
  name: String,
  description: String
});

export default models.VehicleType || model('VehicleType', VehicleTypeSchema);
