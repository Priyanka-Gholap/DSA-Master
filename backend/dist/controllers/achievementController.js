"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserXPProfile = exports.getAchievements = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
const getAchievements = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        // 1. Fetch all achievements
        const allAchievements = await db_1.default.achievement.findMany({
            orderBy: { xpReward: 'asc' },
        });
        // 2. Fetch user's unlocked achievements
        const unlockedAchievements = await db_1.default.userAchievement.findMany({
            where: { userId },
        });
        const unlockedSet = new Set(unlockedAchievements.map((ua) => ua.achievementId));
        const mappedAchievements = allAchievements.map((ach) => {
            const unlockedRecord = unlockedAchievements.find((ua) => ua.achievementId === ach.id);
            return {
                id: ach.id,
                title: ach.title,
                description: ach.description,
                icon: ach.icon,
                xpReward: ach.xpReward,
                unlocked: unlockedSet.has(ach.id),
                unlockedAt: unlockedRecord ? unlockedRecord.unlockedAt : null,
            };
        });
        res.status(200).json({
            status: 'success',
            data: {
                achievements: mappedAchievements,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAchievements = getAchievements;
const getUserXPProfile = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errors_1.AppError('Unauthorized access', 401);
        }
        let xpProfile = await db_1.default.userXP.findUnique({
            where: { userId },
        });
        if (!xpProfile) {
            xpProfile = await db_1.default.userXP.create({
                data: {
                    userId,
                    totalXP: 0,
                    level: 1,
                },
            });
        }
        // Map level to title
        let levelTitle = 'Beginner';
        if (xpProfile.level === 2)
            levelTitle = 'Learner';
        else if (xpProfile.level === 3)
            levelTitle = 'Explorer';
        else if (xpProfile.level === 4)
            levelTitle = 'Problem Solver';
        else if (xpProfile.level >= 5)
            levelTitle = 'Java DSA Expert';
        // Calculate progress to next level
        // Next level XP threshold: Level^2 * 100
        const currentLevelThreshold = Math.pow(xpProfile.level - 1, 2) * 100;
        const nextLevelThreshold = Math.pow(xpProfile.level, 2) * 100;
        const levelRange = nextLevelThreshold - currentLevelThreshold;
        const levelProgress = xpProfile.totalXP - currentLevelThreshold;
        const percentage = levelRange > 0 ? Math.min(100, Math.max(0, Math.round((levelProgress / levelRange) * 100))) : 0;
        res.status(200).json({
            status: 'success',
            data: {
                xpProfile: {
                    totalXP: xpProfile.totalXP,
                    level: xpProfile.level,
                    levelTitle,
                    nextLevelThreshold,
                    percentage,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserXPProfile = getUserXPProfile;
