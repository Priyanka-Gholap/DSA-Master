import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GamificationService {
  /**
   * Awards XP to a user, logs activity, updates goals, and checks achievements.
   */
  static async awardXP(
    userId: string,
    xpAmount: number,
    activityType: 'LESSON_COMPLETED' | 'PROBLEM_SOLVED' | 'REVISION_COMPLETED' | 'GOAL_COMPLETED' | 'SYSTEM',
    description: string
  ) {
    try {
      // 1. Log Activity
      await prisma.activity.create({
        data: {
          userId,
          activityType,
          description,
        },
      });

      // 2. Fetch or initialize XP profile
      let xpProfile = await prisma.userXP.findUnique({
        where: { userId },
      });

      if (!xpProfile) {
        xpProfile = await prisma.userXP.create({
          data: {
            userId,
            totalXP: 0,
            level: 1,
          },
        });
      }

      const originalLevel = xpProfile.level;
      const newXP = xpProfile.totalXP + xpAmount;
      
      // Calculate level based on XP: Level = floor(sqrt(XP / 100)) + 1
      const newLevel = Math.max(1, Math.floor(Math.sqrt(newXP / 100)) + 1);

      // Update XP Profile
      await prisma.userXP.update({
        where: { userId },
        data: {
          totalXP: newXP,
          level: newLevel,
        },
      });

      // 3. Update active goals progress
      await this.updateGoalsProgress(userId, activityType);

      // 4. Run achievements checklist unlocks
      await this.checkAchievements(userId);

      return {
        earnedXP: xpAmount,
        totalXP: newXP,
        leveledUp: newLevel > originalLevel,
        newLevel,
      };
    } catch (error) {
      console.error('Error awarding XP:', error);
      return null;
    }
  }

  /**
   * Helper to increment goal progress based on completed activities.
   */
  private static async updateGoalsProgress(userId: string, activityType: string) {
    const goals = await prisma.goal.findMany({
      where: { userId, completed: false },
    });

    for (const goal of goals) {
      let increment = false;
      const titleLower = goal.title.toLowerCase();

      if (activityType === 'PROBLEM_SOLVED' && (titleLower.includes('problem') || titleLower.includes('solve'))) {
        increment = true;
      } else if (activityType === 'LESSON_COMPLETED' && (titleLower.includes('lesson') || titleLower.includes('read') || titleLower.includes('study'))) {
        increment = true;
      } else if (activityType === 'REVISION_COMPLETED' && (titleLower.includes('revise') || titleLower.includes('revision'))) {
        increment = true;
      }

      if (increment) {
        const nextProgress = goal.progress + 1;
        const isCompleted = nextProgress >= goal.target;

        await prisma.goal.update({
          where: { id: goal.id },
          data: {
            progress: Math.min(goal.target, nextProgress),
            completed: isCompleted,
          },
        });

        // Award bonus XP if this goal is completed
        if (isCompleted) {
          // Trigger recursively under activity type "GOAL_COMPLETED"
          await this.awardXP(
            userId,
            30,
            'GOAL_COMPLETED',
            `Daily Goal Completed: "${goal.title}"`
          );
        }
      }
    }
  }

  /**
   * Evaluates criteria and unlocks new achievements for a user.
   */
  private static async checkAchievements(userId: string) {
    // Get currently unlocked achievement IDs
    const unlockedList = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const unlockedIds = new Set(unlockedList.map((ua) => ua.achievementId));

    // Get all achievements
    const allAchievements = await prisma.achievement.findMany();

    // Fetch user counts to check thresholds
    const lessonsCompletedCount = await prisma.lessonProgress.count({
      where: { userId, completed: true },
    });

    const problemsSolvedCount = await prisma.userProblem.count({
      where: { userId, status: 'SOLVED' },
    });

    const notesCount = await prisma.note.count({
      where: { userId },
    });

    const revisionsCount = await prisma.revision.count({
      where: { userId, completed: true },
    });

    // We can simulate a streak of 7 days if they completed at least 7 items, etc., or standard checker
    const totalActivityDaysCount = await prisma.activity.groupBy({
      by: ['createdAt'],
      where: { userId },
    });
    const streakDays = totalActivityDaysCount.length;

    for (const ach of allAchievements) {
      // Skip if already unlocked
      if (unlockedIds.has(ach.id)) continue;

      let shouldUnlock = false;

      switch (ach.title) {
        case 'First Login':
          shouldUnlock = true; // Always unlocked upon registering/logging in and getting first XP
          break;
        case 'First Lesson Completed':
          if (lessonsCompletedCount >= 1) shouldUnlock = true;
          break;
        case '10 Problems Solved':
          if (problemsSolvedCount >= 10) shouldUnlock = true;
          break;
        case '50 Problems Solved':
          if (problemsSolvedCount >= 50) shouldUnlock = true;
          break;
        case '100 Problems Solved':
          if (problemsSolvedCount >= 100) shouldUnlock = true;
          break;
        case '7 Day Streak':
          if (streakDays >= 7) shouldUnlock = true;
          break;
        case '30 Day Streak':
          if (streakDays >= 30) shouldUnlock = true;
          break;
        case 'Notes Master':
          if (notesCount >= 5) shouldUnlock = true;
          break;
        case 'Revision Expert':
          if (revisionsCount >= 5) shouldUnlock = true;
          break;
        case 'Graph Master':
          // Check if solved all graph problems. Since we have mocked categories:
          const totalGraph = await prisma.problem.count({ where: { topic: { category: 'Algorithms' } } }); // Approximation
          const solvedGraph = await prisma.userProblem.count({
            where: { userId, status: 'SOLVED', problem: { topic: { category: 'Algorithms' } } },
          });
          if (totalGraph > 0 && solvedGraph >= totalGraph) shouldUnlock = true;
          break;
        case 'DP Expert':
          const solvedDP = await prisma.userProblem.count({
            where: { userId, status: 'SOLVED', problem: { topic: { slug: { contains: 'dynamic-programming' } } } },
          });
          if (solvedDP >= 1) shouldUnlock = true; // Unlocks upon first DP problem solved
          break;
      }

      if (shouldUnlock) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: ach.id,
          },
        });

        // Award reward XP recursively under activity type "SYSTEM"
        await this.awardXP(
          userId,
          ach.xpReward,
          'SYSTEM',
          `Achievement Unlocked: "${ach.title}"`
        );
      }
    }
  }
}
