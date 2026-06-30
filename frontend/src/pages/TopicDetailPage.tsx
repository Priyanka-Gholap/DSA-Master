import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Award, 
  ChevronRight, 
  ChevronLeft,
  BookMarked,
  Zap,
  Info,
  FileText,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { 
  SyntaxCodeBlock, 
  ComplexityTable, 
  WarningCard, 
  TipCard, 
  DryRunFlow, 
  ApplicationCard 
} from '../components/ui/LessonComponents';



interface ComplexityOperation {
  operation: string;
  best: string;
  average: string;
  worst: string;
  space: string;
}



interface LessonDetail {
  id: string;
  topicId: string;
  title: string;
  introduction: string;
  objectives: string[];
  prerequisites: string[];
  theory: { type: 'heading' | 'paragraph' | 'tip' | 'warning'; text: string; level?: number }[];
  visualization: { type: string; message: string };
  syntax: { title: string; code: string; language: string }[];
  dryRun: { title: string; steps: { index: string; pointer: string; value: string; comment: string }[] };
  complexity: ComplexityOperation[];
  mistakes: { title: string; description: string }[];
  interviewTips: { questions: string[]; companyTips: string };
  applications: { title: string; description: string }[];
  summary: { takeaways: string[]; nextTopic: string };
}

interface LessonProgress {
  readingProgress: number;
  completed: boolean;
  lastReadSection: string | null;
}

interface TopicSummary {
  id: string;
  title: string;
  slug: string;
  order: number;
}

