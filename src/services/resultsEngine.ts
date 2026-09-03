import { 
  QuizQuestion, 
  SubmittedAnswer, 
  SubjectiveEvaluationResult, 
  QuizAttemptResult, 
  PerformanceCategory, 
  TopicResultMetrics, 
  RecommendedAction 
} from '../types';

/**
 * Classify performance based on standard criteria:
 * - 80%+ = Strong
 * - 60–79% = Developing
 * - Below 60% = Needs Practice
 */
export function classifyPerformance(percentage: number): PerformanceCategory {
  if (percentage >= 80) return 'Strong';
  if (percentage >= 60) return 'Developing';
  return 'Needs Practice';
}

/**
 * Deterministic scoring function for objective & short answer items
 */
export function evaluateQuizQuestion(
  q: QuizQuestion, 
  studentAns: string
): { isCorrect: boolean; score: number; maxScore: number } {
  const maxScore = q.marks || (q.type === 'subjective' ? 3 : q.type === 'short_answer' ? 2 : 1);
  const cleaned = (studentAns || '').trim().toLowerCase();
  const target = (q.answer || '').trim().toLowerCase();

  if (!cleaned || cleaned === '(unanswered)') {
    return { isCorrect: false, score: 0, maxScore };
  }

  // 1. MCQ Evaluation (Strict deterministic matching)
  if (q.type === 'mcq') {
    const isCorrect = cleaned === target || 
      (q.options && q.options.some(opt => opt.trim().toLowerCase() === cleaned && opt.trim().toLowerCase() === target));
    return {
      isCorrect,
      score: isCorrect ? maxScore : 0,
      maxScore
    };
  }

  // 2. Fill in the Blank (Exact or substring/synonym normalized matching)
  if (q.type === 'fill_blank') {
    const isCorrect = cleaned === target || 
      cleaned.includes(target) || 
      target.includes(cleaned);
    return {
      isCorrect,
      score: isCorrect ? maxScore : 0,
      maxScore
    };
  }

  // 3. Short Answer / Subjective Fallback (Rule-based keyword matching when AI is unavailable)
  if (q.expected_key_points && q.expected_key_points.length > 0) {
    const matchedCount = q.expected_key_points.filter(kp => {
      const words = kp.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      return words.some(w => cleaned.includes(w));
    }).length;

    const ratio = matchedCount / q.expected_key_points.length;
    let earned = Math.round(ratio * maxScore);
    if (cleaned.length > 10 && earned === 0) earned = 1; // Attempt credit
    earned = Math.min(maxScore, Math.max(0, earned));

    const isCorrect = earned >= Math.ceil(maxScore / 2);
    return {
      isCorrect,
      score: earned,
      maxScore
    };
  }

  // General fallback
  const isMatch = cleaned === target;
  return {
    isCorrect: isMatch,
    score: isMatch ? maxScore : 0,
    maxScore
  };
}

export interface CalculateResultsInput {
  questions: QuizQuestion[];
  studentAnswers: Record<string, string>;
  subjectiveEvaluations?: Record<string, SubjectiveEvaluationResult>;
  quizTitle: string;
  quizType: 'practice' | 'chapter_test';
  timeSpentSeconds?: number;
  chapterId?: string;
  chapterNumber?: number;
  chapterTitle?: string;
}

/**
 * Deterministic Results Engine:
 * Sums marks, groups by topic, computes accuracy and metrics, and produces review items and actions.
 * Gemini evaluates subjective answers, but the application deterministically calculates all final marks and stats.
 */
