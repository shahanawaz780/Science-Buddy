import React, { useState, useEffect } from 'react';
import { NavigationTab, QuizConfig, QuizAttemptResult } from './types';
import { ProgressProvider, useProgress } from './context/ProgressContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { 
  LandingPage,
  HomePage, 
  LearnPage, 
  LessonPage, 
  TutorPage, 
  PracticePage, 
  ProgressPage, 
  QuizActivePage, 
  ResultPage,
  LoginPage,
  SignUpPage,
  ForgotPasswordPage,
  ProfilePage
} from './pages';
import { QUIZ_CONFIGS } from './data/chapter1Data';
import { Atom } from 'lucide-react';

const PROTECTED_TABS: Set<NavigationTab> = new Set([
  'home',
  'learn',
  'lesson',
  'tutor',
  'practice',
  'quiz_active',
  'result',
  'progress',
  'profile'
]);

function parseTabFromLocation(): { tab: NavigationTab; topicId?: string } {
  if (typeof window === 'undefined') return { tab: 'landing' };

  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  const path = window.location.pathname.replace(/^\//, '').toLowerCase();
  const segment = hash || path;

  if (segment === 'login') return { tab: 'login' };
  if (segment === 'signup' || segment === 'register') return { tab: 'signup' };
  if (segment === 'forgot_password' || segment === 'forgot-password' || segment === 'reset-password') return { tab: 'forgot_password' };
  if (segment === 'landing' || segment === 'welcome') return { tab: 'landing' };
  if (segment === 'dashboard' || segment === 'home') return { tab: 'home' };
  if (segment === 'learn' || segment === 'chapters') return { tab: 'learn' };
  if (segment.startsWith('lesson')) {
    const parts = segment.split('/');
    return { tab: 'lesson', topicId: parts[1] || 'T1' };
  }
  if (segment === 'tutor' || segment === 'ai-tutor') return { tab: 'tutor' };
  if (segment === 'practice' || segment === 'quiz' || segment === 'exam') return { tab: 'practice' };
  if (segment === 'quiz_active' || segment === 'active-quiz' || segment === 'active-exam') return { tab: 'quiz_active' };
  if (segment === 'result' || segment === 'results') return { tab: 'result' };
  if (segment === 'progress' || segment === 'my-progress') return { tab: 'progress' };
  if (segment === 'profile' || segment === 'account') return { tab: 'profile' };

  return { tab: 'landing' };
}

function ScienceBuddyApp() {
  const { progress, activeTopicId, setActiveTopicId, setStudentName } = useProgress();
  const { user, isAuthenticated, isLoading, isPasswordRecoveryMode } = useAuth();
  
  const [currentTab, setCurrentTab] = useState<NavigationTab>('landing');
  const [intendedDestination, setIntendedDestination] = useState<NavigationTab | null>(null);
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);
  
  const [selectedTopicId, setSelectedTopicId] = useState<string>(progress.lastActiveTopicId || activeTopicId || 'T1');
  const [activeQuizConfig, setActiveQuizConfig] = useState<QuizConfig>(QUIZ_CONFIGS[0]);
  const [activeQuizResult, setActiveQuizResult] = useState<QuizAttemptResult | null>(null);

  // Pre-filled tutor prompt state
  const [tutorContextTopic, setTutorContextTopic] = useState<string | undefined>(undefined);
  const [tutorInitialPrompt, setTutorInitialPrompt] = useState<string | undefined>(undefined);

  // Helper to synchronize URL hash without page reload
  const syncUrlHash = (tab: NavigationTab) => {
    if (typeof window === 'undefined') return;
    const targetHash = tab === 'home' ? '#dashboard' : tab === 'landing' ? '#welcome' : `#${tab}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash);
    }
  };

  // Auto-switch to password reset view if recovery mode is detected
  useEffect(() => {
    if (isPasswordRecoveryMode) {
      setCurrentTab('forgot_password');
      syncUrlHash('forgot_password');
    }
  }, [isPasswordRecoveryMode]);

  // Sync student name when user auth changes
  useEffect(() => {
    if (user?.fullName && user.fullName !== progress.studentName) {
      setStudentName(user.fullName);
    }
  }, [user?.fullName]);

  // Sync selectedTopicId when activeTopicId or progress changes
  useEffect(() => {
    if (progress.lastActiveTopicId && progress.lastActiveTopicId !== selectedTopicId) {
      setSelectedTopicId(progress.lastActiveTopicId);
    }
  }, [progress.lastActiveTopicId]);

  // Route Guard & Initial URL Evaluation
  useEffect(() => {
    if (isLoading) return;

    const { tab: parsedTab, topicId } = parseTabFromLocation();
    if (topicId) {
      setSelectedTopicId(topicId);
      setActiveTopicId(topicId);
    }

    if (isAuthenticated) {
      // If user is authenticated
      if (parsedTab === 'landing' || parsedTab === 'login' || parsedTab === 'signup') {
        const dest = intendedDestination && PROTECTED_TABS.has(intendedDestination) ? intendedDestination : 'home';
        setCurrentTab(dest);
        setIntendedDestination(null);
        setRedirectNotice(null);
        syncUrlHash(dest);
      } else {
        setCurrentTab(parsedTab);
      }
    } else {
      // If user is NOT authenticated
      if (PROTECTED_TABS.has(parsedTab)) {
        setIntendedDestination(parsedTab);
        setRedirectNotice('Please log in to access this section.');
        setCurrentTab('login');
        if (typeof window !== 'undefined' && window.location.hash !== '#login') {
          window.history.replaceState(null, '', '#login');
        }
      } else {
        setCurrentTab(parsedTab === 'home' ? 'landing' : parsedTab);
      }
    }
  }, [isAuthenticated, isLoading]);

  // Handle Browser Back / Forward and direct URL Hash changes
  useEffect(() => {
    const handleLocationChange = () => {
      if (isLoading) return;
      const { tab: targetTab, topicId } = parseTabFromLocation();
      if (topicId) {
        setSelectedTopicId(topicId);
        setActiveTopicId(topicId);
      }

      if (!isAuthenticated && PROTECTED_TABS.has(targetTab)) {
        setIntendedDestination(targetTab);
        setRedirectNotice('Please log in to access this section.');
        setCurrentTab('login');
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', '#login');
        }
        return;
      }

      if (isAuthenticated && targetTab === 'landing') {
        setCurrentTab('home');
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', '#dashboard');
        }
        return;
      }

      setCurrentTab(targetTab === 'home' && !isAuthenticated ? 'landing' : targetTab);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [isAuthenticated, isLoading]);

  const handleNavigate = (tab: NavigationTab) => {
    // Intercept protected routes when unauthenticated
    if (!isAuthenticated && PROTECTED_TABS.has(tab)) {
      setIntendedDestination(tab);
      setRedirectNotice('Please sign in to access your learning dashboard, lessons, and practice exams.');
      setCurrentTab('login');
      syncUrlHash('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Redirect to home if logged-in user clicks landing
    if (isAuthenticated && tab === 'landing') {
      setCurrentTab('home');
      syncUrlHash('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Redirect to landing if logged-out user clicks home
    if (!isAuthenticated && tab === 'home') {
      setCurrentTab('landing');
      syncUrlHash('landing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setRedirectNotice(null);
    setCurrentTab(tab);
    syncUrlHash(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = () => {
    const destination = intendedDestination && PROTECTED_TABS.has(intendedDestination) ? intendedDestination : 'home';
    setIntendedDestination(null);
    setRedirectNotice(null);
    setCurrentTab(destination);
    syncUrlHash(destination);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignUpSuccess = () => {
    setIntendedDestination(null);
    setRedirectNotice(null);
    setCurrentTab('home');
    syncUrlHash('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLesson = (topicId: string) => {
    if (!isAuthenticated) {
      setIntendedDestination('learn');
      setRedirectNotice('Please log in to access Chapter 1 lessons.');
      setCurrentTab('login');
      syncUrlHash('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSelectedTopicId(topicId);
    setActiveTopicId(topicId);
    setCurrentTab('lesson');
    syncUrlHash('lesson');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartQuiz = (config: QuizConfig) => {
    if (!isAuthenticated) {
      setIntendedDestination('practice');
      setRedirectNotice('Please log in to start practice quizzes and exams.');
      setCurrentTab('login');
      syncUrlHash('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setActiveQuizConfig(config);
    setCurrentTab('quiz_active');
    syncUrlHash('quiz_active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishQuiz = (result: QuizAttemptResult) => {
    setActiveQuizResult(result);
    setCurrentTab('result');
    syncUrlHash('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskTutorWithPrompt = (topicTitle: string, prompt?: string) => {
    if (!isAuthenticated) {
      setIntendedDestination('tutor');
      setRedirectNotice('Please log in to ask questions to the AI Tutor.');
      setCurrentTab('login');
      syncUrlHash('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setTutorContextTopic(topicTitle);
    setTutorInitialPrompt(prompt);
    setCurrentTab('tutor');
    syncUrlHash('tutor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetakeQuiz = () => {
    if (activeQuizConfig) {
      setCurrentTab('quiz_active');
      syncUrlHash('quiz_active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentTab('practice');
      syncUrlHash('practice');
    }
  };

  // Clean Loading Screen (prevents any flash of protected student content)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md mb-4 animate-pulse">
          <Atom className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <h2 className="text-base sm:text-lg font-bold font-heading text-slate-800 mb-1">
          Checking your Science Buddy account...
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Class 6 CBSE Science Micro-Tutor
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top and Bottom Navigation Bars */}
      <Navbar activeTab={currentTab} onNavigate={handleNavigate} />

      {/* Main Viewport */}
      <main className="flex-1 w-full">
        
        {/* PUBLIC ROUTES */}
        {!isAuthenticated && (
          <>
            {currentTab === 'landing' && (
              <LandingPage onNavigate={handleNavigate} />
            )}

            {currentTab === 'login' && (
              <LoginPage
                onNavigate={handleNavigate}
                onLoginSuccess={handleLoginSuccess}
                redirectNotice={redirectNotice || undefined}
              />
            )}

            {currentTab === 'signup' && (
              <SignUpPage
                onNavigate={handleNavigate}
                onSignUpSuccess={handleSignUpSuccess}
              />
            )}

            {currentTab === 'forgot_password' && (
              <ForgotPasswordPage
                onNavigate={handleNavigate}
              />
            )}

            {/* Fallback for unauthenticated access */}
            {currentTab !== 'landing' && currentTab !== 'login' && currentTab !== 'signup' && currentTab !== 'forgot_password' && (
              <LandingPage onNavigate={handleNavigate} />
            )}
          </>
        )}

        {/* AUTHENTICATED STUDENT ROUTES */}
        {isAuthenticated && (
          <>
            {currentTab === 'home' && (
              <HomePage 
                onNavigate={handleNavigate} 
                onOpenLesson={handleOpenLesson} 
              />
            )}

            {currentTab === 'learn' && (
              <LearnPage 
                onOpenLesson={handleOpenLesson} 
              />
            )}

            {currentTab === 'lesson' && (
              <LessonPage
                topicId={selectedTopicId}
                onNavigate={handleNavigate}
                onSelectTopic={handleOpenLesson}
                onAskTutorWithPrompt={handleAskTutorWithPrompt}
              />
            )}

            {currentTab === 'tutor' && (
              <TutorPage
                initialTopicTitle={tutorContextTopic}
                initialPrompt={tutorInitialPrompt}
              />
            )}

            {currentTab === 'practice' && (
              <PracticePage
                onStartQuiz={handleStartQuiz}
                onOpenLesson={handleOpenLesson}
              />
            )}

            {currentTab === 'quiz_active' && (
              <QuizActivePage
                config={activeQuizConfig}
                onFinishQuiz={handleFinishQuiz}
                onExit={() => setCurrentTab('practice')}
                onAskTutorWithPrompt={handleAskTutorWithPrompt}
              />
            )}

            {currentTab === 'result' && activeQuizResult && (
              <ResultPage
                result={activeQuizResult}
                onRetakeQuiz={handleRetakeQuiz}
                onNavigate={handleNavigate}
                onOpenLesson={handleOpenLesson}
                onAskTutorWithPrompt={handleAskTutorWithPrompt}
              />
            )}

            {currentTab === 'progress' && (
              <ProgressPage
                onNavigate={handleNavigate}
                onOpenLesson={handleOpenLesson}
              />
            )}

            {currentTab === 'profile' && (
              <ProfilePage
                onNavigate={handleNavigate}
              />
            )}

            {currentTab === 'forgot_password' && (
              <ForgotPasswordPage
                onNavigate={handleNavigate}
              />
            )}

            {/* Authenticated user visiting login/signup -> Redirect to home */}
            {(currentTab === 'login' || currentTab === 'signup' || currentTab === 'landing') && (
              <HomePage 
                onNavigate={handleNavigate} 
                onOpenLesson={handleOpenLesson} 
              />
            )}
          </>
        )}

      </main>

      {/* Clean Footer for Desktop */}
      <footer className="hidden md:block bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Science Buddy</span>
            <span>•</span>
            <span>Class 6 CBSE Science Micro-Tutor</span>
            <span>•</span>
            <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-md border border-emerald-200">
              Chapter 1: The Wonderful World of Science
            </span>
          </div>
          <p className="text-slate-400">
            {isAuthenticated ? 'Authenticated Student Session' : 'Public Access'} • Designed for Indian CBSE Students (11–12 Years)
          </p>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <ScienceBuddyApp />
      </ProgressProvider>
    </AuthProvider>
  );
}
