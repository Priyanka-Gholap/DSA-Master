import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Flame, 
  Target, 
  Clock, 
  Play, 
  Map, 
  Code, 
  Bot, 
  ArrowRight, 
  Sparkles,
  BookOpen,
  Calendar,
  Settings as SettingsIcon,
  Award,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch continue learning lesson
  const { data: continueData, isLoading: continueLoading } = useQuery({
    queryKey: ['continue-learning'],
    queryFn: async () => {
      const response = await api.get<{ 
        status: string; 
        data: { lesson: any; progress: any; topic: any } 
      }>('/lessons/continue-reading');
      return response.data.data;
    },
  });

  // Fetch continue solving problem
  const { data: continueSolving, isLoading: continueSolvingLoading } = useQuery({
    queryKey: ['continue-solving'],
    queryFn: async () => {
      const response = await api.get<{ 
        status: string; 
        data: { problem: any; status: string } 
      }>('/problems/continue-solving');
      return response.data.data;
    },
  });

  // Fetch today's revision stats
  const { data: todayStats, isLoading: statsLoading } = useQuery({
    queryKey: ['revisions-today'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: any }>('/revisions/today');
      return response.data.data;
    },
  });

  // Fetch summary stats
  const { data: summaryData } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const response = await api.get('/analytics/summary');
      return response.data.data;
    },
  });

  // Fetch user XP profile
  const { data: xpProfileData } = useQuery({
    queryKey: ['xp-profile'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: { xpProfile: any } }>('/achievements/xp');
      return response.data.data.xpProfile;
    },
  });

  // Fetch goals
  const { data: goalsData } = useQuery({
    queryKey: ['goals-all'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: { goals: any[] } }>('/goals');
      return response.data.data.goals;
    },
  });

  // Fetch achievements
  const { data: achievementsData } = useQuery({
    queryKey: ['achievements-all'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: { achievements: any[] } }>('/achievements');
      return response.data.data.achievements;
    },
  });

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(3);
  const [showGoalForm, setShowGoalForm] = useState(false);

  const queryClient = useQueryClient();

  const createGoalMutation = useMutation({
    mutationFn: async (goal: { title: string; target: number }) => {
      await api.post('/goals', goal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals-all'] });
      toast('Custom learning goal established!', 'success');
      setNewGoalTitle('');
      setShowGoalForm(false);
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      await api.put(`/goals/${id}/progress`, { progress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals-all'] });
      queryClient.invalidateQueries({ queryKey: ['xp-profile'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals-all'] });
      toast('Goal removed.', 'info');
    },
  });

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    createGoalMutation.mutate({
      title: newGoalTitle,
      target: newGoalTarget,
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const quickNavs = [
    { name: 'Roadmap', path: '/roadmap', icon: Map, color: 'text-indigo-400 border-indigo-500/10 hover:border-indigo-500/30 bg-indigo-500/5' },
    { name: 'Practice', path: '/practice', icon: Code, color: 'text-pink-400 border-pink-500/10 hover:border-pink-500/30 bg-pink-500/5' },
    { name: 'AI Mentor', path: '/ai-mentor', icon: Bot, color: 'text-violet-400 border-violet-500/10 hover:border-violet-500/30 bg-violet-500/5' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 select-none text-left"
    >
      {/* Welcome Banner */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl glass-card border border-slate-800/80 p-6 md:p-8 bg-gradient-to-r from-indigo-950/10 to-slate-900/30">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-indigo-500/5 to-transparent rounded-r-2xl pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Learning Journey Active
          </div>
          <h2 className="font-heading font-black text-2xl md:text-3xl text-white tracking-tight">
            {getGreeting()}, {user?.fullName}! 🚀
          </h2>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
            Ready to master Java Data Structures & Algorithms? You are making steady progress. Check your daily metrics and continue where you left off.
          </p>
        </div>
      </motion.div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Stats and Continue Learning (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metrics Row */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Streak Card */}
            <Card hoverEffect={true} className="p-4 border-slate-800 flex items-center gap-4 bg-slate-900/10">
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Study Streak</p>
                <h4 className="font-heading font-bold text-xl text-white mt-0.5">
                  {summaryData?.summary?.currentStreak || 0} Days
                </h4>
              </div>
            </Card>

            {/* Daily Goal Card */}
            <Card hoverEffect={true} className="p-4 border-slate-800 flex items-center gap-4 bg-slate-900/10">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Solved Problems</p>
                <h4 className="font-heading font-bold text-xl text-white mt-0.5">
                  {summaryData?.summary?.problemsSolved || 0} solved
                </h4>
              </div>
            </Card>

            {/* Active Time Card */}
            <Card hoverEffect={true} className="p-4 border-slate-800 flex items-center gap-4 bg-slate-900/10">
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Time Active</p>
                <h4 className="font-heading font-bold text-xl text-white mt-0.5">
                  {summaryData?.summary?.totalStudyHours || 0} hrs
                </h4>
              </div>
            </Card>
          </motion.div>

          {/* Continue Learning card */}
          <motion.div variants={itemVariants}>
            {continueLoading ? (
              <div className="h-44 bg-slate-900/40 border border-slate-850 rounded-2xl animate-pulse" />
            ) : continueData ? (
              <Card className="border-slate-800 overflow-hidden bg-slate-900/20">
                <CardHeader className="border-b border-slate-850/50 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Continue Learning</CardTitle>
                      <CardDescription>Pick up exactly where you left off</CardDescription>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-550 border border-indigo-450 text-white font-semibold uppercase tracking-wider">
                      {continueData.topic.category}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="font-heading font-bold text-base text-slate-200">
                        {continueData.lesson.title}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {continueData.topic.description}
                      </p>
                    </div>
                    
                    <Button 
                      onClick={() => navigate(`/topics/${continueData.topic.slug}`)} 
                      variant="primary" 
                      size="sm" 
                      leftIcon={<Play className="h-3.5 w-3.5 fill-current" />}
                    >
                      Resume
                    </Button>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                      <span>Reading Progress</span>
                      <span>{continueData.progress.readingProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-350" 
                        style={{ width: `${continueData.progress.readingProgress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </motion.div>

          {/* Continue Coding card */}
          <motion.div variants={itemVariants}>
            {continueSolvingLoading ? (
              <div className="h-44 bg-slate-900/40 border border-slate-850 rounded-2xl animate-pulse" />
            ) : continueSolving?.problem ? (
              <Card className="border-slate-800 overflow-hidden bg-slate-900/20">
                <CardHeader className="border-b border-slate-850/50 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Continue Coding</CardTitle>
                      <CardDescription>Resume your last edited problem</CardDescription>
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wider",
                      continueSolving.problem.difficulty === 'Easy' ? 'text-emerald-450 bg-emerald-500/10 border-emerald-500/15' :
                      continueSolving.problem.difficulty === 'Medium' ? 'text-amber-450 bg-amber-500/10 border-amber-500/15' :
                      'text-rose-450 bg-rose-500/10 border-rose-500/15'
                    )}>
                      {continueSolving.problem.difficulty}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="font-heading font-bold text-base text-slate-200">
                        {continueSolving.problem.title}
                      </h4>
                      <p className="text-xs text-slate-400 capitalize">
                        Topic: {continueSolving.problem.topic.title} &bull; Est: {continueSolving.problem.estimatedTime}
                      </p>
                    </div>
                    
                    <Button 
                      onClick={() => navigate(`/practice/problems/${continueSolving.problem.slug}`)} 
                      variant="primary" 
                      size="sm" 
                      leftIcon={<Play className="h-3.5 w-3.5 fill-current" />}
                    >
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </motion.div>

          {/* Today's Revision widget */}
          <motion.div variants={itemVariants}>
            {statsLoading ? (
              <div className="h-44 bg-slate-900/40 border border-slate-850 rounded-2xl animate-pulse" />
            ) : todayStats?.totalToday > 0 ? (
              <Card className="border-slate-800 overflow-hidden bg-slate-900/20">
                <CardHeader className="border-b border-slate-850/50 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Daily Revision Planner</CardTitle>
                      <CardDescription>Keep your spaced repetition streak active</CardDescription>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 font-semibold uppercase tracking-wider">
                      {todayStats.completedToday}/{todayStats.totalToday} Done
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6 space-y-4 text-left">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="font-heading font-bold text-base text-slate-200">
                        {todayStats.totalToday - todayStats.completedToday} items left to revise today
                      </h4>
                      <p className="text-xs text-slate-400">
                        Topics & problems scheduled for dynamic review today.
                      </p>
                    </div>
                    
                    <Button 
                      onClick={() => navigate('/revision')} 
                      variant="primary" 
                      size="sm" 
                      leftIcon={<Calendar className="h-3.5 w-3.5" />}
                    >
                      Start Revising
                    </Button>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                      <span>Revision Completion</span>
                      <span>{todayStats.completionPercentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-violet-550 h-full rounded-full transition-all duration-350" 
                        style={{ width: `${todayStats.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </motion.div>

          {/* Recently Viewed */}
          <motion.div variants={itemVariants}>
            <Card className="border-slate-800 bg-slate-900/10">
              <CardHeader>
                <CardTitle>Recently Viewed Topics</CardTitle>
                <CardDescription>Quick links to topics you reviewed recently</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-3">
                {[
                  { name: 'Binary Search Implementation', cat: 'Arrays & Search', difficulty: 'Easy' },
                  { name: 'Merge Sort Algorithm', cat: 'Sorting', difficulty: 'Medium' },
                  { name: 'Valid Parentheses Check', cat: 'Stacks & Queues', difficulty: 'Easy' },
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => navigate('/topics')}
                    className="flex justify-between items-center p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900 hover:border-indigo-500/20 border border-transparent transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-slate-200">{item.name}</h5>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.cat}</p>
                      </div>
                    </div>

                    <span className={`text-[9px] px-2 py-0.5 rounded font-black tracking-wider uppercase ${
                      item.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-450 border border-amber-500/20'
                    }`}>
                      {item.difficulty}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Side: Profile Summary and Quick Links (1/3 width) */}
        <div className="space-y-6">
          
          {/* User Profile Summary with levels & XP profiles */}
          <motion.div variants={itemVariants}>
            <Card hoverEffect={false} className="border-slate-800 bg-slate-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2">
                <button 
                  onClick={() => navigate('/profile')}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
                  title="Edit Profile"
                >
                  <SettingsIcon className="h-4 w-4" />
                </button>
              </div>

              <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                {/* Avatar */}
                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-black border-2 border-indigo-500/30 shadow-lg shadow-indigo-500/10">
                  {user?.avatar ? user.avatar : user?.fullName.charAt(0).toUpperCase()}
                </div>

                <div className="space-y-1">
                  <h4 className="font-heading font-bold text-base text-white">{user?.fullName}</h4>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 font-bold uppercase tracking-wider">
                    {xpProfileData?.levelTitle || 'Beginner'} (Lvl {xpProfileData?.level || 1})
                  </span>
                </div>

                {/* Level Progress bar */}
                <div className="w-full space-y-1 text-left">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>Level Progress</span>
                    <span>{xpProfileData?.totalXP || 0} / {xpProfileData?.nextLevelThreshold || 100} XP</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-350"
                      style={{ width: `${xpProfileData?.percentage || 0}%` }}
                    />
                  </div>
                </div>

                {/* Substats */}
                <div className="w-full grid grid-cols-2 gap-2.5 py-3 border-y border-slate-850/50">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">XP Earned</span>
                    <span className="text-xs font-bold text-indigo-400 mt-0.5">{xpProfileData?.totalXP || 0} XP</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Rank</span>
                    <span className="text-xs font-bold text-slate-200 mt-0.5">{xpProfileData?.levelTitle || 'Beginner'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Goal Management Widget */}
          <motion.div variants={itemVariants}>
            <Card hoverEffect={false} className="border-slate-800 bg-slate-900/10 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <span className="text-[10px] font-black text-slate-550 uppercase tracking-widest block">Study Goals</span>
                <button
                  onClick={() => setShowGoalForm(!showGoalForm)}
                  className="p-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Add custom goal"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Add Goal Form */}
              {showGoalForm && (
                <form onSubmit={handleAddGoal} className="space-y-3 p-3 bg-slate-950/40 rounded-xl border border-slate-850">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-550 uppercase">Goal Title</label>
                    <input
                      type="text"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      placeholder="e.g. Solve 5 Trees Problems"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-700 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-550 uppercase">Target Count</label>
                    <input
                      type="number"
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                  </div>
                  <Button type="submit" variant="primary" size="sm" className="w-full text-xs py-1 h-auto">
                    Create Goal
                  </Button>
                </form>
              )}

              {/* Goals list */}
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {goalsData && goalsData.length === 0 ? (
                  <div className="text-center py-4 text-[10px] text-slate-650">No study goals active. Add one to stay focused!</div>
                ) : (
                  goalsData?.map((goal) => (
                    <div key={goal.id} className="p-3 bg-slate-900/50 rounded-xl border border-slate-850/50 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <span className={cn(
                          "text-xs font-semibold leading-tight text-left",
                          goal.completed ? "text-slate-550 line-through" : "text-slate-200"
                        )}>
                          {goal.title}
                        </span>
                        <button
                          onClick={() => deleteGoalMutation.mutate(goal.id)}
                          className="p-1 rounded text-slate-600 hover:text-rose-400 hover:bg-rose-500/5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-850 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full"
                            style={{ width: `${(goal.progress / goal.target) * 100}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-bold font-mono text-slate-450 shrink-0">
                          {goal.progress}/{goal.target}
                        </span>
                      </div>

                      {!goal.completed && (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => updateGoalMutation.mutate({ id: goal.id, progress: goal.progress + 1 })}
                            className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/15 font-bold transition-all cursor-pointer"
                          >
                            +1 Progress
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>

          {/* Achievements Summary Badge Widget */}
          <motion.div variants={itemVariants}>
            <Card hoverEffect={false} className="border-slate-800 bg-slate-900/10 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <span className="text-[10px] font-black text-slate-550 uppercase tracking-widest block">Unlocked Badges</span>
                <span 
                  onClick={() => navigate('/analytics')}
                  className="text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  View All
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {achievementsData?.filter(a => a.unlocked).slice(0, 4).map((ach) => (
                  <div 
                    key={ach.id} 
                    className="flex flex-col items-center gap-1.5 text-center p-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl"
                    title={ach.description}
                  >
                    <Award className="h-5 w-5 text-indigo-400" />
                    <span className="text-[8px] font-bold text-slate-350 truncate w-full">{ach.title}</span>
                  </div>
                ))}
                {achievementsData?.filter(a => a.unlocked).length === 0 && (
                  <div className="col-span-4 text-center py-4 text-[10px] text-slate-650">No badges unlocked yet. Keep studying!</div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Quick Navigation Cards */}
          <motion.div variants={itemVariants} className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 text-left">
              Quick Shortcuts
            </h4>
            
            {quickNavs.map((nav) => (
              <div
                key={nav.name}
                onClick={() => navigate(nav.path)}
                className={cn(
                  "p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer",
                  nav.color
                )}
              >
                <div className="flex items-center gap-3.5">
                  <nav.icon className="h-5 w-5 shrink-0" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{nav.name}</span>
                </div>
                <ArrowRight className="h-4.5 w-4.5 text-current opacity-70" />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
