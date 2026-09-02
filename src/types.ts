export type NavigationTab = 
  | 'landing'
  | 'home' 
  | 'learn' 
  | 'lesson' 
  | 'tutor' 
  | 'practice' 
  | 'quiz_active' 
  | 'result' 
  | 'progress'
  | 'login'
  | 'signup'
  | 'forgot_password'
  | 'profile';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  grade?: number;
  board?: string;
  createdAt?: string;
}

// -------------------------------------------------------------
// Science Buddy Content Pack JSON Standard Schema Types
// -------------------------------------------------------------

export interface ContentPackMetadata {
  product: string;
  phase: string;
  board: string;
  grade: number;
  subject: string;
  textbook: string;
  chapter_number: number;
  chapter_title: string;
  source_file: string;
  source_basis: string;
  note?: string;
}

export interface ContentPackTerm {
  term: string;
  meaning: string;
}

export interface ContentPackStep {
  step: number;
  name: string;
  explanation: string;
}

export interface ContentPackExample {
  context: string;
  example: string;
}

export interface ContentPackTheme {
  theme: string;
  concepts: string;
}

export interface ContentPackLesson {
  concept_explanation: string;
  simple_explanation?: string;
  key_points?: string[];
  important_terms?: ContentPackTerm[];
  real_life_examples?: string[];
  steps?: ContentPackStep[];
  examples?: ContentPackExample[];
  themes?: ContentPackTheme[];
  quick_check?: string[];
}

export interface ContentPackTopic {
  topic_id: string;
  title: string;
  source_section: string;
  learning_objective: string;
  lesson: ContentPackLesson;
}

export type QuestionType = 'mcq' | 'fill_blank' | 'short_answer' | 'subjective';

export interface ContentPackQuestion {
  id: string;
  topic_id: string;
  type: QuestionType;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
  expected_key_points?: string[];
  marks: number;
}

export interface SubjectiveRubricCriterion {
  marks: number;
  description: string;
}

export interface ContentPackSubjectiveRubricItem {
  marks: number;
  criteria: SubjectiveRubricCriterion[];
}

export interface ContentPackExamBlueprint {
  exam_id: string;
  title: string;
  questions: number;
  suggested_selection: string[];
  total_marks: number;
  feedback_mode: 'Immediate' | 'After submission' | string;
  note?: string;
}

export interface ChapterContentPack {
  metadata: ContentPackMetadata;
  learning_objectives: string[];
  topics: ContentPackTopic[];
  questions: ContentPackQuestion[];
  answer_key: {
    MCQ: Record<string, string>;
    fill_in_the_blank: Record<string, string>;
    short_answer_and_subjective: string;
  };
  subjective_marking_rubric: Record<string, ContentPackSubjectiveRubricItem>;
  exam_blueprints: ContentPackExamBlueprint[];
  ai_tutor_system_prompt: string;
  subjective_evaluation_prompt: string;
  database_schema?: Record<string, string[]>;
}

// -------------------------------------------------------------
// Unified Application View Types
// -------------------------------------------------------------

export interface ImportantTerm {
  term: string;
  meaning: string;
}

export interface Topic {
  id: string;
  order: number;
  title: string;
  sourceSection: string;
  learningObjective: string;
  lesson: ContentPackLesson;
  estimatedMinutes: number;
  iconName: string;
  category: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  subject: string;
  grade: number;
  board: string;
  textbook: string;
  description: string;
  sourceFile: string;
  sourceBasis: string;
  learningObjectives: string[];
  totalTopics: number;
  topics: Topic[];
}

export interface SubjectiveEvaluationResult {
  score: number;
  max_score: number;
  strengths: string[];
  missing_points: string[];
  misconceptions: string[];
  improvement_tip: string;
  suggested_answer: string;
}

export interface QuizQuestion {
  id: string;
  topicId: string;
  topicTitle: string;
  type: QuestionType;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
  expected_key_points?: string[];
  marks: number;
  rubric?: ContentPackSubjectiveRubricItem;
}

export interface QuizConfig {
  id: string;
  title: string;
  type: 'practice' | 'chapter_test';
  description: string;
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Mixed';
  estimatedTime: string;
  feedbackMode: 'Immediate' | 'After submission';
  suggestedSelection?: string[];
  topicFilter?: string;
}

export type PerformanceCategory = 'Strong' | 'Developing' | 'Needs Practice';

export interface TopicResultMetrics {
  topicId: string;
  topicTitle: string;
  total: number;             // total questions in this topic
  totalQuestions: number;    // alias for total questions
  attempts: number;          // attempted questions count
  correct: number;           // correct questions count
  incorrect: number;         // incorrect questions count
  unattempted: number;       // unattempted count
  totalMarks: number;        // total marks in this topic
  score: number;             // marks obtained in this topic
  marks: number;             // alias for marks obtained
  accuracy: number;          // percentage of correct answers (0 - 100)
  percentage: number;        // percentage score (0 - 100)
  performance_category: PerformanceCategory; // Strong, Developing, Needs Practice
}

