import { Router } from 'express';
import {
  getAllRevisions,
  createRevision,
  toggleCompleteRevision,
  getTodayRevisions,
  deleteRevision
} from '../controllers/revisionController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getAllRevisions);
router.post('/', protect, createRevision);
router.get('/today', protect, getTodayRevisions);
router.put('/:id/complete', protect, toggleCompleteRevision);
router.delete('/:id', protect, deleteRevision);

export default router;
