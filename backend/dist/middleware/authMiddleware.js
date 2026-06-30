"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const db_1 = __importDefault(require("../config/db"));
const protect = async (req, _res, next) => {
    try {
        let token = '';
        // Check cookies first
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        // Fallback to Auth Header
        else if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            throw new errors_1.AppError('Not authorized, no token provided', 401);
        }
        try {
            const decoded = (0, jwt_1.verifyToken)(token);
            // Verify user still exists in database
            const user = await db_1.default.user.findUnique({
                where: { id: decoded.id },
                select: { id: true },
            });
            if (!user) {
                throw new errors_1.AppError('Not authorized, user not found', 401);
            }
            req.user = { id: user.id };
            next();
        }
        catch (err) {
            throw new errors_1.AppError('Not authorized, invalid token', 401);
        }
    }
    catch (error) {
        next(error);
    }
};
exports.protect = protect;
