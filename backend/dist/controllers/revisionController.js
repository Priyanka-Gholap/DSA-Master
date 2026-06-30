"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRevision = exports.getTodayRevisions = exports.toggleCompleteRevision = exports.createRevision = exports.getAllRevisions = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
const gamificationService_1 = require("../services/gamificationService");
const getAllRevisions = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { completed, topicId, problemId } = req.query;
        const whereClause = { userId };
        if (completed !== undefined) {
            whereClause.completed = completed === 'true';
        }
        if (topicId) {
            whereClause.topicId = topicId;
        }
        if (problemId) {
            whereClause.problemId = problemId;
        }
        const revisions = await db_1.default.revision.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getAllRevisions = getAllRevisions;
const createRevision = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { topicId, problemId, days } = req.body;
        if (!topicId && !problemId) {
            throw new errors_1.AppError('Must specify a topicId or problemId to schedule revision', 400);
        }
        // Days can be: 1 (Tomorrow), 3, 7, 14, 30, or custom date string
        let scheduledDate = new Date();
        if (typeof days === 'number') {
            scheduledDate.setDate(scheduledDate.getDate() + days);
        }
        else if (typeof days === 'string') {
            scheduledDate = new Date(days);
        }
        else {
            scheduledDate.setDate(scheduledDate.getDate() + 1); // Default to tomorrow
        }
        // Set time to start of day for clean date matching
        scheduledDate.setHours(0, 0, 0, 0);
        const revision = await db_1.default.revision.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.createRevision = createRevision;
const toggleCompleteRevision = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const revision = await db_1.default.revision.findFirst({
            where: { id, userId },
        });
        if (!revision) {
            throw new errors_1.AppError('Revision schedule not found', 404);
        }
        const nextCompleted = !revision.completed;
        const completedAt = nextCompleted ? new Date() : null;
        const updatedRevision = await db_1.default.revision.update({
            where: { id },
            data: {
                completed: nextCompleted,
                completedAt,
            },
        });
        if (nextCompleted) {
            await gamificationService_1.GamificationService.awardXP(userId, 15, 'REVISION_COMPLETED', `Completed study revision slot`);
        }
        res.status(200).json({
            status: 'success',
            data: { revision: updatedRevision },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.toggleCompleteRevision = toggleCompleteRevision;
const getTodayRevisions = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const revisions = await db_1.default.revision.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getTodayRevisions = getTodayRevisions;
const deleteRevision = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const revision = await db_1.default.revision.findFirst({
            where: { id, userId },
        });
        if (!revision) {
            throw new errors_1.AppError('Revision schedule not found', 404);
        }
        await db_1.default.revision.delete({
            where: { id },
        });
        res.status(200).json({
            status: 'success',
            message: 'Revision schedule deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteRevision = deleteRevision;
