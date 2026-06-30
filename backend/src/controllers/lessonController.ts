import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../utils/errors';
import { GamificationService } from '../services/gamificationService';

export const getLessonByTopicSlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const { topicSlug } = req.params;

    // Find the topic by slug
    const topic = await prisma.topic.findUnique({
      where: { slug: topicSlug },
      select: { id: true, title: true, slug: true },
    });

    if (!topic) {
      throw new AppError('Topic not found', 404);
    }

    // Find the corresponding lesson
    const lesson = await prisma.lesson.findUnique({
      where: { topicId: topic.id },
    });

    if (!lesson) {
      throw new AppError('Lesson content not found for this topic', 404);
    }

    // Find or create LessonProgress
    const lessonProgress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId: lesson.id,
        },
      },
      update: {}, // Just retrieve it if it exists
      create: {
        userId,
        lessonId: lesson.id,
        readingProgress: 0,
        completed: false,
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        lesson,
        progress: lessonProgress,
        topic,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateReadingProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const { id } = req.params; // Lesson ID
    const { readingProgress, lastReadSection } = req.body;

    if (
      readingProgress === undefined ||
      typeof readingProgress !== 'number' ||
      readingProgress < 0 ||
      readingProgress > 100
    ) {
      throw new AppError('Invalid reading progress. Must be a number between 0 and 100', 400);
    }

    // Check if the lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      select: { id: true, topicId: true },
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    const isCompleted = readingProgress === 100;

    // Update LessonProgress
    const progressRecord = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId: id,
        },
      },
      update: {
        readingProgress,
        lastReadSection,
        completed: isCompleted || undefined, // Only set true if reached 100
      },
      create: {
        userId,
        lessonId: id,
        readingProgress,
        lastReadSection,
        completed: isCompleted,
      },
    });

    // Sync with UserProgress (Phase 2 topic progress model)
    // Map reading progress to general topic progress
    await prisma.userProgress.upsert({
      where: {
        userId_topicId: {
          userId,
          topicId: lesson.topicId,
        },
      },
      update: {
        progress: readingProgress,
        completed: isCompleted || undefined,
        lastVisited: new Date(),
      },
      create: {
        userId,
        topicId: lesson.topicId,
        progress: readingProgress,
        completed: isCompleted,
        lastVisited: new Date(),
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        progress: progressRecord,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const completeLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const { id } = req.params; // Lesson ID

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      select: { id: true, topicId: true },
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    // Check if the lesson was already completed to prevent duplicate XP awards
    const existingProgress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId: id } }
    });

    // Set LessonProgress to 100% completed
    const progressRecord = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId: id,
        },
      },
      update: {
        readingProgress: 100,
        completed: true,
      },
      create: {
        userId,
        lessonId: id,
        readingProgress: 100,
        completed: true,
      },
    });

    // Set UserProgress to 100% completed
    await prisma.userProgress.upsert({
      where: {
        userId_topicId: {
          userId,
          topicId: lesson.topicId,
        },
      },
      update: {
        progress: 100,
        completed: true,
        lastVisited: new Date(),
      },
      create: {
        userId,
        topicId: lesson.topicId,
        progress: 100,
        completed: true,
        lastVisited: new Date(),
      },
    });

    if (existingProgress?.completed !== true) {
      const topicInfo = await prisma.topic.findUnique({ where: { id: lesson.topicId }, select: { title: true } });
      await GamificationService.awardXP(
        userId,
        20,
        'LESSON_COMPLETED',
        `Completed lesson: "${topicInfo?.title || 'DSA Topic'}"`
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        progress: progressRecord,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getContinueReading = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    // Find the most recently updated lesson progress
    const latestProgress = await prisma.lessonProgress.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        lesson: {
          include: {
            topic: true,
          },
        },
      },
    });

    if (latestProgress) {
      res.status(200).json({
        status: 'success',
        data: {
          lesson: latestProgress.lesson,
          progress: latestProgress,
          topic: latestProgress.lesson.topic,
        },
      });
      return;
    }

    // Fallback: Return the first lesson in the path (linked to topic order: 1)
    const firstTopic = await prisma.topic.findFirst({
      orderBy: { order: 'asc' },
      include: {
        lesson: true,
      },
    });

    if (!firstTopic || !firstTopic.lesson) {
      throw new AppError('No lessons found in the system', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        lesson: firstTopic.lesson,
        progress: {
          readingProgress: 0,
          completed: false,
          lastReadSection: null,
        },
        topic: firstTopic,
      },
    });
  } catch (error) {
    next(error);
  }
};
