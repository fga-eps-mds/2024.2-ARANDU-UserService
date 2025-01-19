import * as bcrypt from 'bcryptjs';
import * as mongoose from 'mongoose';
import { UserRole } from '../../dtos/user-role.enum';
import { User } from './user.interface';

export const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    verificationToken: { type: String },
    isVerified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.ALUNO,
    },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    subscribedJourneys: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Journey' },
    ],
    completedTrails: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trail' }],
  },
  { timestamps: true, collection: 'users' },
);

UserSchema.pre<User>('save', async function (next) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const user = this;

  if (!user.isModified('password')) {
    return next();
  }

  try {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
    return next();
  } catch (err) {
    return next(err);
  }
});
