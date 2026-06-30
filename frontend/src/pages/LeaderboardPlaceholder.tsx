import React, { useState } from 'react';
import { 
  Trophy, 
  Users, 
  Globe, 
  GraduationCap, 
  Building, 
  Sparkles 
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { cn } from '../utils/cn';

export const LeaderboardPlaceholder: React.FC = () => {
  const [activeBracket, setActiveBracket] = useState<'friends' | 'global' | 'college' | 'company'>('global');

  const brackets = [
    { id: 'global', name: 'Global Rank', icon: Globe },
    { id: 'friends', name: 'Friends', icon: Users },
    { id: 'college', name: 'College', icon: GraduationCap },
    { id: 'company', name: 'Company', icon: Building }
  ];

  // Dummy leaderboard data to make it look premium and high-fidelity
  const dummyRanks = [
    { rank: 1, name: 'Siddharth Sharma', level: 14, xp: 4850, solved: 184, streak: 42, isCurrentUser: false },
    { rank: 2, name: 'Neha Deshmukh', level: 12, xp: 3920, solved: 142, streak: 18, isCurrentUser: false },
    { rank: 3, name: 'Vikram Aditya', level: 11, xp: 3400, solved: 121, streak: 31, isCurrentUser: false },
    { rank: 4, name: 'You (Priyanka)', level: 3, xp: 850, solved: 21, streak: 5, isCurrentUser: true },
    { rank: 5, name: 'Aman Verma', level: 8, xp: 2200, solved: 76, streak: 0, isCurrentUser: false },
  ];

  return (
    <div className="space-y-8 text-left select-none pb-16">
      
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-2xl md:text-3xl text-white tracking-tight flex items-center gap-2">
          <Trophy className="h-7 w-7 text-indigo-400" /> Competitions Leaderboard
        </h1>
        <p className="text-slate-400 text-xs md:text-sm mt-1">
          Measure your DSA skills against peer groups and global competitors.
        </p>
      </div>

      {/* Bracket Selector Tabs */}
      <div className="flex flex-wrap gap-2 select-none border-b border-slate-850 pb-3">
        {brackets.map((b) => {
          const Icon = b.icon;
          return (
            <button
              key={b.id}
              onClick={() => setActiveBracket(b.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                activeBracket === b.id 
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                  : "bg-slate-900/40 text-slate-500 border-transparent hover:text-slate-350"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{b.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaderboard Table Mock (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <Card hoverEffect={false} className="border-slate-850 bg-slate-900/10 overflow-hidden">
            <div className="p-5 border-b border-slate-850 flex justify-between items-center bg-slate-900/20">
              <span className="text-[10px] font-black text-slate-550 uppercase tracking-widest block">
                {activeBracket.toUpperCase()} STANDINGS
              </span>
              <span className="px-2 py-0.5 rounded text-[8px] bg-slate-850 border border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                Live
              </span>
            </div>

            <div className="divide-y divide-slate-850/50">
              {dummyRanks.map((r) => (
                <div 
                  key={r.rank}
                  className={cn(
                    "flex flex-col sm:flex-row justify-between sm:items-center p-4.5 gap-4 transition-colors",
                    r.isCurrentUser ? "bg-indigo-500/5 border-l-2 border-indigo-500" : "hover:bg-slate-900/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Circle */}
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-mono",
                      r.rank === 1 ? "bg-amber-500/10 text-amber-450 border border-amber-500/20" :
                      r.rank === 2 ? "bg-slate-300/10 text-slate-350 border border-slate-300/25" :
                      r.rank === 3 ? "bg-amber-700/10 text-amber-800 border border-amber-850/20" :
                      "text-slate-500"
                    )}>
                      {r.rank}
                    </span>

                    <div>
                      <span className={cn(
                        "text-xs font-bold block",
                        r.isCurrentUser ? "text-indigo-400" : "text-slate-200"
                      )}>
                        {r.name}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold font-mono">
                        Level {r.level} &bull; {r.xp} XP
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-6 self-end sm:self-center font-mono text-[10px] text-slate-400">
                    <div>
                      <span className="text-[8px] text-slate-550 block font-sans font-black uppercase">Streak</span>
                      <span>{r.streak} days</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-550 block font-sans font-black uppercase">Solved</span>
                      <span>{r.solved} items</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Coming Soon Feature Card (Right Column) */}
        <div className="space-y-6">
          <Card hoverEffect={false} className="border-indigo-500/20 bg-indigo-500/5 p-6 rounded-3xl space-y-4 relative overflow-hidden text-center">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 mx-auto flex items-center justify-center text-indigo-400">
              <Sparkles className="h-5 w-5" />
            </div>

            <div className="space-y-1">
              <h4 className="font-heading font-black text-sm text-slate-200">Rank Competitions Coming Soon</h4>
              <p className="text-[10px] text-slate-450 leading-relaxed">
                Connect with college cohorts, match streaks with friends, or benchmark skills on global leaderboards. Unlock rewards and contest leagues.
              </p>
            </div>
            
            <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400 py-1 bg-indigo-500/10 border border-indigo-500/10 rounded-xl">
              Future Release
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
};
