"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubmission = exports.getSubmissionHistory = exports.submitProblemCode = exports.runProblemCode = exports.getDraftCode = exports.saveDraftCode = exports.getContinueSolving = exports.getPracticeProgress = exports.toggleBookmark = exports.updateProblemStatus = exports.getProblemBySlug = exports.getAllProblems = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
const codeExecutionService_1 = require("../services/codeExecutionService");
const gamificationService_1 = require("../services/gamificationService");
const getAllProblems = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { search, difficulty, status, topicSlug, bookmarked, sortBy } = req.query;
        const whereClause = {};
        // 1. Search Query
        if (search && typeof search === 'string') {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { statement: { contains: search, mode: 'insensitive' } },
            ];
        }
        // 2. Difficulty Filter
        if (difficulty && typeof difficulty === 'string' && difficulty !== 'All') {
            whereClause.difficulty = difficulty;
        }
        // 3. Topic Filter
        if (topicSlug && typeof topicSlug === 'string' && topicSlug !== 'All') {
            whereClause.topic = { slug: topicSlug };
        }
        // 4. Status Filter
        if (status && typeof status === 'string' && status !== 'All') {
            if (status === 'UNSOLVED') {
                whereClause.userAttempts = {
                    none: { userId },
                };
            }
            else {
                whereClause.userAttempts = {
                    some: {
                        userId,
                        status,
                    },
                };
            }
        }
        // 5. Bookmarks Filter
        if (bookmarked === 'true') {
            whereClause.userAttempts = {
                some: {
                    userId,
                    bookmarked: true,
                },
            };
        }
        // 6. Sorting Order
        let orderBy = { createdAt: 'desc' };
        if (sortBy === 'alphabetical') {
            orderBy = { title: 'asc' };
        }
        else if (sortBy === 'difficulty') {
            orderBy = { difficulty: 'asc' };
        }
        else if (sortBy === 'recently_added') {
            orderBy = { createdAt: 'desc' };
        }
        else if (sortBy === 'estimated_time') {
            orderBy = { estimatedTime: 'asc' };
        }
        // Execute Query
        const problems = await db_1.default.problem.findMany({
            where: whereClause,
            orderBy,
            include: {
                topic: { select: { id: true, title: true, slug: true } },
                userAttempts: {
                    where: { userId },
                },
            },
        });
        // Map output to flattened properties
        const mappedProblems = problems.map((p) => {
            const attempt = p.userAttempts[0];
            return {
                id: p.id,
                title: p.title,
                slug: p.slug,
                difficulty: p.difficulty,
                estimatedTime: p.estimatedTime,
                topic: p.topic,
                status: attempt ? attempt.status : 'NOT_STARTED',
                bookmarked: attempt ? attempt.bookmarked : false,
                lastAttemptedDate: attempt ? attempt.updatedAt : null,
            };
        });
        res.status(200).json({
            status: 'success',
            data: {
                problems: mappedProblems,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllProblems = getAllProblems;
const getProblemBySlug = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { slug } = req.params;
        // Fetch Problem details
        const problem = await db_1.default.problem.findUnique({
            where: { slug },
            include: {
                topic: { select: { id: true, title: true, slug: true } },
            },
        });
        if (!problem) {
            throw new errors_1.AppError('Problem not found', 404);
        }
        // Upsert UserProblem to capture visit and update lastVisited
        const userProblem = await db_1.default.userProblem.upsert({
            where: {
                userId_problemId: {
                    userId,
                    problemId: problem.id,
                },
            },
            update: {
                lastVisited: new Date(),
            },
            create: {
                userId,
                problemId: problem.id,
                status: 'NOT_STARTED',
                bookmarked: false,
                lastVisited: new Date(),
            },
        });
        res.status(200).json({
            status: 'success',
            data: {
                problem,
                progress: userProblem,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProblemBySlug = getProblemBySlug;
const updateProblemStatus = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { id } = req.params; // Problem ID
        const { status } = req.body;
        if (!status || !['NOT_STARTED', 'ATTEMPTED', 'SOLVED'].includes(status)) {
            throw new errors_1.AppError('Invalid status value. Must be NOT_STARTED, ATTEMPTED, or SOLVED', 400);
        }
        // Verify problem exists
        const problem = await db_1.default.problem.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!problem) {
            throw new errors_1.AppError('Problem not found', 404);
        }
        const solvedAt = status === 'SOLVED' ? new Date() : null;
        // Upsert UserProblem status
        const attempt = await db_1.default.userProblem.upsert({
            where: {
                userId_problemId: {
                    userId,
                    problemId: id,
                },
            },
            update: {
                status,
                solvedAt,
                lastVisited: new Date(),
            },
            create: {
                userId,
                problemId: id,
                status,
                solvedAt,
                lastVisited: new Date(),
            },
        });
        res.status(200).json({
            status: 'success',
            data: {
                attempt,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProblemStatus = updateProblemStatus;
const toggleBookmark = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { id } = req.params; // Problem ID
        const { bookmarked } = req.body;
        if (bookmarked === undefined || typeof bookmarked !== 'boolean') {
            throw new errors_1.AppError('Bookmarked field is required and must be boolean', 400);
        }
        // Verify problem exists
        const problem = await db_1.default.problem.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!problem) {
            throw new errors_1.AppError('Problem not found', 404);
        }
        const attempt = await db_1.default.userProblem.upsert({
            where: {
                userId_problemId: {
                    userId,
                    problemId: id,
                },
            },
            update: {
                bookmarked,
            },
            create: {
                userId,
                problemId: id,
                status: 'NOT_STARTED',
                bookmarked,
            },
        });
        res.status(200).json({
            status: 'success',
            data: {
                attempt,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.toggleBookmark = toggleBookmark;
const getPracticeProgress = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        // Get total problems counts
        const totalCount = await db_1.default.problem.count();
        const easyCount = await db_1.default.problem.count({ where: { difficulty: 'Easy' } });
        const mediumCount = await db_1.default.problem.count({ where: { difficulty: 'Medium' } });
        const hardCount = await db_1.default.problem.count({ where: { difficulty: 'Hard' } });
        // Get solved counts for user
        const solvedCount = await db_1.default.userProblem.count({
            where: { userId, status: 'SOLVED' },
        });
        const easySolvedCount = await db_1.default.userProblem.count({
            where: { userId, status: 'SOLVED', problem: { difficulty: 'Easy' } },
        });
        const mediumSolvedCount = await db_1.default.userProblem.count({
            where: { userId, status: 'SOLVED', problem: { difficulty: 'Medium' } },
        });
        const hardSolvedCount = await db_1.default.userProblem.count({
            where: { userId, status: 'SOLVED', problem: { difficulty: 'Hard' } },
        });
        // Get attempted counts
        const attemptedCount = await db_1.default.userProblem.count({
            where: { userId, status: 'ATTEMPTED' },
        });
        // Recently solved problems
        const recentlySolved = await db_1.default.userProblem.findMany({
            where: { userId, status: 'SOLVED' },
            orderBy: { solvedAt: 'desc' },
            take: 3,
            include: {
                problem: {
                    include: {
                        topic: { select: { title: true } },
                    },
                },
            },
        });
        const completionPercentage = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;
        const remainingCount = totalCount - solvedCount;
        res.status(200).json({
            status: 'success',
            data: {
                total: totalCount,
                solved: solvedCount,
                attempted: attemptedCount,
                remaining: remainingCount,
                completionPercentage,
                difficultyCounts: {
                    Easy: { total: easyCount, solved: easySolvedCount },
                    Medium: { total: mediumCount, solved: mediumSolvedCount },
                    Hard: { total: hardCount, solved: hardSolvedCount },
                },
                recentlySolved: recentlySolved.map((attempt) => ({
                    id: attempt.problem.id,
                    title: attempt.problem.title,
                    slug: attempt.problem.slug,
                    difficulty: attempt.problem.difficulty,
                    topicTitle: attempt.problem.topic.title,
                    solvedAt: attempt.solvedAt,
                })),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPracticeProgress = getPracticeProgress;
const getContinueSolving = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        // Find the most recently visited/attempted problem
        const lastAttempt = await db_1.default.userProblem.findFirst({
            where: { userId },
            orderBy: { lastVisited: 'desc' },
            include: {
                problem: {
                    include: {
                        topic: { select: { title: true } },
                    },
                },
            },
        });
        if (lastAttempt) {
            res.status(200).json({
                status: 'success',
                data: {
                    problem: lastAttempt.problem,
                    status: lastAttempt.status,
                },
            });
            return;
        }
        // Fallback: Return the first problem seeded in the first topic (Introduction to DSA)
        const firstProblem = await db_1.default.problem.findFirst({
            orderBy: {
                topic: {
                    order: 'asc',
                },
            },
            include: {
                topic: { select: { title: true } },
            },
        });
        if (!firstProblem) {
            throw new errors_1.AppError('No problems found in the system', 404);
        }
        res.status(200).json({
            status: 'success',
            data: {
                problem: firstProblem,
                status: 'NOT_STARTED',
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getContinueSolving = getContinueSolving;
const saveDraftCode = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { id } = req.params; // Problem ID
        const { sourceCode, language = 'java' } = req.body;
        const draft = await db_1.default.code.upsert({
            where: {
                userId_problemId: {
                    userId,
                    problemId: id
                }
            },
            update: {
                sourceCode,
                language
            },
            create: {
                userId,
                problemId: id,
                sourceCode,
                language
            }
        });
        res.status(200).json({
            status: 'success',
            data: {
                draft
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.saveDraftCode = saveDraftCode;
const getDraftCode = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { id } = req.params; // Problem ID
        const draft = await db_1.default.code.findUnique({
            where: {
                userId_problemId: {
                    userId,
                    problemId: id
                }
            }
        });
        res.status(200).json({
            status: 'success',
            data: {
                draft
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDraftCode = getDraftCode;
const runProblemCode = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { id } = req.params; // Problem ID
        const { sourceCode, input } = req.body;
        const problem = await db_1.default.problem.findUnique({
            where: { id }
        });
        if (!problem) {
            throw new errors_1.AppError('Problem not found', 404);
        }
        const result = await (0, codeExecutionService_1.executeJavaCode)(sourceCode, input !== undefined ? input : problem.sampleInput, problem.sampleOutput, problem.slug);
        res.status(200).json({
            status: 'success',
            data: {
                result
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.runProblemCode = runProblemCode;
const submitProblemCode = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { id } = req.params; // Problem ID
        const { sourceCode } = req.body;
        const problem = await db_1.default.problem.findUnique({
            where: { id }
        });
        if (!problem) {
            throw new errors_1.AppError('Problem not found', 404);
        }
        const result = await (0, codeExecutionService_1.executeJavaCode)(sourceCode, problem.sampleInput, problem.sampleOutput, problem.slug);
        // Save submission record
        const submission = await db_1.default.submission.create({
            data: {
                userId,
                problemId: id,
                sourceCode,
                status: result.status,
                runtime: result.runtime,
                memory: result.memory
            }
        });
        // Sync status to UserProblem attempts
        const isAccepted = result.status === 'ACCEPTED';
        const status = isAccepted ? 'SOLVED' : 'ATTEMPTED';
        const solvedAt = isAccepted ? new Date() : null;
        // Load current status first to ensure we do not downgrade SOLVED -> ATTEMPTED
        const currentAttempt = await db_1.default.userProblem.findUnique({
            where: { userId_problemId: { userId, problemId: id } }
        });
        const nextStatus = currentAttempt?.status === 'SOLVED' ? 'SOLVED' : status;
        const nextSolvedAt = currentAttempt?.status === 'SOLVED' ? currentAttempt.solvedAt : solvedAt;
        await db_1.default.userProblem.upsert({
            where: {
                userId_problemId: {
                    userId,
                    problemId: id
                }
            },
            update: {
                status: nextStatus,
                solvedAt: nextSolvedAt,
                lastVisited: new Date()
            },
            create: {
                userId,
                problemId: id,
                status: nextStatus,
                solvedAt: nextSolvedAt,
                lastVisited: new Date()
            }
        });
        if (isAccepted && currentAttempt?.status !== 'SOLVED') {
            await gamificationService_1.GamificationService.awardXP(userId, 50, 'PROBLEM_SOLVED', `Solved problem: "${problem.title}"`);
        }
        res.status(200).json({
            status: 'success',
            data: {
                submission,
                result
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.submitProblemCode = submitProblemCode;
const getSubmissionHistory = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { id } = req.params; // Problem ID
        const submissions = await db_1.default.submission.findMany({
            where: {
                userId,
                problemId: id
            },
            orderBy: {
                submittedAt: 'desc'
            }
        });
        res.status(200).json({
            status: 'success',
            data: {
                submissions
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSubmissionHistory = getSubmissionHistory;
const deleteSubmission = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { submissionId } = req.params;
        const submission = await db_1.default.submission.findUnique({
            where: { id: submissionId }
        });
        if (!submission || submission.userId !== userId) {
            throw new errors_1.AppError('Submission not found or unauthorized', 404);
        }
        await db_1.default.submission.delete({
            where: { id: submissionId }
        });
        res.status(200).json({
            status: 'success',
            message: 'Submission deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteSubmission = deleteSubmission;
