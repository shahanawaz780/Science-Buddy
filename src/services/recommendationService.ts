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
  allTopics: Topic[],
  chapterId?: string
): StudentPerformancePayload {
  const chapterTopicIds = new Set(allTopics.map(t => t.id));

  // 1. Calculate topic-level scores and accuracy for the requested chapter topics
  const topicScores = allTopics.map(topic => {
    const tp = progress.topicProgress[topic.id];
    let attemptsCount = 0;
    let totalScoreEarned = 0;
    let totalMaxMarks = 0;
    let totalQuestionsAttempted = 0;
    let totalQuestionsCorrect = 0;

    progress.quizHistory.forEach(quiz => {
      // Filter quiz to this chapter if tagged or if matching topics
      if (chapterId && quiz.chapterId && quiz.chapterId !== chapterId) return;
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

  // Filter quizzes to the current chapter
  const chapterFilteredHistory = progress.quizHistory.filter(q => {
    if (chapterId && q.chapterId) return q.chapterId === chapterId;
    if (q.topicPerformance && q.topicPerformance.some(tp => chapterTopicIds.has(tp.topicId))) return true;
    return !chapterId;
  });

  // 2. Separate quiz and test scores for the current chapter
  const quizScores = chapterFilteredHistory
    .filter(q => q.quizType === 'practice')
    .slice(-5)
    .map(q => ({
      quizTitle: q.quizTitle || 'Practice Quiz',
      percentage: q.percentage,
      score: q.score,
      totalMarks: q.totalMarks,
      timestamp: q.timestamp
    }));

  const testScores = chapterFilteredHistory
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

  // 4. Extract incorrect questions from recent chapter history
  const incorrectQuestions: Array<{
    question: string;
    topicTitle: string;
    studentAnswer?: string;
    correctAnswer?: string;
  }> = [];

  const recentQuizzes = chapterFilteredHistory.slice(-3);
  for (const quiz of recentQuizzes) {
    if (quiz.userAnswers && Array.isArray(quiz.userAnswers)) {
      for (const ua of quiz.userAnswers) {
        if (!ua.isCorrect || ua.score < ua.maxScore) {
          incorrectQuestions.push({
            question: ua.question,
            topicTitle: ua.topic || (allTopics[0]?.title || 'Topic'),
            studentAnswer: ua.student_answer,
            correctAnswer: ua.correct_answer
          });
          if (incorrectQuestions.length >= 8) break;
        }
      }
    }
  }

  // 5. Recent activity summary
  let recentActivity = `Reviewed ${allTopics[0]?.title || 'curriculum'} lessons.`;
  if (chapterFilteredHistory.length > 0) {
    const latest = chapterFilteredHistory[chapterFilteredHistory.length - 1];
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
  payload: StudentPerformancePayload,
  chapterId?: string,
  chapterTitle?: string
): Promise<RecommendationResponse> {
  try {
    const res = await fetch('/api/gemini/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...payload,
        chapter_id: chapterId,
        chapter_title: chapterTitle
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        data: getFallbackRecommendation(payload, chapterTitle),
        error: err.error || 'Failed to generate recommendations.'
      };
    }

    const data: AIRecommendationResult = await res.json();
    const fallback = getFallbackRecommendation(payload, chapterTitle);

    return {
      success: true,
      data: {
        summary: data.summary || fallback.summary,
        strong_area: data.strong_area || fallback.strong_area,
        weak_area: data.weak_area || fallback.weak_area,
        recommended_topic: data.recommended_topic || fallback.recommended_topic,
        recommended_action: data.recommended_action || fallback.recommended_action,
        reason: data.reason || fallback.reason
      },
      isFallback: !!(data as any).is_fallback
    };
  } catch (error: any) {
    console.error('Error in fetchAIRecommendations:', error);
    return {
      success: true, // provide smooth fallback for UI
      data: getFallbackRecommendation(payload, chapterTitle),
      isFallback: true
    };
  }
}

function getFallbackRecommendation(payload: StudentPerformancePayload, chapterTitle?: string): AIRecommendationResult {
  const topics = payload.topicScores || [];
  const sorted = [...topics].sort((a, b) => (a.accuracy ?? 50) - (b.accuracy ?? 50));
  const weakest = sorted[0] || { topicTitle: 'Science Concepts', accuracy: 50 };
  const strongest = sorted[sorted.length - 1] || { topicTitle: 'Fundamental Ideas', accuracy: 85 };
  const chName = chapterTitle || 'this chapter';

  return {
    summary: `You are making steady progress in ${chName}.`,
    strong_area: strongest.topicTitle || 'Core Concepts',
    weak_area: weakest.topicTitle || 'Practice Concepts',
    recommended_topic: weakest.topicTitle || 'Practice Concepts',
    recommended_action: `Review "${weakest.topicTitle || 'Practice Concepts'}" and attempt a practice quiz.`,
    reason: `Your current accuracy in ${weakest.topicTitle} is ${weakest.accuracy}%. Targeted practice here will give you the biggest score boost.`
  };
}
