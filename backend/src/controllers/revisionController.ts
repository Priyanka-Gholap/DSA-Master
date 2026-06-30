import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../utils/errors';
import { GamificationService } from '../services/gamificationService';

export const getAllRevisions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const { completed, topicId, problemId } = req.query;

    const whereClause: any = { userId };

    if (completed !== undefined) {
      whereClause.completed = completed === 'true';
    }
    if (topicId) {
      whereClause.topicId = topicId as string;
    }
    if (problemId) {
      whereClause.problemId = problemId as string;
    }

    const revisions = await prisma.revision.findMany({
      where: whereClause,
      orderBy: { scheduledDate: 'asc' },
      include: {
        topic: { select: { title: true, slug: true, category: true } },
        problem: { select: { title: true, slug: true, difficulty: true } },
      },
    });

    res.status(200).json({
      status: 'success',
      data: { revisions },
    });
  } catch (error) {
    next(error);
  }
};

export const createRevision = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const { topicId, problemId, days } = req.body;

    if (!topicId && !problemId) {
      throw new AppError('Must specify a topicId or problemId to schedule revision', 400);
    }

    // Days can be: 1 (Tomorrow), 3, 7, 14, 30, or custom date string
    let scheduledDate = new Date();
    if (typeof days === 'number') {
      scheduledDate.setDate(scheduledDate.getDate() + days);
    } else if (typeof days === 'string') {
      scheduledDate = new Date(days);
    } else {
      scheduledDate.setDate(scheduledDate.getDate() + 1); // Default to tomorrow
    }

    // Set time to start of day for clean date matching
    scheduledDate.setHours(0, 0, 0, 0);

    const revision = await prisma.revision.create({
      data: {
        userId,
        topicId: topicId || null,
        problemId: problemId || null,
        scheduledDate,
      },
    });

    res.status(201).json({
      status: 'success',
      data: { revision },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleCompleteRevision = async (
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

    const revision = await prisma.revision.findFirst({
      where: { id, userId },
    });

    if (!revision) {
      throw new AppError('Revision schedule not found', 404);
    }

    const nextCompleted = !revision.completed;
    const completedAt = nextCompleted ? new Date() : null;

    const updatedRevision = await prisma.revision.update({
      where: { id },
      data: {
        completed: nextCompleted,
        completedAt,
      },
    });

    if (nextCompleted) {
      await GamificationService.awardXP(
        userId,
        15,
        'REVISION_COMPLETED',
        `Completed study revision slot`
      );
    }

    res.status(200).json({
      status: 'success',
      data: { revision: updatedRevision },
    });
  } catch (error) {
    next(error);
  }
};

export const getTodayRevisions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const revisions = await prisma.revision.findMany({
      where: {
        userId,
        scheduledDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        topic: { select: { title: true, slug: true, category: true } },
        problem: { select: { title: true, slug: true, difficulty: true } },
      },
      orderBy: { completed: 'asc' }, // Uncompleted first
    });

    const totalToday = revisions.length;
    const completedToday = revisions.filter(r => r.completed).length;
    const completionPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    res.status(200).json({
      status: 'success',
      data: {
        revisions,
        totalToday,
        completedToday,
        completionPercentage,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRevision = async (
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

    const revision = await prisma.revision.findFirst({
      where: { id, userId },
    });

    if (!revision) {
      throw new AppError('Revision schedule not found', 404);
    }

    await prisma.revision.delete({
      where: { id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Revision schedule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
