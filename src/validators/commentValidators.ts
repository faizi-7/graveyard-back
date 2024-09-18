import { z } from 'zod';
import { Types } from 'mongoose';

export const validateObjectId = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId format',
  });

export const validateCommentBody
  = z.object({
    content: z.string({message :'Content is required'}).min(1, 'Comment content cannot be empty'),
    parentId: validateObjectId.optional(),
  });

// export const validateUser = z.object({
//   userId: validateObjectId,
//   username: z.string(),
//   email: z.string().email(),
//   role: z.enum(['user', 'contributor']),
// });
