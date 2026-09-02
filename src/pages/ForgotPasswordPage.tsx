import React, { useState, useEffect } from 'react';
import { Mail, Lock, KeyRound, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import { NavigationTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Badge } from '../components/ui';

interface ForgotPasswordPageProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { requestPasswordReset, updatePassword, isPasswordRecoveryMode, clearPasswordRecoveryMode } = useAuth();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingNewPassword, setIsSettingNewPassword] = useState(isPasswordRecoveryMode);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isPasswordRecoveryMode) {
      setIsSettingNewPassword(true);
    }
  }, [isPasswordRecoveryMode]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestPasswordReset(trimmedEmail);
      if (res.success) {
        setSuccessMessage(res.message || 'Password reset link sent! Please check your email.');
      } else {
        setErrorMessage(res.error || 'Failed to send reset email. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage('Network error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await updatePassword(newPassword);
      if (res.success) {
        setSuccessMessage('Password updated successfully! You can now log in with your new password.');
        clearPasswordRecoveryMode();
        setTimeout(() => {
          onNavigate('login');
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Failed to update password. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage('Could not update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-8 sm:my-12 px-4">
      
      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={() => onNavigate('login')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-6 text-white text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold text-white mb-2">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Account Recovery</span>
          </div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">
            {isSettingNewPassword ? 'Set New Password' : 'Reset Your Password'}
          </h1>
          <p className="text-emerald-100 text-xs mt-1 max-w-sm mx-auto">
            {isSettingNewPassword
              ? 'Enter a new password for your Science Buddy account.'
              : 'Enter your registered email address to receive password reset instructions.'}
          </p>
        </div>

        {/* Content Container */}
        <div className="p-6 sm:p-8 space-y-6">
          
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

          {!isSettingNewPassword ? (
            /* Step 1: Request Reset Email */
            <form onSubmit={handleRequestReset} className="space-y-4">
              <Input
                id="reset-email-input"
                label="Registered Email Address"
                type="email"
                icon={Mail}
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading}
                helperText="We will send a secure password recovery link to this address."
              />

              <Button
                id="send-reset-email-btn"
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isLoading}
                icon={KeyRound}
              >
                Send Reset Link
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsSettingNewPassword(true)}
                  className="text-xs text-slate-500 hover:text-emerald-700 font-medium cursor-pointer"
                >
                  Already have a recovery token or want to set a new password? Click here
                </button>
              </div>
            </form>
          ) : (
            /* Step 2: Set New Password */
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <Input
                id="new-password-input"
                label="New Password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
                autoComplete="new-password"
                helperText="Minimum 6 characters."
              />

              <Input
                id="confirm-new-password-input"
                label="Confirm New Password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
              />

              <Button
                id="update-password-btn"
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isLoading}
                icon={CheckCircle2}
              >
                Update Password
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsSettingNewPassword(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                >
                  Back to email reset request
                </button>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Remembered your password?{' '}
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 cursor-pointer"
            >
              Back to Login
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
