import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser } from '../types';
import { getSupabaseBrowserClient } from '../services/supabaseService';

interface AuthContextType {
  user: AuthUser | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPasswordRecoveryMode: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string; confirmationRequired?: boolean }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  clearPasswordRecoveryMode: () => void;
  updateProfileName: (name: string) => Promise<{ success: boolean; error?: string }>;
}

const LOCAL_AUTH_STORAGE_KEY = 'science_buddy_auth_session_v1';
const LOCAL_USERS_STORAGE_KEY = 'science_buddy_registered_users_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to sanitize error messages into friendly, student-appropriate strings
function formatAuthError(err: any): string {
  if (!err) return 'An unexpected error occurred. Please try again.';
  const message = String(err.message || err.error_description || err);

  if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
    return 'Incorrect email or password. Please check your credentials and try again.';
  }
  if (message.includes('User already registered') || message.includes('already_registered') || message.includes('unique constraint')) {
    return 'An account with this email already exists. Please log in instead.';
  }
  if (message.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please check your email inbox to confirm your account before logging in.';
  }
  if (message.includes('rate limit') || message.includes('over_email_send_rate_limit')) {
    return 'Please wait a moment before requesting another reset email.';
  }
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }
  return message.replace(/supabase/gi, 'account').replace(/database/gi, 'system');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPasswordRecoveryMode, setIsPasswordRecoveryMode] = useState<boolean>(false);

  // Initialize Session on App Mount
  useEffect(() => {
    let isMounted = true;
    const client = getSupabaseBrowserClient();

    const initializeAuth = async () => {
      // Check for recovery token in URL hash
      if (typeof window !== 'undefined' && window.location.hash) {
        if (window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token=')) {
          setIsPasswordRecoveryMode(true);
        }
      }

      if (client) {
        try {
          const { data, error } = await client.auth.getSession();
          if (data?.session?.user && isMounted) {
            const suUser = data.session.user;
            setSession(data.session);
            setUser({
              id: suUser.id,
              email: suUser.email || '',
              fullName: suUser.user_metadata?.full_name || suUser.user_metadata?.name || (suUser.email ? suUser.email.split('@')[0] : 'Student'),
              grade: suUser.user_metadata?.grade || 6,
              board: suUser.user_metadata?.board || 'CBSE',
              createdAt: suUser.created_at
            });
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Supabase getSession error:', e);
        }
      }

      // Check local storage fallback session
      try {
        const savedSession = localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
        if (savedSession && isMounted) {
          const parsed = JSON.parse(savedSession);
          if (parsed && parsed.email) {
            setUser(parsed);
            setSession({ user: parsed });
          }
        }
      } catch (e) {
        console.warn('Local session restore error:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen to Supabase Auth state changes if client exists
    let authListenerSubscription: { unsubscribe: () => void } | null = null;
    if (client) {
      try {
        const { data: { subscription } } = client.auth.onAuthStateChange(async (event, currentSession) => {
          if (!isMounted) return;

          if (event === 'PASSWORD_RECOVERY') {
            setIsPasswordRecoveryMode(true);
          }

          if (currentSession?.user) {
            const suUser = currentSession.user;
            setSession(currentSession);
            const authUser: AuthUser = {
              id: suUser.id,
              email: suUser.email || '',
              fullName: suUser.user_metadata?.full_name || suUser.user_metadata?.name || (suUser.email ? suUser.email.split('@')[0] : 'Student'),
              grade: suUser.user_metadata?.grade || 6,
              board: suUser.user_metadata?.board || 'CBSE',
              createdAt: suUser.created_at
            };
            setUser(authUser);
            try {
              localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(authUser));
            } catch {}
          } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            try {
              localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
            } catch {}
          }
        });
        authListenerSubscription = subscription;
      } catch (err) {
        console.warn('Supabase auth state listener error:', err);
      }
    }

    return () => {
      isMounted = false;
      if (authListenerSubscription) {
        authListenerSubscription.unsubscribe();
      }
    };
  }, []);

  // Sign Up function
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    fullName: string
  ): Promise<{ success: boolean; error?: string; confirmationRequired?: boolean }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim() || 'Student';

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const client = getSupabaseBrowserClient();
    if (client) {
      try {
        const { data, error } = await client.auth.signUp({
          email: trimmedEmail,
          password: password,
          options: {
            data: {
              full_name: trimmedName,
              grade: 6,
              board: 'CBSE'
            }
          }
        });

        if (error) {
          return { success: false, error: formatAuthError(error) };
        }

        if (data?.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || trimmedEmail,
            fullName: trimmedName,
            grade: 6,
            board: 'CBSE',
            createdAt: data.user.created_at
          };

          if (data.session) {
            setUser(authUser);
            setSession(data.session);
            try {
              localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(authUser));
            } catch {}
            return { success: true, confirmationRequired: false };
          } else {
            // Email confirmation required by Supabase settings
            return { success: true, confirmationRequired: true };
          }
        }
      } catch (err: any) {
        return { success: false, error: formatAuthError(err) };
      }
    }

    // Local / Offline fallback account registration
    try {
      const existingUsersRaw = localStorage.getItem(LOCAL_USERS_STORAGE_KEY);
      const registeredUsers: Record<string, { password: string; user: AuthUser }> = existingUsersRaw 
        ? JSON.parse(existingUsersRaw) 
        : {};

      if (registeredUsers[trimmedEmail]) {
        return { success: false, error: 'An account with this email already exists. Please log in instead.' };
      }

      const newAuthUser: AuthUser = {
        id: `local-student-${Date.now()}`,
        email: trimmedEmail,
        fullName: trimmedName,
        grade: 6,
        board: 'CBSE',
        createdAt: new Date().toISOString()
      };

      registeredUsers[trimmedEmail] = {
        password: password,
        user: newAuthUser
      };

      localStorage.setItem(LOCAL_USERS_STORAGE_KEY, JSON.stringify(registeredUsers));
      localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(newAuthUser));
      setUser(newAuthUser);
      setSession({ user: newAuthUser });

      return { success: true, confirmationRequired: false };
    } catch (e: any) {
      return { success: false, error: 'Could not create account locally. Please try again.' };
    }
  }, []);

  // Login function
  const login = useCallback(async (
    email: string, 
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    const client = getSupabaseBrowserClient();
    if (client) {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: trimmedEmail,
          password: password
        });

        if (error) {
          return { success: false, error: formatAuthError(error) };
        }

        if (data?.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || trimmedEmail,
            fullName: data.user.user_metadata?.full_name || data.user.user_metadata?.name || trimmedEmail.split('@')[0],
            grade: data.user.user_metadata?.grade || 6,
            board: data.user.user_metadata?.board || 'CBSE',
            createdAt: data.user.created_at
          };

          setUser(authUser);
          setSession(data.session);
          try {
            localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(authUser));
          } catch {}
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: formatAuthError(err) };
      }
    }

    // Local / Offline fallback account login
    try {
      const existingUsersRaw = localStorage.getItem(LOCAL_USERS_STORAGE_KEY);
      const registeredUsers: Record<string, { password: string; user: AuthUser }> = existingUsersRaw 
        ? JSON.parse(existingUsersRaw) 
        : {};

      const record = registeredUsers[trimmedEmail];
      if (!record || record.password !== password) {
        return { success: false, error: 'Incorrect email or password. Please check your details and try again.' };
      }

      setUser(record.user);
      setSession({ user: record.user });
      localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(record.user));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: 'Login verification failed. Please try again.' };
    }
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseBrowserClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err: any) {
        console.warn('Supabase signOut error:', err);
      }
    }

    setUser(null);
    setSession(null);
    setIsPasswordRecoveryMode(false);
    try {
      localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
    } catch {}

    return { success: true };
  }, []);

  // Request Password Reset function
  const requestPasswordReset = useCallback(async (
    email: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const client = getSupabaseBrowserClient();
    if (client) {
      try {
        const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
        const { error } = await client.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: redirectTo
        });

        if (error) {
          return { success: false, error: formatAuthError(error) };
        }

        return { 
          success: true, 
          message: `Password reset instructions have been sent to ${trimmedEmail}. Please check your inbox and spam folder.` 
        };
      } catch (err: any) {
        return { success: false, error: formatAuthError(err) };
      }
    }

    // Local / Offline fallback password reset simulation
    return {
      success: true,
      message: `Password reset request received for ${trimmedEmail}. In offline mode, you can immediately set a new password on this screen.`
    };
  }, []);

  // Update Password function
  const updatePassword = useCallback(async (
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    const client = getSupabaseBrowserClient();
    if (client) {
      try {
        const { error } = await client.auth.updateUser({
          password: newPassword
        });

        if (error) {
          return { success: false, error: formatAuthError(error) };
        }

        setIsPasswordRecoveryMode(false);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: formatAuthError(err) };
      }
    }

    // Local / Offline fallback password update
    if (user?.email) {
      try {
        const existingUsersRaw = localStorage.getItem(LOCAL_USERS_STORAGE_KEY);
        if (existingUsersRaw) {
          const registeredUsers = JSON.parse(existingUsersRaw);
          if (registeredUsers[user.email]) {
            registeredUsers[user.email].password = newPassword;
            localStorage.setItem(LOCAL_USERS_STORAGE_KEY, JSON.stringify(registeredUsers));
          }
        }
      } catch {}
    }

    setIsPasswordRecoveryMode(false);
    return { success: true };
  }, [user]);

  // Update profile full name
  const updateProfileName = useCallback(async (name: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: 'Name cannot be empty.' };

    const client = getSupabaseBrowserClient();
    if (client) {
      try {
        await client.auth.updateUser({
          data: { full_name: trimmed }
        });
      } catch (err) {
        console.warn('Supabase update user metadata error:', err);
      }
    }

    setUser(prev => prev ? { ...prev, fullName: trimmed } : null);
    try {
      const saved = localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.fullName = trimmed;
        localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {}

    return { success: true };
  }, []);

  const clearPasswordRecoveryMode = useCallback(() => {
    setIsPasswordRecoveryMode(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        isPasswordRecoveryMode,
        login,
        signUp,
        logout,
        requestPasswordReset,
        updatePassword,
        clearPasswordRecoveryMode,
        updateProfileName
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
