import React, { useState } from 'react';
import { Copy, Check, Lightbulb, AlertTriangle, Play, Briefcase } from 'lucide-react';
import { cn } from '../../utils/cn';

// Helper to highlight Java keywords
const highlightJavaCode = (code: string) => {
  const keywords = /\b(public|protected|private|class|interface|new|return|int|void|boolean|char|double|float|long|short|for|while|if|else|switch|case|break|continue|static|final|this|super|null|import|package|extends|implements|throw|try|catch|finally)\b/g;
  const strings = /(["'])(?:(?=(\\?))\2.)*?\1/g;
  const comments = /(\/\/.*|\/\*[\s\S]*?\*\/)/g;
  const numbers = /\b(\d+)\b/g;
  const annotations = /(@\w+)/g;

  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Apply colors inside HTML
  highlighted = highlighted.replace(comments, '<span class="text-slate-500 font-normal italic">$1</span>');
  highlighted = highlighted.replace(strings, '<span class="text-amber-300">$1</span>');
  
  // Temporarily bypass HTML tags to avoid breaking spans
  highlighted = highlighted.replace(keywords, '<span class="text-indigo-400 font-semibold">$1</span>');
  highlighted = highlighted.replace(numbers, '<span class="text-sky-400">$1</span>');
  highlighted = highlighted.replace(annotations, '<span class="text-violet-400">$1</span>');

  return highlighted;
};

interface CodeBlockProps {
  title: string;
  code: string;
  language: string;
}

export const SyntaxCodeBlock: React.FC<CodeBlockProps> = ({ title, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split('\n');

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl relative text-left">
      {/* Header bar */}
      <div className="flex justify-between items-center px-4.5 py-3 border-b border-slate-900 bg-slate-900/50">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
          </span>
          {title}
        </span>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Copy Code"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-450" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Code Area */}
      <div className="p-4 overflow-x-auto flex font-mono text-xs leading-relaxed bg-slate-950/80">
        {/* Line Numbers */}
        <div className="select-none pr-4.5 text-right text-slate-650 border-r border-slate-900/60 font-semibold">
          {lines.map((_, idx) => (
            <div key={idx}>{idx + 1}</div>
          ))}
        </div>
        {/* Code Content */}
        <pre className="pl-4.5 text-slate-200">
          <code dangerouslySetInnerHTML={{ __html: highlightJavaCode(code.trim()) }} />
        </pre>
      </div>
    </div>
  );
};

// Operation Complexity Table
interface ComplexityRow {
  operation: string;
  best: string;
  average: string;
  worst: string;
  space: string;
}

interface ComplexityTableProps {
  operations: ComplexityRow[];
}

export const ComplexityTable: React.FC<ComplexityTableProps> = ({ operations }) => {
  const getBadgeClass = (complexity: string) => {
    const clean = complexity.replace(/\s/g, '').toLowerCase();
    if (clean === 'o(1)') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (clean === 'o(logn)') return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    if (clean === 'o(n)') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    return 'bg-rose-500/10 text-rose-450 border border-rose-500/20';
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/10 overflow-hidden shadow-sm text-left">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-850 text-slate-500 uppercase tracking-widest text-[9px] font-black bg-slate-900/35">
              <th className="py-3 px-4">Operation</th>
              <th className="py-3 px-4">Best Case</th>
              <th className="py-3 px-4">Average Case</th>
              <th className="py-3 px-4">Worst Case</th>
              <th className="py-3 px-4">Space Complexity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/40">
            {operations.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-900/20 text-slate-350">
                <td className="py-3.5 px-4 font-semibold text-slate-200">{row.operation}</td>
                <td className="py-3.5 px-4">
                  <span className={cn("px-2 py-0.5 rounded font-mono text-[10px]", getBadgeClass(row.best))}>
                    {row.best}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className={cn("px-2 py-0.5 rounded font-mono text-[10px]", getBadgeClass(row.average))}>
                    {row.average}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className={cn("px-2 py-0.5 rounded font-mono text-[10px]", getBadgeClass(row.worst))}>
                    {row.worst}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-450">{row.space}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Warning block Card
export const WarningCard: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="flex gap-4 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-left text-rose-250">
    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex-shrink-0 h-10 w-10 flex items-center justify-center text-rose-400">
      <AlertTriangle className="h-5 w-5" />
    </div>
    <div className="space-y-0.5">
      <h5 className="font-heading font-bold text-xs text-white uppercase tracking-wider">{title}</h5>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
    </div>
  </div>
);

// Pro-tip Card
export const TipCard: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="flex gap-4 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-left text-indigo-250">
    <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex-shrink-0 h-10 w-10 flex items-center justify-center text-indigo-400">
      <Lightbulb className="h-5 w-5" />
    </div>
    <div className="space-y-0.5">
      <h5 className="font-heading font-bold text-xs text-white uppercase tracking-wider">{title}</h5>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
    </div>
  </div>
);

// Dry Run step visualization
interface DryRunStep {
  index: string;
  pointer: string;
  value: string;
  comment: string;
}

interface DryRunFlowProps {
  title: string;
  steps: DryRunStep[];
}

export const DryRunFlow: React.FC<DryRunFlowProps> = ({ title, steps }) => {
  return (
    <div className="space-y-4 text-left">
      <h4 className="font-heading font-bold text-sm text-slate-350 flex items-center gap-2">
        <Play className="h-4.5 w-4.5 text-indigo-400 fill-indigo-400/20" />
        Dry Run: {title}
      </h4>

      <div className="flex flex-col gap-4 relative pl-3.5 border-l-2 border-indigo-500/15">
        {steps.map((step, idx) => (
          <div key={idx} className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 bg-slate-900/20 p-4 rounded-xl border border-slate-850/80">
            {/* Step Marker Badge */}
            <div className="absolute -left-7 top-4 h-6 w-6 rounded-full bg-indigo-650 border border-indigo-500 text-[10px] font-black text-white flex items-center justify-center shadow-md">
              {idx + 1}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-850 text-slate-400 uppercase tracking-widest font-black">
                  State: {step.index}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 uppercase tracking-widest font-black">
                  Action: {step.pointer}
                </span>
              </div>
              <p className="text-xs text-slate-400">{step.comment}</p>
            </div>

            <div className="py-2.5 px-4 rounded-xl bg-slate-950 font-mono text-[10px] text-indigo-350 border border-slate-900 self-stretch shrink-0 flex items-center justify-center min-w-[140px]">
              {step.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Real-world Application Card
export const ApplicationCard: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="flex gap-4 p-4.5 rounded-xl border border-slate-800/80 bg-slate-900/15 text-left relative overflow-hidden transition-all duration-300 hover:border-indigo-500/25">
    <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex-shrink-0 h-11 w-11 flex items-center justify-center text-indigo-400">
      <Briefcase className="h-5 w-5" />
    </div>
    <div className="space-y-1">
      <h5 className="font-heading font-bold text-xs text-slate-200">{title}</h5>
      <p className="text-[11px] text-slate-450 leading-relaxed">{description}</p>
    </div>
  </div>
);
