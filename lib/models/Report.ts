import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  reportedUserId: mongoose.Types.ObjectId;
  loadId?: mongoose.Types.ObjectId;
  reportType: "spam" | "inappropriate_content" | "fraud" | "harassment" | "fake_profile" | "other";
  description: string;
  evidence: string[];
  status: "pending" | "under_review" | "resolved" | "dismissed";
  adminNotes?: string;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    reportedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    loadId: {
      type: Schema.Types.ObjectId,
      ref: "Load",
      required: false
    },
    reportType: {
      type: String,
      required: true,
      enum: ["spam", "inappropriate_content", "fraud", "harassment", "fake_profile", "other"]
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true
    },
    evidence: [{
      type: String
    }],
    status: {
      type: String,
      enum: ["pending", "under_review", "resolved", "dismissed"],
      default: "pending"
    },
    adminNotes: {
      type: String,
      maxlength: 2000,
      trim: true
    },
    resolvedAt: {
      type: Date
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

ReportSchema.index({ reporterId: 1, createdAt: -1 });
ReportSchema.index({ reportedUserId: 1, status: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ createdAt: -1 });

export default (mongoose.models.Report as Model<IReport>) || mongoose.model<IReport>("Report", ReportSchema);