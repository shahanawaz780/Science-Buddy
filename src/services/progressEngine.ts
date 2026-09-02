import { 
  Topic, 
  TopicProgress, 
  QuizAttemptResult, 
  UserProgressData, 
  PerformanceCategory 
} from '../types';
import { PERFORMANCE_THRESHOLDS } from '../config/constants';

export interface TopicStatCalculation {
  topic: Topic;
  tp: TopicProgress | undefined;
  attempts: number;
  accuracy: number;
  scoreDisplay: string;
  classification: 'strong' | 'developing' | 'needs_practice';
  isCompleted: boolean;
}

/**
 * Classify a percentage score into standard performance categories
 */
export function classifyProgressScore(percentage: number): PerformanceCategory {
  if (percentage >= PERFORMANCE_THRESHOLDS.strong) return 'Strong';
  if (percentage >= PERFORMANCE_THRESHOLDS.developing) return 'Developing';
  return 'Needs Practice';
}

/**
 * Calculates the overall progress percentage for a given set of topics and user topic progress
 */
export function calculateOverallProgressPercentage(
  topics: Topic[],
  topicProgress: Record<string, TopicProgress>
): number {
  if (!topics || topics.length === 0) return 0;
  
  const totalMastery = topics.reduce((acc, t) => {
    const tp = topicProgress[t.id];
    if (tp?.completed) return acc + 100;
    return acc + (tp?.masteryPercentage || 0);
  }, 0);

  return Math.round(totalMastery / topics.length);
}

/**
 * Calculates total completed topics count
 */
export function calculateCompletedTopicsCount(
  topics: Topic[],
  topicProgress: Record<string, TopicProgress>
): number {
  if (!topics || topics.length === 0) return 0;
  return topics.filter(t => topicProgress[t.id]?.completed).length;
}

/**
 * Calculates average quiz score percentage across all recorded quiz attempts
 */
export function calculateAverageQuizScorePercentage(quizHistory: QuizAttemptResult[]): number {
  if (!quizHistory || quizHistory.length === 0) return 0;
  const totalPercent = quizHistory.reduce((acc, q) => acc + (q.percentage || 0), 0);
  return Math.round(totalPercent / quizHistory.length);
}

/**
 * Detailed topic performance calculation combining quiz history and topic completion state
 */
export function calculateTopicStatistics(
  topics: Topic[],
  progress: UserProgressData
): TopicStatCalculation[] {
  if (!topics) return [];

  return topics.map(topic => {
    const tp = progress.topicProgress[topic.id];

    let totalQuestionsAttempted = 0;
    let totalQuestionsCorrect = 0;
    let totalScoreEarned = 0;
    let totalMaxMarks = 0;
    let attemptsCount = 0;

    (progress.quizHistory || []).forEach(quiz => {
      const topicPerf = quiz.topicPerformance?.find(p => p.topicId === topic.id);
      if (topicPerf && topicPerf.total > 0) {
        attemptsCount++;
        totalQuestionsAttempted += topicPerf.total;
        totalQuestionsCorrect += topicPerf.correct;
        totalScoreEarned += (topicPerf.score !== undefined ? topicPerf.score : topicPerf.correct);
        totalMaxMarks += (topicPerf.totalMarks !== undefined ? topicPerf.totalMarks : topicPerf.total);
      }
    });

    let accuracy = 0;
    if (totalQuestionsAttempted > 0) {
      accuracy = totalMaxMarks > 0 
        ? Math.round((totalScoreEarned / totalMaxMarks) * 100)
        : Math.round((totalQuestionsCorrect / totalQuestionsAttempted) * 100);
    } else if (tp?.masteryPercentage !== undefined && tp.masteryPercentage > 0) {
      accuracy = tp.masteryPercentage;
    } else if (tp?.completed) {
      accuracy = 85;
    }

    const scoreDisplay = totalMaxMarks > 0 
      ? `${totalScoreEarned}/${totalMaxMarks}`
      : `${accuracy}%`;

    let classification: 'strong' | 'developing' | 'needs_practice' = 'needs_practice';
    if (accuracy >= PERFORMANCE_THRESHOLDS.strong) {
      classification = 'strong';
    } else if (accuracy >= PERFORMANCE_THRESHOLDS.developing) {
      classification = 'developing';
    } else {
      classification = 'needs_practice';
    }

    return {
      topic,
      tp,
      attempts: attemptsCount,
      accuracy,
      scoreDisplay,
      classification,
      isCompleted: !!tp?.completed
    };
  });
}

/**
 * Identifies strong and weak topics from user progress data
 */
export function identifyStrongAndWeakTopics(
  topics: Topic[],
  progress: UserProgressData
): {
  strongTopics: { id: string; title: string; score: number }[];
  weakTopics: { id: string; title: string; score: number; reason: string }[];
} {
  const stats = calculateTopicStatistics(topics, progress);

  const strongTopics = stats
    .filter(s => s.classification === 'strong')
    .map(s => ({
      id: s.topic.id,
      title: s.topic.title,
      score: s.accuracy
    }));

  const weakTopics = stats
    .filter(s => s.classification === 'needs_practice' || s.classification === 'developing')
    .map(s => ({
      id: s.topic.id,
      title: s.topic.title,
      score: s.accuracy,
      reason: s.attempts === 0 ? 'Not practiced in quizzes yet' : `Scored ${s.accuracy}% in recent questions`
    }));

  return { strongTopics, weakTopics };
}
