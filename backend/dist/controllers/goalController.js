"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGoal = exports.updateGoalProgress = exports.createGoal = exports.getGoals = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
const gamificationService_1 = require("../services/gamificationService");
const getGoals = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const goals = await db_1.default.goal.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({
            status: 'success',
            data: { goals },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getGoals = getGoals;
const createGoal = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { title, target } = req.body;
        if (!title || typeof title !== 'string') {
            throw new errors_1.AppError('Goal title is required and must be a string', 400);
        }
        if (!target || typeof target !== 'number' || target <= 0) {
            throw new errors_1.AppError('Goal target must be a positive number', 400);
        }
        const goal = await db_1.default.goal.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.createGoal = createGoal;
const updateGoalProgress = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { progress } = req.body;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const goal = await db_1.default.goal.findFirst({
            where: { id, userId },
        });
        if (!goal) {
            throw new errors_1.AppError('Goal not found', 404);
        }
        if (progress === undefined || typeof progress !== 'number' || progress < 0) {
            throw new errors_1.AppError('Progress must be a non-negative number', 400);
        }
        const nextProgress = Math.min(goal.target, progress);
        const wasCompleted = goal.completed;
        const isCompleted = nextProgress >= goal.target;
        const updatedGoal = await db_1.default.goal.update({
            where: { id },
            data: {
                progress: nextProgress,
                completed: isCompleted,
            },
        });
        // Award bonus XP if this goal just completed
        if (isCompleted && !wasCompleted) {
            await gamificationService_1.GamificationService.awardXP(userId, 30, 'GOAL_COMPLETED', `Completed Goal: "${goal.title}"`);
        }
        res.status(200).json({
            status: 'success',
            data: { goal: updatedGoal },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateGoalProgress = updateGoalProgress;
const deleteGoal = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const goal = await db_1.default.goal.findFirst({
            where: { id, userId },
        });
        if (!goal) {
            throw new errors_1.AppError('Goal not found', 404);
        }
        await db_1.default.goal.delete({
            where: { id },
        });
        res.status(200).json({
            status: 'success',
            message: 'Goal deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteGoal = deleteGoal;
