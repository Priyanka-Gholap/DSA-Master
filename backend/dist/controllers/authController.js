"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../config/db"));
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const setTokenCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};
const register = async (req, res, next) => {
    try {
        const { fullName, email, password } = req.body;
        const existingUser = await db_1.default.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            throw new errors_1.AppError('Email address is already registered', 400);
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Default avatar placeholder (e.g., initial letter)
        const avatar = fullName.charAt(0).toUpperCase();
        const user = await db_1.default.user.create({
            data: {
                fullName,
                email: email.toLowerCase(),
                password: hashedPassword,
                avatar,
            },
        });
        const token = (0, jwt_1.signToken)({ id: user.id });
        setTokenCookie(res, token);
        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    avatar: user.avatar,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
                token,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await db_1.default.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            throw new errors_1.AppError('Invalid email or password', 401);
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            throw new errors_1.AppError('Invalid email or password', 401);
        }
        const token = (0, jwt_1.signToken)({ id: user.id });
        setTokenCookie(res, token);
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    avatar: user.avatar,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
                token,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const logout = async (_req, res, next) => {
    try {
        res.cookie('token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: new Date(0),
        });
        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
const getMe = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            throw new errors_1.AppError('User not found', 404);
        }
        res.status(200).json({
            status: 'success',
            data: {
                user,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
