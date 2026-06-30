import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Pin, 
  Archive, 
  Trash2, 
  Plus, 
  Loader2, 
  BookOpen, 
  FileText, 
  CheckSquare, 
  Code, 
  Heading1, 
  List, 
  Bold, 
  Italic, 
  Quote, 
  FolderOpen
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { cn } from '../utils/cn';

interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  archived: boolean;
  topicId: string | null;
  problemId: string | null;
  createdAt: string;
  updatedAt: string;
  topic?: { title: string; slug: string };
  problem?: { title: string; slug: string };
}

export const NotesPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pinned' | 'archived'>('all');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Note editor inputs
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Fetch Notes
  const { data: notesData, isLoading } = useQuery<{ notes: Note[] }>({
    queryKey: ['notes', search, activeTab],
    queryFn: async () => {
      const isPinned = activeTab === 'pinned' ? 'true' : undefined;
      const isArchived = activeTab === 'archived' ? 'true' : 'false';
      const response = await api.get<{ status: string; data: { notes: Note[] } }>('/notes', {
        params: {
          search: search || undefined,
          pinned: isPinned,
          archived: isArchived
        }
      });
      return response.data.data;
    }
  });

  const notes = notesData?.notes || [];

  // Find currently active note
  const activeNote = notes.find(n => n.id === selectedNoteId);

  // Update inputs when active note changes
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
      setLastSaved(new Date(activeNote.updatedAt));
    } else if (notes.length > 0 && !selectedNoteId) {
      // Auto-select first note if none is chosen
      setSelectedNoteId(notes[0].id);
    }
  }, [selectedNoteId, activeNote, notes]);

  // Create Note mutation
  const createNoteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<{ status: string; data: { note: Note } }>('/notes', {
        title: 'New DSA Concept Note',
        content: '# New Concept\nWrite down observations or approaches here...'
      });
      return response.data.data.note;
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setSelectedNoteId(newNote.id);
      toast('Note created successfully!', 'success');
    }
  });

  // Update Note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      setIsSaving(true);
      await api.put(`/notes/${id}`, { title, content });
    },
    onSuccess: () => {
      setLastSaved(new Date());
      setIsSaving(false);
      // Invalidate note list silently
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: () => {
      setIsSaving(false);
      toast('Failed to auto-save note.', 'error');
    }
  });

  // Debounced auto-save handler
  const handleInputChange = (field: 'title' | 'content', val: string) => {
    if (field === 'title') {
      setTitle(val);
    } else {
      setContent(val);
    }

    if (!selectedNoteId) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      updateNoteMutation.mutate({
        id: selectedNoteId,
        title: field === 'title' ? val : title,
        content: field === 'content' ? val : content
      });
    }, 1500); // 1.5 seconds debounce
  };

  // Toggle Pin Note
  const pinMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/notes/${id}/pin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast('Note pin state toggled.', 'info');
    }
  });

  // Toggle Archive Note
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/notes/${id}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setSelectedNoteId(null);
      toast('Note archive state toggled.', 'info');
    }
  });

  // Delete Note
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setSelectedNoteId(null);
      toast('Note deleted permanently.', 'info');
    }
  });

  // Insert markdown helpers inside text area
  const insertMarkdown = (syntax: string) => {
    if (!contentRef.current) return;
    const txtArea = contentRef.current;
    const start = txtArea.selectionStart;
    const end = txtArea.selectionEnd;
    const text = txtArea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const selected = text.substring(start, end);

    let replacement = '';
    if (syntax === 'bold') replacement = `**${selected || 'bold text'}**`;
    else if (syntax === 'italic') replacement = `*${selected || 'italic text'}*`;
    else if (syntax === 'code') replacement = `\`\`\`java\n${selected || '// Write Java code here'}\n\`\`\``;
    else if (syntax === 'list') replacement = `\n- ${selected || 'list item'}`;
    else if (syntax === 'checklist') replacement = `\n- [ ] ${selected || 'todo task'}`;
    else if (syntax === 'heading') replacement = `\n# ${selected || 'Heading'}`;
    else if (syntax === 'quote') replacement = `\n> ${selected || 'Blockquote'}`;

    const newContent = before + replacement + after;
    setContent(newContent);
    handleInputChange('content', newContent);

    // Reset cursor position
    setTimeout(() => {
      txtArea.focus();
      const newCursorPos = start + replacement.length;
      txtArea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] border border-slate-850 rounded-2xl overflow-hidden bg-slate-950/40 text-left">
      
      {/* 1. Left Sidebar: Notes Navigator List */}
      <div className="w-full md:w-80 border-r border-slate-850 flex flex-col bg-slate-900/10 shrink-0">
        
        {/* Header Search Area */}
        <div className="p-4 space-y-3.5 border-b border-slate-850 bg-slate-900/15">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-black text-lg text-white">My Library</h3>
            <button
              onClick={() => createNoteMutation.mutate()}
              className="h-8 w-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center cursor-pointer transition-colors shadow shadow-indigo-650/40"
              title="Create new note"
            >
              <Plus className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, markdown contents..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 text-slate-200 placeholder:text-slate-500 rounded-lg border border-slate-800 text-xs focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Tab Selection Filter */}
        <div className="flex border-b border-slate-850 text-center select-none text-[9px] font-black tracking-wider uppercase bg-slate-900/20">
          {(['all', 'pinned', 'archived'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedNoteId(null);
              }}
              className={cn(
                "flex-1 py-3.5 border-b-2 cursor-pointer transition-all",
                activeTab === tab 
                  ? "text-indigo-400 border-indigo-500 bg-slate-950/20" 
                  : "text-slate-500 border-transparent hover:text-slate-350"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notes Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            [1, 2, 3].map(n => (
              <div key={n} className="h-16 bg-slate-900/40 border border-slate-850 rounded-xl animate-pulse" />
            ))
          ) : notes.length === 0 ? (
            <div className="text-center p-8 text-slate-550 flex flex-col items-center justify-center">
              <FolderOpen className="h-7 w-7 text-slate-650 mb-1" />
              <span className="text-[10px] font-bold">No notes found</span>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={cn(
                  "p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 group relative",
                  selectedNoteId === note.id
                    ? "bg-indigo-500/10 border-indigo-500/30 shadow-sm"
                    : "bg-transparent border-transparent hover:bg-slate-900/30 hover:border-slate-850"
                )}
              >
                <div className="flex justify-between items-start gap-2">
                  <h4 className={cn(
                    "text-xs font-bold truncate pr-3",
                    selectedNoteId === note.id ? "text-indigo-300" : "text-slate-200 group-hover:text-white"
                  )}>
                    {note.title || 'Untitled Concept'}
                  </h4>
                  {note.pinned && <Pin className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5 fill-current" />}
                </div>

                <p className="text-[10px] text-slate-500 truncate mt-1">
                  {note.content.replace(/[#*`>_\-]/g, '').trim() || 'Empty note content...'}
                </p>

                {/* Subtitle Badging (attached problem or topic) */}
                {(note.topic || note.problem) && (
                  <div className="flex items-center gap-1 mt-2.5">
                    <BookOpen className="h-3 w-3 text-slate-600" />
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide truncate max-w-[150px]">
                      {note.topic?.title || note.problem?.title}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Right Workspace: Notion-style editor workspace */}
      <div className="flex-1 flex flex-col bg-slate-950/20">
        
        {activeNote ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* Editor Action HUD Toolbar */}
            <div className="p-3.5 border-b border-slate-850 bg-slate-900/15 flex flex-wrap justify-between items-center gap-4 select-none shrink-0">
              
              {/* Last Saved Indicators */}
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                {isSaving ? (
                  <span className="flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</span>
                ) : lastSaved ? (
                  <span>Saved {Math.round((new Date().getTime() - lastSaved.getTime()) / 1000)}s ago</span>
                ) : (
                  <span>Syncing notes draft...</span>
                )}
              </div>

              {/* Action buttons (Pin, Archive, Delete) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => pinMutation.mutate(activeNote.id)}
                  className={cn(
                    "p-1.5 rounded-lg border transition-colors cursor-pointer",
                    activeNote.pinned 
                      ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/25" 
                      : "bg-transparent text-slate-550 border-slate-800 hover:text-slate-200"
                  )}
                  title="Pin note to library top"
                >
                  <Pin className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => archiveMutation.mutate(activeNote.id)}
                  className={cn(
                    "p-1.5 rounded-lg border transition-colors cursor-pointer",
                    activeNote.archived 
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/25" 
                      : "bg-transparent text-slate-550 border-slate-800 hover:text-slate-200"
                  )}
                  title="Archive note"
                >
                  <Archive className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => {
                    if (confirm('Delete this note permanently?')) {
                      deleteMutation.mutate(activeNote.id);
                    }
                  }}
                  className="p-1.5 rounded-lg border border-transparent text-slate-550 hover:text-rose-450 hover:bg-rose-500/5 transition-all cursor-pointer"
                  title="Delete note permanently"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Markdown formatting shortcuts toolbar */}
            <div className="flex items-center gap-1.5 p-2 bg-slate-950 border-b border-slate-850 overflow-x-auto shrink-0 select-none">
              <button onClick={() => insertMarkdown('heading')} className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-white" title="Insert Heading"><Heading1 className="h-4 w-4" /></button>
              <button onClick={() => insertMarkdown('bold')} className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-white" title="Insert Bold"><Bold className="h-4 w-4" /></button>
              <button onClick={() => insertMarkdown('italic')} className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-white" title="Insert Italic"><Italic className="h-4 w-4" /></button>
              <div className="w-[1px] h-4 bg-slate-800 mx-1 shrink-0" />
              <button onClick={() => insertMarkdown('code')} className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-white" title="Insert Code Block"><Code className="h-4 w-4" /></button>
              <button onClick={() => insertMarkdown('list')} className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-white" title="Insert Bullet List"><List className="h-4 w-4" /></button>
              <button onClick={() => insertMarkdown('checklist')} className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-white" title="Insert Checklist"><CheckSquare className="h-4 w-4" /></button>
              <button onClick={() => insertMarkdown('quote')} className="p-1.5 rounded hover:bg-slate-900 text-slate-400 hover:text-white" title="Insert Blockquote"><Quote className="h-4 w-4" /></button>
            </div>

            {/* Edit inputs container */}
            <div className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden">
              
              {/* Title input */}
              <input
                type="text"
                value={title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Untitled Note"
                className="w-full bg-transparent text-xl md:text-2xl font-heading font-black text-white outline-none placeholder:text-slate-700 tracking-tight"
              />

              {/* Content textarea */}
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Start writing markdown... Use headings (#), checklists (- [ ]), and Java code blocks."
                className="flex-1 w-full bg-transparent text-xs md:text-sm text-slate-350 leading-relaxed outline-none resize-none font-mono placeholder:text-slate-750"
              />
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-500">
            <FileText className="h-10 w-10 text-slate-750 mb-2.5" />
            <h5 className="font-heading font-bold text-slate-300 text-sm">No Note Selected</h5>
            <p className="text-xs text-slate-550 max-w-sm leading-relaxed mt-1">
              Select an existing notes file from the library panel or click the '+' button to write down your Java DSA study plans.
            </p>
          </div>
        )}

      </div>

    </div>
  );
};
