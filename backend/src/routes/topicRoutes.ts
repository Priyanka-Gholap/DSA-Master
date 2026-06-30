import { Router } from 'express';
import { 
  getAllTopics, 
  getTopicByIdOrSlug, 
  updateProgress, 
  getContinueLearning 
} from '../controllers/topicController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getAllTopics);
router.get('/continue-learning', protect, getContinueLearning);
router.get('/:idOrSlug', protect, getTopicByIdOrSlug);
router.put('/:id/progress', protect, updateProgress);

export default router;
