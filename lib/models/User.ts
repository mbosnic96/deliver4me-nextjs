import { Schema, model, models, Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'client' | 'driver' | 'admin';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  rating: number;
  reviewsCount: number;
  unreadMessagesCount: number;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  failedLoginAttempts: number;
  lockUntil: Date | null;
  lastFailedLogin: Date | null;
}

export interface IUserLean {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'client' | 'driver' | 'admin';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  rating: number;
  reviewsCount: number;
  __v?: number;
  failedLoginAttempts: number;
  lockUntil: Date | null;
  lastFailedLogin: Date | null;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    phone: String,
    role: { type: String, required: true, enum: ['client', 'driver', 'admin'] },
    address: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    photoUrl: String,
    latitude: Number,
    longitude: Number,
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    unreadMessagesCount: { type: Number, default: 0 },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastFailedLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

const UserModel = models?.User || model<IUser>('User', UserSchema);
export default UserModel;