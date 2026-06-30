import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  PlayCircle, 
  Lock, 
  Clock, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface TopicSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  estimatedTime: string;
  category: string;
  order: number;
  progress: number;
  completed: boolean;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export const RoadmapPage: React.FC = () => {
  const navigate = useNavigate();

  // Fetch topics via TanStack Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: { topics: TopicSummary[] } }>('/topics');
      return response.data.data.topics;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8 select-none text-left py-8">
        {/* Header Skeleton */}
        <div className="h-32 bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse p-6 space-y-3">
          <div className="h-4 bg-slate-800 rounded w-1/4" />
          <div className="h-6 bg-slate-800 rounded w-1/2" />
          <div className="h-3 bg-slate-800 rounded w-1/3" />
        </div>
        {/* Roadmap Nodes Skeleton */}
        <div className="max-w-2xl mx-auto space-y-8 relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-850 -translate-x-1/2" />
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-6 justify-center">
              <div className="w-1/2 h-24 bg-slate-900/40 border border-slate-850 rounded-xl animate-pulse" />
              <div className="h-10 w-10 rounded-full bg-slate-850 border-2 border-slate-800 animate-pulse shrink-0" />
              <div className="w-1/2 hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-4">
        <h3 className="font-heading font-bold text-lg text-white">Failed to load roadmap</h3>
        <p className="text-slate-400 text-sm">Please verify your database connection and try again.</p>
        <Button onClick={() => window.location.reload()} variant="primary">
          Retry
        </Button>
      </div>
    );
  }

  // Calculate statistics
  const totalTopics = data.length;
  const completedCount = data.filter((t) => t.completed).length;
  const totalCompletionPercent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  // Group topics to check locked status. 
  // For standard linear roadmap, we say: a topic is "unlocked" if it's the first topic OR the previous topic is completed!
  const isUnlocked = (index: number) => {
    if (index === 0) return true;
    return data[index - 1].completed;
  };

  return (
    <div className="space-y-10 text-left select-none pb-16">
      
      {/* Roadmap Stats Header */}
      <Card hoverEffect={false} className="border-slate-850 bg-slate-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-500/5 to-transparent rounded-r-2xl pointer-events-none" />
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          
          <div className="md:col-span-2 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-wider">
              <TrendingUp className="h-3.5 w-3.5" />
              Java DSA Path
            </div>
            <h2 className="font-heading font-black text-2xl text-white tracking-tight">Interactive Learning Roadmap</h2>
            <p className="text-xs text-slate-400">
              Master Java DSA node-by-node. Complete modules to unlock advanced topics and track your progress.
            </p>
          </div>

          <div className="space-y-1 md:border-l border-slate-800/60 md:pl-6">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Completed</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-heading font-bold text-white">{completedCount}</span>
              <span className="text-xs text-slate-500">/ {totalTopics} modules</span>
            </div>
          </div>

          <div className="space-y-2 md:border-l border-slate-800/60 md:pl-6">
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>Overall Completion</span>
              <span>{totalCompletionPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-850 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${totalCompletionPercent}%` }}
              />
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Visual Roadmap Tree */}
      <div className="max-w-4xl mx-auto relative px-4">
        {/* Central connecting line */}
        <div className="absolute left-6 md:left-1/2 top-4 bottom-4 w-[2px] bg-slate-800 -translate-x-1/2 pointer-events-none" />

        <div className="space-y-10 relative">
          {data.map((topic, index) => {
            const unlocked = isUnlocked(index);
            const isLeft = index % 2 === 0;

            const borderColors = {
              COMPLETED: 'border-emerald-500/40 shadow-emerald-500/2 hover:border-emerald-500/80',
              IN_PROGRESS: 'border-indigo-500/40 shadow-indigo-500/5 hover:border-indigo-500/80',
              NOT_STARTED: 'border-slate-800 hover:border-indigo-500/30'
            };

            const nodeIconColors = {
              COMPLETED: 'bg-emerald-950 border-emerald-500 text-emerald-400',
              IN_PROGRESS: 'bg-indigo-950 border-indigo-500 text-indigo-400 animate-pulse',
              NOT_STARTED: 'bg-slate-900 border-slate-800 text-slate-500'
            };

            return (
              <div 
                key={topic.id}
                className={cn(
                  "flex items-center gap-6 md:gap-10",
                  isLeft ? "flex-row md:flex-row" : "flex-row md:flex-row-reverse"
                )}
              >
                {/* Node Card - 1/2 width on desktop */}
                <div className="w-full md:w-[calc(50%-20px)] flex-1">
                  <motion.div
                    initial={{ opacity: 0, x: isLeft ? -15 : 15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card
                      hoverEffect={unlocked}
                      onClick={() => unlocked && navigate(`/topics/${topic.slug}`)}
                      className={cn(
                        "p-5 cursor-pointer relative overflow-hidden transition-all duration-300",
                        !unlocked && "opacity-45 cursor-not-allowed hover:translate-y-0 hover:border-slate-850",
                        unlocked && borderColors[topic.status]
                      )}
                    >
                      {/* Active glow pointer */}
                      {topic.status === 'IN_PROGRESS' && (
                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                      )}

                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1.5 text-left">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                            Module {index + 1} &bull; {topic.category}
                          </span>
                          <h4 className="font-heading font-bold text-sm md:text-base text-slate-200">
                            {topic.title}
                          </h4>
                          <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                            {topic.description}
                          </p>
                        </div>
                      </div>

                      {/* Info footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-850/50 mt-4 text-[10px] font-semibold text-slate-400">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                            topic.difficulty === 'Beginner' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/15' :
                            topic.difficulty === 'Intermediate' ? 'bg-amber-500/10 text-amber-450 border border-amber-500/15' :
                            'bg-rose-500/10 text-rose-450 border border-rose-500/15'
                          )}>
                            {topic.difficulty}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {topic.estimatedTime}
                          </span>
                        </div>

                        {unlocked ? (
                          <div className="flex items-center gap-1.5 text-indigo-400">
                            <span>Learn</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Lock className="h-3.5 w-3.5" />
                            <span>Locked</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                </div>

                {/* Timeline node node connector (circle) */}
                <div 
                  className={cn(
                    "h-10 w-10 rounded-full border-2 flex items-center justify-center shrink-0 z-10 shadow-lg relative",
                    !unlocked ? "bg-slate-950 border-slate-850 text-slate-600" : nodeIconColors[topic.status]
                  )}
                >
                  {!unlocked ? (
                    <Lock className="h-4 w-4" />
                  ) : topic.status === 'COMPLETED' ? (
                    <CheckCircle2 className="h-5 w-5 fill-current text-emerald-500 bg-slate-950 rounded-full" />
                  ) : topic.status === 'IN_PROGRESS' ? (
                    <PlayCircle className="h-5 w-5 text-indigo-400" />
                  ) : (
                    <Circle className="h-3 w-3 fill-current text-slate-500" />
                  )}

                  {/* Order indicator */}
                  <span className="absolute -bottom-5 text-[8px] font-black text-slate-500 tracking-wider">
                    #{index + 1}
                  </span>
                </div>

                {/* Blank space for balancing on desktop */}
                <div className="hidden md:block w-[calc(50%-20px)]" />

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
