import { Router } from 'express';
import {
  getAllProblems,
  getProblemBySlug,
  updateProblemStatus,
  toggleBookmark,
  getPracticeProgress,
  getContinueSolving,
  saveDraftCode,
  getDraftCode,
  runProblemCode,
  submitProblemCode,
  getSubmissionHistory,
  deleteSubmission
} from '../controllers/problemController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getAllProblems);
router.get('/progress', protect, getPracticeProgress);
router.get('/continue-solving', protect, getContinueSolving);
router.get('/:slug', protect, getProblemBySlug);
router.put('/:id/status', protect, updateProblemStatus);
router.put('/:id/bookmark', protect, toggleBookmark);

router.post('/:id/code', protect, saveDraftCode);
router.get('/:id/code', protect, getDraftCode);
router.post('/:id/run', protect, runProblemCode);
router.post('/:id/submit', protect, submitProblemCode);
router.get('/:id/submissions', protect, getSubmissionHistory);
router.delete('/submissions/:submissionId', protect, deleteSubmission);

export default router;
