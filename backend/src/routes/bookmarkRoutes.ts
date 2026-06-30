import { Router } from 'express';
import {
  getAllBookmarks,
  createBookmark,
  deleteBookmark
} from '../controllers/bookmarkController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getAllBookmarks);
router.post('/', protect, createBookmark);
router.delete('/:id', protect, deleteBookmark);

export default router;
