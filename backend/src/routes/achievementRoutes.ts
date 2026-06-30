import { Router } from 'express';
import { 
  getAchievements, 
  getUserXPProfile 
} from '../controllers/achievementController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', getAchievements);
router.get('/xp', getUserXPProfile);

export default router;
