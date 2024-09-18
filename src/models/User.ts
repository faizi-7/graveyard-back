import { Schema, SchemaTypes, model } from 'mongoose';
import bcrypt from 'bcrypt'; 

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  fullname : string;
  emailVerified: boolean;
  profileUrl: string;
  role: 'user' | 'contributor';
  comparePassword(enteredPassword:string): Promise<boolean>
  favorites : [string];
  about : string;
}
const userSchema = new Schema({
  username: { type: String, required: true }, 
  email: { type: String, required: true, unique: true }, 
  password: { type: String, required: true }, 
  emailVerified: { type: Boolean, default: false }, 
  fullname : { type : String},
  profileUrl: {type: String, default: 'https://res.cloudinary.com/dhi0av50m/image/upload/v1726231559/ideas_app/defaultpic_uo8za9.jpg'},
  favorites : [{type : SchemaTypes.ObjectId, ref : 'Idea'}],
  role: { 
    type: String, 
    enum: ['user', 'contributor'], 
    default: 'user' 
  },
  about : {type : String}
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
