"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBookmark = exports.createBookmark = exports.getAllBookmarks = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
const getAllBookmarks = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { category, collection, contentType } = req.query;
        const whereClause = { userId };
        if (category) {
            whereClause.category = category;
        }
        if (collection) {
            whereClause.collection = collection;
        }
        if (contentType) {
            whereClause.contentType = contentType;
        }
        const bookmarks = await db_1.default.bookmark.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
        });
        // Populate actual entity titles based on polymorphic contentId/contentType
        const populatedBookmarks = await Promise.all(bookmarks.map(async (bm) => {
            let details = null;
            if (bm.contentType === 'TOPIC') {
                details = await db_1.default.topic.findUnique({
                    where: { id: bm.contentId },
                    select: { title: true, slug: true, category: true },
                });
            }
            else if (bm.contentType === 'PROBLEM') {
                details = await db_1.default.problem.findUnique({
                    where: { id: bm.contentId },
                    select: { title: true, slug: true, difficulty: true },
                });
            }
            else if (bm.contentType === 'LESSON') {
                details = await db_1.default.lesson.findUnique({
                    where: { id: bm.contentId },
                    select: { title: true, topic: { select: { slug: true } } },
                });
            }
            else if (bm.contentType === 'NOTE') {
                details = await db_1.default.note.findUnique({
                    where: { id: bm.contentId },
                    select: { title: true, content: true },
                });
            }
            return {
                ...bm,
                resource: details,
            };
        }));
        res.status(200).json({
            status: 'success',
            data: { bookmarks: populatedBookmarks },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllBookmarks = getAllBookmarks;
const createBookmark = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { contentType, contentId, category = 'Important', collection } = req.body;
        if (!contentType || !contentId) {
            throw new errors_1.AppError('Must specify a contentType and contentId', 400);
        }
        // Verify if already bookmarked
        const existing = await db_1.default.bookmark.findUnique({
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
        const bookmark = await db_1.default.bookmark.create({
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
            await db_1.default.userProblem.upsert({
                where: { userId_problemId: { userId, problemId: contentId } },
                update: { bookmarked: true },
                create: { userId, problemId: contentId, bookmarked: true },
            });
        }
        res.status(201).json({
            status: 'success',
            data: { bookmark },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createBookmark = createBookmark;
const deleteBookmark = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const bookmark = await db_1.default.bookmark.findFirst({
            where: { id, userId },
        });
        if (!bookmark) {
            throw new errors_1.AppError('Bookmark not found', 404);
        }
        await db_1.default.bookmark.delete({
            where: { id },
        });
        // Unsync bookmark state in UserProblem if content is problem
        if (bookmark.contentType === 'PROBLEM') {
            const remainingBookmarks = await db_1.default.bookmark.count({
                where: { userId, contentType: 'PROBLEM', contentId: bookmark.contentId },
            });
            if (remainingBookmarks === 0) {
                await db_1.default.userProblem.update({
                    where: { userId_problemId: { userId, problemId: bookmark.contentId } },
                    data: { bookmarked: false },
                });
            }
        }
        res.status(200).json({
            status: 'success',
            message: 'Bookmark removed successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteBookmark = deleteBookmark;
