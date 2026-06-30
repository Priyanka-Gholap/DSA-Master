import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Bookmark, 
  CheckCircle2, 
  Play, 
  Clipboard, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Terminal, 
  Activity, 
  History, 
  Trash2,
  FileText
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';

interface ProblemDetail {
  id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  statement: string;
  constraints: string;
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  explanation: string;
  estimatedTime: string;
  topicId: string;
  topic: { title: string; slug: string };
}

interface UserProblemAttempt {
  status: 'NOT_STARTED' | 'ATTEMPTED' | 'SOLVED';
  bookmarked: boolean;
}

interface SubmissionHistoryItem {
  id: string;
  submittedAt: string;
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR';
  runtime: number | null;
  memory: number | null;
  sourceCode: string;
}

export const ProblemDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Workspace split layout width (percent)
  const [leftWidth, setLeftWidth] = useState(45);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Tab configurations
  const [activeConsoleTab, setActiveConsoleTab] = useState<'input' | 'output'>('input');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'editor' | 'history' | 'notes'>('editor');

  // Problem Notes States
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isNoteSaving, setIsNoteSaving] = useState(false);
  const [noteLastSaved, setNoteLastSaved] = useState<Date | null>(null);
  const autoSaveNoteTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Monaco editor state
  const [code, setCode] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Execution console outputs
  const [customInput, setCustomInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [execResult, setExecResult] = useState<any>(null);

  // Reset confirmation dialog
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  // Fetch Problem Details
  const { data, isLoading, error } = useQuery({
    queryKey: ['problem', slug],
    queryFn: async () => {
      const response = await api.get<{ 
        status: string; 
        data: { problem: ProblemDetail; progress: UserProblemAttempt } 
      }>(`/problems/${slug}`);
      return response.data.data;
    }
  });

  const problem = data?.problem;
  const progress = data?.progress;

  // Load Problem Note
  const { data: problemNote } = useQuery({
    queryKey: ['problem-note', problem?.id],
    queryFn: async () => {
      if (!problem) return null;
      const response = await api.get<{ status: string; data: { notes: any[] } }>('/notes', {
        params: { problemId: problem.id }
      });
      return response.data.data.notes[0] || null;
    },
    enabled: !!problem,
  });

  // Sync problem note inputs when it finishes loading
  useEffect(() => {
    if (problemNote) {
      setNoteTitle(problemNote.title);
      setNoteContent(problemNote.content);
      setNoteLastSaved(new Date(problemNote.updatedAt));
    }
  }, [problemNote]);

  // Create Problem Note Mutation
  const createProblemNoteMutation = useMutation({
    mutationFn: async () => {
      if (!problem) return;
      const response = await api.post<{ status: string; data: { note: any } }>('/notes', {
        title: `Notes: ${problem.title}`,
        content: '# Problem Strategy\n- Approach:\n- Tricks:\n- Observations:',
        problemId: problem.id
      });
      return response.data.data.note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problem-note', problem?.id] });
      toast('Note worksheet initialized!', 'success');
    }
  });

  // Update Problem Note Mutation
  const updateProblemNoteMutation = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      if (!problemNote) return;
      setIsNoteSaving(true);
      await api.put(`/notes/${problemNote.id}`, { title, content });
    },
    onSuccess: () => {
      setNoteLastSaved(new Date());
      setIsNoteSaving(false);
      queryClient.invalidateQueries({ queryKey: ['problem-note', problem?.id] });
    },
    onError: () => {
      setIsNoteSaving(false);
      toast('Failed to save notes changes.', 'error');
    }
  });

  const handleNoteChange = (field: 'title' | 'content', val: string) => {
    if (field === 'title') setNoteTitle(val);
    else setNoteContent(val);

    if (!problemNote) return;

    if (autoSaveNoteTimerRef.current) {
      clearTimeout(autoSaveNoteTimerRef.current);
    }

    autoSaveNoteTimerRef.current = setTimeout(() => {
      updateProblemNoteMutation.mutate({
        title: field === 'title' ? val : noteTitle,
        content: field === 'content' ? val : noteContent
      });
    }, 1500);
  };

  // Load Saved Draft Code
  const { data: draftData } = useQuery({
    queryKey: ['draft-code', problem?.id],
    queryFn: async () => {
      if (!problem) return null;
      const response = await api.get<{ status: string; data: { draft: { sourceCode: string } | null } }>(
        `/problems/${problem.id}/code`
      );
      return response.data.data.draft;
    },
    enabled: !!problem,
  });

  // Load Submission History
  const { data: historyData } = useQuery({
    queryKey: ['submissions-history', problem?.id],
    queryFn: async () => {
      if (!problem) return [];
      const response = await api.get<{ status: string; data: { submissions: SubmissionHistoryItem[] } }>(
        `/problems/${problem.id}/submissions`
      );
      return response.data.data.submissions;
    },
    enabled: !!problem,
  });

  // Default Java code template
  const defaultTemplate = `import java.util.*;\n\npublic class Solution {\n    public int solve(int[] nums, int target) {\n        // Write your Java solution here\n        return -1;\n    }\n}`;

  // Initialize Code editor (Saved Draft -> Default template)
  useEffect(() => {
    if (draftData?.sourceCode) {
      setCode(draftData.sourceCode);
      setLastSaved(new Date());
    } else if (problem) {
      setCode(defaultTemplate);
      setCustomInput(problem.sampleInput);
    }
  }, [draftData, problem]);

  // Drag Divider Split Pane handler
  const handleMouseDown = () => {
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth > 25 && newWidth < 75) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Save draft code mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (sourceCode: string) => {
      if (!problem) return;
      setIsSaving(true);
      await api.post(`/problems/${problem.id}/code`, { sourceCode });
    },
    onSuccess: () => {
      setLastSaved(new Date());
      setIsSaving(false);
    },
    onError: () => {
      setIsSaving(false);
      toast('Failed to auto-save draft code.', 'error');
    }
  });

  // Handle Monaco code changes (Debounced Auto Save)
  const handleCodeChange = (val: string | undefined) => {
    const value = val || '';
    setCode(value);

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveDraftMutation.mutate(value);
    }, 1500); // 1.5 seconds debounce
  };

  // Run Code mutation
  const runCodeMutation = useMutation({
    mutationFn: async () => {
      if (!problem) return;
      setIsRunning(true);
      setActiveConsoleTab('output');
      const response = await api.post(`/problems/${problem.id}/run`, {
        sourceCode: code,
        input: customInput
      });
      return response.data.data.result;
    },
    onSuccess: (result) => {
      setIsRunning(false);
      setExecResult(result);
    },
    onError: () => {
      setIsRunning(false);
      toast('Failed to execute test run.', 'error');
    }
  });

  // Submit Code mutation
  const submitCodeMutation = useMutation({
    mutationFn: async () => {
      if (!problem) return;
      setIsSubmitting(true);
      setActiveConsoleTab('output');
      const response = await api.post(`/problems/${problem.id}/submit`, {
        sourceCode: code
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      setIsSubmitting(false);
      setExecResult(data.result);
      queryClient.invalidateQueries({ queryKey: ['problem', slug] });
      queryClient.invalidateQueries({ queryKey: ['submissions-history', problem?.id] });
      queryClient.invalidateQueries({ queryKey: ['practice-progress'] });
      queryClient.invalidateQueries({ queryKey: ['continue-solving'] });

      if (data.result.status === 'ACCEPTED') {
        setShowCelebration(true);
      } else {
        toast(`Submission failed with status: ${data.result.status}`, 'error');
      }
    },
    onError: () => {
      setIsSubmitting(false);
      toast('Failed to submit code.', 'error');
    }
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async (bookmarked: boolean) => {
      if (!problem) return;
      await api.put(`/problems/${problem.id}/bookmark`, { bookmarked });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['problem', slug] });
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      queryClient.invalidateQueries({ queryKey: ['practice-progress'] });
      toast(variables ? 'Problem bookmarked!' : 'Bookmark removed.', 'info');
    }
  });

  // Schedule Revision Mutation
  const scheduleRevisionMutation = useMutation({
    mutationFn: async (days: number) => {
      if (!problem) return;
      await api.post('/revisions', {
        problemId: problem.id,
        days
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisions-all'] });
      queryClient.invalidateQueries({ queryKey: ['revisions-today'] });
      toast('Revision scheduled successfully!', 'success');
    }
  });

  // Delete submission history mutation
  const deleteSubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      await api.delete(`/problems/submissions/${submissionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions-history', problem?.id] });
      toast('Submission record deleted.', 'info');
    }
  });

  // Reset editor template
  const handleResetCode = () => {
    setCode(defaultTemplate);
    saveDraftMutation.mutate(defaultTemplate);
    setShowResetConfirm(false);
    toast('Code editor has been reset.', 'info');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 select-none text-left py-8">
        <div className="h-6 bg-slate-900/40 rounded w-16 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
          <div className="bg-slate-900/45 border border-slate-850 rounded-2xl animate-pulse" />
          <div className="bg-slate-900/45 border border-slate-850 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !problem || !progress) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-4">
        <h3 className="font-heading font-bold text-lg text-white">Problem not found</h3>
        <p className="text-slate-400 text-xs">Verify your database connections.</p>
        <Button onClick={() => navigate('/practice')} variant="primary">
          Back to Practice Hub
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left select-none pb-8 h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      
      {/* Celebration Popup Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="max-w-md w-full glass-card border border-emerald-500/20 bg-slate-900 p-8 rounded-3xl text-center space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 className="h-9 w-9 animate-bounce text-emerald-400" />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-heading font-black text-2xl text-white">Submission Accepted!</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                  Excellent job! Your code compiled, ran against all test suites, and solved <strong>{problem.title}</strong> successfully.
                </p>
                {execResult && (
                  <div className="flex justify-center gap-6 pt-3 text-xs font-mono text-slate-350">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-sans font-bold">Runtime</span>
                      <span className="text-emerald-400 font-bold">{execResult.runtime} ms</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-sans font-bold">Memory</span>
                      <span className="text-emerald-400 font-bold">{Math.round((execResult.memory || 0) / 1024)} MB</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button 
                  onClick={() => {
                    setShowCelebration(false);
                    navigate('/practice');
                  }} 
                  variant="primary" 
                  className="w-full"
                >
                  Back to Practice Hub
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Reset Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-sm w-full glass-card border border-slate-800 bg-slate-900 p-6 rounded-2xl text-left space-y-4">
              <h4 className="font-heading font-bold text-base text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                Reset Code Template?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                This will delete your draft and restore the default Java method signature. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <Button onClick={() => setShowResetConfirm(false)} variant="ghost" size="sm">
                  Cancel
                </Button>
                <Button onClick={handleResetCode} variant="danger" size="sm">
                  Reset Code
                </Button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Header toolbar */}
      <div className="flex justify-between items-center px-2 shrink-0">
        <Link
          to="/practice"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Practice Arena
        </Link>

        {/* Auto save HUD info */}
        <div className="flex items-center gap-3 text-[10px] text-slate-550 font-semibold">
          {isSaving ? (
            <span className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" /> Saving...
            </span>
          ) : lastSaved ? (
            <span>Last saved {Math.round((new Date().getTime() - lastSaved.getTime()) / 1000)}s ago</span>
          ) : (
            <span>No draft saved</span>
          )}

          <div className="flex gap-2 items-center">
            <button
              onClick={() => bookmarkMutation.mutate(!progress.bookmarked)}
              className={cn(
                "p-1.5 rounded-lg border transition-colors cursor-pointer",
                progress.bookmarked 
                  ? "bg-rose-500/10 text-rose-500 border-rose-500/15"
                  : "bg-transparent text-slate-500 border-slate-800 hover:text-slate-200"
              )}
              title={progress.bookmarked ? 'Remove bookmark' : 'Bookmark problem'}
            >
              <Bookmark className={cn("h-3.5 w-3.5", progress.bookmarked && "fill-current")} />
            </button>
            
            <select
              onChange={(e) => {
                if (e.target.value === '') return;
                scheduleRevisionMutation.mutate(parseInt(e.target.value));
                e.target.value = '';
              }}
              className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-white cursor-pointer focus:outline-none"
            >
              <option value="">Schedule Revision</option>
              <option value="1">Tomorrow</option>
              <option value="3">In 3 Days</option>
              <option value="7">In 7 Days</option>
              <option value="14">In 14 Days</option>
              <option value="30">In 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resizable Double-Pane Workspace (SplitPane) */}
      <div 
        ref={containerRef}
        className="flex-1 flex flex-col lg:flex-row gap-0.5 border border-slate-850 rounded-2xl overflow-hidden bg-slate-950/60 shadow-xl"
      >
        
        {/* Left Pane: Statements & History Tabs */}
        <div 
          className="flex flex-col h-full bg-slate-900/10"
          style={{ width: `${leftWidth}%` }}
        >
          {/* Workspace description tab header */}
          <div className="flex border-b border-slate-900 bg-slate-900/35 select-none shrink-0">
            <button
              onClick={() => setActiveWorkspaceTab('editor')}
              className={cn(
                "px-4.5 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer",
                activeWorkspaceTab === 'editor' 
                  ? "text-indigo-400 border-indigo-500" 
                  : "text-slate-500 border-transparent hover:text-slate-350"
              )}
            >
              Description
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('history')}
              className={cn(
                "px-4.5 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                activeWorkspaceTab === 'history' 
                  ? "text-indigo-400 border-indigo-500" 
                  : "text-slate-500 border-transparent hover:text-slate-350"
              )}
            >
              Submissions ({historyData?.length || 0})
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('notes')}
              className={cn(
                "px-4.5 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                activeWorkspaceTab === 'notes' 
                  ? "text-indigo-400 border-indigo-500" 
                  : "text-slate-500 border-transparent hover:text-slate-350"
              )}
            >
              My Notes
            </button>
          </div>

          {/* Description Pane Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {activeWorkspaceTab === 'editor' ? (
              <>
                {/* Title */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border",
                      problem.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15' :
                      problem.difficulty === 'Medium' ? 'text-amber-450 bg-amber-500/10 border-amber-550/15' :
                      'text-rose-450 bg-rose-500/10 border-rose-500/15'
                    )}>
                      {problem.difficulty}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {problem.topic.title}
                    </span>
                  </div>
                  <h3 className="font-heading font-black text-xl text-white tracking-tight">
                    {problem.title}
                  </h3>
                </div>

                {/* Problem Statement */}
                <div className="space-y-2 text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/20 p-4 rounded-xl border border-slate-850/40">
                  {problem.statement}
                </div>

                {/* Constraints */}
                <div className="space-y-2">
                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Constraints</h5>
                  <pre className="font-mono text-[10px] text-indigo-350 bg-slate-950/30 p-3 rounded-xl border border-indigo-500/10 leading-relaxed">
                    {problem.constraints}
                  </pre>
                </div>

                {/* Input Format */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Input Format</span>
                  <p className="text-xs text-slate-400 bg-slate-900/20 p-3 rounded-lg border border-slate-850/60 leading-relaxed">
                    {problem.inputFormat}
                  </p>
                </div>

                {/* Output Format */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Output Format</span>
                  <p className="text-xs text-slate-400 bg-slate-900/20 p-3 rounded-lg border border-slate-850/60 leading-relaxed">
                    {problem.outputFormat}
                  </p>
                </div>

                {/* Sample cases */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Sample Input</span>
                      <button
                        onClick={() => copyToClipboard(problem.sampleInput, 'in-sample')}
                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-350 transition-colors"
                      >
                        {copiedStates['in-sample'] ? <Check className="h-3 w-3 text-emerald-450" /> : <Clipboard className="h-3 w-3" />}
                      </button>
                    </div>
                    <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[10px] text-slate-300 border border-slate-900 overflow-x-auto">
                      {problem.sampleInput}
                    </pre>
                  </div>
                  <div className="space-y-1.5 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Sample Output</span>
                      <button
                        onClick={() => copyToClipboard(problem.sampleOutput, 'out-sample')}
                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-350 transition-colors"
                      >
                        {copiedStates['out-sample'] ? <Check className="h-3 w-3 text-emerald-450" /> : <Clipboard className="h-3 w-3" />}
                      </button>
                    </div>
                    <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[10px] text-slate-300 border border-slate-900 overflow-x-auto">
                      {problem.sampleOutput}
                    </pre>
                  </div>
                </div>
              </>
            ) : activeWorkspaceTab === 'history' ? (
              // Submission History list
              <div className="space-y-4">
                {historyData && historyData.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <History className="h-8 w-8 text-slate-650 mx-auto mb-2" />
                    <h6 className="font-heading font-bold text-slate-450 text-xs">No Submissions Found</h6>
                    <p className="text-[10px] text-slate-500 mt-0.5">Submit your Java solution code to trace compilation state histories.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyData?.map((sub) => {
                      const isAcc = sub.status === 'ACCEPTED';
                      return (
                        <div 
                          key={sub.id}
                          className="p-4 rounded-xl border border-slate-850 bg-slate-900/10 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-800 transition-colors"
                        >
                          <div className="space-y-1.5 text-left">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border",
                                isAcc ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' : 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                              )}>
                                {sub.status.replace('_', ' ')}
                              </span>
                              <span className="text-[9px] text-slate-500 font-semibold font-mono">
                                {new Date(sub.submittedAt).toLocaleTimeString()}
                              </span>
                            </div>
                            
                            <div className="flex gap-4 font-mono text-[10px] text-slate-400">
                              <span>Time: {sub.runtime || 0} ms</span>
                              <span>Mem: {Math.round((sub.memory || 0) / 1024)} MB</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <Button
                              onClick={() => {
                                setCode(sub.sourceCode);
                                setActiveWorkspaceTab('editor');
                                toast('Loaded submission code into workspace.', 'info');
                              }}
                              variant="outline"
                              size="sm"
                              className="text-[10px] py-1 px-2.5 h-auto"
                            >
                              Load Code
                            </Button>
                            <button
                              onClick={() => deleteSubmissionMutation.mutate(sub.id)}
                              className="p-1.5 rounded-lg border border-transparent text-slate-550 hover:text-rose-400 hover:bg-rose-500/5 transition-colors cursor-pointer"
                              title="Delete submission record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // Notes tab editor workspace
              <div className="space-y-4 h-full flex flex-col">
                {!problemNote ? (
                  <div className="py-12 text-center text-slate-550 flex flex-col items-center justify-center h-full space-y-4">
                    <FileText className="h-8 w-8 text-slate-650" />
                    <div className="space-y-1">
                      <h6 className="font-heading font-bold text-slate-300 text-xs">No notes for this problem</h6>
                      <p className="text-[10px] text-slate-550">Create a worksheet to jot down approaches, optimal layouts, and edge cases.</p>
                    </div>
                    <Button 
                      onClick={() => createProblemNoteMutation.mutate()} 
                      isLoading={createProblemNoteMutation.isPending}
                      variant="primary" 
                      size="sm"
                    >
                      Create Note
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col h-full overflow-hidden space-y-4 text-left">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                      <span className="text-[10px] font-semibold text-slate-550">
                        {isNoteSaving ? (
                          <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Saving...</span>
                        ) : noteLastSaved ? (
                          <span>Saved {Math.round((new Date().getTime() - noteLastSaved.getTime()) / 1000)}s ago</span>
                        ) : (
                          <span>Changes auto-saved</span>
                        )}
                      </span>
                    </div>

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
                      placeholder="Jot down notes (supports markdown format)..."
                      className="flex-1 w-full bg-transparent text-xs text-slate-350 leading-relaxed font-mono outline-none resize-none placeholder:text-slate-750"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Drag Resizing handle bar */}
        <div 
          onMouseDown={handleMouseDown}
          className="hidden lg:block w-1 hover:w-1.5 bg-slate-900 hover:bg-indigo-500/50 cursor-col-resize self-stretch transition-all duration-150 shrink-0" 
        />

        {/* Right Pane: Monaco Editor & Console Tabs */}
        <div 
          className="flex-1 flex flex-col h-full bg-slate-950/40 min-w-0"
        >
          
          {/* Code Editor Body */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            {/* Editor Action buttons */}
            <div className="absolute top-2 right-4 z-10 flex gap-2">
              <Button
                onClick={() => setShowResetConfirm(true)}
                variant="outline"
                size="sm"
                className="text-[10px] py-1.5 px-3 h-auto bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border-slate-850"
              >
                Reset
              </Button>
            </div>

            <Editor
              height="100%"
              defaultLanguage="java"
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
                bracketPairColorization: { enabled: true }
              }}
            />
          </div>

          {/* Console Output Workspace Drawer */}
          <div className="h-64 border-t border-slate-900 flex flex-col bg-slate-950 shrink-0 min-h-0">
            {/* Console Tab header */}
            <div className="flex border-b border-slate-900 bg-slate-900/60 select-none shrink-0 px-2 justify-between items-center">
              <div className="flex">
                <button
                  onClick={() => setActiveConsoleTab('input')}
                  className={cn(
                    "px-4.5 py-2.5 text-[9px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                    activeConsoleTab === 'input' 
                      ? "text-indigo-400 border-indigo-500" 
                      : "text-slate-500 border-transparent hover:text-slate-350"
                  )}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  Custom Testcase
                </button>
                <button
                  onClick={() => setActiveConsoleTab('output')}
                  className={cn(
                    "px-4.5 py-2.5 text-[9px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                    activeConsoleTab === 'output' 
                      ? "text-indigo-400 border-indigo-500" 
                      : "text-slate-500 border-transparent hover:text-slate-350"
                  )}
                >
                  <Activity className="h-3.5 w-3.5" />
                  Console Output
                </button>
              </div>

              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest pr-3">
                IDE Terminal
              </span>
            </div>

            {/* Console Pane Area */}
            <div className="flex-1 overflow-y-auto p-4 flex">
              {activeConsoleTab === 'input' ? (
                <div className="w-full flex flex-col space-y-2 h-full text-left">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Test Input</span>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Provide variables parameters inputs..."
                    className="flex-1 w-full bg-slate-950/80 border border-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 outline-none focus:border-indigo-500 resize-none h-full shadow-inner"
                  />
                </div>
              ) : (
                // Output results console
                <div className="w-full h-full text-left flex flex-col">
                  {isRunning || isSubmitting ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-3.5">
                      <RefreshCw className="h-6 w-6 text-indigo-500 animate-spin" />
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {isSubmitting ? 'Evaluating Submission...' : 'Running compiler tests...'}
                      </span>
                    </div>
                  ) : execResult ? (
                    <div className="flex-1 space-y-4">
                      {/* Metric row summary */}
                      <div className="flex flex-wrap gap-4 items-center justify-between border-b border-slate-900/60 pb-3">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border",
                            execResult.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' :
                            execResult.status === 'WRONG_ANSWER' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          )}>
                            {execResult.status.replace('_', ' ')}
                          </span>

                          <span className="text-[9px] font-bold text-slate-500">
                            Time: <span className="font-mono text-slate-300">{execResult.runtime || 0} ms</span>
                          </span>

                          <span className="text-[9px] font-bold text-slate-500">
                            Memory: <span className="font-mono text-slate-300">{Math.round((execResult.memory || 0) / 1024)} MB</span>
                          </span>
                        </div>
                      </div>

                      {/* Output stack stdout / stderr */}
                      <div className="font-mono text-xs leading-relaxed space-y-3">
                        {execResult.compileError ? (
                          <pre className="text-rose-400 bg-rose-500/5 p-3 rounded-lg border border-rose-500/15 overflow-x-auto max-h-[140px]">
                            {execResult.compileError}
                          </pre>
                        ) : execResult.stderr ? (
                          <pre className="text-rose-450 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10 overflow-x-auto max-h-[140px]">
                            {execResult.stderr}
                          </pre>
                        ) : (
                          <div className="space-y-2">
                            <span className="text-[9px] text-slate-550 font-bold uppercase tracking-wider block">Standard Output</span>
                            <pre className="text-emerald-400 bg-slate-950 p-3 rounded-lg border border-slate-900 overflow-x-auto max-h-[120px]">
                              {execResult.stdout || 'Program executed successfully with no stdout.'}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center">
                      <Terminal className="h-6 w-6 text-slate-650 mb-1.5" />
                      <h6 className="font-heading font-bold text-slate-450 text-xs">Terminal Standby</h6>
                      <p className="text-[10px] text-slate-500 mt-0.5">Click 'Run Code' or 'Submit' to output compilation outputs.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Run / Submit buttons toolbar footer */}
            <div className="border-t border-slate-900 bg-slate-900/40 p-3.5 flex justify-end gap-3 shrink-0">
              <Button
                onClick={() => runCodeMutation.mutate()}
                isLoading={isRunning}
                disabled={isRunning || isSubmitting}
                variant="outline"
                size="sm"
                className="text-xs"
                leftIcon={<Play className="h-3.5 w-3.5" />}
              >
                Run Code
              </Button>
              
              <Button
                onClick={() => submitCodeMutation.mutate()}
                isLoading={isSubmitting}
                disabled={isRunning || isSubmitting}
                variant="primary"
                size="sm"
                className="text-xs px-4"
              >
                Submit
              </Button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
