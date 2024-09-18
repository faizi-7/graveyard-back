import { Router } from 'express';
import { checkAuthBasic } from '../middleware/checkAuth';
import { addComment, getCommentByIdea } from '../controllers/commentController';

const router = Router();

// POST '/api/:ideaId/comments/'
router.post('/:ideaId',checkAuthBasic, addComment);

router.get('/:ideaId', getCommentByIdea)

export default router;