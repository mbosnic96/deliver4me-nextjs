import mongoose, { Schema, Document } from 'mongoose';

export interface ICMSTestimonial extends Document {
  name: string;
  role: string;
  text: string;
  avatar?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CMSTestimonialSchema = new Schema<ICMSTestimonial>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    text: { type: String, required: true },
    avatar: String,
    order: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CMSTestimonialSchema.index({ order: 1 });

export default mongoose.models.CMSTestimonial || mongoose.model<ICMSTestimonial>('CMSTestimonial', CMSTestimonialSchema);
