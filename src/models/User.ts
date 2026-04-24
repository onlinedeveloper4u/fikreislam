import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'owner' | 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ['owner', 'admin', 'user'], default: 'user' },
  },
  { timestamps: true, collection: 'users' }
);

// We define models with a check to prevent recompilation issue in development.
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
