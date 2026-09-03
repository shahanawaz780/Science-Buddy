import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  UserProgressData, 
  QuizAttemptResult, 
  TopicProgress, 
  SupabaseSyncStatus,
  Chapter,
  ChapterProgressSummary
} from '../types';
import { 
  getChapter, 
  getAllChapters, 
  getTopicsForChapter,
  normalizeChapterKey 
} from '../services/curriculumService';
import { CHAPTER_1_DATA } from '../data/chapter1Data';
import { 
  checkSupabaseStatus, 
  seedCurriculumToDatabase, 
  saveTopicProgressToDatabase, 
  saveQuizAttemptToDatabase,
  fetchStudentDataFromDatabase,
  fetchCurriculumFromDatabase
} from '../services/supabaseService';
import { useAuth } from './AuthContext';

export interface RecommendedActivity {
  type: 'weak_topic_revision' | 'continue_lesson' | 'take_quiz' | 'next_chapter' | 'general';
  title: string;
  subtitle: string;
  description: string;
  actionLabel: string;
  actionType: 'lesson' | 'practice' | 'chapter' | 'chapters';
  topicId?: string;
  chapterId?: string;
}

interface ProgressContextType {
  progress: UserProgressData;
  studentId: string;
  activeChapterId: string;
  setActiveChapterId: (chapterId: string) => void;
  currentChapter: Chapter;
  allChapters: Chapter[];
  getChapterProgress: (chapterId: string) => ChapterProgressSummary;
  setStudentName: (name: string) => void;
  markTopicCompleted: (topicId: string, chapterId?: string) => void;
  recordTopicView: (topicId: string, chapterId?: string) => void;
  recordQuickCheckPassed: (topicId: string, chapterId?: string) => void;
  recordQuizResult: (result: QuizAttemptResult) => void;
  resetProgress: () => void;
  loadSampleData: () => void;
  activeTopicId: string;
  setActiveTopicId: (topicId: string) => void;
  overallProgressPercentage: number;
  completedTopicsCount: number;
  overallCurriculumProgressPercentage: number;
  averageQuizScorePercentage: number;
  latestQuizResult: QuizAttemptResult | null;
  strongTopics: { id: string; title: string; score: number }[];
  weakTopics: { id: string; title: string; score: number; reason: string; chapterNumber?: number; chapterTitle?: string }[];
  recommendedActivity: RecommendedActivity;
  // Supabase Database States & Actions
  supabaseStatus: SupabaseSyncStatus;
  isDbSyncing: boolean;
  syncWithDatabase: (targetStudentId?: string) => Promise<void>;
  seedDatabase: () => Promise<{ success: boolean; message: string }>;
}

// Clean un-hardcoded initial progress; real progress comes directly from Supabase
const buildInitialProgress = (studentName: string = 'Student'): UserProgressData => {
  return {
    studentName,
    activeChapterId: 'chapter-1',
    lastActiveChapterId: 'chapter-1',
    lastActiveTopicId: CHAPTER_1_DATA.topics[0]?.id || 'T1',
    topicProgress: {},
    quizHistory: []
  };
};

