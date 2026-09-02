import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  UserProgressData, 
  QuizAttemptResult, 
  TopicProgress, 
  SupabaseSyncStatus 
} from '../types';
import { CHAPTER_1_DATA } from '../data/chapter1Data';
import { 
  checkSupabaseStatus, 
  seedCurriculumToDatabase, 
  saveTopicProgressToDatabase, 
  saveQuizAttemptToDatabase,
  fetchStudentDataFromDatabase 
} from '../services/supabaseService';

interface ProgressContextType {
  progress: UserProgressData;
  studentId: string;
  setStudentName: (name: string) => void;
  markTopicCompleted: (topicId: string) => void;
  recordTopicView: (topicId: string) => void;
  recordQuickCheckPassed: (topicId: string) => void;
  recordQuizResult: (result: QuizAttemptResult) => void;
  resetProgress: () => void;
  loadSampleData: () => void;
  activeTopicId: string;
  setActiveTopicId: (topicId: string) => void;
  overallProgressPercentage: number;
  completedTopicsCount: number;
  averageQuizScorePercentage: number;
  latestQuizResult: QuizAttemptResult | null;
  strongTopics: { id: string; title: string; score: number }[];
  weakTopics: { id: string; title: string; score: number; reason: string }[];
  // Supabase Database States & Actions
  supabaseStatus: SupabaseSyncStatus;
  isDbSyncing: boolean;
  syncWithDatabase: () => Promise<void>;
  seedDatabase: () => Promise<{ success: boolean; message: string }>;
}

const buildInitialProgress = (): UserProgressData => {
  const defaultTopicProgress: Record<string, TopicProgress> = {};
  
  CHAPTER_1_DATA.topics.forEach((topic, idx) => {
    if (idx === 0) {
      defaultTopicProgress[topic.id] = {
        topicId: topic.id,
        completed: true,
        viewedSectionsCount: 4,
        quickCheckPassed: true,
        masteryPercentage: 90
      };
    } else if (idx === 1) {
      defaultTopicProgress[topic.id] = {
        topicId: topic.id,
        completed: true,
        viewedSectionsCount: 3,
        quickCheckPassed: true,
        masteryPercentage: 85
      };
    } else if (idx === 2) {
      defaultTopicProgress[topic.id] = {
        topicId: topic.id,
        completed: true,
        viewedSectionsCount: 4,
        quickCheckPassed: true,
        masteryPercentage: 80
      };
    } else if (idx === 3) {
      defaultTopicProgress[topic.id] = {
        topicId: topic.id,
        completed: false,
        viewedSectionsCount: 1,
        quickCheckPassed: false,
        masteryPercentage: 55
      };
    } else {
      defaultTopicProgress[topic.id] = {
        topicId: topic.id,
        completed: false,
        viewedSectionsCount: 0,
        quickCheckPassed: false,
        masteryPercentage: 20
      };
    }
  });

  return {
    studentName: 'Student',
    lastActiveTopicId: CHAPTER_1_DATA.topics[0]?.id || 'T1',
    topicProgress: defaultTopicProgress,
    quizHistory: [
      {
        id: 'init-quiz-1',
        quizTitle: 'Chapter 1 Practice Quiz',
        quizType: 'practice',
        totalQuestions: 10,
        attemptedQuestions: 10,
        unattemptedQuestions: 0,
        totalMarks: 10,
        correctAnswers: 8,
        incorrectAnswers: 2,
        score: 8,
        marksObtained: 8,
        percentage: 80,
        performanceCategory: 'Strong',
        timeSpentSeconds: 195,
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        userAnswers: [],
        reviewQuestions: [],
        recommendedActions: [
          {
            id: 'action-1',
            type: 'practice_topic',
            title: 'Targeted Practice: Everyday Examples of Scientific Thinking',
            description: 'Scored 33% in everyday applications. Take interactive quizzes to strengthen your understanding.',
            topicId: 'T4',
            urgency: 'high',
            buttonLabel: 'Practice Topic'
          }
        ],
        topicPerformance: [
          {
            topicId: 'T1',
            topicTitle: 'Welcome to the World of Science',
            total: 2,
            totalQuestions: 2,
            attempts: 2,
            correct: 2,
            incorrect: 0,
            unattempted: 0,
            totalMarks: 2,
            score: 2,
            marks: 2,
            accuracy: 100,
            percentage: 100,
            performance_category: 'Strong'
          },
          {
            topicId: 'T2',
            topicTitle: 'Science as an Unending Jigsaw Puzzle',
            total: 2,
            totalQuestions: 2,
            attempts: 2,
            correct: 2,
            incorrect: 0,
            unattempted: 0,
            totalMarks: 2,
            score: 2,
            marks: 2,
            accuracy: 100,
            percentage: 100,
            performance_category: 'Strong'
          },
          {
            topicId: 'T3',
            topicTitle: 'The Scientific Method',
            total: 3,
            totalQuestions: 3,
            attempts: 3,
            correct: 3,
            incorrect: 0,
            unattempted: 0,
            totalMarks: 3,
            score: 3,
            marks: 3,
            accuracy: 100,
            percentage: 100,
            performance_category: 'Strong'
          },
          {
            topicId: 'T4',
            topicTitle: 'Everyday Examples of Scientific Thinking',
            total: 3,
            totalQuestions: 3,
            attempts: 3,
            correct: 1,
            incorrect: 2,
            unattempted: 0,
            totalMarks: 3,
            score: 1,
            marks: 1,
            accuracy: 33,
            percentage: 33,
            performance_category: 'Needs Practice'
          }
        ],
        recommendedRevisionTopics: [
          {
            topicId: 'T4',
            topicTitle: 'Everyday Examples of Scientific Thinking',
            reason: 'Review the everyday applications (bicycle tube leak test, milk boiling, phototropism) and practice identifying the underlying scientific concepts.'
          }
        ]
      }
    ]
  };
};

