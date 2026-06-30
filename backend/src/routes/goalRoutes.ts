import { Router } from 'express';
import { 
  getGoals, 
  createGoal, 
  updateGoalProgress, 
  deleteGoal 
} from '../controllers/goalController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/', getGoals);
router.post('/', createGoal);
router.put('/:id/progress', updateGoalProgress);
router.delete('/:id', deleteGoal);

export default router;
