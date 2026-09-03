import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  BookOpen, 
  Bot, 
  CheckSquare, 
  BarChart2, 
  Sparkles, 
  User, 
  Atom, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  RotateCcw, 
  UploadCloud,
  ChevronDown,
  LogIn,
  UserPlus,
  LogOut,
  Settings,
  Layers,
  Check
} from 'lucide-react';
import { NavigationTab } from '../types';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import { Button, Modal, Input, Badge } from './ui';

interface NavbarProps {
  activeTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onNavigate }) => {
  const { 
    progress, 
    activeChapterId,
    setActiveChapterId,
    currentChapter,
    allChapters,
    getChapterProgress,
    setStudentName, 
    resetProgress, 
    loadSampleData,
    supabaseStatus,
    isDbSyncing,
    syncWithDatabase,
    seedDatabase
  } = useProgress();

  const { user, isAuthenticated, logout } = useAuth();

  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [nameInput, setNameInput] = useState(user?.fullName || progress.studentName);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const chapterDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAccountDropdown(false);
      }
      if (chapterDropdownRef.current && !chapterDropdownRef.current.contains(event.target as Node)) {
        setShowChapterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Main navigation items for authenticated students
  const navItems = [
    { id: 'chapters' as NavigationTab, label: 'Chapters', icon: Layers },
    { id: 'home' as NavigationTab, label: 'Dashboard', icon: Home },
    { id: 'learn' as NavigationTab, label: 'Learn', icon: BookOpen },
    { id: 'tutor' as NavigationTab, label: 'AI Tutor', icon: Bot, badge: 'AI' },
    { id: 'practice' as NavigationTab, label: 'Practice & Exam', icon: CheckSquare },
    { id: 'progress' as NavigationTab, label: 'My Progress', icon: BarChart2 },
  ];

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setStudentName(nameInput.trim());
    }
    setShowProfileModal(false);
  };

  const handleSeedDatabase = async () => {
    const res = await seedDatabase();
    setSeedNotice(res.message);
    setTimeout(() => setSeedNotice(null), 4000);
  };

  const handleLogout = async () => {
    setShowAccountDropdown(false);
    await logout();
    onNavigate('landing');
  };

  const displayName = user?.fullName || progress.studentName || 'Student';

  return (
    <>
      {/* Top Header for Desktop, Tablet & Mobile */}
      <header id="main-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          
          {/* Logo & Subject Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="brand-logo-btn"
              onClick={() => onNavigate(isAuthenticated ? 'home' : 'landing')}
              className="flex items-center gap-2.5 group text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl cursor-pointer"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-150">
                <Atom className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold font-heading text-slate-900 tracking-tight flex items-center gap-1.5 leading-none">
                  Science Buddy
                </span>
                <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold text-emerald-700 mt-1">
                  <Badge variant="success" size="sm">Class 6 CBSE</Badge>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="text-slate-600 font-bold hidden sm:inline">Ch {currentChapter.number}</span>
                </div>
              </div>
            </button>

            {/* Chapter Switcher Dropdown (Desktop & Tablet) */}
            {isAuthenticated && (
              <div className="relative hidden md:block" ref={chapterDropdownRef}>
                <button
                  id="chapter-switcher-pill"
                  onClick={() => setShowChapterDropdown(!showChapterDropdown)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors"
                  title="Switch Chapter"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="truncate max-w-[140px]">Ch {currentChapter.number}: {currentChapter.title}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {showChapterDropdown && (
                  <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in-50">
                    <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class 6 Chapters</span>
                      <button
                        onClick={() => {
                          setShowChapterDropdown(false);
                          onNavigate('chapters');
                        }}
                        className="text-[11px] text-blue-600 font-bold hover:underline"
                      >
                        View All
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {allChapters.map(ch => {
                        const isChActive = ch.id === activeChapterId;
                        const chProg = getChapterProgress(ch.id);
                        return (
                          <button
                            key={ch.id}
                            id={`switch-to-ch-${ch.number}`}
                            onClick={() => {
                              setActiveChapterId(ch.id);
                              setShowChapterDropdown(false);
                              if (activeTab === 'chapters') {
                                onNavigate('learn');
                              }
                            }}
                            className={`w-full px-3 py-2 text-left flex items-start justify-between gap-2 hover:bg-slate-50 transition-colors ${
                              isChActive ? 'bg-emerald-50/70 text-emerald-900 font-bold' : 'text-slate-700'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-semibold flex items-center gap-1.5">
                                <span>Ch {ch.number}: {ch.title}</span>
                                {!ch.isAvailable && (
                                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-normal">Coming Soon</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {ch.totalTopics} Topics • {chProg.completionPercentage}% Mastered
                              </div>
                            </div>
                            {isChActive && <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Navigation Links — ONLY Rendered for Authenticated Students */}
          {isAuthenticated && (
            <nav id="desktop-nav" className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || 
                  (item.id === 'chapters' && activeTab === 'chapters') ||
                  (item.id === 'home' && activeTab === 'home') ||
                  (item.id === 'learn' && activeTab === 'lesson') ||
                  (item.id === 'practice' && (activeTab === 'quiz_active' || activeTab === 'result'));

                return (
                  <button
                    key={item.id}
                    id={`nav-link-${item.id}`}
                    onClick={() => onNavigate(item.id)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                      isActive
                        ? 'bg-white text-emerald-900 shadow-2xs border border-slate-200/90 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-600 text-white tracking-wider">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            
            {/* Authenticated: Supabase Status Pill (Desktop/Tablet) */}
            {isAuthenticated && (
              <button
                id="supabase-status-pill"
                onClick={() => {
                  setNameInput(user?.fullName || progress.studentName);
                  setShowProfileModal(true);
                }}
                title={supabaseStatus.isConnected ? "Supabase Cloud Connected" : "Local Storage Mode"}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  supabaseStatus.isConnected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/80'
                }`}
              >
                <Database className={`w-3.5 h-3.5 ${supabaseStatus.isConnected ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="hidden xl:inline">{supabaseStatus.isConnected ? 'Supabase' : 'Local Mode'}</span>
                {isDbSyncing ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                ) : (
                  <span className={`w-2 h-2 rounded-full ${supabaseStatus.isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                )}
              </button>
            )}

            {/* Unauthenticated: Fast Action Buttons for Desktop */}
            {!isAuthenticated && (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  id="header-login-btn"
                  variant="outline"
                  size="sm"
                  icon={LogIn}
                  onClick={() => onNavigate('login')}
                  className={activeTab === 'login' ? 'ring-2 ring-emerald-500 font-bold' : ''}
                >
                  Log In
                </Button>
                <Button
                  id="header-signup-btn"
                  variant="primary"
                  size="sm"
                  icon={UserPlus}
                  onClick={() => onNavigate('signup')}
                  className={activeTab === 'signup' ? 'ring-2 ring-emerald-500 font-bold' : ''}
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Account Menu Dropdown */}
            <div className="relative" ref={dropdownRef}>
              
              <button
                id="account-menu-button"
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                aria-expanded={showAccountDropdown}
                aria-haspopup="true"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                  isAuthenticated
                    ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-slate-800'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                } ${activeTab === 'login' || activeTab === 'signup' || activeTab === 'profile' ? 'ring-2 ring-emerald-500/50' : ''}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isAuthenticated 
                    ? 'bg-emerald-600 text-white shadow-2xs' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {isAuthenticated ? (
                    displayName.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>

                <div className="text-left hidden sm:block">
                  <span className="block font-semibold text-slate-800 text-xs leading-tight">
                    {isAuthenticated ? displayName : 'Account'}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium">
                    {isAuthenticated ? 'Logged In' : 'Sign In / Up'}
                  </span>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  showAccountDropdown ? 'rotate-180 text-emerald-600' : ''
                }`} />
              </button>

              {/* Account Dropdown Menu */}
              {showAccountDropdown && (
                <div 
                  id="account-dropdown-menu"
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in-50 slide-in-from-top-2"
                >
                  
                  {/* Account Header Section */}
                  <div className="px-4 py-2.5 border-b border-slate-100 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Science Buddy Account
                    </p>
                    {isAuthenticated ? (
                      <div className="mt-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {user?.email || 'Student Account'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 mt-0.5">
                        Sign in to access your learning dashboard, AI tutor, and practice exams.
                      </p>
                    )}
                  </div>

                  {/* Menu Options: Conditional on Authentication State */}
                  <div className="py-1">
                    {!isAuthenticated ? (
                      /* WHEN USER IS NOT LOGGED IN: Show Sign Up & Login */
                      <>
                        <button
                          id="menu-signup-btn"
                          role="menuitem"
                          onClick={() => {
                            setShowAccountDropdown(false);
                            onNavigate('signup');
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="block font-bold">Sign Up</span>
                            <span className="text-[10px] font-normal text-slate-500">Create a new student profile</span>
                          </div>
                        </button>

                        <button
                          id="menu-login-btn"
                          role="menuitem"
                          onClick={() => {
                            setShowAccountDropdown(false);
                            onNavigate('login');
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <LogIn className="w-4 h-4 text-slate-500 shrink-0" />
                          <div>
                            <span className="block font-bold">Login</span>
                            <span className="text-[10px] font-normal text-slate-400">Sign in with email & password</span>
                          </div>
                        </button>
                      </>
                    ) : (
                      /* WHEN USER IS LOGGED IN: Show My Profile, My Progress & Logout */
                      <>
                        <button
                          id="menu-chapters-btn"
                          role="menuitem"
                          onClick={() => {
                            setShowAccountDropdown(false);
                            onNavigate('chapters');
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div>
                            <span className="block font-bold">All Science Chapters</span>
                            <span className="text-[10px] font-normal text-slate-400">Switch or explore chapters</span>
                          </div>
                        </button>

                        <button
                          id="menu-profile-btn"
                          role="menuitem"
                          onClick={() => {
                            setShowAccountDropdown(false);
                            onNavigate('profile');
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <User className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="block font-bold">My Profile</span>
                            <span className="text-[10px] font-normal text-slate-400">View & edit student info</span>
                          </div>
                        </button>

                        <button
                          id="menu-progress-btn"
                          role="menuitem"
                          onClick={() => {
                            setShowAccountDropdown(false);
                            onNavigate('progress');
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <BarChart2 className="w-4 h-4 text-teal-600 shrink-0" />
                          <div>
                            <span className="block font-bold">My Progress</span>
                            <span className="text-[10px] font-normal text-slate-400">Chapter mastery & quiz history</span>
                          </div>
                        </button>

                        <div className="border-t border-slate-100 my-1" />

                        <button
                          id="menu-logout-btn"
                          role="menuitem"
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                          <div>
                            <span className="block font-bold">Logout</span>
                            <span className="text-[10px] font-normal text-rose-400">End your current session</span>
                          </div>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Settings quick helper for logged in users */}
                  {isAuthenticated && (
                    <div className="border-t border-slate-100 mt-1 pt-1.5 px-4 pb-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountDropdown(false);
                          setNameInput(user?.fullName || progress.studentName);
                          setShowProfileModal(true);
                        }}
                        className="w-full text-left py-1 text-[11px] text-slate-400 hover:text-emerald-700 flex items-center gap-1.5 cursor-pointer font-medium"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Database & Sync Settings</span>
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar — ONLY Rendered for Authenticated Students */}
      {isAuthenticated && (
        <nav 
          id="mobile-nav" 
          aria-label="Mobile Navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg"
        >
          <div className="grid grid-cols-6 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || 
                (item.id === 'chapters' && activeTab === 'chapters') ||
                (item.id === 'home' && activeTab === 'home') ||
                (item.id === 'learn' && activeTab === 'lesson') ||
                (item.id === 'practice' && (activeTab === 'quiz_active' || activeTab === 'result'));

              return (
                <button
                  key={item.id}
                  id={`mobile-nav-link-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  aria-label={`Navigate to ${item.label}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[44px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive
                      ? 'text-emerald-800 bg-emerald-50 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} aria-hidden="true" />
                    {item.badge && (
                      <span className="absolute -top-1 -right-2 text-[8px] bg-emerald-600 text-white font-extrabold px-1 rounded-full">
                        AI
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] mt-0.5 tracking-tight line-clamp-1">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Database Integration Settings Modal */}
      {isAuthenticated && (
        <Modal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          title="Student Settings & Cloud Sync"
          description="Class 6 CBSE • Science: The Wonderful World of Science"
          maxWidth="md"
        >
          <form onSubmit={handleSaveName} className="space-y-4">
            <Input
              label="Display Name"
              icon={User}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Aarav, Ananya, Student"
              maxLength={30}
              helperText="Personalizes your AI tutor and progress certificate."
            />

            {/* Supabase Database Integration Status Section */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Database className={`w-4 h-4 ${supabaseStatus.isConnected ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span>Supabase Database Status</span>
                </div>
                <Badge variant={supabaseStatus.isConnected ? 'success' : 'default'} size="sm">
                  {supabaseStatus.isConnected ? 'Connected' : 'Local Mode'}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {supabaseStatus.isConnected 
                  ? 'Student progress and quiz attempt answers are synchronized to Supabase cloud tables in real time.' 
                  : 'Running in resilient offline mode with local storage persistence.'}
              </p>

              {seedNotice && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{seedNotice}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSeedDatabase}
                  disabled={isDbSyncing}
                  icon={UploadCloud}
                >
                  Seed / Import Ch 1
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => syncWithDatabase()}
                  disabled={isDbSyncing}
                  icon={RefreshCw}
                >
                  Sync with DB
                </Button>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Curriculum Scope</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Standard</span>
                  <strong className="text-slate-800">Class 6 CBSE</strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Chapter 1</span>
                  <strong className="text-slate-800 line-clamp-1">Wonderful World of Science</strong>
                </div>
              </div>
            </div>

            {/* Reset Data Helper */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  loadSampleData();
                  setShowProfileModal(false);
                }}
                className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
              >
                Load Sample Progress
              </button>
              <button
                type="button"
                onClick={() => {
                  resetProgress();
                  setShowProfileModal(false);
                }}
                className="text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to 0%</span>
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setShowProfileModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
