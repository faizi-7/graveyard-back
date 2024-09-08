import { z } from 'zod';
import { Types } from 'mongoose';

export const validateIdea = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  creator: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid creator ID',
  }),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  implemented: z.boolean().optional(),
  isOriginal: z.boolean().default(true),
  sourceDescription: z.string().optional(),
  donationQrCodeUrl: z.string().url('Invalid URL').optional(),
})
  .refine((data) => {
    if (!data.isOriginal) {
      return data.sourceDescription;
    }
    return true;
  }, {
    path: ['sourceDescription'],
    message: 'Source description is required when the idea is not original',
  });

export const validateIdeaUpdate = z.object({
  implemented: z.boolean().optional(),
  donationQrCodeUrl: z.string().url("Invalid URL for donation QR code").optional()
}).strict();
export const validateVote = z.object({
  vote: z.enum(['upvote', 'downvote'])
});

export const validateComment = z.object({
  comment: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment can be at max 1000 character long')
});
export const validateParams = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid URL Param format')