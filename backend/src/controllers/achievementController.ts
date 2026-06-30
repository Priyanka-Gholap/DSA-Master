import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../utils/errors';

export const getAchievements = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    // 1. Fetch all achievements
    const allAchievements = await prisma.achievement.findMany({
      orderBy: { xpReward: 'asc' },
    });

    // 2. Fetch user's unlocked achievements
    const unlockedAchievements = await prisma.userAchievement.findMany({
      where: { userId },
    });

    const unlockedSet = new Set(unlockedAchievements.map((ua) => ua.achievementId));

    const mappedAchievements = allAchievements.map((ach) => {
      const unlockedRecord = unlockedAchievements.find((ua) => ua.achievementId === ach.id);
      return {
        id: ach.id,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        xpReward: ach.xpReward,
        unlocked: unlockedSet.has(ach.id),
        unlockedAt: unlockedRecord ? unlockedRecord.unlockedAt : null,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        achievements: mappedAchievements,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserXPProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    let xpProfile = await prisma.userXP.findUnique({
      where: { userId },
    });

    if (!xpProfile) {
      xpProfile = await prisma.userXP.create({
        data: {
          userId,
          totalXP: 0,
          level: 1,
        },
      });
    }

    // Map level to title
    let levelTitle = 'Beginner';
    if (xpProfile.level === 2) levelTitle = 'Learner';
    else if (xpProfile.level === 3) levelTitle = 'Explorer';
    else if (xpProfile.level === 4) levelTitle = 'Problem Solver';
    else if (xpProfile.level >= 5) levelTitle = 'Java DSA Expert';

    // Calculate progress to next level
    // Next level XP threshold: Level^2 * 100
    const currentLevelThreshold = Math.pow(xpProfile.level - 1, 2) * 100;
    const nextLevelThreshold = Math.pow(xpProfile.level, 2) * 100;
    const levelRange = nextLevelThreshold - currentLevelThreshold;
    const levelProgress = xpProfile.totalXP - currentLevelThreshold;
    const percentage = levelRange > 0 ? Math.min(100, Math.max(0, Math.round((levelProgress / levelRange) * 100))) : 0;

    res.status(200).json({
      status: 'success',
      data: {
        xpProfile: {
          totalXP: xpProfile.totalXP,
          level: xpProfile.level,
          levelTitle,
          nextLevelThreshold,
          percentage,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
