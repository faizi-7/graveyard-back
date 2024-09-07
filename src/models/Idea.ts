import { SchemaTypes, Schema, model } from "mongoose";

const ideaSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  creator: { type: SchemaTypes.ObjectId, ref: 'User', required: true },
  tags : [{ type: String }],
  votes : { type : Number, default : 0 },
  implemented : { type : Boolean, default : false },
  comments : { type : SchemaTypes.ObjectId, ref : 'Comment' }

}, { timestamps: true });

export const Idea = model('Idea', ideaSchema)