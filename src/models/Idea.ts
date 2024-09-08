import { SchemaTypes, Schema, model } from "mongoose";

const ideaSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  creator: { type: SchemaTypes.ObjectId, ref: 'User', required: true },
  tags: {type : [{ type: String }], required : true},
  votes: { type: Number, default: 0 },
  implemented: { type: Boolean, default: false },
  isOriginal: { type: Boolean, default: true },
  sourceDescription: { type: String },
  donationQrCodeUrl: { type: String, required: false },

}, { timestamps: true });

export const Idea = model('Idea', ideaSchema);
