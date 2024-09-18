import { Router } from 'express'
import { createIdea, getAllIdeas, getIdea, updateIdea, deleteIdea, voteIdea, addFavoriteIdea, getIdeaTags, getIdeaByUser, getTopIdeas } from '../controllers/ideaController';
import { checkAuthBasic, checkAuthPro } from '../middleware/checkAuth';
import { upload } from '../services/uploadService';
const router= Router()

// POST -> /api/ideas/
router.post('/',checkAuthPro, upload.single('image'), createIdea);

// GET -> /api/ideas/
router.get('/', getAllIdeas);

// GET -> /api/ideas/top
router.get('/top', getTopIdeas);


// GET -> /api/ideas/user/:userId
router.get('/user/:userId', getIdeaByUser);

// GET -> /api/ideas/tags
router.get('/tags', getIdeaTags);

// GET -> /api/ideas/:id
router.get('/:id', getIdea);


// PUT -> /api/ideas/:id
router.put('/:id',checkAuthPro,upload.single('image'), updateIdea);

// DELETE -> /api/ideas/:id
router.delete('/:id',checkAuthPro, deleteIdea);

// POST -> /api/ideas/:id/vote
router.post('/:id/vote',checkAuthBasic, voteIdea);

// POST -> /api/ideas/favorites/:ideaId
router.post('/favorites/:ideaId', checkAuthBasic, addFavoriteIdea);

// router.get('/favorites/:userId', getFavoriteIdeas)

export default router