export const TopicDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Schedule Topic Revision Mutation
  const scheduleTopicRevisionMutation = useMutation({
    mutationFn: async (days: number) => {
      if (!topic) return;
      await api.post('/revisions', {
        topicId: topic.id,
        days
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisions-all'] });
      queryClient.invalidateQueries({ queryKey: ['revisions-today'] });
      toast('Revision scheduled successfully!', 'success');
    }
  });

  const [activeSection, setActiveSection] = useState('Introduction');
  const [localProgress, setLocalProgress] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const progressSentRef = useRef<Record<number, boolean>>({});

  // Topic Notes States
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isNoteSaving, setIsNoteSaving] = useState(false);
  const [noteLastSaved, setNoteLastSaved] = useState<Date | null>(null);
  const autoSaveNoteTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sections = [
    'Introduction',
    'Objectives',
    'Prerequisites',
    'Theory',
    'Visuals',
    'Syntax',
    'Dry Run',
    'Complexity',
    'Mistakes',
    'Interview',
    'Applications',
    'Summary'
  ];

  // Fetch all topics to calculate previous and next slugs
  const { data: topics } = useQuery<TopicSummary[]>({
    queryKey: ['topics'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: { topics: TopicSummary[] } }>('/topics');
      return response.data.data.topics;
    },
  });

  // Fetch lesson data
  const { data, isLoading, error } = useQuery({
    queryKey: ['lesson', slug],
    queryFn: async () => {
      const response = await api.get<{ 
        status: string; 
        data: { lesson: LessonDetail; progress: LessonProgress; topic: any } 
      }>(`/lessons/${slug}`);
      return response.data.data;
    },
  });

  const lesson = data?.lesson;
  const progress = data?.progress;
  const topic = data?.topic;

  // Load Topic Note
  const { data: topicNote } = useQuery({
    queryKey: ['topic-note', topic?.id],
    queryFn: async () => {
      if (!topic) return null;
      const response = await api.get<{ status: string; data: { notes: any[] } }>('/notes', {
        params: { topicId: topic.id }
      });
      return response.data.data.notes[0] || null;
    },
    enabled: !!topic,
  });

  // Sync inputs when loaded
  useEffect(() => {
    if (topicNote) {
      setNoteTitle(topicNote.title);
      setNoteContent(topicNote.content);
      setNoteLastSaved(new Date(topicNote.updatedAt));
    }
  }, [topicNote]);

  // Create Note Mutation
  const createTopicNoteMutation = useMutation({
    mutationFn: async () => {
      if (!topic) return;
      const response = await api.post<{ status: string; data: { note: any } }>('/notes', {
        title: `Notes: ${topic.title}`,
        content: '# Lesson Core Concepts\n- Key Formulae:\n- Common Patterns:\n- Pitfalls to avoid:',
        topicId: topic.id
      });
      return response.data.data.note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-note', topic?.id] });
      toast('Notes sheet initialized for topic!', 'success');
    }
  });

  // Update Note Mutation
  const updateTopicNoteMutation = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      if (!topicNote) return;
      setIsNoteSaving(true);
      await api.put(`/notes/${topicNote.id}`, { title, content });
    },
    onSuccess: () => {
      setNoteLastSaved(new Date());
      setIsNoteSaving(false);
      queryClient.invalidateQueries({ queryKey: ['topic-note', topic?.id] });
    },
    onError: () => {
      setIsNoteSaving(false);
      toast('Failed to save notes changes.', 'error');
    }
  });

  const handleNoteChange = (field: 'title' | 'content', val: string) => {
    if (field === 'title') setNoteTitle(val);
    else setNoteContent(val);

    if (!topicNote) return;

    if (autoSaveNoteTimerRef.current) {
      clearTimeout(autoSaveNoteTimerRef.current);
    }

    autoSaveNoteTimerRef.current = setTimeout(() => {
      updateTopicNoteMutation.mutate({
        title: field === 'title' ? val : noteTitle,
        content: field === 'content' ? val : noteContent
      });
    }, 1500);
  };

  // Set initial local progress
  useEffect(() => {
    if (progress) {
      setLocalProgress(progress.readingProgress);
    }
  }, [progress]);

  // Mutation for progress updates
  const progressMutation = useMutation({
    mutationFn: async ({ readingProgress, lastReadSection }: { readingProgress: number; lastReadSection: string }) => {
      if (!lesson) return;
      await api.put(`/lessons/${lesson.id}/progress`, { readingProgress, lastReadSection });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson', slug] });
      queryClient.invalidateQueries({ queryKey: ['continue-learning'] });
    }
  });

  // Mutation for completing the lesson
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!lesson) return;
      await api.post(`/lessons/${lesson.id}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson', slug] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['continue-learning'] });
      setShowCelebration(true);
      toast('🎉 Lesson Completed! You have unlocked the next stage.', 'success');
    }
  });

  // Scroll spy effect to track active section and progress percentage
  useEffect(() => {
    if (!lesson) return;

    const handleScroll = () => {
      const viewportHeight = window.innerHeight;
      let currentSection = 'Introduction';
      let furthestIdx = 0;

      sections.forEach((sec, idx) => {
        const el = document.getElementById(`sec-${sec.toLowerCase().replace(/\s/g, '-')}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If section top is above middle of viewport
          if (rect.top <= viewportHeight / 2) {
            currentSection = sec;
            furthestIdx = Math.max(furthestIdx, idx);
          }
        }
      });

      setActiveSection(currentSection);

      // Discrete section progress percentage
      const progressPercent = Math.round(((furthestIdx + 1) / sections.length) * 100);
      
      setLocalProgress((prev) => {
        const nextVal = Math.max(prev, progressPercent);
        // Sync with backend only when crossing into a new section value
        if (nextVal > prev && !progressSentRef.current[nextVal]) {
          progressSentRef.current[nextVal] = true;
          progressMutation.mutate({ readingProgress: nextVal, lastReadSection: currentSection });
        }
        return nextVal;
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lesson, sections]);

  // Navigate helper
  const scrollToSection = (sec: string) => {
    const el = document.getElementById(`sec-${sec.toLowerCase().replace(/\s/g, '-')}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 select-none text-left py-8">
        <div className="h-6 bg-slate-900/40 rounded w-16 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-40 bg-slate-900/40 border border-slate-850 rounded-2xl animate-pulse" />
            <div className="h-96 bg-slate-900/40 border border-slate-850 rounded-2xl animate-pulse" />
          </div>
          <div className="h-64 bg-slate-900/40 border border-slate-850 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !lesson || !progress || !topic) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-4">
        <h3 className="font-heading font-bold text-lg text-white">Lesson content not found</h3>
        <p className="text-slate-400 text-xs">Please verify your database initialization and try again.</p>
        <Button onClick={() => navigate('/roadmap')} variant="primary">
          Back to Roadmap
        </Button>
      </div>
    );
  }

  // Get previous and next topics in sequence
  let prevTopic: TopicSummary | null = null;
  let nextTopic: TopicSummary | null = null;
  if (topics && topic) {
    const sorted = [...topics].sort((a, b) => a.order - b.order);
    const currIdx = sorted.findIndex((t) => t.id === topic.id);
    if (currIdx > 0) prevTopic = sorted[currIdx - 1];
    if (currIdx < sorted.length - 1) nextTopic = sorted[currIdx + 1];
  }

  return (
    <div className="relative select-none pb-16">
      
      {/* Reading Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-900 z-40 pointer-events-none">
        <motion.div 
          className="h-full bg-indigo-500" 
          animate={{ width: `${localProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-md w-full glass-card border border-emerald-500/20 bg-slate-900 p-8 rounded-3xl text-center space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Award className="h-10 w-10 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-black text-2xl text-white">Lesson Completed!</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                  You have successfully completed <strong>{lesson.title}</strong> theory. You are ready to unlock the next module on the roadmap.
                </p>
              </div>
              <div className="pt-2">
                <Button 
                  onClick={() => {
                    setShowCelebration(false);
                    if (nextTopic) {
                      navigate(`/topics/${nextTopic.slug}`);
                    } else {
                      navigate('/roadmap');
                    }
                  }} 
                  variant="primary" 
                  className="w-full"
                  rightIcon={<ChevronRight className="h-4.5 w-4.5" />}
                >
                  {nextTopic ? 'Next Lesson' : 'Back to Roadmap'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6 text-left">
        {/* Back and Page Header */}
        <div className="flex justify-between items-center">
          <Link
            to="/roadmap"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            Back to Roadmap
          </Link>
          {progress.completed && (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-450 text-[10px] font-black uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5" /> Completed
            </div>
          )}
        </div>

        {/* 3-Column Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start relative">
          
          {/* Column 1: Table of Contents (Sticky Sidebar Left) */}
          <aside className="hidden lg:block lg:sticky lg:top-22 lg:col-span-1 space-y-4">
            <Card hoverEffect={false} className="border-slate-850 bg-slate-900/15 p-4.5 rounded-2xl select-none">
              <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block mb-3 pl-1">
                Table of Contents
              </span>
              <nav className="space-y-0.5 text-xs font-semibold">
                {sections.map((sec) => {
                  const isActive = activeSection === sec;
                  return (
                    <button
                      key={sec}
                      onClick={() => scrollToSection(sec)}
                      className={cn(
                        "w-full text-left py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-between group cursor-pointer",
                        isActive 
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 font-bold" 
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/40 border border-transparent"
                      )}
                    >
                      <span>{sec}</span>
                      <ChevronRight className={cn(
                        "h-3.5 w-3.5 opacity-0 transition-opacity",
                        isActive ? "opacity-100 text-indigo-400" : "group-hover:opacity-100 text-slate-500"
                      )} />
                    </button>
                  );
                })}
              </nav>
            </Card>
          </aside>

          {/* Column 2: Main Educational Content (2/4 width) */}
          <div className="lg:col-span-2 space-y-8 max-w-2xl w-full">
            
            {/* Section 1: Intro */}
            <section id="sec-introduction" className="space-y-4 pt-4 scroll-mt-24">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-550 uppercase tracking-wider block">
                  Introduction
                </span>
                <h3 className="font-heading font-black text-2xl md:text-3xl text-white tracking-tight leading-tight">
                  {lesson.title}
                </h3>
              </div>
              <p className="text-slate-350 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                {lesson.introduction}
              </p>
            </section>

            {/* Section 2: Objectives */}
            <section id="sec-objectives" className="space-y-4 pt-6 border-t border-slate-900/60 scroll-mt-24">
              <h4 className="font-heading font-black text-sm text-slate-300 uppercase tracking-widest">
                Learning Objectives
              </h4>
              <Card hoverEffect={false} className="border-slate-850 bg-slate-900/10 p-5 rounded-2xl">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-3">
                  After completing this lesson you will understand:
                </span>
                <div className="space-y-2.5">
                  {lesson.objectives.map((obj, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs font-medium text-slate-300">
                      <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            {/* Section 3: Prerequisites */}
            <section id="sec-prerequisites" className="space-y-4 pt-6 border-t border-slate-900/60 scroll-mt-24">
              <h4 className="font-heading font-black text-sm text-slate-300 uppercase tracking-widest">
                Recommended Prerequisites
              </h4>
              {lesson.prerequisites.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/20 border border-slate-850 text-xs font-semibold text-slate-450 flex items-center gap-2">
                  <Info className="h-4 w-4 text-indigo-400" />
                  No prerequisites are required for this foundational lesson.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {lesson.prerequisites.map((pre, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 rounded-xl bg-slate-900/35 border border-slate-850/80 flex items-center justify-between hover:border-indigo-500/25 transition-colors cursor-pointer"
                      onClick={() => navigate(`/topics/${pre}`)}
                    >
                      <div className="flex items-center gap-2.5">
                        <BookMarked className="h-4.5 w-4.5 text-indigo-400" />
                        <span className="text-xs font-bold text-slate-200 capitalize">
                          {pre.replace(/-/g, ' ')}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section 4: Theory */}
            <section id="sec-theory" className="space-y-5 pt-6 border-t border-slate-900/60 scroll-mt-24">
              <h4 className="font-heading font-black text-sm text-slate-300 uppercase tracking-widest">
                Structured Theory
              </h4>
              <div className="space-y-5">
                {lesson.theory.map((block, idx) => {
                  if (block.type === 'heading') {
                    return (
                      <h4 key={idx} className="font-heading font-bold text-base text-slate-200 pt-3">
                        {block.text}
                      </h4>
                    );
                  }
                  if (block.type === 'tip') {
                    return <TipCard key={idx} title="Study Tip" description={block.text} />;
                  }
                  if (block.type === 'warning') {
                    return <WarningCard key={idx} title="Important Warning" description={block.text} />;
                  }
                  return (
                    <p key={idx} className="text-slate-350 text-xs md:text-sm leading-relaxed">
                      {block.text}
                    </p>
                  );
                })}
              </div>
            </section>

            {/* Section 5: Visual Explanation */}
            <section id="sec-visuals" className="space-y-4 pt-6 border-t border-slate-900/60 scroll-mt-24">
              <h4 className="font-heading font-black text-sm text-slate-300 uppercase tracking-widest">
                Visual Explanation & Simulations
              </h4>
              <div className="p-8 rounded-2xl border border-indigo-500/10 bg-indigo-500/5 text-center relative overflow-hidden flex flex-col items-center justify-center space-y-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                  <Maximize2 className="h-5 w-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h5 className="font-heading font-bold text-xs text-slate-200">Interactive Algorithm Visualizer</h5>
                  <p className="text-[10px] text-slate-450 max-w-sm mx-auto leading-relaxed">
                    Step through the operations, observe comparative pointer shifts, or modify stack/queue memory arrays in real time.
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    let visType = 'bubble-sort';
                    if (slug?.includes('bubble')) visType = 'bubble-sort';
                    else if (slug?.includes('selection')) visType = 'selection-sort';
                    else if (slug?.includes('linear')) visType = 'linear-search';
                    else if (slug?.includes('binary')) visType = 'binary-search';
                    else if (slug?.includes('stack')) visType = 'stack-operations';
                    else if (slug?.includes('queue')) visType = 'queue-operations';
                    else if (slug?.includes('list')) visType = 'linked-list';
                    else if (slug?.includes('tree')) visType = 'bst-traversal';
                    else if (slug?.includes('graph')) visType = 'graph-bfs';
                    else if (slug?.includes('knapsack')) visType = 'dp-knapsack';
                    
                    navigate(`/visualizer?type=${visType}`);
                  }}
                  variant="primary" 
                  size="sm"
                >
                  Visualize Algorithm
                </Button>
              </div>
            </section>

            {/* Section 6: Syntax Code Block */}
            <section id="sec-syntax" className="space-y-4 pt-6 border-t border-slate-900/60 scroll-mt-24">
              <h4 className="font-heading font-black text-sm text-slate-300 uppercase tracking-widest">
                Java Syntax Examples
              </h4>
              <div className="space-y-4">
                {lesson.syntax.map((codeCard, idx) => (
                  <SyntaxCodeBlock 
                    key={idx}
                    title={codeCard.title}
                    code={codeCard.code}
                    language={codeCard.language}
                  />
                ))}
              </div>
            </section>

            {/* Section 7: Dry Run */}
            <section id="sec-dry-run" className="space-y-4 pt-6 border-t border-slate-900/60 scroll-mt-24">
              <h4 className="font-heading font-black text-sm text-slate-300 uppercase tracking-widest">
                Execution Trace
              </h4>
              <DryRunFlow 
                title={lesson.dryRun.title}
                steps={lesson.dryRun.steps}
              />
            </section>

            {/* Section 8: Complexity */}
            <section id="sec-complexity" className="space-y-4 pt-6 border-t border-slate-900/60 scroll-mt-24">
              <h4 className="font-heading font-black text-sm text-slate-300 uppercase tracking-widest">
                Complexity Profiles
              </h4>
              <ComplexityTable operations={lesson.complexity} />
            </section>

            {/* Section 9: Mistakes Warnings */}
            <section id="sec-mistakes" className="space-y-4 pt-6 border-t border-slate-900/60 scroll-mt-24">
              <h4 className="font-heading font-black text-sm text-slate-300 uppercase tracking-widest">
                Common Mistakes to Avoid
              </h4>
              <div className="space-y-3.5">
                {lesson.mistakes.map((mistake, idx) => (
                  <WarningCard 
                    key={idx}
                    title={mistake.title}
                    description={mistake.description}
                  />
                ))}
              </div>
            </section>

            {/* Section 10: Interview tips */}
            <section id="sec-interview" className="space-y-4 pt-6 border-t border-slate-900/60 scroll-mt-24">
              <h4 className="font-heading font-black text-sm text-slate-300 uppercase tracking-widest">
                Interview preparation
              </h4>
              <Card hoverEffect={false} className="border-slate-800 bg-slate-900/10 p-5 rounded-2xl space-y-4">
                <div className="space-y-2">
                  <h5 className="font-heading font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                    <Zap className="h-4 w-4 text-indigo-400" /> Key Interview Questions
                  </h5>
                  <div className="space-y-1.5 pl-1.5">
                    {lesson.interviewTips.questions.map((q, idx) => (
                      <div key={idx} className="text-xs text-slate-350 flex gap-2">
                        <span>&bull;</span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-850/60 space-y-1">
                  <h5 className="font-heading font-bold text-xs text-slate-400 uppercase tracking-wider">
                    Company Trends
                  </h5>
                  <p className="text-xs text-slate-400 leading-relaxed pl-1">
                    {lesson.interviewTips.companyTips}
                  </p>
                </div>
              </Card>
            </section>

            {/* Section 11: Real world applications */}
            <section id="sec-applications" className="space-y-4 pt-6 border-t border-slate-900/60 scroll-mt-24">
              <h4 className="font-heading font-black text-sm text-slate-300 uppercase tracking-widest">
                Real-World Applications
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {lesson.applications.map((app, idx) => (
                  <ApplicationCard 
                    key={idx}
                    title={app.title}
                    description={app.description}
                  />
                ))}
              </div>
            </section>

            {/* Section 12: Summary */}
            <section id="sec-summary" className="space-y-4 pt-6 border-t border-slate-900/60 scroll-mt-24">
              <h4 className="font-heading font-black text-sm text-slate-300 uppercase tracking-widest">
                Lesson Summary
              </h4>
              <Card hoverEffect={false} className="border-slate-800 bg-slate-900/20 p-5 rounded-2xl space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                    Key Takeaways
                  </span>
                  <div className="space-y-2">
                    {lesson.summary.takeaways.map((takeaway, idx) => (
                      <div key={idx} className="flex gap-2.5 text-xs text-slate-300 font-medium">
                        <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{takeaway}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {nextTopic && (
                  <div className="pt-4 border-t border-slate-850/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider block">
                        What You'll Learn Next
                      </span>
                      <span className="text-xs font-bold text-white block mt-0.5 capitalize">
                        {nextTopic.title}
                      </span>
                    </div>
                    <Button
                      onClick={() => navigate(`/topics/${nextTopic?.slug}`)}
                      variant="outline"
                      size="sm"
                      rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                    >
                      Next Lesson Preview
                    </Button>
                  </div>
                )}
              </Card>
            </section>

            {/* Navigation Footer */}
            <footer className="pt-10 border-t border-slate-900/60 flex justify-between items-center gap-4">
              {prevTopic ? (
                <Button
                  onClick={() => navigate(`/topics/${prevTopic?.slug}`)}
                  variant="outline"
                  size="sm"
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Previous Lesson
                </Button>
              ) : (
                <div className="w-10" />
              )}

              <Button
                onClick={() => navigate('/roadmap')}
                variant="ghost"
                size="sm"
              >
                Roadmap
              </Button>

              {nextTopic ? (
                <Button
                  onClick={() => navigate(`/topics/${nextTopic?.slug}`)}
                  variant="outline"
                  size="sm"
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Next Lesson
                </Button>
              ) : (
                <div className="w-10" />
              )}
            </footer>

          </div>

          {/* Column 3: Progress Tracker (Sticky Sidebar Right 1/4 width) */}
          <aside className="lg:sticky lg:top-22 lg:col-span-1 space-y-4 w-full">
            <Card hoverEffect={false} className="border-slate-850 bg-slate-900/15 p-5 rounded-2xl text-center space-y-4">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                Reading Progress
              </span>
              
              <div className="flex flex-col items-center">
                <span className="text-2xl font-heading font-black text-white">{localProgress}%</span>
                <span className="text-[9px] text-slate-450 uppercase tracking-widest mt-0.5">Read</span>
              </div>

              {/* Status Badge */}
              <div className="py-2.5 border-t border-b border-slate-850/45 w-full flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-500 text-[10px] uppercase tracking-wider">Status</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                  progress.completed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                  localProgress > 0 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25' :
                  'bg-slate-900 text-slate-650 border border-slate-850'
                )}>
                  {progress.completed ? 'Completed' : localProgress > 0 ? 'In Progress' : 'Not Started'}
                </span>
              </div>

              {/* Action Completion Button */}
              {progress.completed ? (
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Lesson Completed
                </div>
              ) : (
                <Button
                  onClick={() => completeMutation.mutate()}
                  isLoading={completeMutation.isPending}
                  variant="primary"
                  size="sm"
                  className="w-full text-xs"
                >
                  Complete Lesson
                </Button>
              )}
            </Card>

            {/* Topic notes panel in sidebar */}
            <Card hoverEffect={false} className="border-slate-850 bg-slate-900/15 p-5 rounded-2xl text-center space-y-4">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                Study Companion
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Jot down key concepts, Java syntax snippets, or interview tips directly inside this topic.
              </p>
              <Button
                onClick={() => setShowNotesDrawer(true)}
                variant="outline"
                size="sm"
                className="w-full text-xs"
                leftIcon={<FileText className="h-4 w-4" />}
              >
                My Lesson Notes
              </Button>
            </Card>

            {/* Spaced Repetition card */}
            <Card hoverEffect={false} className="border-slate-850 bg-slate-900/15 p-5 rounded-2xl text-center space-y-4">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                Revision Scheduler
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Add this topic to your spaced repetition dashboard to trigger reminder alerts.
              </p>
              
              <select
                onChange={(e) => {
                  if (e.target.value === '') return;
                  scheduleTopicRevisionMutation.mutate(parseInt(e.target.value));
                  e.target.value = '';
                }}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer focus:outline-none"
              >
                <option value="">Choose Interval...</option>
                <option value="1">Tomorrow</option>
                <option value="3">In 3 Days</option>
                <option value="7">In 7 Days</option>
                <option value="14">In 14 Days</option>
                <option value="30">In 30 Days</option>
              </select>
            </Card>
          </aside>

        </div>
      </div>

      {/* Spaced repetition slide-in drawer */}
      <AnimatePresence>
        {showNotesDrawer && (
          <>
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setShowNotesDrawer(false)}
            />
            
            {/* Drawer slide-in panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-96 bg-slate-900 border-l border-slate-800 p-6 flex flex-col shadow-2xl h-screen"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-850 pb-4 mb-4 select-none shrink-0">
                <div className="text-left">
                  <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block">Topic Notes Workspace</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {isNoteSaving ? (
                      <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Saving...</span>
                    ) : noteLastSaved ? (
                      <span>Saved {Math.round((new Date().getTime() - noteLastSaved.getTime()) / 1000)}s ago</span>
                    ) : (
                      <span>Changes saved</span>
                    )}
                  </span>
                </div>
                <button
                  onClick={() => setShowNotesDrawer(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                {!topicNote ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <FileText className="h-8 w-8 text-slate-650" />
                    <div className="space-y-1">
                      <h6 className="font-heading font-bold text-slate-350 text-xs">No notes for this topic yet</h6>
                      <p className="text-[10px] text-slate-500">Document study summaries, code patterns, and tips to revise later.</p>
                    </div>
                    <Button
                      onClick={() => createTopicNoteMutation.mutate()}
                      isLoading={createTopicNoteMutation.isPending}
                      variant="primary"
                      size="sm"
                    >
                      Create Notes Sheet
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col h-full overflow-hidden space-y-4 text-left">
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => handleNoteChange('title', e.target.value)}
                      placeholder="Note Title"
                      className="w-full bg-transparent text-sm font-heading font-bold text-white outline-none placeholder:text-slate-700"
                    />

                    <textarea
                      value={noteContent}
                      onChange={(e) => handleNoteChange('content', e.target.value)}
                      placeholder="Type notes (markdown formatting supported)..."
                      className="flex-1 w-full bg-transparent text-xs text-slate-350 leading-relaxed font-mono outline-none resize-none placeholder:text-slate-750"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
