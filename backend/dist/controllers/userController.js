"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { fullName, email, avatar } = req.body;
        // If email is being changed, check if it's already in use
        if (email) {
            const existingUser = await db_1.default.user.findFirst({
                where: {
                    email: email.toLowerCase(),
                    NOT: { id: userId },
                },
            });
            if (existingUser) {
                throw new errors_1.AppError('Email address is already in use by another account', 400);
            }
        }
        const updatedUser = await db_1.default.user.update({
            where: { id: userId },
            data: {
                ...(fullName && { fullName }),
                ...(email && { email: email.toLowerCase() }),
                ...(avatar !== undefined && { avatar }),
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.status(200).json({
            status: 'success',
            data: {
                user: updatedUser,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { currentPassword, newPassword } = req.body;
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errors_1.AppError('User not found', 404);
        }
        const isMatch = await bcrypt_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            throw new errors_1.AppError('Current password is incorrect', 400);
        }
        const hashedNewPassword = await bcrypt_1.default.hash(newPassword, 10);
        await db_1.default.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword },
        });
        res.status(200).json({
            status: 'success',
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
