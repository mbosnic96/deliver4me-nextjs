import mongoose, { Schema, Document } from 'mongoose';

export interface ICMSHero extends Document {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CMSHeroSchema = new Schema<ICMSHero>(
  {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    ctaText: { type: String, required: true },
    ctaLink: { type: String, required: true },
    backgroundImage: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.CMSHero || mongoose.model<ICMSHero>('CMSHero', CMSHeroSchema);