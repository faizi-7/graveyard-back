import { z } from 'zod';
import { categories } from '../constants/constants';

const validateTags = (tags: string[]) => tags.every(tag => categories.includes(tag));
export const validateIdea = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  tags: z.array(z.string()).min(1, 'At least one tag is required').refine(validateTags, {
    message: 'One or more tags are invalid',
  }),

  implemented: z.boolean().optional(),
  isOriginal: z.enum(["true", "false"]),  
  sourceDescription: z.string().optional(),
  donationQrCodeUrl: z.string().url('Invalid URL').optional(),
})
  .refine((data) => {
    if (data.isOriginal == "false") {
      return data.sourceDescription;
    }
    return true;
  }, {
    path: ['sourceDescription'],
    message: 'Source description is required when the idea is not original',
  });

export const validateIdeaUpdate = z.object({
  implemented: z.enum(["true", "false"]),  
}).strict();
export const validateVote = z.object({
  vote: z.enum(['upvote', 'downvote'], {
    errorMap: () => ({ message: 'Invalid vote type, must be either "upvote" or "downvote".' }),
  })
  
});

export const validateComment = z.object({
  comment: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment can be at max 1000 character long')
});
export const validateParams = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid URL Param format')