export interface AIRecommendationResult {
  summary: string;
  strong_area: string;
  weak_area: string;
  recommended_topic: string;
  recommended_action: string;
  reason: string;
}

export interface StudentPerformancePayload {
  topicScores: Array<{
    topicId: string;
    topicTitle: string;
    accuracy: number;
    scoreDisplay?: string;
    attempts: number;
    classification?: string;
  }>;
  quizScores: Array<{
    quizTitle: string;
    percentage: number;
    score: number;
    totalMarks: number;
    timestamp?: string;
  }>;
  testScores: Array<{
    testTitle: string;
    percentage: number;
    score: number;
    totalMarks: number;
    timestamp?: string;
  }>;
  completedTopics: string[];
  incorrectQuestions: Array<{
    question: string;
    topicTitle: string;
    studentAnswer?: string;
    correctAnswer?: string;
  }>;
  recentActivity?: string;
}

export interface StudentTutorContext {
  weakTopics: Array<{
    topicId: string;
    topicTitle: string;
    accuracy?: number;
    attempts?: number;
    classification?: string;
  }>;
  primaryWeakSkill?: string;
  primaryWeakTopicTitle?: string;
  recentIncorrectAnswers: Array<{
    question: string;
    topicTitle: string;
    studentAnswer?: string;
    correctAnswer?: string;
  }>;
  completedLessons: string[];
  quizPerformanceSummary: {
    quizzesAttempted: number;
    averageScore: number;
    latestQuizTitle?: string;
    latestScore?: string;
  };
}

export interface RecommendedAction {
  id: string;
  type: 'revise_topic' | 'practice_topic' | 'retake_test' | 'ask_tutor' | 'explore_next';
  title: string;
  description: string;
  topicId?: string;
  topicTitle?: string;
  urgency: 'high' | 'medium' | 'low';
  buttonLabel: string;
}

export interface SubmittedAnswer {
  question_id: string;
  topic: string;
  topicId: string;
  question: string;
  type: QuestionType;
  student_answer: string;
  correct_answer: string;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  isAttempted?: boolean;
  explanation: string;
  options?: string[];
  expected_key_points?: string[];
  rubric?: ContentPackSubjectiveRubricItem;
  evaluation?: SubjectiveEvaluationResult;
  evaluationError?: string;
  isEvaluating?: boolean;
}

export interface QuizAttemptResult {
  id?: string;
  quizTitle: string;
  quizType: 'practice' | 'chapter_test';
  totalQuestions: number;       // total_questions
  attemptedQuestions: number;   // attempted_questions
  unattemptedQuestions: number; // unattempted_questions
  totalMarks: number;           // total_marks
  score: number;                // marks_obtained
  marksObtained: number;        // alias for marks_obtained
  percentage: number;           // percentage (0 - 100)
  correctAnswers: number;       // correct_answers
  incorrectAnswers: number;     // incorrect_answers
  performanceCategory: PerformanceCategory; // Strong / Developing / Needs Practice
  timeSpentSeconds: number;
  timestamp: string;
  userAnswers: SubmittedAnswer[];
  topicPerformance: TopicResultMetrics[]; // topic_scores with attempts, correct, marks, accuracy, category
  reviewQuestions: SubmittedAnswer[];    // questions requiring review
  recommendedActions: RecommendedAction[]; // recommended next actions
  recommendedRevisionTopics?: {
    topicId: string;
    topicTitle: string;
    reason: string;
  }[];
}

export interface TopicProgress {
  topicId: string;
  completed: boolean;
  viewedSectionsCount: number;
  quickCheckPassed: boolean;
  masteryPercentage: number;
}

export interface UserProgressData {
  studentName: string;
  topicProgress: Record<string, TopicProgress>;
  quizHistory: QuizAttemptResult[];
  lastActiveTopicId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  promptType?: string;
}

// -------------------------------------------------------------
// Supabase Database Entity Types
// -------------------------------------------------------------

export interface DbStudent {
  id: string;
  name: string;
  grade: number;
  board: string;
  created_at?: string;
}

export interface DbChapter {
  id: string;
  grade: number;
  subject: string;
  chapter_number: number;
  title: string;
  created_at?: string;
}

export interface DbTopic {
  id: string;
  chapter_id: string;
  title: string;
  sequence: number;
  learning_objective?: string;
}

export interface DbStudentProgress {
  id?: string;
  student_id: string;
  chapter_id: string;
  topic_id: string;
  completion_percent: number;
  accuracy: number;
  attempts: number;
  updated_at?: string;
}

export interface DbQuizAttempt {
  id?: string;
  student_id: string;
  chapter_id: string;
  quiz_type: 'practice' | 'chapter_test' | string;
  total_marks: number;
  marks_obtained: number;
  percentage: number;
  completed_at?: string;
}

export interface DbStudentAnswer {
  id?: string;
  attempt_id: string;
  question_id: string;
  student_answer: string;
  score: number;
  ai_feedback?: any;
  created_at?: string;
}

export interface SupabaseSyncStatus {
  isConfigured: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  stats?: {
    students: number;
    chapters: number;
    topics: number;
    progressCount: number;
    attemptsCount: number;
  };
}
