import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../utils/errors';
import { GamificationService } from '../services/gamificationService';

export const getGoals = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: { goals },
    });
  } catch (error) {
    next(error);
  }
};

export const createGoal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const { title, target } = req.body;

    if (!title || typeof title !== 'string') {
      throw new AppError('Goal title is required and must be a string', 400);
    }

    if (!target || typeof target !== 'number' || target <= 0) {
      throw new AppError('Goal target must be a positive number', 400);
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        title,
        target,
        progress: 0,
        completed: false,
      },
    });

    res.status(201).json({
      status: 'success',
      data: { goal },
    });
  } catch (error) {
    next(error);
  }
};

export const updateGoalProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { progress } = req.body;

    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const goal = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new AppError('Goal not found', 404);
    }

    if (progress === undefined || typeof progress !== 'number' || progress < 0) {
      throw new AppError('Progress must be a non-negative number', 400);
    }

    const nextProgress = Math.min(goal.target, progress);
    const wasCompleted = goal.completed;
    const isCompleted = nextProgress >= goal.target;

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        progress: nextProgress,
        completed: isCompleted,
      },
    });

    // Award bonus XP if this goal just completed
    if (isCompleted && !wasCompleted) {
      await GamificationService.awardXP(
        userId,
        30,
        'GOAL_COMPLETED',
        `Completed Goal: "${goal.title}"`
      );
    }

    res.status(200).json({
      status: 'success',
      data: { goal: updatedGoal },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const goal = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new AppError('Goal not found', 404);
    }

    await prisma.goal.delete({
      where: { id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
