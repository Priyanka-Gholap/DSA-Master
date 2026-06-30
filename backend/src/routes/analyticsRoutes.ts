import { Router } from 'express';
import { 
  getAnalyticsSummary, 
  getAnalyticsCharts, 
  getAnalyticsHeatmap, 
  getActivityTimeline 
} from '../controllers/analyticsController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.get('/summary', getAnalyticsSummary);
router.get('/charts', getAnalyticsCharts);
router.get('/heatmap', getAnalyticsHeatmap);
router.get('/timeline', getActivityTimeline);

export default router;
