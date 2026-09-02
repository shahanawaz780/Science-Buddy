import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  BookOpen, 
  Calendar, 
  Database, 
  RefreshCw, 
  UploadCloud, 
  CheckCircle2, 
  LogOut, 
  Award, 
  ArrowRight, 
  Sparkles, 
  RotateCcw,
  Check
} from 'lucide-react';
import { NavigationTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { Button, Input, Badge, Card } from '../components/ui';

interface ProfilePageProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, logout, updateProfileName } = useAuth();
  const { 
    progress, 
    setStudentName, 
    supabaseStatus, 
    isDbSyncing, 
    syncWithDatabase, 
    seedDatabase,
    overallProgressPercentage,
    completedTopicsCount,
    averageQuizScorePercentage,
    resetProgress,
    loadSampleData
  } = useProgress();

  const [nameInput, setNameInput] = useState(user?.fullName || progress.studentName || 'Student');
  const [isSavingName, setIsSavingName] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setIsSavingName(true);
    try {
      setStudentName(nameInput.trim());
      if (isAuthenticated) {
        await updateProfileName(nameInput.trim());
      }
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    } catch (err) {
      console.warn('Error saving name:', err);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSeed = async () => {
    const res = await seedDatabase();
    setSeedNotice(res.message);
    setTimeout(() => setSeedNotice(null), 5000);
  };

  const handleLogout = async () => {
    await logout();
    onNavigate('home');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            {(user?.fullName || progress.studentName || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-slate-900">
                {user?.fullName || progress.studentName}
              </h1>
              {isAuthenticated ? (
                <Badge variant="success" size="sm">Verified Account</Badge>
              ) : (
                <Badge variant="default" size="sm">Guest / Offline</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {user?.email || 'Local Student Session'} • Class 6 CBSE
            </p>
          </div>
        </div>

        {/* Action button */}
        {isAuthenticated ? (
          <Button
            id="profile-logout-btn"
            variant="outline"
            size="sm"
            icon={LogOut}
            onClick={handleLogout}
          >
            Log Out
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('login')}
            >
              Log In
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('signup')}
            >
              Sign Up
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Account Details & Editing */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Student Profile Card */}
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800 font-heading flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>Student Information</span>
              </h2>
              {saveSuccessNotice && (
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved successfully!</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSaveName} className="space-y-4">
              <Input
                id="profile-name-input"
                label="Student Full Name"
                icon={User}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                helperText="Used on certificates, AI tutor chats, and progress records."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="profile-email-input"
                  label="Registered Email"
                  icon={Mail}
                  value={user?.email || 'guest@local.app'}
                  disabled
                  helperText="Primary identifier for your cloud progress."
                />

                <Input
                  id="profile-curriculum-input"
                  label="Curriculum & Grade"
                  icon={BookOpen}
                  value="Class 6 CBSE Science"
                  disabled
                  helperText="Chapter 1: The Wonderful World of Science"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  id="save-profile-btn"
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSavingName}
                >
                  Update Name
                </Button>
              </div>
            </form>
          </Card>

          {/* Supabase Cloud Database Integration Status */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className={`w-4 h-4 ${supabaseStatus.isConnected ? 'text-emerald-600' : 'text-slate-500'}`} />
                <h2 className="text-base font-bold text-slate-800 font-heading">
                  Supabase Cloud Storage
                </h2>
              </div>
              <Badge variant={supabaseStatus.isConnected ? 'success' : 'default'} size="sm">
                {supabaseStatus.isConnected ? 'Connected' : 'Local Mode'}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {supabaseStatus.isConnected
                ? 'Your student progress, topic mastery, and practice test answers are safely synchronized with Supabase in real-time.'
                : 'Science Buddy is currently running in offline local mode. All progress is safely saved to your browser storage.'}
            </p>

            {seedNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{seedNotice}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2.5 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeed}
                disabled={isDbSyncing}
                icon={UploadCloud}
              >
                Seed / Import Chapter 1 Data
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => syncWithDatabase()}
                disabled={isDbSyncing}
                icon={RefreshCw}
              >
                Sync with Database
              </Button>
            </div>
          </Card>

        </div>

        {/* Right Column: Progress Quick Card & Helpers */}
        <div className="space-y-6">
          
          {/* Quick Learning Stats Card */}
          <Card className="p-6 space-y-4 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Overall Progress
              </span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-emerald-800 font-heading">
                {overallProgressPercentage}%
              </span>
              <span className="text-xs text-slate-500 font-medium">Chapter 1 Mastery</span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${overallProgressPercentage}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Topics Done</span>
                <strong className="text-slate-800 text-sm">{completedTopicsCount} / 6</strong>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Avg Score</span>
                <strong className="text-emerald-700 text-sm">{averageQuizScorePercentage}%</strong>
              </div>
            </div>

            <Button
              id="view-full-progress-btn"
              variant="primary"
              fullWidth
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => onNavigate('progress')}
            >
              View Full Progress
            </Button>
          </Card>

          {/* Quick Tools & Dev Helpers */}
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Data Management
            </h3>

            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  loadSampleData();
                  setSaveSuccessNotice(true);
                  setTimeout(() => setSaveSuccessNotice(false), 3000);
                }}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Load Sample Progress Data</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              </button>

              <button
                type="button"
                onClick={() => {
                  resetProgress();
                  setSaveSuccessNotice(true);
                  setTimeout(() => setSaveSuccessNotice(false), 3000);
                }}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Reset Chapter Progress (0%)</span>
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
};
