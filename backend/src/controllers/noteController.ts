import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../utils/errors';

export const getAllNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const { search, pinned, archived, topicId, problemId, sortBy = 'recently_updated' } = req.query;

    const whereClause: any = {
      userId,
      archived: archived === 'true',
    };

    if (pinned === 'true') {
      whereClause.pinned = true;
    }
    if (topicId) {
      whereClause.topicId = topicId as string;
    }
    if (problemId) {
      whereClause.problemId = problemId as string;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { updatedAt: 'desc' };
    if (sortBy === 'alphabetical') {
      orderBy = { title: 'asc' };
    } else if (sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    }

    const notes = await prisma.note.findMany({
      where: whereClause,
      orderBy,
      include: {
        topic: { select: { title: true, slug: true } },
        problem: { select: { title: true, slug: true } },
      },
    });

    res.status(200).json({
      status: 'success',
      data: { notes },
    });
  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (
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

    const note = await prisma.note.findFirst({
      where: { id, userId },
      include: {
        topic: { select: { title: true, slug: true } },
        problem: { select: { title: true, slug: true } },
      },
    });

    if (!note) {
      throw new AppError('Note not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

export const createNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const { title = 'Untitled Note', content = '', topicId, problemId } = req.body;

    const note = await prisma.note.create({
      data: {
        userId,
        title,
        content,
        topicId: topicId || null,
        problemId: problemId || null,
      },
    });

    res.status(201).json({
      status: 'success',
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (
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

    const { title, content } = req.body;

    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      throw new AppError('Note not found', 404);
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        title: title !== undefined ? title : note.title,
        content: content !== undefined ? content : note.content,
      },
    });

    res.status(200).json({
      status: 'success',
      data: { note: updatedNote },
    });
  } catch (error) {
    next(error);
  }
};

export const togglePinNote = async (
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

    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      throw new AppError('Note not found', 404);
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: { pinned: !note.pinned },
    });

    res.status(200).json({
      status: 'success',
      data: { note: updatedNote },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleArchiveNote = async (
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

    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      throw new AppError('Note not found', 404);
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: { archived: !note.archived },
    });

    res.status(200).json({
      status: 'success',
      data: { note: updatedNote },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (
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

    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      throw new AppError('Note not found', 404);
    }

    await prisma.note.delete({
      where: { id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Note deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
