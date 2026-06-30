import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../utils/errors';

export const getPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    let preferences = await prisma.visualizerPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await prisma.visualizerPreference.create({
        data: {
          userId,
          animationSpeed: 500,
          preferredTheme: 'dark',
          lastVisualizer: 'sorting',
        },
      });
    }

    res.status(200).json({
      status: 'success',
      data: { preferences },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const { animationSpeed, preferredTheme, lastVisualizer } = req.body;

    const preferences = await prisma.visualizerPreference.upsert({
      where: { userId },
      update: {
        animationSpeed: animationSpeed !== undefined ? animationSpeed : undefined,
        preferredTheme: preferredTheme !== undefined ? preferredTheme : undefined,
        lastVisualizer: lastVisualizer !== undefined ? lastVisualizer : undefined,
      },
      create: {
        userId,
        animationSpeed: animationSpeed !== undefined ? animationSpeed : 500,
        preferredTheme: preferredTheme !== undefined ? preferredTheme : 'dark',
        lastVisualizer: lastVisualizer !== undefined ? lastVisualizer : 'sorting',
      },
    });

    res.status(200).json({
      status: 'success',
      data: { preferences },
    });
  } catch (error) {
    next(error);
  }
};

export const getFavorites = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const favorites = await prisma.favoriteVisualizer.findMany({
      where: { userId },
    });

    res.status(200).json({
      status: 'success',
      data: { favorites },
    });
  } catch (error) {
    next(error);
  }
};

export const addFavorite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const { visualizerName } = req.body;

    if (!visualizerName || typeof visualizerName !== 'string') {
      throw new AppError('Visualizer name is required and must be a string', 400);
    }

    const favorite = await prisma.favoriteVisualizer.upsert({
      where: {
        userId_visualizerName: {
          userId,
          visualizerName,
        },
      },
      update: {},
      create: {
        userId,
        visualizerName,
      },
    });

    res.status(201).json({
      status: 'success',
      data: { favorite },
    });
  } catch (error) {
    next(error);
  }
};

export const removeFavorite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const { name } = req.params;

    const favorite = await prisma.favoriteVisualizer.findFirst({
      where: { userId, visualizerName: name },
    });

    if (!favorite) {
      throw new AppError('Favorite record not found', 404);
    }

    await prisma.favoriteVisualizer.delete({
      where: { id: favorite.id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Visualizer removed from favorites list',
    });
  } catch (error) {
    next(error);
  }
};
