import mongoose, { Schema, Document } from 'mongoose';

export interface ICMSPartner extends Document {
  name: string;
  logo: string; 
  website?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CMSPartnerSchema = new Schema<ICMSPartner>(
  {
    name: { type: String, required: true },
    logo: { type: String, required: true },
    website: String,
    order: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CMSPartnerSchema.index({ order: 1 });

export default mongoose.models.CMSPartner || mongoose.model<ICMSPartner>('CMSPartner', CMSPartnerSchema);
