import { Schema, model, models, Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  userName: string;
  email: string;
  password: string;
  phone: string;
  role: 'client' | 'driver';
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
}

export interface IUserLean extends Omit<IUser, keyof Document> {
  _id: Types.ObjectId;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    userName: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, required: true, enum: ['client', 'driver'] },
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
  },
  { timestamps: true }
);

// Check if the model exists before compiling it
const User = models.User || model<IUser>('User', UserSchema);

export default User;