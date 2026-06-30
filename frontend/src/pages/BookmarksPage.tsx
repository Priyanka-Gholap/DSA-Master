import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bookmark, 
  Trash2, 
  Search, 
  BookOpen, 
  Code, 
  FileText, 
  Folder,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { Card, CardContent } from '../components/ui/Card';
import { cn } from '../utils/cn';

interface BookmarkItem {
  id: string;
  contentType: 'TOPIC' | 'PROBLEM' | 'LESSON' | 'NOTE';
  contentId: string;
  category: string;
  collection: string | null;
  createdAt: string;
  resource?: {
    title: string;
    slug?: string;
    category?: string;
    difficulty?: string;
    topic?: { slug: string };
    content?: string;
  } | null;
}

export const BookmarksPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeCollection, setActiveCollection] = useState<string>('All');

  // Fetch Bookmarks
  const { data: bookmarksData, isLoading } = useQuery<{ bookmarks: BookmarkItem[] }>({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: { bookmarks: BookmarkItem[] } }>('/bookmarks');
      return response.data.data;
    }
  });

  const bookmarks = bookmarksData?.bookmarks || [];

  // Delete Bookmark Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/bookmarks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['problems'] }); // Refresh problems list to sync heart icon
      toast('Bookmark removed.', 'info');
    }
  });

  // Extract unique custom collections & categories
  const collections = ['All', ...Array.from(new Set(bookmarks.map(bm => bm.collection).filter(Boolean))) as string[]];
  const categories = ['All', 'Interview', 'Revision', 'Important', 'Favourite', 'Difficult'];

  // Filter bookmarks on Client
  const filteredBookmarks = bookmarks.filter((bm) => {
    // Search filter
    const title = bm.resource?.title || '';
    const matchSearch = title.toLowerCase().includes(search.toLowerCase());

    // Category filter
    const matchCategory = activeCategory === 'All' || bm.category === activeCategory;

    // Collection filter
    const matchCollection = activeCollection === 'All' || bm.collection === activeCollection;

    return matchSearch && matchCategory && matchCollection;
  });

  const getResourceLink = (bm: BookmarkItem) => {
    if (!bm.resource) return '#';
    if (bm.contentType === 'TOPIC') return `/topics/${bm.resource.slug}`;
    if (bm.contentType === 'PROBLEM') return `/practice/problems/${bm.resource.slug}`;
    if (bm.contentType === 'LESSON') return `/topics/${bm.resource.topic?.slug}`;
    if (bm.contentType === 'NOTE') return `/notes`;
    return '#';
  };

  const getResourceTypeIcon = (type: string) => {
    if (type === 'TOPIC') return <Folder className="h-4 w-4 text-indigo-400" />;
    if (type === 'PROBLEM') return <Code className="h-4 w-4 text-emerald-450" />;
    if (type === 'LESSON') return <BookOpen className="h-4 w-4 text-amber-400" />;
    return <FileText className="h-4 w-4 text-violet-400" />;
  };

  return (
    <div className="space-y-8 text-left select-none pb-16">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div>
          <h2 className="font-heading font-black text-2xl text-white tracking-tight">Bookmarks Vault</h2>
          <p className="text-xs text-slate-400 mt-1">Organize your favorite questions, lessons, and personal notes into custom study folders.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookmarked files..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900/60 text-slate-200 placeholder:text-slate-500 rounded-xl border border-slate-805 text-xs focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 2. Collections and category chips */}
      <div className="space-y-4">
        {/* Category selections */}
        <div className="space-y-2">
          <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block">Bookmark Tag Category</span>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                  activeCategory === cat
                    ? 'bg-indigo-650 text-white border-indigo-550 shadow shadow-indigo-600/15'
                    : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Collections selection folder tabs */}
        {collections.length > 1 && (
          <div className="space-y-2">
            <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block">Collection Folder</span>
            <div className="flex flex-wrap gap-1.5">
              {collections.map((coll) => (
                <button
                  key={coll}
                  onClick={() => setActiveCollection(coll)}
                  className={cn(
                    "py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5",
                    activeCollection === coll
                      ? 'bg-slate-850 text-white border-slate-750'
                      : 'border-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-900/40'
                  )}
                >
                  <Folder className="h-3.5 w-3.5" />
                  {coll}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Bookmarks Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-32 bg-slate-900/40 border border-slate-850 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <Card hoverEffect={false} className="border-slate-850 bg-slate-900/10 py-16 text-center max-w-lg mx-auto">
          <CardContent className="space-y-4">
            <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-550 mx-auto">
              <Bookmark className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading font-semibold text-white">No bookmarks matched criteria</h4>
              <p className="text-xs text-slate-400">Click bookmark action toggles in learning lessons, problem detail consoles, or concept notes pages.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBookmarks.map((bm) => {
            const title = bm.resource?.title || 'Untitled bookmark item';
            const link = getResourceLink(bm);
            const tag = bm.category;

            return (
              <Card key={bm.id} className="border-slate-850 bg-slate-900/10 flex flex-col justify-between p-5 relative overflow-hidden group">
                {/* Accent link overlay */}
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => navigate(link)}
                    className="p-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-100 cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-3.5 text-left min-w-0 pr-6">
                  {/* Header content type badge */}
                  <div className="flex items-center gap-2">
                    {getResourceTypeIcon(bm.contentType)}
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      {bm.contentType}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 
                    onClick={() => navigate(link)}
                    className="font-heading font-black text-sm text-slate-200 group-hover:text-white cursor-pointer transition-colors truncate"
                  >
                    {title}
                  </h4>
                </div>

                {/* Footer labels and action triggers */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-850/50 mt-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-500/15 text-indigo-400 bg-indigo-500/5">
                      {tag}
                    </span>
                    {bm.collection && (
                      <span className="text-[8px] font-bold text-slate-500 flex items-center gap-1">
                        <Folder className="h-3 w-3" />
                        {bm.collection}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => deleteMutation.mutate(bm.id)}
                    className="p-1.5 rounded-lg border border-transparent text-slate-550 hover:text-rose-400 hover:bg-rose-500/5 transition-colors cursor-pointer"
                    title="Remove bookmark"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
};
