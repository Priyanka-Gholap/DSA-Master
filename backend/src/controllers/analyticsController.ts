import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../utils/errors';

/**
   Calculates the user's current and longest streaks based on activities or completed sessions.
 */
const calculateStreaks = (activities: { createdAt: Date }[]) => {
  if (activities.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Parse activity dates as local strings YYYY-MM-DD
  const dates = Array.from(
    new Set(
      activities.map((a) => a.createdAt.toISOString().slice(0, 10))
    )
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // descending (newest first)

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // If there are no activities today or yesterday, current streak is broken/0
  if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
    currentStreak = 0;
  } else {
    currentStreak = 1;
    let expectedTime = new Date(dates[0]).getTime();
    for (let i = 1; i < dates.length; i++) {
      const diff = expectedTime - new Date(dates[i]).getTime();
      const diffDays = Math.round(diff / 86400000);
      if (diffDays === 1) {
        currentStreak++;
        expectedTime = new Date(dates[i]).getTime();
      } else if (diffDays > 1) {
        break;
      }
    }
  }

  // Calculate longest streak
  const ascendingDates = [...dates].reverse();
  if (ascendingDates.length > 0) {
    tempStreak = 1;
    longestStreak = 1;
    for (let i = 1; i < ascendingDates.length; i++) {
      const diff = new Date(ascendingDates[i]).getTime() - new Date(ascendingDates[i - 1]).getTime();
      const diffDays = Math.round(diff / 86400000);
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return { currentStreak, longestStreak };
};

export const getAnalyticsSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    // 1. Fetch total counts
    const solvedProblems = await prisma.userProblem.count({
      where: { userId, status: 'SOLVED' },
    });

    const completedLessons = await prisma.lessonProgress.count({
      where: { userId, completed: true },
    });

    const completedTopics = await prisma.userProgress.count({
      where: { userId, completed: true },
    });

    const completedRevisions = await prisma.revision.count({
      where: { userId, completed: true },
    });

    const notesCreated = await prisma.note.count({
      where: { userId },
    });

    const submissionsCount = await prisma.submission.count({
      where: { userId },
    });

    const successfulSubmissions = await prisma.submission.count({
      where: { userId, status: 'ACCEPTED' },
    });

    // 2. Fetch active streak
    const activities = await prisma.activity.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const { currentStreak, longestStreak } = calculateStreaks(activities);

    // Calculate actual hours: Lessons = 0.5hr each, Revisions = 0.2hr each, Code Submissions = 0.1hr each
    const totalStudyHours = parseFloat(
      (completedLessons * 0.5 + completedRevisions * 0.2 + submissionsCount * 0.1).toFixed(1)
    );

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalStudyHours: totalStudyHours,
          problemsSolved: solvedProblems,
          lessonsCompleted: completedLessons,
          topicsCompleted: completedTopics,
          revisionSessions: completedRevisions,
          notesCreated,
          codeExecutions: submissionsCount * 2,
          successfulSubmissions,
          currentStreak,
          longestStreak: Math.max(longestStreak, currentStreak),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsCharts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    // 1. Topic Progress data (Weak/Strong Areas)
    const topicsProgress = await prisma.userProgress.findMany({
      where: { userId },
      include: {
        topic: { select: { title: true, category: true } },
      },
    });

    const topicsProgressData = topicsProgress.map((tp) => ({
      name: tp.topic.title,
      progress: tp.progress,
      category: tp.topic.category,
    }));

    // 2. Coding Submissions outcomes
    const submissions = await prisma.submission.findMany({
      where: { userId },
      select: { status: true },
    });

    const outcomesCount = {
      ACCEPTED: 0,
      WRONG_ANSWER: 0,
      COMPILATION_ERROR: 0,
      RUNTIME_ERROR: 0,
    };

    submissions.forEach((s) => {
      if (s.status in outcomesCount) {
        outcomesCount[s.status as keyof typeof outcomesCount]++;
      }
    });

    const outcomesData = [
      { name: 'Accepted', value: outcomesCount.ACCEPTED },
      { name: 'Wrong Answer', value: outcomesCount.WRONG_ANSWER },
      { name: 'Compilation Error', value: outcomesCount.COMPILATION_ERROR },
      { name: 'Runtime Error', value: outcomesCount.RUNTIME_ERROR },
    ];

    // 3. Weekly Study time (Reading vs Practice vs Revision in minutes) calculated dynamically
    // Get last 7 days date strings in local time prefix
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    }).reverse();

    const weeklyActivities = await prisma.activity.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const activitiesByDay: Record<string, { Reading: number; Practice: number; Revision: number }> = {};
    last7Days.forEach((dayStr) => {
      activitiesByDay[dayStr] = { Reading: 0, Practice: 0, Revision: 0 };
    });

    weeklyActivities.forEach((act) => {
      const dayStr = act.createdAt.toISOString().slice(0, 10);
      if (dayStr in activitiesByDay) {
        if (act.activityType === 'LESSON_COMPLETED') {
          activitiesByDay[dayStr].Reading += 30; // 30 minutes
        } else if (act.activityType === 'PROBLEM_SOLVED') {
          activitiesByDay[dayStr].Practice += 45; // 45 minutes
        } else if (act.activityType === 'REVISION_COMPLETED') {
          activitiesByDay[dayStr].Revision += 15; // 15 minutes
        }
      }
    });

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const studyHoursData = last7Days.map((dayStr) => {
      const date = new Date(dayStr);
      const dayName = daysOfWeek[date.getDay()];
      const metrics = activitiesByDay[dayStr];
      return {
        day: dayName,
        Reading: metrics.Reading,
        Practice: metrics.Practice,
        Revision: metrics.Revision,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        topicsProgress: topicsProgressData,
        outcomes: outcomesData,
        studyHours: studyHoursData,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsHeatmap = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    // Heatmap: contributions over last 12 weeks (84 days)
    const activities = await prisma.activity.findMany({
      where: { userId },
      select: { createdAt: true },
    });

    const countsByDate: Record<string, number> = {};
    activities.forEach((act) => {
      const dateStr = act.createdAt.toISOString().slice(0, 10);
      countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
    });

    const heatmapData: { date: string; count: number }[] = [];
    const today = new Date();

    for (let i = 83; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 86400000);
      const dateStr = date.toISOString().slice(0, 10);
      heatmapData.push({
        date: dateStr,
        count: countsByDate[dateStr] || 0,
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        heatmap: heatmapData,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getActivityTimeline = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized access', 401);
    }

    const activities = await prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.status(200).json({
      status: 'success',
      data: {
        activities,
      },
    });
  } catch (error) {
    next(error);
  }
};
