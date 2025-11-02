import mongoose, { Schema, Document } from 'mongoose';

export interface ICMSFeature extends Document {
  title: string;
  description: string;
  icon: string; // Icon name from lucide-react
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CMSFeatureSchema = new Schema<ICMSFeature>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CMSFeatureSchema.index({ order: 1 });

export default mongoose.models.CMSFeature || mongoose.model<ICMSFeature>('CMSFeature', CMSFeatureSchema);
