import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Award, 
  Flame, 
  Clock, 
  BookOpen, 
  Code, 
  History, 
  CheckCircle2, 
  Activity as ActivityIcon, 
  TrendingUp
} from 'lucide-react';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { cn } from '../utils/cn';

interface SummaryData {
  totalStudyHours: number;
  problemsSolved: number;
  lessonsCompleted: number;
  topicsCompleted: number;
  revisionSessions: number;
  notesCreated: number;
  codeExecutions: number;
  successfulSubmissions: number;
  currentStreak: number;
  longestStreak: number;
}

interface TopicProgress {
  name: string;
  progress: number;
  category: string;
}

interface OutcomeData {
  name: string;
  value: number;
}

interface StudyHoursItem {
  day: string;
  Reading: number;
  Practice: number;
  Revision: number;
}

interface HeatmapItem {
  date: string;
  count: number;
}

interface ActivityItem {
  id: string;
  activityType: string;
  description: string;
  createdAt: string;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'coding' | 'topics'>('overview');

  // 1. Fetch Summary Stats
  const { data: summaryData, isLoading: summaryLoading } = useQuery<{ summary: SummaryData }>({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const response = await api.get('/analytics/summary');
      return response.data.data;
    },
  });

  // 2. Fetch Charts Data
  const { data: chartsData, isLoading: chartsLoading } = useQuery<{
    topicsProgress: TopicProgress[];
    outcomes: OutcomeData[];
    studyHours: StudyHoursItem[];
  }>({
    queryKey: ['analytics-charts'],
    queryFn: async () => {
      const response = await api.get('/analytics/charts');
      return response.data.data;
    },
  });

  // 3. Fetch Heatmap
  const { data: heatmapData, isLoading: heatmapLoading } = useQuery<{ heatmap: HeatmapItem[] }>({
    queryKey: ['analytics-heatmap'],
    queryFn: async () => {
      const response = await api.get('/analytics/heatmap');
      return response.data.data;
    },
  });

  // 4. Fetch Timeline
  const { data: timelineData, isLoading: timelineLoading } = useQuery<{ activities: ActivityItem[] }>({
    queryKey: ['analytics-timeline'],
    queryFn: async () => {
      const response = await api.get('/analytics/timeline');
      return response.data.data;
    },
  });

  // Loading skeletons
  if (summaryLoading || chartsLoading || heatmapLoading || timelineLoading) {
    return (
      <div className="space-y-8 select-none text-left py-8 animate-pulse">
        <div className="h-8 bg-slate-900/60 rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-900/40 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-900/30 rounded-2xl" />
      </div>
    );
  }

  const summary = summaryData?.summary;
  const heatmap = heatmapData?.heatmap || [];
  const activities = timelineData?.activities || [];
  const outcomes = chartsData?.outcomes || [];
  const studyHours = chartsData?.studyHours || [];
  const topicsProgress = chartsData?.topicsProgress || [];

  // Group heatmap into weeks of 7 days (last 12 weeks = 84 days)
  const weeks: HeatmapItem[][] = [];
  for (let i = 0; i < heatmap.length; i += 7) {
    weeks.push(heatmap.slice(i, i + 7));
  }

  // Get intensity color class for heatmap counts
  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-slate-900 border border-slate-950';
    if (count === 1) return 'bg-indigo-950 border border-indigo-900/45';
    if (count === 2) return 'bg-indigo-800 border border-indigo-750/50';
    if (count === 3) return 'bg-indigo-650 border border-indigo-600/50';
    return 'bg-indigo-500 border border-indigo-400/50';
  };

  return (
    <div className="space-y-8 text-left select-none pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-white tracking-tight">
            Study Analytics & Insights
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Track your coding metrics, daily study streams, and gamified progress.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-900/60 p-1 border border-slate-850 rounded-xl select-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
              activeTab === 'overview' 
                ? "bg-indigo-500 text-white shadow-lg" 
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('coding')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
              activeTab === 'coding' 
                ? "bg-indigo-500 text-white shadow-lg" 
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            Coding Stats
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
              activeTab === 'topics' 
                ? "bg-indigo-500 text-white shadow-lg" 
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            Topic Progress
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card hoverEffect={false} className="border-slate-850 p-4.5 rounded-2xl flex flex-col justify-between">
            <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block">Study Hours</span>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl font-heading font-black text-white">{summary.totalStudyHours}h</span>
              <Clock className="h-4.5 w-4.5 text-indigo-400 self-center ml-auto" />
            </div>
          </Card>

          <Card hoverEffect={false} className="border-slate-850 p-4.5 rounded-2xl flex flex-col justify-between">
            <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block">Problems Solved</span>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl font-heading font-black text-white">{summary.problemsSolved}</span>
              <Code className="h-4.5 w-4.5 text-emerald-450 self-center ml-auto" />
            </div>
          </Card>

          <Card hoverEffect={false} className="border-slate-850 p-4.5 rounded-2xl flex flex-col justify-between">
            <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block">Lessons Completed</span>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl font-heading font-black text-white">{summary.lessonsCompleted}</span>
              <BookOpen className="h-4.5 w-4.5 text-amber-400 self-center ml-auto" />
            </div>
          </Card>

          <Card hoverEffect={false} className="border-slate-850 p-4.5 rounded-2xl flex flex-col justify-between">
            <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block">Streak Active</span>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl font-heading font-black text-white flex items-center gap-1">
                {summary.currentStreak} <span className="text-xs text-slate-500">days</span>
              </span>
              <Flame className="h-4.5 w-4.5 text-orange-500 self-center ml-auto fill-current" />
            </div>
          </Card>

          <Card hoverEffect={false} className="border-slate-850 p-4.5 rounded-2xl flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block">Longest Streak</span>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl font-heading font-black text-white flex items-center gap-1">
                {summary.longestStreak} <span className="text-xs text-slate-500">days</span>
              </span>
              <TrendingUp className="h-4.5 w-4.5 text-indigo-400 self-center ml-auto" />
            </div>
          </Card>
        </div>
      )}

      {/* Tab contents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Selected Tab Charts */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Study Time Allocation Area Chart */}
              <Card className="border-slate-850 bg-slate-900/10">
                <CardHeader>
                  <CardTitle>Study Time Allocation</CardTitle>
                  <CardDescription>Visualizing reading vs coding vs revisions (minutes/day)</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={studyHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRead" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPractice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="day" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                      <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      <Area type="monotone" dataKey="Reading" stroke="#6366f1" fillOpacity={1} fill="url(#colorRead)" />
                      <Area type="monotone" dataKey="Practice" stroke="#10b981" fillOpacity={1} fill="url(#colorPractice)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* GitHub-style Contribution Heatmap */}
              <Card className="border-slate-850 bg-slate-900/10 p-5 rounded-2xl">
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-850/45">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-slate-200">Study Contribution Map</h4>
                    <span className="text-[10px] text-slate-500">Activity index across lessons completed and compiler executions.</span>
                  </div>
                </div>

                {/* Heatmap Grid */}
                <div className="overflow-x-auto select-none pt-2 pb-2">
                  <div className="flex gap-1 min-w-[320px] justify-between">
                    {weeks.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-1">
                        {week.map((day, dIdx) => (
                          <div
                            key={dIdx}
                            className={cn(
                              "w-3.5 h-3.5 rounded-sm transition-all duration-150 cursor-pointer hover:ring-2 hover:ring-indigo-500",
                              getIntensityClass(day.count)
                            )}
                            title={`${day.count} activities on ${new Date(day.date).toLocaleDateString()}`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend bar */}
                <div className="flex justify-end items-center gap-1.5 text-[9px] text-slate-550 font-bold uppercase tracking-wider pt-4">
                  <span>Less</span>
                  <div className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-950" />
                  <div className="w-3.5 h-3.5 rounded bg-indigo-950 border border-indigo-900" />
                  <div className="w-3.5 h-3.5 rounded bg-indigo-800 border border-indigo-750" />
                  <div className="w-3.5 h-3.5 rounded bg-indigo-500 border border-indigo-400" />
                  <span>More</span>
                </div>
              </Card>
            </>
          )}

          {activeTab === 'coding' && (
            <>
              {/* Compiler Executions Pie Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-slate-850 bg-slate-900/10">
                  <CardHeader>
                    <CardTitle>Code Submissions Breakdown</CardTitle>
                    <CardDescription>Proportions of accepted solutions vs failures</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64 flex items-center justify-center">
                    {outcomes.length === 0 || outcomes.every(o => o.value === 0) ? (
                      <div className="text-xs text-slate-550">No execution outcomes logged yet.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={outcomes.filter(o => o.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {outcomes.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                          <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Coding Speed Stats & Timing */}
                <Card className="border-slate-850 bg-slate-900/10 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Efficiency Metrics</span>
                    <h3 className="font-heading font-black text-lg text-white mt-2">Java Performance Insights</h3>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-850/30">
                      <span className="text-xs text-slate-400 font-semibold">Average Runtime</span>
                      <span className="text-xs font-mono font-bold text-slate-200">124 ms</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-850/30">
                      <span className="text-xs text-slate-400 font-semibold">Memory Usage Avg</span>
                      <span className="text-xs font-mono font-bold text-slate-200">22.8 MB</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-850/30">
                      <span className="text-xs text-slate-400 font-semibold">Compiler Runs Ratio</span>
                      <span className="text-xs font-mono font-bold text-slate-200">3.2 runs/sol</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-xs text-slate-400 font-semibold">Preferred Language</span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 font-black uppercase tracking-wider">Java (100%)</span>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}

          {activeTab === 'topics' && (
            <Card className="border-slate-850 bg-slate-900/10">
              <CardHeader>
                <CardTitle>Topic Progress Matrix</CardTitle>
                <CardDescription>Status percentage bar charts per feature category</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {topicsProgress.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-550">
                    No learning progress logged yet. Start a lesson to map insights!
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topicsProgress} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={10} domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} width={90} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                      <Bar dataKey="progress" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right 1 Column: Activity Timeline */}
        <div className="space-y-6">
          <Card className="border-slate-850 bg-slate-900/10 p-5 rounded-2xl flex flex-col h-full">
            <div className="pb-4 mb-4 border-b border-slate-850/45 flex items-center gap-2">
              <ActivityIcon className="h-4 w-4 text-indigo-400" />
              <div>
                <h4 className="font-heading font-bold text-sm text-slate-200">Activity Timeline</h4>
                <span className="text-[10px] text-slate-550">Your recent chronological study events</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[480px] pr-2 space-y-4 text-left">
              {activities.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-600">
                  No learning activities tracked yet.
                </div>
              ) : (
                activities.map((act) => {
                  const getIcon = (type: string) => {
                    if (type === 'LESSON_COMPLETED') return <BookOpen className="h-3 w-3 text-amber-400" />;
                    if (type === 'PROBLEM_SOLVED') return <CheckCircle2 className="h-3 w-3 text-emerald-400" />;
                    if (type === 'REVISION_COMPLETED') return <History className="h-3 w-3 text-violet-400" />;
                    return <Award className="h-3 w-3 text-indigo-400" />;
                  };

                  return (
                    <div key={act.id} className="relative pl-6 pb-2 border-l border-slate-850 last:border-0 last:pb-0">
                      {/* Timeline Dot Icon */}
                      <div className="absolute -left-3.5 top-0 h-7 w-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                        {getIcon(act.activityType)}
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-300 leading-snug">
                          {act.description}
                        </p>
                        <span className="text-[9px] text-slate-550 font-bold font-mono uppercase">
                          {new Date(act.createdAt).toLocaleDateString()} at {new Date(act.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
};
