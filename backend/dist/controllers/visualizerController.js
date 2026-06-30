"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFavorite = exports.addFavorite = exports.getFavorites = exports.updatePreferences = exports.getPreferences = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
const getPreferences = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        let preferences = await db_1.default.visualizerPreference.findUnique({
            where: { userId },
        });
        if (!preferences) {
            preferences = await db_1.default.visualizerPreference.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getPreferences = getPreferences;
const updatePreferences = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { animationSpeed, preferredTheme, lastVisualizer } = req.body;
        const preferences = await db_1.default.visualizerPreference.upsert({
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
    }
    catch (error) {
        next(error);
    }
};
exports.updatePreferences = updatePreferences;
const getFavorites = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const favorites = await db_1.default.favoriteVisualizer.findMany({
            where: { userId },
        });
        res.status(200).json({
            status: 'success',
            data: { favorites },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getFavorites = getFavorites;
const addFavorite = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { visualizerName } = req.body;
        if (!visualizerName || typeof visualizerName !== 'string') {
            throw new errors_1.AppError('Visualizer name is required and must be a string', 400);
        }
        const favorite = await db_1.default.favoriteVisualizer.upsert({
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
    }
    catch (error) {
        next(error);
    }
};
exports.addFavorite = addFavorite;
const removeFavorite = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        const { name } = req.params;
        const favorite = await db_1.default.favoriteVisualizer.findFirst({
            where: { userId, visualizerName: name },
        });
        if (!favorite) {
            throw new errors_1.AppError('Favorite record not found', 404);
        }
        await db_1.default.favoriteVisualizer.delete({
            where: { id: favorite.id },
        });
        res.status(200).json({
            status: 'success',
            message: 'Visualizer removed from favorites list',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.removeFavorite = removeFavorite;
