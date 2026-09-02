import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft, Sparkles, BookOpen, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { NavigationTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Badge } from '../components/ui';

interface LoginPageProps {
  onNavigate: (tab: NavigationTab) => void;
  onLoginSuccess?: () => void;
  redirectNotice?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onLoginSuccess, redirectNotice }) => {
  const { login, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        setSuccessMessage('Logged in successfully! Redirecting to your dashboard...');
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            onNavigate('home');
          }
        }, 500);
      } else {
        setErrorMessage(res.error || 'Incorrect email or password. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage('Failed to log in. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // If already logged in
  if (isAuthenticated && user) {
    return (
      <div className="max-w-md mx-auto my-12 px-4 animate-in fade-in">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-heading">You are already logged in</h2>
            <p className="text-sm text-slate-600 mt-1">
              Signed in as <span className="font-semibold text-slate-900">{user.email}</span> ({user.fullName})
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onNavigate('profile')}
              fullWidth
            >
              My Profile
            </Button>
            <Button
              variant="primary"
              onClick={() => onNavigate('home')}
              fullWidth
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto my-8 sm:my-12 px-4 animate-in fade-in">
      
      {/* Top back button */}
      <div className="mb-4">
        <button
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-6 text-white text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold text-white mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Class 6 CBSE Science</span>
          </div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Student Login</h1>
          <p className="text-emerald-100 text-xs mt-1 max-w-sm mx-auto">
            Access your chapter progress, test history, and AI tutor notes.
          </p>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8 space-y-5">
          
          {redirectNotice && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="font-medium">{redirectNotice}</div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="font-medium">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="login-email-input"
              label="Student Email Address"
              type="email"
              icon={Mail}
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot_password')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm rounded-xl border border-slate-300 hover:border-slate-400 pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                id="login-submit-button"
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isLoading}
                icon={LogIn}
                className="font-bold shadow-sm"
              >
                Sign In to Science Buddy
              </Button>
            </div>
          </form>

          {/* Sign Up Redirect */}
          <div className="text-center pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Don't have a student account yet?{' '}
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              >
                Create a Free Account
              </button>
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
