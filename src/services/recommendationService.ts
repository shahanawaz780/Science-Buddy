import { 
  AIRecommendationResult, 
  StudentPerformancePayload, 
  UserProgressData, 
  Topic 
} from '../types';

export interface RecommendationResponse {
  success: boolean;
  data: AIRecommendationResult;
  isFallback?: boolean;
  error?: string;
}

/**
 * Builds a clean, sanitized performance payload from the user's progress data and curriculum topics.
 * Does NOT include personal identifiers (e.g. emails, full private details).
 */
export function buildPerformancePayload(
  progress: UserProgressData,
  allTopics: Topic[]
): StudentPerformancePayload {
  // 1. Calculate topic-level scores and accuracy
  const topicScores = allTopics.map(topic => {
    const tp = progress.topicProgress[topic.id];
    let attemptsCount = 0;
    let totalScoreEarned = 0;
    let totalMaxMarks = 0;
    let totalQuestionsAttempted = 0;
    let totalQuestionsCorrect = 0;

    progress.quizHistory.forEach(quiz => {
      const perf = quiz.topicPerformance?.find(p => p.topicId === topic.id);
      if (perf && perf.total > 0) {
        attemptsCount++;
        totalQuestionsAttempted += perf.total;
        totalQuestionsCorrect += perf.correct;
        totalScoreEarned += (perf.score !== undefined ? perf.score : perf.correct);
        totalMaxMarks += (perf.totalMarks !== undefined ? perf.totalMarks : perf.total);
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
    } else {
      accuracy = 40;
    }

    const classification = accuracy >= 80 ? 'Strong' : accuracy >= 60 ? 'Developing' : 'Needs Practice';

    return {
      topicId: topic.id,
      topicTitle: topic.title,
      accuracy,
      scoreDisplay: totalMaxMarks > 0 ? `${totalScoreEarned}/${totalMaxMarks}` : `${accuracy}%`,
      attempts: attemptsCount,
      classification
    };
  });

  // 2. Separate quiz and test scores
  const quizScores = progress.quizHistory
    .filter(q => q.quizType === 'practice')
    .slice(-5)
    .map(q => ({
      quizTitle: q.quizTitle || 'Practice Quiz',
      percentage: q.percentage,
      score: q.score,
      totalMarks: q.totalMarks,
      timestamp: q.timestamp
    }));

  const testScores = progress.quizHistory
    .filter(q => q.quizType === 'chapter_test')
    .slice(-5)
    .map(t => ({
      testTitle: t.quizTitle || 'Chapter Test',
      percentage: t.percentage,
      score: t.score,
      totalMarks: t.totalMarks,
      timestamp: t.timestamp
    }));

  // 3. Completed topics list
  const completedTopics = allTopics
    .filter(topic => !!progress.topicProgress[topic.id]?.completed)
    .map(t => t.title);

  // 4. Extract incorrect questions from recent history
  const incorrectQuestions: Array<{
    question: string;
    topicTitle: string;
    studentAnswer?: string;
    correctAnswer?: string;
  }> = [];

  const recentQuizzes = progress.quizHistory.slice(-3);
  for (const quiz of recentQuizzes) {
    if (quiz.userAnswers && Array.isArray(quiz.userAnswers)) {
      for (const ua of quiz.userAnswers) {
        if (!ua.isCorrect || ua.score < ua.maxScore) {
          incorrectQuestions.push({
            question: ua.question,
            topicTitle: ua.topic || 'Chapter 1',
            studentAnswer: ua.student_answer,
            correctAnswer: ua.correct_answer
          });
          if (incorrectQuestions.length >= 8) break;
        }
      }
    }
  }

  // 5. Recent activity summary
  let recentActivity = 'Reviewed Chapter 1 lessons.';
  if (progress.quizHistory.length > 0) {
    const latest = progress.quizHistory[progress.quizHistory.length - 1];
    recentActivity = `Completed "${latest.quizTitle}" scoring ${latest.score}/${latest.totalMarks} (${latest.percentage}%).`;
  }

  return {
    topicScores,
    quizScores,
    testScores,
    completedTopics,
    incorrectQuestions,
    recentActivity
  };
}

/**
 * Calls server-side Gemini endpoint for personalized AI recommendations.
 */
export async function fetchAIRecommendations(
  payload: StudentPerformancePayload
): Promise<RecommendationResponse> {
  try {
    const res = await fetch('/api/gemini/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        data: getFallbackRecommendation(payload),
        error: err.error || 'Failed to generate recommendations.'
      };
    }

    const data: AIRecommendationResult = await res.json();

    return {
      success: true,
      data: {
        summary: data.summary || 'You are making good progress in Chapter 1.',
        strong_area: data.strong_area || 'Collaboration in Science',
        weak_area: data.weak_area || 'How Do Scientists Work?',
        recommended_topic: data.recommended_topic || 'How Do Scientists Work?',
        recommended_action: data.recommended_action || 'Review the five steps and attempt the practice quiz.',
        reason: data.reason || 'Focusing on this topic will help you achieve full marks in Chapter 1.'
      },
      isFallback: !!(data as any).is_fallback
    };
  } catch (error: any) {
    console.error('Error in fetchAIRecommendations:', error);
    return {
      success: true, // provide smooth fallback for UI
      data: getFallbackRecommendation(payload),
      isFallback: true
    };
  }
}

function getFallbackRecommendation(payload: StudentPerformancePayload): AIRecommendationResult {
  const topics = payload.topicScores || [];
  const sorted = [...topics].sort((a, b) => (a.accuracy ?? 50) - (b.accuracy ?? 50));
  const weakest = sorted[0] || { topicTitle: 'How Do Scientists Work?', accuracy: 50 };
  const strongest = sorted[sorted.length - 1] || { topicTitle: 'Welcome to the World of Science', accuracy: 85 };

  return {
    summary: 'You are doing well overall in Chapter 1.',
    strong_area: strongest.topicTitle || 'Collaboration in Science',
    weak_area: weakest.topicTitle || 'How Do Scientists Work?',
    recommended_topic: weakest.topicTitle || 'How Do Scientists Work?',
    recommended_action: `Review "${weakest.topicTitle || 'How Do Scientists Work?'}" and attempt the practice quiz.`,
    reason: `Your current accuracy in ${weakest.topicTitle} is ${weakest.accuracy}%. Targeted practice here will give you the biggest score boost.`
  };
}
