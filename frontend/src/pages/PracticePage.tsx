import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bookmark, 
  CheckCircle2, 
  Play, 
  HelpCircle, 
  BookOpen, 
  Clock, 
  ChevronRight,
  SlidersHorizontal,
  Award,
  X
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';

interface ProblemSummary {
  id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTime: string;
  topic: { title: string; slug: string };
  status: 'NOT_STARTED' | 'ATTEMPTED' | 'SOLVED';
  bookmarked: boolean;
  lastAttemptedDate: string | null;
}

interface DifficultyMetric {
  total: number;
  solved: number;
}

interface PracticeProgress {
  total: number;
  solved: number;
  attempted: number;
  remaining: number;
  completionPercentage: number;
  difficultyCounts: {
    Easy: DifficultyMetric;
    Medium: DifficultyMetric;
    Hard: DifficultyMetric;
  };
  recentlySolved: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
    topicTitle: string;
    solvedAt: string;
  }[];
}

interface ContinueSolving {
  problem: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
    estimatedTime: string;
    topic: { title: string };
  };
  status: string;
}

export const PracticePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string>('All');
  const [status, setStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('recently_added');
  const [showBookmarked, setShowBookmarked] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Fetch Practice Progress Stats
  const { data: progressData } = useQuery<PracticeProgress>({
    queryKey: ['practice-progress'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: PracticeProgress }>('/problems/progress');
      return response.data.data;
    }
  });

  // Fetch Continue Solving
  const { data: continueData, isLoading: continueLoading } = useQuery<ContinueSolving>({
    queryKey: ['continue-solving'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: ContinueSolving }>('/problems/continue-solving');
      return response.data.data;
    }
  });

  // Fetch Problems list based on search/filters
  const { data: problemsData, isLoading: listLoading, error } = useQuery<ProblemSummary[]>({
    queryKey: ['problems', search, difficulty, status, showBookmarked, sortBy],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: { problems: ProblemSummary[] } }>('/problems', {
        params: {
          search: search || undefined,
          difficulty: difficulty !== 'All' ? difficulty : undefined,
          status: status !== 'All' ? status : undefined,
          bookmarked: showBookmarked ? true : undefined,
          sortBy
        }
      });
      return response.data.data.problems;
    }
  });

  // Toggle Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async ({ id, bookmarked }: { id: string; bookmarked: boolean }) => {
      await api.put(`/problems/${id}/bookmark`, { bookmarked });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      queryClient.invalidateQueries({ queryKey: ['practice-progress'] });
      toast(variables.bookmarked ? 'Bookmark added!' : 'Bookmark removed.', 'info');
    }
  });

  const handleBookmarkToggle = (id: string, current: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card navigation click
    bookmarkMutation.mutate({ id, bookmarked: !current });
  };

  const getDifficultyColor = (diff: string) => {
    if (diff === 'Easy') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15';
    if (diff === 'Medium') return 'text-amber-400 bg-amber-500/10 border-amber-500/15';
    return 'text-rose-450 bg-rose-500/10 border-rose-500/15';
  };

  const getStatusIcon = (stat: string) => {
    if (stat === 'SOLVED') return <CheckCircle2 className="h-4.5 w-4.5 text-emerald-450 fill-emerald-500/10" />;
    if (stat === 'ATTEMPTED') return <Play className="h-4 w-4 text-indigo-400 fill-indigo-400/25" />;
    return <span className="h-3 w-3 rounded-full border-2 border-slate-800 bg-slate-950 inline-block" />;
  };

  return (
    <div className="space-y-8 text-left select-none pb-16">
      
      {/* 1. Header Banner */}
      <Card hoverEffect={false} className="border-slate-850 bg-slate-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-500/5 to-transparent rounded-r-2xl pointer-events-none" />
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          
          <div className="md:col-span-2 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-wider">
              <Award className="h-3.5 w-3.5" />
              Practice Arena
            </div>
            <h2 className="font-heading font-black text-2xl text-white tracking-tight">Code Practice Workspace</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verify your understanding with hands-on exercises. Search, bookmark, and solve problems grouped by sequential Java topics.
            </p>
          </div>

          <div className="space-y-1 md:border-l border-slate-800/60 md:pl-6">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Solved Problems</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-heading font-bold text-white">
                {progressData?.solved || 0}
              </span>
              <span className="text-xs text-slate-500">/ {progressData?.total || 0} solved</span>
            </div>
          </div>

          <div className="space-y-2 md:border-l border-slate-800/60 md:pl-6">
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>Overall Practice Progress</span>
              <span>{progressData?.completionPercentage || 0}%</span>
            </div>
            <div className="w-full h-2 bg-slate-855 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${progressData?.completionPercentage || 0}%` }}
              />
            </div>
          </div>

        </CardContent>
      </Card>

      {/* 2. Top row: Continue Solving & Difficulty Rings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Continue Solving Card */}
        <div className="lg:col-span-2">
          {continueLoading ? (
            <div className="h-44 bg-slate-900/40 border border-slate-850 rounded-2xl animate-pulse" />
          ) : continueData?.problem ? (
            <Card className="border-slate-800 overflow-hidden bg-slate-900/15 h-full flex flex-col justify-between p-5 relative">
              <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
              
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block">
                    Continue Solving
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border",
                    getDifficultyColor(continueData.problem.difficulty)
                  )}>
                    {continueData.problem.difficulty}
                  </span>
                </div>
                
                <h4 className="font-heading font-black text-lg text-slate-200">
                  {continueData.problem.title}
                </h4>
                <p className="text-xs text-slate-450 capitalize">
                  Topic: {continueData.problem.topic.title} &bull; {continueData.problem.estimatedTime}
                </p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-850/50 mt-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-450">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                  <span>Resume attempt</span>
                </div>
                <Button 
                  onClick={() => navigate(`/practice/problems/${continueData.problem.slug}`)} 
                  variant="primary" 
                  size="sm"
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Resume
                </Button>
              </div>
            </Card>
          ) : null}
        </div>

        {/* Difficulty Ring stats */}
        <Card hoverEffect={false} className="border-slate-800 bg-slate-900/15 p-5 flex flex-col justify-between">
          <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block text-left mb-4">
            Difficulty Distribution
          </span>

          <div className="grid grid-cols-3 gap-2 items-center">
            {progressData?.difficultyCounts && Object.entries(progressData.difficultyCounts).map(([diff, metrics]) => {
              const pct = metrics.total > 0 ? Math.round((metrics.solved / metrics.total) * 100) : 0;
              const ringColor = diff === 'Easy' ? 'stroke-emerald-500' : diff === 'Medium' ? 'stroke-amber-500' : 'stroke-rose-500';
              
              return (
                <div key={diff} className="flex flex-col items-center space-y-2">
                  <div className="relative h-16 w-16 flex items-center justify-center">
                    <svg className="absolute h-full w-full -rotate-90">
                      <circle cx="32" cy="32" r="24" className="stroke-slate-850 fill-none" strokeWidth="4" />
                      <motion.circle 
                        cx="32" cy="32" r="24" className={cn("fill-none", ringColor)} strokeWidth="4" 
                        strokeDasharray={2 * Math.PI * 24}
                        initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - pct / 100) }}
                        transition={{ duration: 0.5 }}
                      />
                    </svg>
                    <span className="text-[10px] font-mono text-white font-bold">{pct}%</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-slate-200 block">{diff}</span>
                    <span className="text-[8px] text-slate-500 block">{metrics.solved}/{metrics.total} solved</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

      </div>

      {/* 3. Search, Filter, Sort and List */}
      <div className="space-y-4">
        
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3.5 justify-between items-stretch sm:items-center">
          {/* Keyword Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems by title, keywords or topic..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 text-slate-100 placeholder:text-slate-500 rounded-xl border border-slate-800/85 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all duration-200 text-xs shadow-inner"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filter & Bookmark Toggles */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold cursor-pointer transition-colors",
                showFilters 
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/25" 
                  : "border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </button>

            <button
              onClick={() => setShowBookmarked(!showBookmarked)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold cursor-pointer transition-colors",
                showBookmarked 
                  ? "bg-rose-500/10 text-rose-450 border-rose-500/25" 
                  : "border-slate-800 text-slate-400 hover:text-rose-450 hover:bg-slate-900"
              )}
            >
              <Bookmark className={cn("h-4 w-4", showBookmarked && "fill-current text-rose-500")} />
              <span>Bookmarked</span>
            </button>
          </div>
        </div>

        {/* Filters drawer panels */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card rounded-2xl p-5 border border-slate-850 bg-slate-900/10 grid grid-cols-1 sm:grid-cols-3 gap-5"
            >
              {/* Difficulty filter buttons */}
              <div className="space-y-2 text-left">
                <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block">Difficulty</span>
                <div className="flex flex-wrap gap-1.5">
                  {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={cn(
                        "py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                        difficulty === diff
                          ? 'bg-indigo-650 text-white border-indigo-550'
                          : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      )}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status filter buttons */}
              <div className="space-y-2 text-left">
                <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block">Attempt Status</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'All', label: 'All' },
                    { id: 'SOLVED', label: 'Solved' },
                    { id: 'ATTEMPTED', label: 'Attempted' },
                    { id: 'UNSOLVED', label: 'Unsolved' }
                  ].map((stat) => (
                    <button
                      key={stat.id}
                      onClick={() => setStatus(stat.id)}
                      className={cn(
                        "py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                        status === stat.id
                          ? 'bg-indigo-650 text-white border-indigo-550'
                          : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      )}
                    >
                      {stat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting selector */}
              <div className="space-y-2 text-left">
                <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block">Sort By</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 bg-slate-950 text-slate-300 border border-slate-800 rounded-lg text-xs outline-none focus:border-indigo-500"
                >
                  <option value="recently_added">Recently Added</option>
                  <option value="alphabetical">Alphabetical (A-Z)</option>
                  <option value="difficulty">Difficulty (Easy first)</option>
                  <option value="estimated_time">Estimated Time</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Problems List Table */}
        {listLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-16 bg-slate-900/35 border border-slate-850 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error || !problemsData ? (
          <div className="p-12 text-center border border-slate-855 bg-slate-900/10 rounded-2xl">
            <HelpCircle className="h-8 w-8 text-slate-500 mx-auto mb-2" />
            <h5 className="font-heading font-bold text-white">Failed to load problems</h5>
            <p className="text-xs text-slate-400">Please check your database connectivity and try again.</p>
          </div>
        ) : problemsData.length === 0 ? (
          <Card hoverEffect={false} className="border-slate-855 bg-slate-900/10 py-16 text-center max-w-lg mx-auto">
            <CardContent className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-550 mx-auto">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-semibold text-white">No problems matched criteria</h4>
                <p className="text-xs text-slate-400">Try adjusting your filters, clearing search input, or untoggling bookmarks.</p>
              </div>
              <Button onClick={() => {
                setSearch('');
                setDifficulty('All');
                setStatus('All');
                setShowBookmarked(false);
              }} variant="outline" size="sm">
                Reset All Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-2xl border border-slate-805 bg-slate-900/10 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-widest text-[9px] font-black bg-slate-900/40">
                    <th className="py-3 px-4 w-12 text-center">Status</th>
                    <th className="py-3 px-4">Problem Name</th>
                    <th className="py-3 px-4">Topic</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">Estimated Time</th>
                    <th className="py-3 px-4 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/40">
                  {problemsData.map((prob) => (
                    <tr 
                      key={prob.id} 
                      onClick={() => navigate(`/practice/problems/${prob.slug}`)}
                      className="hover:bg-slate-900/30 text-slate-350 cursor-pointer transition-colors duration-150 group"
                    >
                      {/* Status icon column */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center">
                          {getStatusIcon(prob.status)}
                        </div>
                      </td>

                      {/* Problem Title */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-200 group-hover:text-white transition-colors block">
                          {prob.title}
                        </span>
                      </td>

                      {/* Topic Category */}
                      <td className="py-4 px-4 font-semibold text-slate-400 capitalize">
                        {prob.topic.title}
                      </td>

                      {/* Difficulty Badge */}
                      <td className="py-4 px-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                          getDifficultyColor(prob.difficulty)
                        )}>
                          {prob.difficulty}
                        </span>
                      </td>

                      {/* Estimated time */}
                      <td className="py-4 px-4 font-mono text-[10px] text-slate-400 flex items-center gap-1.5 mt-1.5 border-none">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        {prob.estimatedTime}
                      </td>

                      {/* Action buttons (Bookmark & open) */}
                      <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => handleBookmarkToggle(prob.id, prob.bookmarked, e)}
                            className={cn(
                              "p-1.5 rounded-lg border transition-colors cursor-pointer",
                              prob.bookmarked 
                                ? "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20"
                                : "bg-transparent text-slate-550 border-slate-800 hover:text-slate-200 hover:bg-slate-850"
                            )}
                          >
                            <Bookmark className={cn("h-3.5 w-3.5", prob.bookmarked && "fill-current")} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
