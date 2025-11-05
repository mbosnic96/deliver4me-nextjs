import mongoose, { Schema, Document } from "mongoose";

export interface ITerms extends Document {
  title: string;
  content: string;
  updatedAt: Date;
}

const TermsSchema = new Schema<ITerms>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Terms || mongoose.model<ITerms>("Terms", TermsSchema);
  
