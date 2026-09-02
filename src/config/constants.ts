/**
 * Application Configuration & Constants for Science Buddy
 */

export const APP_CONFIG = {
  name: 'Science Buddy',
  description: 'AI-powered micro-tutor for Indian Class 6 CBSE Science students.',
  defaultChapterKey: 'ch1',
  defaultStudentId: 'student-1',
  defaultStudentName: 'Student',
  grade: 6,
  board: 'CBSE',
  subject: 'Science',
  textbook: 'Curiosity'
} as const;

export const PERFORMANCE_THRESHOLDS = {
  strong: 80,
  developing: 60
} as const;

export const QUIZ_SETTINGS = {
  chapterTestSeconds: 1200, // 20 minutes
  practiceQuizSeconds: 480,  // 8 minutes
  defaultSubjectiveMarks: 3,
  defaultShortAnswerMarks: 2,
  defaultObjectiveMarks: 1
} as const;

export const TTS_SETTINGS = {
  defaultSpeedRate: 0.95,
  defaultPitch: 1.0,
  defaultVolume: 1.0,
  preferredLanguages: ['en-IN', 'en-GB', 'en-US', 'en']
} as const;

export const API_ROUTES = {
  tutor: '/api/tutor',
  evaluateSubjective: '/api/evaluate-subjective',
  evaluateBatchSubjective: '/api/evaluate-batch-subjective',
  recommendations: '/api/recommendations',
  supabaseStatus: '/api/supabase/status',
  supabaseSeed: '/api/supabase/seed',
  supabaseCurriculum: '/api/supabase/curriculum',
  supabaseStudentProgress: '/api/supabase/student-progress',
  supabaseQuizAttempt: '/api/supabase/quiz-attempt',
  supabaseStudentData: '/api/supabase/student-data'
} as const;
