import { Router } from 'express';
import { 
  getLessonByTopicSlug, 
  updateReadingProgress, 
  completeLesson, 
  getContinueReading 
} from '../controllers/lessonController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/continue-reading', protect, getContinueReading);
router.get('/:topicSlug', protect, getLessonByTopicSlug);
router.put('/:id/progress', protect, updateReadingProgress);
router.post('/:id/complete', protect, completeLesson);

export default router;
