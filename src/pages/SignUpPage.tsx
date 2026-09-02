import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, ArrowLeft, Sparkles, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { NavigationTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { Button, Input, Badge } from '../components/ui';

interface SignUpPageProps {
  onNavigate: (tab: NavigationTab) => void;
  onSignUpSuccess?: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigate, onSignUpSuccess }) => {
  const { signUp, isAuthenticated } = useAuth();
  const { setStudentName } = useProgress();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setConfirmationNotice(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrorMessage('Please enter your full name or nickname.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signUp(trimmedEmail, password, trimmedName);
      if (res.success) {
        setStudentName(trimmedName);
        if (res.confirmationRequired) {
          setConfirmationNotice(
            `Account registered! A confirmation link has been sent to ${trimmedEmail}. Please verify your email before logging in.`
          );
        } else {
          if (onSignUpSuccess) {
            onSignUpSuccess();
          } else {
            onNavigate('home');
          }
        }
      } else {
        setErrorMessage(res.error || 'Failed to create account. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage('Sign up failed. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // If already authenticated
  if (isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-heading">You are already registered & signed in</h2>
            <p className="text-sm text-slate-600 mt-1">
              You have an active Science Buddy session.
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
              Start Learning
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto my-8 sm:my-12 px-4">
      
      {/* Top back button */}
      <div className="mb-4">
        <button
          onClick={() => onNavigate('home')}
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
            <span>Class 6 CBSE • Free Student Access</span>
          </div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Create Student Account</h1>
          <p className="text-emerald-100 text-xs mt-1 max-w-sm mx-auto">
            Save your progress, master Chapter 1 concepts, and take practice tests anytime.
          </p>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {confirmationNotice ? (
            <div className="space-y-5 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 font-heading">Registration Successful</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  {confirmationNotice}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => onNavigate('login')}
                fullWidth
              >
                Proceed to Login
              </Button>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="font-medium">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Student Full Name */}
                <Input
                  id="signup-name-input"
                  label="Student Full Name"
                  type="text"
                  icon={User}
                  placeholder="e.g. Aarav Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isLoading}
                  helperText="Used on your progress reports and AI tutor discussions."
                />

                {/* Email Address */}
                <Input
                  id="signup-email-input"
                  label="Email Address"
                  type="email"
                  icon={Mail}
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password (Min 6 characters)
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-password-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={isLoading}
                      autoComplete="new-password"
                      className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-sm rounded-xl border border-slate-300 hover:border-slate-400 pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <Input
                  id="signup-confirm-password-input"
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  icon={Lock}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />

                {/* Class / Curriculum Badge Info */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Grade / Curriculum</span>
                  </div>
                  <Badge variant="success" size="sm">Class 6 CBSE Science</Badge>
                </div>

                <Button
                  id="signup-submit-btn"
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                  icon={UserPlus}
                >
                  Create Account
                </Button>
              </form>

              {/* Already have an account link */}
              <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600 space-y-2">
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 cursor-pointer"
                  >
                    Log In
                  </button>
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