const STORAGE_KEY = 'science_buddy_class6_progress_v2';
const STUDENT_ID_KEY = 'science_buddy_student_id';

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [studentId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STUDENT_ID_KEY);
      if (saved) return saved;
      const newId = 'student-1';
      localStorage.setItem(STUDENT_ID_KEY, newId);
      return newId;
    } catch {
      return 'student-1';
    }
  });

  const effectiveStudentId = user?.id || studentId;
  const effectiveStudentName = user?.fullName || (user?.email ? user.email.split('@')[0] : 'Student');

  const [activeChapterId, setActiveChapterIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.activeChapterId) return normalizeChapterKey(parsed.activeChapterId);
      }
    } catch (e) {
      console.warn('Could not read saved activeChapterId:', e);
    }
    return 'chapter-1';
  });

  const [progress, setProgress] = useState<UserProgressData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.topicProgress) {
          return {
            studentName: parsed.studentName || 'Student',
            activeChapterId: parsed.activeChapterId || 'chapter-1',
            lastActiveChapterId: parsed.lastActiveChapterId || parsed.activeChapterId || 'chapter-1',
            lastActiveTopicId: parsed.lastActiveTopicId || 'T1',
            topicProgress: parsed.topicProgress,
            chapterProgress: parsed.chapterProgress || {},
            quizHistory: Array.isArray(parsed.quizHistory) ? parsed.quizHistory : []
          };
        }
      }
    } catch (e) {
      console.warn('Could not read saved progress, using initialized progress:', e);
    }
    return buildInitialProgress();
  });

  const setActiveChapterId = useCallback((chapterId: string) => {
    const normalized = normalizeChapterKey(chapterId);
    setActiveChapterIdState(normalized);
    setProgress(prev => ({
      ...prev,
      activeChapterId: normalized,
      lastActiveChapterId: normalized
    }));
  }, []);

  // Current active Chapter object & All Chapters
  const currentChapter = getChapter(activeChapterId);
  const allChapters = getAllChapters();

  const [activeTopicId, setActiveTopicId] = useState<string>(
    currentChapter.topics[0]?.id || 'T1'
  );
  
  // When active chapter changes, set active topic if needed
  useEffect(() => {
    const chTopics = getTopicsForChapter(activeChapterId);
    if (chTopics.length > 0) {
      const hasTopic = chTopics.some(t => t.id === activeTopicId);
      if (!hasTopic) {
        setActiveTopicId(chTopics[0].id);
      }
    }
  }, [activeChapterId]);

  const [latestQuizResult, setLatestQuizResult] = useState<QuizAttemptResult | null>(
    progress.quizHistory.length > 0 ? progress.quizHistory[progress.quizHistory.length - 1] : null
  );

  // Supabase Sync Status State
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseSyncStatus>({
    isConfigured: false,
    isConnected: false,
    isSyncing: false,
    lastSyncedAt: null,
    errorMessage: null
  });
  const [isDbSyncing, setIsDbSyncing] = useState<boolean>(false);

  // Periodic and initial Supabase status check
  const refreshDbStatus = useCallback(async () => {
    const status = await checkSupabaseStatus();
    setSupabaseStatus(status);
    return status;
  }, []);

  // Sync data with Supabase Database
  const syncWithDatabase = useCallback(async (targetStudentId?: string) => {
    const studentToFetch = targetStudentId || effectiveStudentId;
    setIsDbSyncing(true);
    setSupabaseStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const status = await checkSupabaseStatus();
      setSupabaseStatus(status);

      if (status.isConnected) {
        const dbData = await fetchStudentDataFromDatabase(studentToFetch);
        
        // 1. Update Student Name if available from Supabase
        if (dbData.student?.name) {
          setProgress(prev => ({ ...prev, studentName: dbData.student!.name }));
        } else if (effectiveStudentName && effectiveStudentName !== 'Student') {
          setProgress(prev => ({ ...prev, studentName: effectiveStudentName }));
        }

        // 2. Merge actual topic progress from Supabase
        if (dbData && dbData.progress && dbData.progress.length > 0) {
          setProgress(prev => {
            const updatedTopicProgress = { ...prev.topicProgress };
            dbData.progress.forEach(p => {
              const current = updatedTopicProgress[p.topic_id] || {
                topicId: p.topic_id,
                chapterId: p.chapter_id || 'chapter-1',
                completed: false,
                viewedSectionsCount: 0,
                quickCheckPassed: false,
                masteryPercentage: 0
              };
              const isCompleted = (Number(p.completion_percent) || 0) >= 100 || current.completed;
              const mastery = Math.round(Number(p.accuracy) || Number(p.completion_percent) || 0);
              updatedTopicProgress[p.topic_id] = {
                ...current,
                chapterId: p.chapter_id || current.chapterId,
                completed: isCompleted,
                masteryPercentage: mastery
              };
            });
            return {
              ...prev,
              topicProgress: updatedTopicProgress
            };
          });
        }

        // 3. Merge actual quiz attempts from Supabase
        if (dbData && dbData.quizAttempts && dbData.quizAttempts.length > 0) {
          const mappedQuizHistory: QuizAttemptResult[] = dbData.quizAttempts.map(attempt => {
            const ch = getChapter(attempt.chapter_id || 'chapter-1');
            const pct = Math.round(Number(attempt.percentage) || 0);
            const marksObt = Number(attempt.marks_obtained) || 0;
            const totalMarks = Number(attempt.total_marks) || 10;
            const chNum = attempt.chapter_id === 'chapter-2' ? 2 : (ch?.number || 1);
            const chTitle = ch?.title || (attempt.chapter_id === 'chapter-2' ? 'Diversity in the Living World' : 'The Wonderful World of Science');
            
            return {
              id: attempt.id,
              chapterId: attempt.chapter_id || 'chapter-1',
              chapterNumber: chNum,
              chapterTitle: chTitle,
              quizTitle: attempt.quiz_type === 'exam' ? `Chapter ${chNum} Exam` : `Chapter ${chNum} Practice Quiz`,
              quizType: (attempt.quiz_type as any) || 'practice',
              totalQuestions: totalMarks,
              attemptedQuestions: totalMarks,
              unattemptedQuestions: 0,
              totalMarks: totalMarks,
              correctAnswers: Math.round((marksObt / totalMarks) * totalMarks),
              incorrectAnswers: totalMarks - Math.round((marksObt / totalMarks) * totalMarks),
              score: marksObt,
              marksObtained: marksObt,
              percentage: pct,
              performanceCategory: pct >= 80 ? 'Strong' : pct >= 60 ? 'Developing' : 'Needs Practice',
              timeSpentSeconds: 180,
              timestamp: attempt.completed_at || new Date().toISOString(),
              userAnswers: (attempt.student_answers || []).map((sa: any) => ({
                question_id: sa.question_id || 'q-1',
                topic: sa.topic || 'Science Concept',
                topicId: sa.topicId || sa.topic_id || 'T1',
                question: sa.question || 'Science Question',
                type: (sa.type as any) || 'mcq',
                student_answer: String(sa.student_answer || ''),
                correct_answer: String(sa.correct_answer || ''),
                score: Number(sa.score) || 0,
                maxScore: Number(sa.maxScore || sa.max_score) || 1,
                isCorrect: (Number(sa.score) || 0) > 0,
                isAttempted: true,
                explanation: sa.explanation || '',
                evaluation: sa.ai_feedback
              })),
              topicPerformance: [],
              reviewQuestions: [],
              recommendedActions: []
            };
          });

          setProgress(prev => ({
            ...prev,
            quizHistory: mappedQuizHistory
          }));

          if (mappedQuizHistory.length > 0) {
            setLatestQuizResult(mappedQuizHistory[0]);
          }
        }

        // 4. Fetch and sync curriculum from Supabase
        try {
          await fetchCurriculumFromDatabase();
        } catch (cErr) {
          console.warn('Curriculum DB fetch warning:', cErr);
        }

        setSupabaseStatus(prev => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: new Date().toISOString(),
          errorMessage: null
        }));
      } else {
        setSupabaseStatus(prev => ({
          ...prev,
          isSyncing: false
        }));
      }
    } catch (err: any) {
      console.warn('Supabase sync warning:', err);
      setSupabaseStatus(prev => ({
        ...prev,
        isSyncing: false,
        errorMessage: err?.message || 'Sync failed.'
      }));
    } finally {
      setIsDbSyncing(false);
    }
  }, [effectiveStudentId, effectiveStudentName]);

  // Seed / Import Chapter 1 Data into Supabase
  const seedDatabase = useCallback(async () => {
    setIsDbSyncing(true);
    try {
      const res = await seedCurriculumToDatabase(studentId, progress.studentName);
      await refreshDbStatus();
      return res;
    } catch (err: any) {
      return { success: false, message: err?.message || 'Database seeding failed.' };
    } finally {
      setIsDbSyncing(false);
    }
  }, [studentId, progress.studentName, refreshDbStatus]);

  // Initial check on mount
  useEffect(() => {
    refreshDbStatus();
  }, [refreshDbStatus]);

  // Local storage persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...progress,
        activeChapterId
      }));
    } catch (e) {
      console.warn('Could not save progress to localStorage:', e);
    }
  }, [progress, activeChapterId]);

  const setStudentName = (name: string) => {
    setProgress(prev => ({ ...prev, studentName: name }));
  };

  /**
   * Calculate Progress Summary for a specific Chapter
   */
  const getChapterProgress = useCallback((chId: string): ChapterProgressSummary => {
    const chapter = getChapter(chId);
    const topics = chapter.topics || [];
    
    if (topics.length === 0) {
      return {
        chapterId: chId,
        completionPercentage: 0,
        completedTopicsCount: 0,
        totalTopics: chapter.totalTopics || 0,
        averageQuizScore: undefined,
        latestAssessmentScore: undefined,
        assessmentStatus: 'not_attempted',
        assessmentStatusLabel: 'Not Attempted',
        status: chapter.status || 'coming_soon'
      };
    }

    const completedCount = topics.filter(t => progress.topicProgress[t.id]?.completed).length;
    const totalMastery = topics.reduce((acc, t) => acc + (progress.topicProgress[t.id]?.masteryPercentage || 0), 0);
    const avgPercentage = Math.round(totalMastery / topics.length);

    // Look up quizzes taken for this chapter
    const normChId = normalizeChapterKey(chId);
    const chapterQuizzes = progress.quizHistory.filter(q => {
      const qNorm = normalizeChapterKey(q.chapterId || '');
      return qNorm === normChId || q.chapterNumber === chapter.number;
    });

    const latestQuiz = chapterQuizzes.length > 0 ? chapterQuizzes[0] : undefined;
    const averageQuizScore = chapterQuizzes.length > 0 
      ? Math.round(chapterQuizzes.reduce((acc, q) => acc + q.percentage, 0) / chapterQuizzes.length)
      : undefined;

    let assessmentStatus: 'completed' | 'needs_practice' | 'not_attempted' = 'not_attempted';
    let assessmentStatusLabel = 'Not Attempted';

    if (latestQuiz) {
      if (latestQuiz.percentage >= 60) {
        assessmentStatus = 'completed';
        assessmentStatusLabel = `Score: ${latestQuiz.percentage}% (${latestQuiz.performanceCategory || 'Passed'})`;
      } else {
        assessmentStatus = 'needs_practice';
        assessmentStatusLabel = `Score: ${latestQuiz.percentage}% (Needs Practice)`;
      }
    }

    let status = chapter.status || 'available';
    if (completedCount === topics.length && topics.length > 0) {
      status = 'completed';
    } else if (completedCount > 0 || avgPercentage > 0) {
      status = 'in_progress';
    }

    return {
      chapterId: chId,
      completionPercentage: avgPercentage,
      completedTopicsCount: completedCount,
      totalTopics: topics.length,
      averageQuizScore,
      latestAssessmentScore: latestQuiz?.percentage,
      assessmentStatus,
      assessmentStatusLabel,
      status
    };
  }, [progress.topicProgress, progress.quizHistory]);

  // Sync on initial load and whenever user changes
  useEffect(() => {
    syncWithDatabase(effectiveStudentId);
  }, [effectiveStudentId, syncWithDatabase]);

  const markTopicCompleted = (topicId: string, chapterId: string = activeChapterId) => {
    const targetChapterId = normalizeChapterKey(chapterId);
    setProgress(prev => {
      const current = prev.topicProgress[topicId] || {
        topicId,
        chapterId: targetChapterId,
        completed: false,
        viewedSectionsCount: 0,
        quickCheckPassed: false,
        masteryPercentage: 0
      };

      return {
        ...prev,
        lastActiveTopicId: topicId,
        lastActiveChapterId: targetChapterId,
        topicProgress: {
          ...prev.topicProgress,
          [topicId]: {
            ...current,
            chapterId: targetChapterId,
            completed: true,
            quickCheckPassed: true,
            masteryPercentage: 100
          }
        }
      };
    });

    // Save to Supabase (non-blocking)
    saveTopicProgressToDatabase(
      effectiveStudentId, 
      targetChapterId, 
      topicId, 
      100, 
      100, 
      1, 
      progress.studentName || effectiveStudentName
    ).catch(e => console.warn('Supabase background progress save:', e));
  };

  const recordTopicView = (topicId: string, chapterId: string = activeChapterId) => {
    const targetChapterId = normalizeChapterKey(chapterId);
    setActiveTopicId(topicId);
    setProgress(prev => {
      const current = prev.topicProgress[topicId] || {
        topicId,
        chapterId: targetChapterId,
        completed: false,
        viewedSectionsCount: 0,
        quickCheckPassed: false,
        masteryPercentage: 0
      };

      const newCount = (current.viewedSectionsCount || 0) + 1;
      const calculatedMastery = current.completed 
        ? 100 
        : Math.min(90, Math.max(current.masteryPercentage, Math.min(newCount * 25, 75)));

      return {
        ...prev,
        lastActiveTopicId: topicId,
        lastActiveChapterId: targetChapterId,
        topicProgress: {
          ...prev.topicProgress,
          [topicId]: {
            ...current,
            chapterId: targetChapterId,
            viewedSectionsCount: newCount,
            masteryPercentage: calculatedMastery
          }
        }
      };
    });

    // Update in Supabase (non-blocking)
    const current = progress.topicProgress[topicId];
    saveTopicProgressToDatabase(
      effectiveStudentId,
      targetChapterId,
      topicId,
      current?.completed ? 100 : 50,
      current?.masteryPercentage || 60,
      (current?.viewedSectionsCount || 0) + 1,
      progress.studentName || effectiveStudentName
    ).catch(e => console.warn('Supabase topic view save:', e));
  };

  const recordQuickCheckPassed = (topicId: string, chapterId: string = activeChapterId) => {
    const targetChapterId = normalizeChapterKey(chapterId);
    setProgress(prev => {
      const current = prev.topicProgress[topicId] || {
        topicId,
        chapterId: targetChapterId,
        completed: false,
        viewedSectionsCount: 0,
        quickCheckPassed: false,
        masteryPercentage: 0
      };

      return {
        ...prev,
        lastActiveTopicId: topicId,
        lastActiveChapterId: targetChapterId,
        topicProgress: {
          ...prev.topicProgress,
          [topicId]: {
            ...current,
            chapterId: targetChapterId,
            completed: true,
            quickCheckPassed: true,
            masteryPercentage: 100
          }
        }
      };
    });

    // Update in Supabase (non-blocking)
    saveTopicProgressToDatabase(
      effectiveStudentId,
      targetChapterId,
      topicId,
      100,
      100,
      2,
      progress.studentName || effectiveStudentName
    ).catch(e => console.warn('Supabase quick check save:', e));
  };

  const recordQuizResult = (result: QuizAttemptResult) => {
    const quizChapterId = result.chapterId || activeChapterId;
    const ch = getChapter(quizChapterId);
    const enrichedResult: QuizAttemptResult = {
      ...result,
      chapterId: quizChapterId,
      chapterNumber: result.chapterNumber || ch.number,
      chapterTitle: result.chapterTitle || ch.title
    };

    setLatestQuizResult(enrichedResult);
    setProgress(prev => {
      const updatedTopicProgress = { ...prev.topicProgress };

      // Update topic masteries based on quiz performance
      enrichedResult.topicPerformance.forEach(tp => {
        const existing = updatedTopicProgress[tp.topicId] || {
          topicId: tp.topicId,
          chapterId: quizChapterId,
          completed: false,
          viewedSectionsCount: 1,
          quickCheckPassed: false,
          masteryPercentage: 0
        };

        const newMastery = Math.round((existing.masteryPercentage + tp.percentage) / 2);
        updatedTopicProgress[tp.topicId] = {
          ...existing,
          chapterId: quizChapterId,
          masteryPercentage: newMastery,
          completed: existing.completed || tp.percentage >= 70
        };
      });

      return {
        ...prev,
        topicProgress: updatedTopicProgress,
        quizHistory: [enrichedResult, ...prev.quizHistory]
      };
    });

    // 1. Record Quiz Attempt & Student Answers in Supabase
    saveQuizAttemptToDatabase(effectiveStudentId, quizChapterId, enrichedResult, progress.studentName || effectiveStudentName)
      .then(res => {
        if (res.success) {
          refreshDbStatus();
        }
      })
      .catch(e => console.warn('Supabase quiz attempt save:', e));

    // 2. Update all affected topic progress records in Supabase
    enrichedResult.topicPerformance.forEach(tp => {
      saveTopicProgressToDatabase(
        effectiveStudentId,
        quizChapterId,
        tp.topicId,
        tp.percentage >= 70 ? 100 : Math.max(50, tp.percentage),
        tp.percentage,
        tp.attempts || 1,
        progress.studentName || effectiveStudentName
      ).catch(e => console.warn('Supabase topic progress update:', e));
    });
  };

  const resetProgress = () => {
    const emptyTopicProgress: Record<string, TopicProgress> = {};
    
    // Reset all available topics across all chapters
    allChapters.forEach(ch => {
      ch.topics.forEach(t => {
        emptyTopicProgress[t.id] = {
          topicId: t.id,
          chapterId: ch.id,
          completed: false,
          viewedSectionsCount: 0,
          quickCheckPassed: false,
          masteryPercentage: 0
        };
      });
    });

    const emptyProgress: UserProgressData = {
      studentName: progress.studentName || 'Student',
      activeChapterId: 'chapter-1',
      lastActiveChapterId: 'chapter-1',
      lastActiveTopicId: CHAPTER_1_DATA.topics[0]?.id || 'T1',
      topicProgress: emptyTopicProgress,
      chapterProgress: {},
      quizHistory: []
    };
    setProgress(emptyProgress);
    setLatestQuizResult(null);
  };

  const loadSampleData = () => {
    const sample = buildInitialProgress();
    setProgress(sample);
    setLatestQuizResult(sample.quizHistory[0]);
  };

  // Calculations for current active chapter
  const currentChapterTopics = currentChapter.topics;
  const completedTopicsCount = currentChapterTopics.filter(t => progress.topicProgress[t.id]?.completed).length;
  
  const currentChapterMasterySum = currentChapterTopics.reduce((acc, t) => {
    return acc + (progress.topicProgress[t.id]?.masteryPercentage || 0);
  }, 0);
  const overallProgressPercentage = currentChapterTopics.length > 0 
    ? Math.round(currentChapterMasterySum / currentChapterTopics.length) 
    : 0;

  // Curriculum-wide progress calculation
  const allAvailableTopics = allChapters.filter(c => c.isAvailable).flatMap(c => c.topics);
  const completedCurriculumTopicsCount = allAvailableTopics.filter(t => progress.topicProgress[t.id]?.completed).length;
  const overallCurriculumProgressPercentage = allAvailableTopics.length > 0
    ? Math.round((completedCurriculumTopicsCount / allAvailableTopics.length) * 100)
    : 0;

  const averageQuizScorePercentage = progress.quizHistory.length > 0
    ? Math.round(progress.quizHistory.reduce((acc, q) => acc + q.percentage, 0) / progress.quizHistory.length)
    : 0;

  // Strong vs Weak topics for current chapter (or all if empty)
  const topicList = currentChapterTopics.length > 0 ? currentChapterTopics : allAvailableTopics;

  const strongTopics = topicList
    .filter(t => (progress.topicProgress[t.id]?.masteryPercentage || 0) >= 80)
    .map(t => ({
      id: t.id,
      title: t.title,
      score: progress.topicProgress[t.id]?.masteryPercentage || 0
    }));

  // Identify weak topics across the active curriculum (topics with attempts where accuracy < 60%)
  const weakTopics = allAvailableTopics
    .filter(t => {
      const p = progress.topicProgress[t.id];
      return p && p.masteryPercentage > 0 && p.masteryPercentage < 60;
    })
    .map(t => {
      const p = progress.topicProgress[t.id];
      const ch = allChapters.find(c => c.id === t.chapterId || c.number === (t.chapterId === 'chapter-2' ? 2 : 1));
      return {
        id: t.id,
        title: t.title,
        chapterNumber: ch?.number || 1,
        chapterTitle: ch?.title || 'Science',
        score: p?.masteryPercentage || 0,
        reason: `Scored ${p?.masteryPercentage}% accuracy in practice assessments.`
      };
    });

  // Recommended next activity calculation based on actual student progress
  const recommendedActivity: RecommendedActivity = (() => {
    // 1. If there is a weak topic, recommend targeted revision
    if (weakTopics.length > 0) {
      const topWeak = weakTopics[0];
      return {
        type: 'weak_topic_revision',
        title: `Review Weak Topic: ${topWeak.title}`,
        subtitle: `Chapter ${topWeak.chapterNumber || 1} • Accuracy: ${topWeak.score}%`,
        description: topWeak.reason || 'Revisit key explanations and test your understanding.',
        actionLabel: 'Review Topic',
        actionType: 'lesson',
        topicId: topWeak.id,
        chapterId: `chapter-${topWeak.chapterNumber || 1}`
      };
    }

    // 2. If current chapter has an uncompleted topic, recommend continuing
    const nextUncompletedTopic = currentChapter.topics.find(t => !progress.topicProgress[t.id]?.completed);
    if (nextUncompletedTopic) {
      return {
        type: 'continue_lesson',
        title: `Continue Learning: ${nextUncompletedTopic.title}`,
        subtitle: `Chapter ${currentChapter.number}: ${currentChapter.title} • Topic ${nextUncompletedTopic.order}`,
        description: nextUncompletedTopic.learningObjective || 'Pick up right where you left off.',
        actionLabel: 'Continue Lesson',
        actionType: 'lesson',
        topicId: nextUncompletedTopic.id,
        chapterId: currentChapter.id
      };
    }

    // 3. If all topics completed in current chapter but no assessment taken
    const chProg = getChapterProgress(currentChapter.id);
    if (chProg.assessmentStatus === 'not_attempted') {
      return {
        type: 'take_quiz',
        title: `Take Assessment: Chapter ${currentChapter.number} Quiz`,
        subtitle: `${currentChapter.title} • 10 Questions`,
        description: 'All topics completed! Take the practice quiz to validate your understanding.',
        actionLabel: 'Start Practice Quiz',
        actionType: 'practice',
        chapterId: currentChapter.id
      };
    }

    // 4. Recommend next available chapter (e.g. Chapter 2)
    const nextChapter = allChapters.find(c => c.number === currentChapter.number + 1 && c.isAvailable);
    if (nextChapter) {
      return {
        type: 'next_chapter',
        title: `Explore Chapter ${nextChapter.number}: ${nextChapter.title}`,
        subtitle: `Next Chapter in Syllabus • ${nextChapter.totalTopics} Topics`,
        description: nextChapter.description || 'Discover plant structures, root systems, and animal adaptations.',
        actionLabel: 'Start Chapter',
        actionType: 'chapter',
        chapterId: nextChapter.id
      };
    }

    return {
      type: 'general',
      title: 'Practice & Master Science Concepts',
      subtitle: 'Class 6 Curiosity Syllabus',
      description: 'Review interactive topics or ask your AI Tutor any science question.',
      actionLabel: 'Explore Chapters',
      actionType: 'chapters'
    };
  })();

  return (
    <ProgressContext.Provider
      value={{
        progress,
        studentId: effectiveStudentId,
        activeChapterId,
        setActiveChapterId,
        currentChapter,
        allChapters,
        getChapterProgress,
        setStudentName,
        markTopicCompleted,
        recordTopicView,
        recordQuickCheckPassed,
        recordQuizResult,
        resetProgress,
        loadSampleData,
        activeTopicId,
        setActiveTopicId,
        overallProgressPercentage,
        completedTopicsCount,
        overallCurriculumProgressPercentage,
        averageQuizScorePercentage,
        latestQuizResult,
        strongTopics,
        weakTopics,
        recommendedActivity,
        supabaseStatus,
        isDbSyncing,
        syncWithDatabase,
        seedDatabase
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

