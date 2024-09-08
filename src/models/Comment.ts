import { Schema, SchemaTypes, model } from 'mongoose';

const commentSchema = new Schema({
  content: { type: String, required: true },
  creator: { type: SchemaTypes.ObjectId, ref: 'User', required: true },
  idea: { type: SchemaTypes.ObjectId, ref: 'Idea', required: true },
  parentComment: { type: SchemaTypes.ObjectId, ref: 'Comment', default: null },
  replies: [{ type: SchemaTypes.ObjectId, ref: 'Comment' }],
}, { timestamps: true });

export const Comment = model('Comment', commentSchema);
