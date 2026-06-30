import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, BookOpen, Clock, ChevronRight, X } from 'lucide-react';
import api from '../services/api';
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

export const TopicsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="h-8 bg-slate-900/40 rounded w-1/4 animate-pulse" />
          <div className="h-10 bg-slate-900/40 rounded w-full sm:w-1/3 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-44 bg-slate-900/40 border border-slate-850 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-4">
        <h3 className="font-heading font-bold text-lg text-white">Failed to load topics</h3>
        <p className="text-slate-400 text-sm">Please verify your database connection and try again.</p>
        <Button onClick={() => window.location.reload()} variant="primary">
          Retry
        </Button>
      </div>
    );
  }

  // Filter topics locally based on states
  const filteredTopics = data.filter((topic) => {
    const matchesSearch = 
      topic.title.toLowerCase().includes(search.toLowerCase()) || 
      topic.description.toLowerCase().includes(search.toLowerCase()) ||
      topic.category.toLowerCase().includes(search.toLowerCase());
      
    const matchesDifficulty = selectedDifficulty ? topic.difficulty === selectedDifficulty : true;
    const matchesStatus = selectedStatus ? topic.status === selectedStatus : true;

    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  const clearFilters = () => {
    setSelectedDifficulty(null);
    setSelectedStatus(null);
    setSearch('');
  };

  const hasActiveFilters = selectedDifficulty !== null || selectedStatus !== null || search !== '';

  return (
    <div className="space-y-8 text-left select-none pb-16">
      
      {/* Search and Filters Header */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics by title, keywords or categories..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-900/65 text-slate-100 placeholder:text-slate-500 rounded-xl border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/35 focus:outline-none transition-all duration-200 text-sm shadow-inner"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter buttons desktop */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`md:hidden flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
              showMobileFilters ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20' : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
          </button>

          {/* Difficulty filters */}
          <div className="hidden md:flex items-center gap-1.5 border-r border-slate-800 pr-3 mr-0.5">
            {['Beginner', 'Intermediate', 'Advanced'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? null : diff)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                  selectedDifficulty === diff
                    ? 'bg-indigo-650 text-white border-indigo-550'
                    : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Status filters */}
          <div className="hidden md:flex items-center gap-1.5">
            {[
              { id: 'NOT_STARTED', label: 'Not Started' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'COMPLETED', label: 'Completed' },
            ].map((stat) => (
              <button
                key={stat.id}
                onClick={() => setSelectedStatus(selectedStatus === stat.id ? null : stat.id)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                  selectedStatus === stat.id
                    ? 'bg-indigo-650 text-white border-indigo-550'
                    : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {stat.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-450 hover:text-rose-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/5 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-card rounded-2xl p-5 border border-slate-800 space-y-4"
          >
            {/* Difficulty */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Difficulty</span>
              <div className="flex flex-wrap gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? null : diff)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border ${
                      selectedDifficulty === diff
                        ? 'bg-indigo-650 text-white border-indigo-550'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Completion</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'NOT_STARTED', label: 'Not Started' },
                  { id: 'IN_PROGRESS', label: 'In Progress' },
                  { id: 'COMPLETED', label: 'Completed' },
                ].map((stat) => (
                  <button
                    key={stat.id}
                    onClick={() => setSelectedStatus(selectedStatus === stat.id ? null : stat.id)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border ${
                      selectedStatus === stat.id
                        ? 'bg-indigo-650 text-white border-indigo-550'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {stat.label}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <div className="pt-2">
                <Button onClick={clearFilters} variant="danger" size="sm" className="w-full text-xs">
                  Clear All Filters
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of Topics */}
      {filteredTopics.length === 0 ? (
        <Card hoverEffect={false} className="border-slate-850 bg-slate-900/10 py-16 text-center max-w-lg mx-auto">
          <CardContent className="space-y-4">
            <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading font-semibold text-white">No topics match filters</h4>
              <p className="text-xs text-slate-400">Try adjusting your search keywords or clearing active filters.</p>
            </div>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" size="sm">
                Reset Search Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredTopics.map((topic) => {
              const borderColors = {
                COMPLETED: 'border-emerald-500/35 hover:border-emerald-500/70',
                IN_PROGRESS: 'border-indigo-500/35 hover:border-indigo-500/70',
                NOT_STARTED: 'border-slate-800 hover:border-indigo-500/30'
              };

              return (
                <motion.div
                  key={topic.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                >
                  <Card
                    onClick={() => navigate(`/topics/${topic.slug}`)}
                    className={`h-full flex flex-col justify-between p-5 cursor-pointer relative overflow-hidden transition-all duration-300 ${borderColors[topic.status]}`}
                  >
                    <div className="space-y-3">
                      {/* Header row */}
                      <div className="flex justify-between items-center text-[9px] font-black text-slate-500 tracking-wider">
                        <span className="uppercase">{topic.category}</span>
                        <span>#{topic.order}</span>
                      </div>

                      {/* Title & Desc */}
                      <div className="space-y-1.5 text-left">
                        <h4 className="font-heading font-bold text-base text-slate-200 group-hover:text-white transition-colors">
                          {topic.title}
                        </h4>
                        <p className="text-slate-450 text-xs line-clamp-2 leading-relaxed">
                          {topic.description}
                        </p>
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="mt-6 space-y-4 pt-4 border-t border-slate-850/50">
                      
                      {/* Progress bar */}
                      {topic.progress > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                            <span>Module Progress</span>
                            <span>{topic.progress}%</span>
                          </div>
                          <div className="w-full h-1 bg-slate-855 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                topic.completed ? 'bg-emerald-500' : 'bg-indigo-500'
                              }`} 
                              style={{ width: `${topic.progress}%` }} 
                            />
                          </div>
                        </div>
                      )}

                      {/* Footer Row */}
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            topic.difficulty === 'Beginner' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/15' :
                            topic.difficulty === 'Intermediate' ? 'bg-amber-500/10 text-amber-450 border border-amber-500/15' :
                            'bg-rose-500/10 text-rose-450 border border-rose-500/15'
                          }`}>
                            {topic.difficulty}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {topic.estimatedTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-indigo-400">
                          <span>Open</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </div>

                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

    </div>
  );
};
