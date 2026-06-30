import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import topicRoutes from './topicRoutes';
import lessonRoutes from './lessonRoutes';
import problemRoutes from './problemRoutes';
import noteRoutes from './noteRoutes';
import revisionRoutes from './revisionRoutes';
import bookmarkRoutes from './bookmarkRoutes';
import analyticsRoutes from './analyticsRoutes';
import goalRoutes from './goalRoutes';
import achievementRoutes from './achievementRoutes';
import visualizerRoutes from './visualizerRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/topics', topicRoutes);
router.use('/lessons', lessonRoutes);
router.use('/problems', problemRoutes);
router.use('/notes', noteRoutes);
router.use('/revisions', revisionRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/goals', goalRoutes);
router.use('/achievements', achievementRoutes);
router.use('/visualizers', visualizerRoutes);

export default router;
