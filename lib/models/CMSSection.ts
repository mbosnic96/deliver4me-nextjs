import mongoose, { Schema, Document } from 'mongoose';

export interface ICMSSection extends Document {
  type: 'hero' | 'features' | 'testimonials' | 'stats' | 'about' | 'map' | 'app' | 'cta' | 'partners';
  title?: string;
  subtitle?: string;
  content?: any; 
  order: number;
  isActive: boolean;
  backgroundColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CMSSectionSchema = new Schema<ICMSSection>(
  {
    type: {
      type: String,
      enum: ['hero', 'features', 'testimonials', 'stats', 'about', 'map', 'app', 'cta', 'partners'],
      required: true
    },
    title: String,
    subtitle: String,
    content: Schema.Types.Mixed, 
    order: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
    backgroundColor: String,
  },
  { timestamps: true }
);

CMSSectionSchema.index({ order: 1 });

export default mongoose.models.CMSSection || mongoose.model<ICMSSection>('CMSSection', CMSSectionSchema);
