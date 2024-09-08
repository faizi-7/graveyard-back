import { Router } from 'express';
import { checkAuthBasic } from '../middleware/checkAuth';
import { addComment } from '../controllers/commentController';

const router = Router();

// POST '/api/:ideaId/comments/'
router.post('/:ideaId',checkAuthBasic, addComment);

export default router;