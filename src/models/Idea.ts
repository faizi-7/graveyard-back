import { SchemaTypes, Schema, model } from "mongoose";

const ideaSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  creator: { type: SchemaTypes.ObjectId, ref: 'User', required: true },
  tags: {type : [{ type: String }], required : true},
  votes: { type: Number, default: 0 },
  voters: [{
    userId: { type: SchemaTypes.ObjectId, ref: 'User', required: true },
    vote: { type: String, enum: ['upvote', 'downvote'], required: true }
  }],
  // implemented: { type: Boolean, default: false },
  isOriginal: { type: String, enum : ["true", "false"], default: "true" },
  implemented: { type: String, enum : ["true", "false"], default: "false" },
  sourceDescription: { type: String },
  donationQrCodeUrl: { type: String, required: false },
}, { timestamps: true });

export const Idea = model('Idea', ideaSchema);
