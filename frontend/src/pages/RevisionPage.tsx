import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Award
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { Card, CardContent } from '../components/ui/Card';
import { cn } from '../utils/cn';

interface Revision {
  id: string;
  topicId: string | null;
  problemId: string | null;
  scheduledDate: string;
  completed: boolean;
  completedAt: string | null;
  topic?: { title: string; slug: string; category: string };
  problem?: { title: string; slug: string; difficulty: string };
}

interface TodayStats {
  revisions: Revision[];
  totalToday: number;
  completedToday: number;
  completionPercentage: number;
}

export const RevisionPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Fetch Today's revision stats
  const { data: todayStats } = useQuery<TodayStats>({
    queryKey: ['revisions-today'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: TodayStats }>('/revisions/today');
      return response.data.data;
    }
  });

  // Fetch All revisions (to mark calendar dots)
  const { data: allRevisionsData } = useQuery<{ revisions: Revision[] }>({
    queryKey: ['revisions-all'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: { revisions: Revision[] } }>('/revisions');
      return response.data.data;
    }
  });

  const allRevisions = allRevisionsData?.revisions || [];

  // Toggle Completion
  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/revisions/${id}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisions-today'] });
      queryClient.invalidateQueries({ queryKey: ['revisions-all'] });
      toast('Revision completed!', 'success');
    }
  });

  // Delete Revision
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/revisions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisions-today'] });
      queryClient.invalidateQueries({ queryKey: ['revisions-all'] });
      toast('Revision cancelled.', 'info');
    }
  });

  // Helper: Month Calendar builder
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days: (Date | null)[] = [];
    // Pad first week
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Fill days
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const handleMonthChange = (direction: 'next' | 'prev') => {
    const nextDate = new Date(currentMonth);
    nextDate.setMonth(nextDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(nextDate);
  };

  const calendarDays = getDaysInMonth(currentMonth);

  // Check if a day has revisions scheduled
  const getRevisionsForDay = (date: Date) => {
    return allRevisions.filter(rev => {
      const revDate = new Date(rev.scheduledDate);
      return (
        revDate.getDate() === date.getDate() &&
        revDate.getMonth() === date.getMonth() &&
        revDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Selected date filtered revisions
  const selectedRevisions = getRevisionsForDay(selectedDate);

  const getDifficultyColor = (diff: string) => {
    if (diff === 'Easy') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15';
    if (diff === 'Medium') return 'text-amber-400 bg-amber-500/10 border-amber-500/15';
    return 'text-rose-450 bg-rose-500/10 border-rose-500/15';
  };

  return (
    <div className="space-y-8 text-left select-none pb-16">
      
      {/* 1. Today's Dashboard widget banner */}
      <Card hoverEffect={false} className="border-slate-850 bg-slate-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-500/5 to-transparent rounded-r-2xl pointer-events-none" />
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          
          <div className="md:col-span-2 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-wider">
              <Award className="h-3.5 w-3.5" />
              Active Revision Planner
            </div>
            <h2 className="font-heading font-black text-2xl text-white tracking-tight">DSA Spaced Repetition</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Schedule flashcard revisions for topics and practice questions at 3, 7, or 14-day intervals to maximize memory retention.
            </p>
          </div>

          <div className="space-y-1 md:border-l border-slate-800/60 md:pl-6">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Today's Schedule</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-heading font-bold text-white">
                {todayStats?.completedToday || 0}
              </span>
              <span className="text-xs text-slate-500">/ {todayStats?.totalToday || 0} completed</span>
            </div>
          </div>

          <div className="space-y-2 md:border-l border-slate-800/60 md:pl-6">
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>Today's Progress</span>
              <span>{todayStats?.completionPercentage || 0}%</span>
            </div>
            <div className="w-full h-2 bg-slate-855 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${todayStats?.completionPercentage || 0}%` }}
              />
            </div>
          </div>

        </CardContent>
      </Card>

      {/* 2. Main content block: Calendar and Revision list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Revision Calendar Grid (Left Column) */}
        <Card hoverEffect={false} className="lg:col-span-2 border-slate-800 bg-slate-900/10 p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-heading font-bold text-sm text-slate-200 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-indigo-400" />
              <span>
                {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
              </span>
            </h3>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleMonthChange('prev')}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => handleMonthChange('next')}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-550 uppercase tracking-wider mb-2">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="h-10 opacity-0" />;

              const isToday = new Date().toDateString() === day.toDateString();
              const isSelected = selectedDate.toDateString() === day.toDateString();
              const revisionsForDay = getRevisionsForDay(day);
              const hasRevisions = revisionsForDay.length > 0;
              const allCompleted = hasRevisions && revisionsForDay.every(r => r.completed);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "h-10 rounded-xl flex flex-col items-center justify-between p-1.5 border transition-all cursor-pointer relative",
                    isSelected 
                      ? "bg-indigo-650 text-white border-indigo-550 shadow shadow-indigo-600/25" 
                      : isToday
                      ? "bg-indigo-550/10 text-indigo-400 border-indigo-500/25 hover:bg-indigo-550/20"
                      : "bg-transparent border-slate-900 hover:border-slate-800 hover:bg-slate-900/40 text-slate-400 hover:text-slate-100"
                  )}
                >
                  <span className="text-[11px] font-mono font-bold mt-0.5">{day.getDate()}</span>
                  
                  {/* Indicators dot */}
                  {hasRevisions && (
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full block mb-0.5",
                      allCompleted ? "bg-emerald-450" : "bg-indigo-400"
                    )} />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Selected date's revision list (Right Column) */}
        <Card hoverEffect={false} className="border-slate-800 bg-slate-900/10 p-5 flex flex-col h-full min-h-[360px]">
          <div className="border-b border-slate-850/50 pb-4 mb-4 text-left">
            <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block">Revision List</span>
            <h4 className="font-heading font-black text-sm text-white mt-1">
              {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {selectedRevisions.length === 0 ? (
              <div className="py-12 text-center text-slate-550 flex flex-col items-center justify-center h-full">
                <Clock className="h-7 w-7 text-slate-650 mb-1" />
                <span className="text-[10px] font-bold">No revisions scheduled</span>
              </div>
            ) : (
              selectedRevisions.map((rev) => {
                const title = rev.topic?.title || rev.problem?.title;
                const category = rev.topic?.category || rev.problem?.difficulty;
                const isProblem = !!rev.problemId;

                return (
                  <div 
                    key={rev.id} 
                    className={cn(
                      "p-3 rounded-xl border flex justify-between items-center gap-3 transition-all",
                      rev.completed 
                        ? "border-emerald-500/10 bg-emerald-500/5 opacity-70" 
                        : "border-slate-850 bg-slate-900/40 hover:border-slate-800"
                    )}
                  >
                    <div className="space-y-1.5 text-left min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h5 className={cn(
                          "text-xs font-bold truncate",
                          rev.completed ? "text-slate-500 line-through" : "text-slate-200"
                        )}>
                          {title}
                        </h5>
                      </div>

                      <div className="flex items-center gap-2">
                        {isProblem ? (
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0",
                            getDifficultyColor(category || 'Easy')
                          )}>
                            {category}
                          </span>
                        ) : (
                          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 shrink-0">
                            {category}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-500 font-semibold uppercase">
                          {isProblem ? 'Problem' : 'Topic'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => completeMutation.mutate(rev.id)}
                        className={cn(
                          "p-1.5 rounded-lg border transition-colors cursor-pointer",
                          rev.completed 
                            ? "bg-emerald-500/15 text-emerald-450 border-emerald-500/25" 
                            : "bg-transparent text-slate-550 border-slate-800 hover:text-emerald-450 hover:bg-emerald-500/5"
                        )}
                        title={rev.completed ? 'Mark as incomplete' : 'Mark completed'}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(rev.id)}
                        className="p-1.5 rounded-lg border border-transparent text-slate-550 hover:text-rose-400 hover:bg-rose-500/5 transition-colors cursor-pointer"
                        title="Delete schedule"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </Card>

      </div>

    </div>
  );
};
