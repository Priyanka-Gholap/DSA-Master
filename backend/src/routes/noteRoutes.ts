import { Router } from 'express';
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  togglePinNote,
  toggleArchiveNote,
  deleteNote
} from '../controllers/noteController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getAllNotes);
router.post('/', protect, createNote);
router.get('/:id', protect, getNoteById);
router.put('/:id', protect, updateNote);
router.put('/:id/pin', protect, togglePinNote);
router.put('/:id/archive', protect, toggleArchiveNote);
router.delete('/:id', protect, deleteNote);

export default router;
