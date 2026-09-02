import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  DbStudent, 
  DbChapter, 
  DbTopic, 
  DbStudentProgress, 
  DbQuizAttempt, 
  DbStudentAnswer,
  SupabaseSyncStatus,
  QuizAttemptResult,
  SubmittedAnswer
} from '../types';
import curiosityCh1 from '../data/chapters/chapter_1_curiosity.json';

// Detect client-side Supabase credentials if provided
const rawClientUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const clientSupabaseUrl = rawClientUrl ? rawClientUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '') : '';
const clientSupabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

let browserClient: SupabaseClient | null = null;
if (clientSupabaseUrl && clientSupabaseAnonKey) {
  try {
    browserClient = createClient(clientSupabaseUrl, clientSupabaseAnonKey, {
      auth: { 
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch (err) {
    console.warn('Could not initialize direct browser Supabase client:', err);
  }
}

/**
 * Get direct browser Supabase Client
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  return browserClient;
}

/**
 * Check Supabase Connection Status
 */
export async function checkSupabaseStatus(): Promise<SupabaseSyncStatus> {
  try {
    const res = await fetch('/api/supabase/status');
    if (!res.ok) {
      return {
        isConfigured: false,
        isConnected: false,
        isSyncing: false,
        lastSyncedAt: null,
        errorMessage: 'Backend status check returned HTTP ' + res.status
      };
    }
    const data = await res.json();
    return {
      isConfigured: !!data.configured,
      isConnected: !!data.connected,
      isSyncing: false,
      lastSyncedAt: data.connected ? new Date().toISOString() : null,
      errorMessage: data.connected ? null : (data.message || null),
      stats: data.stats
    };
  } catch (err: any) {
    return {
      isConfigured: false,
      isConnected: false,
      isSyncing: false,
      lastSyncedAt: null,
      errorMessage: err?.message || 'Database unavailable (using local offline storage).'
    };
  }
}

/**
 * Seed Chapter 1 Curriculum into Supabase
 */
export async function seedCurriculumToDatabase(
  studentId: string = 'student-1',
  studentName: string = 'Student'
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/supabase/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        student_name: studentName
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to seed database.');
    }

    return {
      success: true,
      message: data.message || 'Chapter 1 curriculum successfully imported to Supabase!'
    };
  } catch (err: any) {
    console.warn('Supabase seed error (using local JSON seed fallback):', err?.message);
    return {
      success: false,
      message: err?.message || 'Supabase is currently offline. Content loaded from local JSON pack.'
    };
  }
}

/**
 * Fetch database-driven chapters and topics (with local JSON fallback)
 */
export async function fetchCurriculumFromDatabase(): Promise<{
  source: 'supabase' | 'local_json';
  chapters: any[];
}> {
  try {
    const res = await fetch('/api/supabase/curriculum');
    if (res.ok) {
      const data = await res.json();
      if (data.chapters && data.chapters.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Could not fetch curriculum from DB, using bundled JSON pack:', e);
  }
  return {
    source: 'local_json',
    chapters: [curiosityCh1]
  };
}

/**
 * Save / Upsert Student Progress for a Topic
 * Called when a student views a lesson, passes a quick check, or completes a topic.
 */
export async function saveTopicProgressToDatabase(
  studentId: string,
  chapterId: string,
  topicId: string,
  completionPercent: number,
  accuracy: number,
  attempts: number = 1,
  studentName: string = 'Student'
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/supabase/student-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        student_name: studentName,
        chapter_id: chapterId,
        topic_id: topicId,
        completion_percent: completionPercent,
        accuracy: accuracy,
        attempts: attempts
      })
    });

    const data = await res.json();
    return { success: !!data.success, error: data.error };
  } catch (err: any) {
    console.warn('Database progress sync skipped (offline mode):', err?.message);
    return { success: false, error: err?.message };
  }
}

/**
 * Record Quiz Attempt & Individual Answers in Supabase
 * Creates a record in quiz_attempts and individual rows in student_answers.
 */
export async function saveQuizAttemptToDatabase(
  studentId: string,
  chapterId: string,
  quizResult: QuizAttemptResult,
  studentName: string = 'Student'
): Promise<{ success: boolean; attemptId?: string; error?: string }> {
  try {
    // Map individual answers for student_answers table
    const answersPayload = (quizResult.userAnswers || []).map(ans => ({
      question_id: ans.question_id,
      student_answer: ans.student_answer || '(unanswered)',
      score: ans.score !== undefined ? ans.score : (ans.isCorrect ? 1 : 0),
      ai_feedback: ans.evaluation || null
    }));

    const res = await fetch('/api/supabase/quiz-attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        student_name: studentName,
        chapter_id: chapterId,
        quiz_type: quizResult.quizType,
        total_marks: quizResult.totalMarks || quizResult.totalQuestions,
        marks_obtained: quizResult.marksObtained !== undefined ? quizResult.marksObtained : quizResult.score,
        percentage: quizResult.percentage,
        answers: answersPayload
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to save quiz attempt.');
    }

    return {
      success: true,
      attemptId: data.attempt_id
    };
  } catch (err: any) {
    console.warn('Quiz attempt database sync skipped (offline mode):', err?.message);
    return {
      success: false,
      error: err?.message
    };
  }
}

/**
 * Fetch Student Data & History from Supabase
 */
export async function fetchStudentDataFromDatabase(studentId: string): Promise<{
  student: DbStudent | null;
  progress: DbStudentProgress[];
  quizAttempts: (DbQuizAttempt & { student_answers?: DbStudentAnswer[] })[];
  error?: string;
}> {
  try {
    const res = await fetch(`/api/supabase/student-data?student_id=${encodeURIComponent(studentId)}`);
    if (res.ok) {
      const data = await res.json();
      return {
        student: data.student || null,
        progress: data.progress || [],
        quizAttempts: data.quiz_attempts || []
      };
    }
    return { student: null, progress: [], quizAttempts: [], error: 'HTTP ' + res.status };
  } catch (err: any) {
    return {
      student: null,
      progress: [],
      quizAttempts: [],
      error: err?.message || 'Offline'
    };
  }
}
