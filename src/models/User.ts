import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt'; 

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  emailVerified: boolean;
  socialAccounts: Map<string, string>;
  role: 'user' | 'contributor';
  comparePassword(enteredPassword:string): Promise<boolean>
}
const userSchema = new Schema({
  username: { type: String, required: true }, 
  email: { type: String, required: true, unique: true }, 
  password: { type: String, required: true }, 
  emailVerified: { type: Boolean, default: false }, 
  socialAccounts: {
    type: Map,
    of: String 
  },
  role: { 
    type: String, 
    enum: ['user', 'contributor'], 
    default: 'user' 
  },
}, { timestamps: true });


userSchema.pre('save', async function(next) {
  const user = this;
  if (user.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    } catch (error:any) {
      return next(error);
    }
  }

  next();
});


userSchema.methods.comparePassword = async function(enteredPassword: string) {
  return bcrypt.compare(enteredPassword, this.password);
};

export const User = model<IUser>('User', userSchema);
