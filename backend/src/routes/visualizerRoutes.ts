import { Router } from 'express';
import {
  getPreferences,
  updatePreferences,
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../controllers/visualizerController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);
router.get('/favorites', getFavorites);
router.post('/favorites', addFavorite);
router.delete('/favorites/:name', removeFavorite);

export default router;
