import { Router } from 'express'
import { createIdea, getAllIdeas, getIdea, updateIdea, deleteIdea, voteIdea, addFavoriteIdea } from '../controllers/ideaController';
import { checkAuthBasic, checkAuthPro } from '../middleware/checkAuth';
const router= Router()

// POST -> /api/ideas/
router.post('/',checkAuthPro, createIdea);

// GET -> /api/ideas/
router.get('/', getAllIdeas);

// GET -> /api/ideas/:id
router.get('/:id', getIdea);

// PUT -> /api/ideas/:id
router.put('/:id',checkAuthPro, updateIdea);

// DELETE -> /api/ideas/:id
router.delete('/:id',checkAuthPro, deleteIdea);

// POST -> /api/ideas/:id/vote
router.post('/:id/vote',checkAuthPro, voteIdea);

// POST -> /api/ideas/favorites/:ideaId
router.post('/favorites/:ideaId', checkAuthBasic, addFavoriteIdea);

export default router