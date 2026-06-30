"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContinueReading = exports.completeLesson = exports.updateReadingProgress = exports.getLessonByTopicSlug = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
const gamificationService_1 = require("../services/gamificationService");
const getLessonByTopicSlug = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { topicSlug } = req.params;
        // Find the topic by slug
        const topic = await db_1.default.topic.findUnique({
            where: { slug: topicSlug },
            select: { id: true, title: true, slug: true },
        });
        if (!topic) {
            throw new errors_1.AppError('Topic not found', 404);
        }
        // Find the corresponding lesson
        const lesson = await db_1.default.lesson.findUnique({
            where: { topicId: topic.id },
        });
        if (!lesson) {
            throw new errors_1.AppError('Lesson content not found for this topic', 404);
        }
        // Find or create LessonProgress
        const lessonProgress = await db_1.default.lessonProgress.upsert({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getLessonByTopicSlug = getLessonByTopicSlug;
const updateReadingProgress = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { id } = req.params; // Lesson ID
        const { readingProgress, lastReadSection } = req.body;
        if (readingProgress === undefined ||
            typeof readingProgress !== 'number' ||
            readingProgress < 0 ||
            readingProgress > 100) {
            throw new errors_1.AppError('Invalid reading progress. Must be a number between 0 and 100', 400);
        }
        // Check if the lesson exists
        const lesson = await db_1.default.lesson.findUnique({
            where: { id },
            select: { id: true, topicId: true },
        });
        if (!lesson) {
            throw new errors_1.AppError('Lesson not found', 404);
        }
        const isCompleted = readingProgress === 100;
        // Update LessonProgress
        const progressRecord = await db_1.default.lessonProgress.upsert({
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
        await db_1.default.userProgress.upsert({
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
    }
    catch (error) {
        next(error);
    }
};
exports.updateReadingProgress = updateReadingProgress;
const completeLesson = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { id } = req.params; // Lesson ID
        const lesson = await db_1.default.lesson.findUnique({
            where: { id },
            select: { id: true, topicId: true },
        });
        if (!lesson) {
            throw new errors_1.AppError('Lesson not found', 404);
        }
        // Check if the lesson was already completed to prevent duplicate XP awards
        const existingProgress = await db_1.default.lessonProgress.findUnique({
            where: { userId_lessonId: { userId, lessonId: id } }
        });
        // Set LessonProgress to 100% completed
        const progressRecord = await db_1.default.lessonProgress.upsert({
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
        await db_1.default.userProgress.upsert({
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
            const topicInfo = await db_1.default.topic.findUnique({ where: { id: lesson.topicId }, select: { title: true } });
            await gamificationService_1.GamificationService.awardXP(userId, 20, 'LESSON_COMPLETED', `Completed lesson: "${topicInfo?.title || 'DSA Topic'}"`);
        }
        res.status(200).json({
            status: 'success',
            data: {
                progress: progressRecord,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.completeLesson = completeLesson;
const getContinueReading = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        // Find the most recently updated lesson progress
        const latestProgress = await db_1.default.lessonProgress.findFirst({
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
        const firstTopic = await db_1.default.topic.findFirst({
            orderBy: { order: 'asc' },
            include: {
                lesson: true,
            },
        });
        if (!firstTopic || !firstTopic.lesson) {
            throw new errors_1.AppError('No lessons found in the system', 404);
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
    }
    catch (error) {
        next(error);
    }
};
exports.getContinueReading = getContinueReading;
