import mongoose, { Schema, Document } from 'mongoose';

export type ContentType = 
  | 'hero' 
  | 'features' 
  | 'testimonials' 
  | 'stats' 
  | 'about' 
  | 'cta' 
  | 'posts'
  | 'slider'
  | 'gallery'
  | 'contact';

export interface ICMSContent extends Document {
  type: ContentType;
  title?: string;
  subtitle?: string;
  content: any; 
  order: number;
  isActive: boolean;
  metadata?: {
    backgroundColor?: string;
    textColor?: string;
    backgroundImage?: string;
    layout?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CMSContentSchema = new Schema<ICMSContent>(
  {
    type: {
      type: String,
      enum: ['hero', 'features', 'testimonials', 'stats', 'about', 'cta', 'posts', 'slider', 'gallery', 'contact'],
      required: true
    },
    title: String,
    subtitle: String,
    content: {
      type: Schema.Types.Mixed,
      required: true,
      default: {}
    },
    order: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    metadata: {
      backgroundColor: String,
      textColor: String,
      backgroundImage: String,
      layout: String
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index for efficient querying
CMSContentSchema.index({ type: 1, order: 1 });
CMSContentSchema.index({ isActive: 1, order: 1 });

export default mongoose.models.CMSContent || mongoose.model<ICMSContent>('CMSContent', CMSContentSchema);