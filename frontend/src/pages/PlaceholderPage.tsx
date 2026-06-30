import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Map, 
  BookOpen, 
  Code, 
  History, 
  BarChart2, 
  Bot, 
  Bookmark,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';

export const PlaceholderPage: React.FC = () => {
  const location = useLocation();

  const getPageDetails = () => {
    switch (location.pathname) {
      case '/roadmap':
        return {
          title: 'Interactive Java DSA Roadmap',
          desc: 'A visual, branching learning pathway tailored to your experience. Drag nodes, track completion, and lock in concepts step-by-step.',
          icon: <Map className="h-10 w-10 text-indigo-400" />,
          phase: 'Phase 2',
        };
      case '/topics':
        return {
          title: 'Structured DSA Topics',
          desc: 'Complete text, animation-traced slides, and Java reference implementations for basic to advanced data structures and algorithms.',
          icon: <BookOpen className="h-10 w-10 text-violet-400" />,
          phase: 'Phase 2',
        };
      case '/practice':
        return {
          title: 'Smart Practice Board',
          desc: 'Our interactive compiler sandbox where you write, debug, and execute Java code directly against standard collections of DSA challenges.',
          icon: <Code className="h-10 w-10 text-pink-400" />,
          phase: 'Phase 3',
        };
      case '/revision':
        return {
          title: 'Revision Planner',
          desc: 'Spaced repetition engine designed to schedule topic reviews at optimized forgetting curves, boosting cognitive retention.',
          icon: <History className="h-10 w-10 text-amber-400" />,
          phase: 'Phase 3',
        };
      case '/analytics':
        return {
          title: 'Performance & Progress Analytics',
          desc: 'Detailed graphs tracking completion speed, category accuracy, compilation failures, and study time metrics.',
          icon: <BarChart2 className="h-10 w-10 text-teal-400" />,
          phase: 'Phase 4',
        };
      case '/ai-mentor':
        return {
          title: 'AI Personal Mentor',
          desc: 'Chat directly with our LLM-backed Java companion. Get code feedback, complexity walkthroughs, and conceptual explanations.',
          icon: <Bot className="h-10 w-10 text-indigo-450" />,
          phase: 'Phase 4',
        };
      case '/bookmarks':
        return {
          title: 'Bookmarked Solutions',
          desc: 'Easily save problems, code snippets, notes, and study cards to reference later in custom revisions folders.',
          icon: <Bookmark className="h-10 w-10 text-purple-400" />,
          phase: 'Phase 2',
        };
      default:
        return {
          title: 'Module Coming Soon',
          desc: 'We are currently crafting this feature. It will unlock in an upcoming release cycle.',
          icon: <Sparkles className="h-10 w-10 text-amber-450" />,
          phase: 'Future Release',
        };
    }
  };

  const details = getPageDetails();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 relative select-none">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card hoverEffect={false} className="border-slate-800 bg-slate-900/30 overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-indigo-500/20 via-indigo-500/40 to-indigo-500/20" />
          <CardContent className="pt-8 pb-10 px-6 space-y-6 flex flex-col items-center">
            {/* Visual Icon Badge */}
            <div className="h-20 w-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg relative">
              {details.icon}
              <div className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-md bg-indigo-550 border border-indigo-450 text-[9px] font-black tracking-widest text-white uppercase shadow-sm">
                {details.phase}
              </div>
            </div>

            {/* Title & Desc */}
            <div className="space-y-2">
              <h3 className="font-heading font-black text-xl text-white tracking-tight">{details.title}</h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{details.desc}</p>
            </div>

            {/* Under Construction Banner */}
            <div className="w-full py-2.5 px-4 rounded-xl bg-slate-950/60 border border-slate-900 flex items-center justify-center gap-2 text-[10px] font-bold tracking-wider text-slate-550 uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Under Active Development
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
