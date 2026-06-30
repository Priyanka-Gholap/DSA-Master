import { Router } from 'express';
import { updateProfile, changePassword } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { validate } from '../middleware/validationMiddleware';
import { updateProfileSchema, changePasswordSchema } from '../utils/validators';

const router = Router();

router.put('/profile', protect, validate(updateProfileSchema), updateProfile);
router.put('/change-password', protect, validate(changePasswordSchema), changePassword);

export default router;
