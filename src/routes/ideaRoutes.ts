import { Router } from 'express'
import { createIdea, getAllIdeas, getIdea, updateIdea, deleteIdea, voteIdea } from '../controllers/ideaController';
import { checkAuthBasic } from '../middleware/checkAuth';
const router= Router()

// POST -> /api/ideas/
router.post('/',checkAuthBasic, createIdea);

// GET -> /api/ideas/
router.get('/', getAllIdeas);

// GET -> /api/ideas/:id
router.get('/:id', getIdea);

// PUT -> /api/ideas/:id
router.put('/:id',checkAuthBasic, updateIdea);

// DELETE -> /api/ideas/:id
router.delete('/:id',checkAuthBasic, deleteIdea);

// POST -> /api/ideas/:id/vote
router.post('/:id/vote',checkAuthBasic, voteIdea);

export default router