const STORAGE_KEY = 'science_buddy_class6_progress_v2';
const STUDENT_ID_KEY = 'science_buddy_student_id';

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const [progress, setProgress] = useState<UserProgressData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.topicProgress) {
          CHAPTER_1_DATA.topics.forEach(t => {
            if (!parsed.topicProgress[t.id]) {
              parsed.topicProgress[t.id] = {
                topicId: t.id,
                completed: false,
                viewedSectionsCount: 0,
                quickCheckPassed: false,
                masteryPercentage: 0
              };
            }
          });
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read saved progress, using initialized progress:', e);
    }
    return buildInitialProgress();
  });

  const [activeTopicId, setActiveTopicId] = useState<string>(
    CHAPTER_1_DATA.topics[0]?.id || 'T1'
  );
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
  const syncWithDatabase = useCallback(async () => {
    setIsDbSyncing(true);
    setSupabaseStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const status = await checkSupabaseStatus();
      setSupabaseStatus(status);

      if (status.isConnected) {
        const dbData = await fetchStudentDataFromDatabase(studentId);
        
        // If database has student progress rows, merge them seamlessly
        if (dbData && dbData.progress && dbData.progress.length > 0) {
          setProgress(prev => {
            const updatedTopicProgress = { ...prev.topicProgress };
            dbData.progress.forEach(p => {
              const current = updatedTopicProgress[p.topic_id] || {
                topicId: p.topic_id,
                completed: false,
                viewedSectionsCount: 0,
                quickCheckPassed: false,
                masteryPercentage: 0
              };
              updatedTopicProgress[p.topic_id] = {
                ...current,
                completed: p.completion_percent >= 100 || current.completed,
                masteryPercentage: Math.max(current.masteryPercentage, Math.round(Number(p.accuracy) || 0))
              };
            });
            return {
              ...prev,
              topicProgress: updatedTopicProgress
            };
          });
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
  }, [studentId]);

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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.warn('Could not save progress to localStorage:', e);
    }
  }, [progress]);

  const setStudentName = (name: string) => {
    setProgress(prev => ({ ...prev, studentName: name }));
  };

  const markTopicCompleted = (topicId: string) => {
    setProgress(prev => {
      const current = prev.topicProgress[topicId] || {
        topicId,
        completed: false,
        viewedSectionsCount: 0,
        quickCheckPassed: false,
        masteryPercentage: 0
      };

      return {
        ...prev,
        lastActiveTopicId: topicId,
        topicProgress: {
          ...prev.topicProgress,
          [topicId]: {
            ...current,
            completed: true,
            quickCheckPassed: true,
            masteryPercentage: 100
          }
        }
      };
    });

    // Save to Supabase (non-blocking)
    saveTopicProgressToDatabase(
      studentId, 
      'chapter-1', 
      topicId, 
      100, 
      100, 
      1, 
      progress.studentName
    ).catch(e => console.warn('Supabase background progress save:', e));
  };

  const recordTopicView = (topicId: string) => {
    setActiveTopicId(topicId);
    setProgress(prev => {
      const current = prev.topicProgress[topicId] || {
        topicId,
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
        topicProgress: {
          ...prev.topicProgress,
          [topicId]: {
            ...current,
            viewedSectionsCount: newCount,
            masteryPercentage: calculatedMastery
          }
        }
      };
    });

    // Update in Supabase (non-blocking)
    const current = progress.topicProgress[topicId];
    saveTopicProgressToDatabase(
      studentId,
      'chapter-1',
      topicId,
      current?.completed ? 100 : 50,
      current?.masteryPercentage || 60,
      (current?.viewedSectionsCount || 0) + 1,
      progress.studentName
    ).catch(e => console.warn('Supabase topic view save:', e));
  };

  const recordQuickCheckPassed = (topicId: string) => {
    setProgress(prev => {
      const current = prev.topicProgress[topicId] || {
        topicId,
        completed: false,
        viewedSectionsCount: 0,
        quickCheckPassed: false,
        masteryPercentage: 0
      };

      return {
        ...prev,
        lastActiveTopicId: topicId,
        topicProgress: {
          ...prev.topicProgress,
          [topicId]: {
            ...current,
            completed: true,
            quickCheckPassed: true,
            masteryPercentage: 100
          }
        }
      };
    });

    // Update in Supabase (non-blocking)
    saveTopicProgressToDatabase(
      studentId,
      'chapter-1',
      topicId,
      100,
      100,
      2,
      progress.studentName
    ).catch(e => console.warn('Supabase quick check save:', e));
  };

  const recordQuizResult = (result: QuizAttemptResult) => {
    setLatestQuizResult(result);
    setProgress(prev => {
      const updatedTopicProgress = { ...prev.topicProgress };

      // Update topic masteries based on quiz performance
      result.topicPerformance.forEach(tp => {
        const existing = updatedTopicProgress[tp.topicId] || {
          topicId: tp.topicId,
          completed: false,
          viewedSectionsCount: 1,
          quickCheckPassed: false,
          masteryPercentage: 0
        };

        const newMastery = Math.round((existing.masteryPercentage + tp.percentage) / 2);
        updatedTopicProgress[tp.topicId] = {
          ...existing,
          masteryPercentage: newMastery,
          completed: existing.completed || tp.percentage >= 70
        };
      });

      return {
        ...prev,
        topicProgress: updatedTopicProgress,
        quizHistory: [...prev.quizHistory, result]
      };
    });

    // 1. Record Quiz Attempt & Student Answers in Supabase
    saveQuizAttemptToDatabase(studentId, 'chapter-1', result, progress.studentName)
      .then(res => {
        if (res.success) {
          refreshDbStatus();
        }
      })
      .catch(e => console.warn('Supabase quiz attempt save:', e));

    // 2. Update all affected topic progress records in Supabase
    result.topicPerformance.forEach(tp => {
      saveTopicProgressToDatabase(
        studentId,
        'chapter-1',
        tp.topicId,
        tp.percentage >= 70 ? 100 : Math.max(50, tp.percentage),
        tp.percentage,
        tp.attempts || 1,
        progress.studentName
      ).catch(e => console.warn('Supabase topic progress update:', e));
    });
  };

  const resetProgress = () => {
    const emptyTopicProgress: Record<string, TopicProgress> = {};
    CHAPTER_1_DATA.topics.forEach(t => {
      emptyTopicProgress[t.id] = {
        topicId: t.id,
        completed: false,
        viewedSectionsCount: 0,
        quickCheckPassed: false,
        masteryPercentage: 0
      };
    });

    const emptyProgress: UserProgressData = {
      studentName: progress.studentName || 'Student',
      lastActiveTopicId: CHAPTER_1_DATA.topics[0]?.id || 'T1',
      topicProgress: emptyTopicProgress,
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

  // Calculations
  const allTopics = CHAPTER_1_DATA.topics;
  const completedTopicsCount = allTopics.filter(t => progress.topicProgress[t.id]?.completed).length;
  
  const totalMasterySum = allTopics.reduce((acc, t) => {
    return acc + (progress.topicProgress[t.id]?.masteryPercentage || 0);
  }, 0);
  const overallProgressPercentage = allTopics.length > 0 ? Math.round(totalMasterySum / allTopics.length) : 0;

  const averageQuizScorePercentage = progress.quizHistory.length > 0
    ? Math.round(progress.quizHistory.reduce((acc, q) => acc + q.percentage, 0) / progress.quizHistory.length)
    : 80;

  // Strong vs Weak topics
  const strongTopics = allTopics
    .filter(t => (progress.topicProgress[t.id]?.masteryPercentage || 0) >= 80)
    .map(t => ({
      id: t.id,
      title: t.title,
      score: progress.topicProgress[t.id]?.masteryPercentage || 0
    }));

  const weakTopics = allTopics
    .filter(t => (progress.topicProgress[t.id]?.masteryPercentage || 0) < 60)
    .map(t => {
      const p = progress.topicProgress[t.id];
      let reason = 'Review lesson concepts and take a quick check test.';
      if (!p || p.masteryPercentage === 0) {
        reason = 'Topic not started yet.';
      } else if (!p.completed) {
        reason = 'In progress - complete the lesson and quick check.';
      } else {
        reason = 'Score was below 60% in practice quizzes.';
      }
      return {
        id: t.id,
        title: t.title,
        score: p?.masteryPercentage || 0,
        reason
      };
    });

  return (
    <ProgressContext.Provider
      value={{
        progress,
        studentId,
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
        averageQuizScorePercentage,
        latestQuizResult,
        strongTopics,
        weakTopics,
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
