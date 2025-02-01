import mongoose, { Document } from 'mongoose';
import { UserRole } from '../../dtos/user-role.enum';

export interface User extends Document {
  name: string;
  email: string;
  username: string;
  password?: string;
  verificationToken?: string;
  isVerified?: boolean;
  role?: UserRole;
  knowledges?: mongoose.Types.ObjectId[];
  subjects?: mongoose.Types.ObjectId[];
  journeys?: mongoose.Types.ObjectId[];
  subscribedJourneys?: mongoose.Types.ObjectId[];
  subscribedSubjects?: mongoose.Types.ObjectId[];
  completedTrails?: mongoose.Types.ObjectId[];
}
