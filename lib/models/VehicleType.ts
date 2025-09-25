import { Schema, model, models } from 'mongoose';

const VehicleTypeSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

const VehicleType = models.VehicleType || model('VehicleType', VehicleTypeSchema);

export default VehicleType;