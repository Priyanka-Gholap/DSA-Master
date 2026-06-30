import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { useAuthStore } from './store/authStore';

// Layouts
import { RootLayout } from './layouts/RootLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { ProtectedLayout } from './components/layout/ProtectedLayout';

// Lazy loaded Pages
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage').then(m => ({ default: m.PlaceholderPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage').then(m => ({ default: m.UnauthorizedPage })));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage').then(m => ({ default: m.RoadmapPage })));
const TopicsPage = lazy(() => import('./pages/TopicsPage').then(m => ({ default: m.TopicsPage })));
const TopicDetailPage = lazy(() => import('./pages/TopicDetailPage').then(m => ({ default: m.TopicDetailPage })));
const PracticePage = lazy(() => import('./pages/PracticePage').then(m => ({ default: m.PracticePage })));
const ProblemDetailPage = lazy(() => import('./pages/ProblemDetailPage').then(m => ({ default: m.ProblemDetailPage })));
const NotesPage = lazy(() => import('./pages/NotesPage').then(m => ({ default: m.NotesPage })));
const RevisionPage = lazy(() => import('./pages/RevisionPage').then(m => ({ default: m.RevisionPage })));
const BookmarksPage = lazy(() => import('./pages/BookmarksPage').then(m => ({ default: m.BookmarksPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const LeaderboardPlaceholder = lazy(() => import('./pages/LeaderboardPlaceholder').then(m => ({ default: m.LeaderboardPlaceholder })));
const VisualizerPage = lazy(() => import('./pages/VisualizerPage').then(m => ({ default: m.VisualizerPage })));

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={
              <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-indigo-400 font-bold select-none">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 rounded-xl border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <div className="text-xs uppercase tracking-widest text-slate-550 font-black animate-pulse mt-2">Loading DSA Master...</div>
                </div>
              </div>
            }>
              <Routes>
                
                {/* Marketing Routes */}
                <Route element={<RootLayout />}>
                  <Route path="/" element={<LandingPage />} />
                </Route>

                {/* Authentication Routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Route>

                {/* Protected Routes (Dashboard Console) */}
                <Route element={<ProtectedLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  
                  {/* Future Module Placeholders */}
                  <Route path="/roadmap" element={<RoadmapPage />} />
                  <Route path="/topics" element={<TopicsPage />} />
                  <Route path="/topics/:slug" element={<TopicDetailPage />} />
                  <Route path="/practice" element={<PracticePage />} />
                  <Route path="/practice/problems/:slug" element={<ProblemDetailPage />} />
                  <Route path="/notes" element={<NotesPage />} />
                  <Route path="/revision" element={<RevisionPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/visualizer" element={<VisualizerPage />} />
                  <Route path="/ai-mentor" element={<PlaceholderPage />} />
                  <Route path="/bookmarks" element={<BookmarksPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPlaceholder />} />
                </Route>

                {/* Error and Redirection routes */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<Navigate to="/404" replace />} />

              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
