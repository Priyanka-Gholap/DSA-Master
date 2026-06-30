"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNote = exports.toggleArchiveNote = exports.togglePinNote = exports.updateNote = exports.createNote = exports.getNoteById = exports.getAllNotes = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
const getAllNotes = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { search, pinned, archived, topicId, problemId, sortBy = 'recently_updated' } = req.query;
        const whereClause = {
            userId,
            archived: archived === 'true',
        };
        if (pinned === 'true') {
            whereClause.pinned = true;
        }
        if (topicId) {
            whereClause.topicId = topicId;
        }
        if (problemId) {
            whereClause.problemId = problemId;
        }
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }
        let orderBy = { updatedAt: 'desc' };
        if (sortBy === 'alphabetical') {
            orderBy = { title: 'asc' };
        }
        else if (sortBy === 'oldest') {
            orderBy = { createdAt: 'asc' };
        }
        const notes = await db_1.default.note.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getAllNotes = getAllNotes;
const getNoteById = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const note = await db_1.default.note.findFirst({
            where: { id, userId },
            include: {
                topic: { select: { title: true, slug: true } },
                problem: { select: { title: true, slug: true } },
            },
        });
        if (!note) {
            throw new errors_1.AppError('Note not found', 404);
        }
        res.status(200).json({
            status: 'success',
            data: { note },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getNoteById = getNoteById;
const createNote = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { title = 'Untitled Note', content = '', topicId, problemId } = req.body;
        const note = await db_1.default.note.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.createNote = createNote;
const updateNote = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { title, content } = req.body;
        const note = await db_1.default.note.findFirst({
            where: { id, userId },
        });
        if (!note) {
            throw new errors_1.AppError('Note not found', 404);
        }
        const updatedNote = await db_1.default.note.update({
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
    }
    catch (error) {
        next(error);
    }
};
exports.updateNote = updateNote;
const togglePinNote = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const note = await db_1.default.note.findFirst({
            where: { id, userId },
        });
        if (!note) {
            throw new errors_1.AppError('Note not found', 404);
        }
        const updatedNote = await db_1.default.note.update({
            where: { id },
            data: { pinned: !note.pinned },
        });
        res.status(200).json({
            status: 'success',
            data: { note: updatedNote },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.togglePinNote = togglePinNote;
const toggleArchiveNote = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const note = await db_1.default.note.findFirst({
            where: { id, userId },
        });
        if (!note) {
            throw new errors_1.AppError('Note not found', 404);
        }
        const updatedNote = await db_1.default.note.update({
            where: { id },
            data: { archived: !note.archived },
        });
        res.status(200).json({
            status: 'success',
            data: { note: updatedNote },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.toggleArchiveNote = toggleArchiveNote;
const deleteNote = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const note = await db_1.default.note.findFirst({
            where: { id, userId },
        });
        if (!note) {
            throw new errors_1.AppError('Note not found', 404);
        }
        await db_1.default.note.delete({
            where: { id },
        });
        res.status(200).json({
            status: 'success',
            message: 'Note deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteNote = deleteNote;
