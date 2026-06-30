import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../utils/errors';

export const getAllTopics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    // Fetch all topics in order
    const topics = await prisma.topic.findMany({
      orderBy: { order: 'asc' },
    });

    // Fetch user progress for all topics
    const userProgress = await prisma.userProgress.findMany({
      where: { userId },
    });

    // Map progress to topics
    const progressMap = new Map(
      userProgress.map((p) => [p.topicId, p])
    );

    const mergedTopics = topics.map((topic) => {
      const prog = progressMap.get(topic.id);
      const progressPercent = prog ? prog.progress : 0;
      const completed = prog ? prog.completed : false;
      
      let status = 'NOT_STARTED';
      if (completed) {
        status = 'COMPLETED';
      } else if (progressPercent > 0) {
        status = 'IN_PROGRESS';
      }

      return {
        id: topic.id,
        title: topic.title,
        slug: topic.slug,
        description: topic.description,
        difficulty: topic.difficulty,
        estimatedTime: topic.estimatedTime,
        category: topic.category,
        order: topic.order,
        progress: progressPercent,
        completed,
        status,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        topics: mergedTopics,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTopicByIdOrSlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const { idOrSlug } = req.params;

    // Search by slug first, then fallback to id
    let topic = await prisma.topic.findUnique({
      where: { slug: idOrSlug },
    });

    if (!topic) {
      // Check if it's a valid uuid before searching by id
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(idOrSlug)) {
        topic = await prisma.topic.findUnique({
          where: { id: idOrSlug },
        });
      }
    }

    if (!topic) {
      throw new AppError('Topic not found', 404);
    }

    // Upsert UserProgress to record this visit (so it becomes the "last visited" topic)
    const progressRecord = await prisma.userProgress.upsert({
      where: {
        userId_topicId: {
          userId,
          topicId: topic.id,
        },
      },
      update: {
        lastVisited: new Date(),
      },
      create: {
        userId,
        topicId: topic.id,
        progress: 0,
        completed: false,
        lastVisited: new Date(),
      },
    });

    let status = 'NOT_STARTED';
    if (progressRecord.completed) {
      status = 'COMPLETED';
    } else if (progressRecord.progress > 0) {
      status = 'IN_PROGRESS';
    }

    res.status(200).json({
      status: 'success',
      data: {
        topic: {
          ...topic,
          progress: progressRecord.progress,
          completed: progressRecord.completed,
          status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const { id } = req.params;
    const { progress, completed } = req.body;

    if (progress === undefined || typeof progress !== 'number' || progress < 0 || progress > 100) {
      throw new AppError('Invalid progress value. Must be a number between 0 and 100', 400);
    }

    // Verify the topic exists
    const topic = await prisma.topic.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!topic) {
      throw new AppError('Topic not found', 404);
    }

    const isCompleted = completed !== undefined ? completed : progress === 100;

    const progressRecord = await prisma.userProgress.upsert({
      where: {
        userId_topicId: {
          userId,
          topicId: id,
        },
      },
      update: {
        progress,
        completed: isCompleted,
        lastVisited: new Date(),
      },
      create: {
        userId,
        topicId: id,
        progress,
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

export const getContinueLearning = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    // Fetch the most recently visited topic
    const latestProgress = await prisma.userProgress.findFirst({
      where: { userId },
      orderBy: { lastVisited: 'desc' },
      include: {
        topic: true,
      },
    });

    if (latestProgress) {
      res.status(200).json({
        status: 'success',
        data: {
          topic: {
            ...latestProgress.topic,
            progress: latestProgress.progress,
            completed: latestProgress.completed,
          },
        },
      });
      return;
    }

    // Fallback: If no topic has been visited yet, return the first topic in the roadmap (order: 1)
    const firstTopic = await prisma.topic.findFirst({
      orderBy: { order: 'asc' },
    });

    if (!firstTopic) {
      throw new AppError('No topics found in the system', 450);
    }

    res.status(200).json({
      status: 'success',
      data: {
        topic: {
          ...firstTopic,
          progress: 0,
          completed: false,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