export function calculateQuizResults({
  questions,
  studentAnswers,
  subjectiveEvaluations = {},
  quizTitle,
  quizType,
  timeSpentSeconds = 0,
  chapterId,
  chapterNumber,
  chapterTitle
}: CalculateResultsInput): QuizAttemptResult {
  const totalQuestions = questions.length;
  let totalMarks = 0;
  let marksObtained = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let attemptedQuestions = 0;

  // Intermediate topic accumulator map
  const topicMap = new Map<string, {
    topicId: string;
    topicTitle: string;
    total: number;
    attempts: number;
    correct: number;
    incorrect: number;
    unattempted: number;
    totalMarks: number;
    marks: number;
  }>();

  // Evaluate each question deterministically
  const userAnswers: SubmittedAnswer[] = questions.map(q => {
    const rawAnswer = studentAnswers[q.id];
    const isAttempted = typeof rawAnswer === 'string' && rawAnswer.trim().length > 0 && rawAnswer !== '(Unanswered)';
    const studentAnswerText = isAttempted ? rawAnswer.trim() : '(Unanswered)';

    if (isAttempted) {
      attemptedQuestions++;
    }

    const isSubjectiveType = q.type === 'subjective' || q.type === 'short_answer';
    const aiEval = isSubjectiveType ? subjectiveEvaluations[q.id] : undefined;

    let score = 0;
    let maxScore = q.marks || (q.type === 'subjective' ? 3 : q.type === 'short_answer' ? 2 : 1);
    let isCorrect = false;

    if (isAttempted) {
      if (aiEval && typeof aiEval.score === 'number') {
        // AI-evaluated subjective question: clamp score safely within valid range
        maxScore = aiEval.max_score || maxScore;
        score = Math.min(maxScore, Math.max(0, aiEval.score));
        // A question is marked as correct if student earned at least 50% of the maximum marks
        isCorrect = score >= Math.ceil(maxScore / 2);
      } else {
        // Deterministic evaluation for MCQ / fill_blank or fallback rule-based matching
        const evalRes = evaluateQuizQuestion(q, studentAnswerText);
        score = evalRes.score;
        maxScore = evalRes.maxScore;
        isCorrect = evalRes.isCorrect;
      }
    } else {
      score = 0;
      isCorrect = false;
    }

    totalMarks += maxScore;
    marksObtained += score;

    if (isCorrect) {
      correctAnswers++;
    } else {
      incorrectAnswers++;
    }

    // Initialize or update topic accumulator
    if (!topicMap.has(q.topicId)) {
      topicMap.set(q.topicId, {
        topicId: q.topicId,
        topicTitle: q.topicTitle,
        total: 0,
        attempts: 0,
        correct: 0,
        incorrect: 0,
        unattempted: 0,
        totalMarks: 0,
        marks: 0
      });
    }

    const topicEntry = topicMap.get(q.topicId)!;
    topicEntry.total++;
    topicEntry.totalMarks += maxScore;
    topicEntry.marks += score;

    if (isAttempted) {
      topicEntry.attempts++;
      if (isCorrect) {
        topicEntry.correct++;
      } else {
        topicEntry.incorrect++;
      }
    } else {
      topicEntry.unattempted++;
      topicEntry.incorrect++;
    }

    const explanationText = q.explanation || 
      (q.expected_key_points && q.expected_key_points.length > 0 
        ? `NCERT Key Concepts: ${q.expected_key_points.join('; ')}` 
        : `Correct answer: ${q.answer}`);

    const submitted: SubmittedAnswer = {
      question_id: q.id,
      topic: q.topicTitle,
      topicId: q.topicId,
      question: q.question,
      type: q.type,
      student_answer: studentAnswerText,
      correct_answer: q.answer,
      score,
      maxScore,
      isCorrect,
      isAttempted,
      explanation: explanationText,
      options: q.options,
      expected_key_points: q.expected_key_points,
      rubric: q.rubric,
      evaluation: aiEval
    };

    return submitted;
  });

  const unattemptedQuestions = totalQuestions - attemptedQuestions;
  const percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
  const overallPerformanceCategory = classifyPerformance(percentage);

  // Build topic-wise performance metrics
  const topicPerformance: TopicResultMetrics[] = Array.from(topicMap.values()).map(t => {
    const topicPercentage = t.totalMarks > 0 ? Math.round((t.marks / t.totalMarks) * 100) : 0;
    const accuracy = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
    const category = classifyPerformance(topicPercentage);

    return {
      topicId: t.topicId,
      topicTitle: t.topicTitle,
      total: t.total,
      totalQuestions: t.total,
      attempts: t.attempts,
      correct: t.correct,
      incorrect: t.incorrect,
      unattempted: t.unattempted,
      totalMarks: t.totalMarks,
      score: t.marks,
      marks: t.marks,
      accuracy,
      percentage: topicPercentage,
      performance_category: category
    };
  });

  // Filter questions requiring review (all incorrect, partial credit, or unattempted)
  const reviewQuestions = userAnswers.filter(ua => !ua.isCorrect || ua.score < ua.maxScore || !ua.isAttempted);

  // Generate recommended next actions
  const recommendedActions: RecommendedAction[] = [];
  const weakTopics = topicPerformance.filter(t => t.performance_category === 'Needs Practice');
  const developingTopics = topicPerformance.filter(t => t.performance_category === 'Developing');

  if (weakTopics.length > 0) {
    weakTopics.forEach(t => {
      recommendedActions.push({
        id: `revise-${t.topicId}`,
        type: 'revise_topic',
        title: `Revise: ${t.topicTitle}`,
        description: `Scored ${t.percentage}% (${t.marks}/${t.totalMarks} marks) with ${t.accuracy}% accuracy. Read the lesson to strengthen core definitions and concepts.`,
        topicId: t.topicId,
        topicTitle: t.topicTitle,
        urgency: 'high',
        buttonLabel: 'Revise Lesson'
      });
    });
  }

  if (developingTopics.length > 0) {
    developingTopics.forEach(t => {
      recommendedActions.push({
        id: `practice-${t.topicId}`,
        type: 'practice_topic',
        title: `Targeted Practice: ${t.topicTitle}`,
        description: `Good foundation (${t.percentage}% score). Take quick interactive quizzes to push for complete mastery.`,
        topicId: t.topicId,
        topicTitle: t.topicTitle,
        urgency: 'medium',
        buttonLabel: 'Practice Topic'
      });
    });
  }

  // Quiz-level next action
  if (percentage < 60) {
    recommendedActions.push({
      id: 'retake-test',
      type: 'retake_test',
      title: quizType === 'chapter_test' ? 'Retake Chapter Assessment' : 'Retake Practice Quiz',
      description: 'After reviewing key topics above, retake the assessment to measure your improved understanding.',
      urgency: 'high',
      buttonLabel: 'Retake Test'
    });
  } else if (percentage >= 80) {
    recommendedActions.push({
      id: 'deep-dive-tutor',
      type: 'ask_tutor',
      title: 'Deep Curiosity Exploration with AI Tutor',
      description: 'Mastery achieved! Challenge your thinking with real-world scientific questions and extension experiments.',
      urgency: 'low',
      buttonLabel: 'Ask AI Tutor'
    });
  }

  const recommendedRevisionTopics = weakTopics.concat(developingTopics).map(t => ({
    topicId: t.topicId,
    topicTitle: t.topicTitle,
    reason: `Scored ${t.percentage}% in ${t.topicTitle}. Focus on NCERT key points and explanations.`
  }));

  return {
    id: `result-${Date.now()}`,
    chapterId,
    chapterNumber,
    chapterTitle,
    quizTitle,
    quizType,
    totalQuestions,
    attemptedQuestions,
    unattemptedQuestions,
    totalMarks,
    score: marksObtained,
    marksObtained,
    percentage,
    correctAnswers,
    incorrectAnswers,
    performanceCategory: overallPerformanceCategory,
    timeSpentSeconds,
    timestamp: new Date().toISOString(),
    userAnswers,
    topicPerformance,
    reviewQuestions,
    recommendedActions,
    recommendedRevisionTopics
  };
}
