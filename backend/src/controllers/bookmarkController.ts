import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../utils/errors';

export const getAllBookmarks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const { category, collection, contentType } = req.query;

    const whereClause: any = { userId };

    if (category) {
      whereClause.category = category as string;
    }
    if (collection) {
      whereClause.collection = collection as string;
    }
    if (contentType) {
      whereClause.contentType = contentType as string;
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Populate actual entity titles based on polymorphic contentId/contentType
    const populatedBookmarks = await Promise.all(
      bookmarks.map(async (bm) => {
        let details: any = null;
        if (bm.contentType === 'TOPIC') {
          details = await prisma.topic.findUnique({
            where: { id: bm.contentId },
            select: { title: true, slug: true, category: true },
          });
        } else if (bm.contentType === 'PROBLEM') {
          details = await prisma.problem.findUnique({
            where: { id: bm.contentId },
            select: { title: true, slug: true, difficulty: true },
          });
        } else if (bm.contentType === 'LESSON') {
          details = await prisma.lesson.findUnique({
            where: { id: bm.contentId },
            select: { title: true, topic: { select: { slug: true } } },
          });
        } else if (bm.contentType === 'NOTE') {
          details = await prisma.note.findUnique({
            where: { id: bm.contentId },
            select: { title: true, content: true },
          });
        }

        return {
          ...bm,
          resource: details,
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: { bookmarks: populatedBookmarks },
    });
  } catch (error) {
    next(error);
  }
};

export const createBookmark = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const { contentType, contentId, category = 'Important', collection } = req.body;

    if (!contentType || !contentId) {
      throw new AppError('Must specify a contentType and contentId', 400);
    }

    // Verify if already bookmarked
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_contentType_contentId_category: {
          userId,
          contentType,
          contentId,
          category,
        },
      },
    });

    if (existing) {
      res.status(200).json({
        status: 'success',
        message: 'Bookmark already exists',
        data: { bookmark: existing },
      });
      return;
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId,
        contentType,
        contentId,
        category,
        collection: collection || null,
      },
    });

    // Sync status to UserProblem if bookmarking a problem
    if (contentType === 'PROBLEM') {
      await prisma.userProblem.upsert({
        where: { userId_problemId: { userId, problemId: contentId } },
        update: { bookmarked: true },
        create: { userId, problemId: contentId, bookmarked: true },
      });
    }

    res.status(201).json({
      status: 'success',
      data: { bookmark },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBookmark = async (
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

    const bookmark = await prisma.bookmark.findFirst({
      where: { id, userId },
    });

    if (!bookmark) {
      throw new AppError('Bookmark not found', 404);
    }

    await prisma.bookmark.delete({
      where: { id },
    });

    // Unsync bookmark state in UserProblem if content is problem
    if (bookmark.contentType === 'PROBLEM') {
      const remainingBookmarks = await prisma.bookmark.count({
        where: { userId, contentType: 'PROBLEM', contentId: bookmark.contentId },
      });
      if (remainingBookmarks === 0) {
        await prisma.userProblem.update({
          where: { userId_problemId: { userId, problemId: bookmark.contentId } },
          data: { bookmarked: false },
        });
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Bookmark removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
