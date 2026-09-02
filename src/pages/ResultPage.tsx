import React, { useEffect, useState, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  RotateCcw, 
  BookOpen, 
  Bot, 
  Sparkles, 
  Check, 
  X, 
  AlertTriangle, 
  BarChart2, 
  Lightbulb, 
  AlertCircle, 
  Loader2, 
  CheckCircle, 
  Target, 
  ListFilter 
} from 'lucide-react';
import { 
  QuizAttemptResult, 
  NavigationTab, 
  SubmittedAnswer, 
  SubjectiveEvaluationResult, 
  PerformanceCategory,
  TopicResultMetrics,
  AIRecommendationResult
} from '../types';
import { evaluateSubjectiveAnswer } from '../services/aiEvaluationService';
import { fetchAIRecommendations } from '../services/recommendationService';
import { formatTime } from '../utils';

interface ResultPageProps {
  result: QuizAttemptResult;
  onRetakeQuiz: () => void;
  onNavigate: (tab: NavigationTab) => void;
  onOpenLesson: (topicId: string) => void;
  onAskTutorWithPrompt: (topicTitle: string, prompt?: string) => void;
}

type QuestionFilterType = 'all' | 'incorrect_only' | 'correct_only' | 'subjective_only';

export const ResultPage: React.FC<ResultPageProps> = ({
  result,
  onRetakeQuiz,
  onNavigate,
  onOpenLesson,
  onAskTutorWithPrompt
}) => {
  const percentage = result.percentage;
  const isChapterTest = result.quizType === 'chapter_test';

  // Review section filter state
  const [filterMode, setFilterMode] = useState<QuestionFilterType>('all');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');

  // State to hold any re-evaluated subjective answers on the results screen
  const [reEvaluations, setReEvaluations] = useState<Record<string, SubjectiveEvaluationResult>>({});
  const [evaluatingQuestionId, setEvaluatingQuestionId] = useState<string | null>(null);

  // AI Recommendation for the result attempt
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendationResult | null>(null);
  const [_isLoadingRecommendation, setIsLoadingRecommendation] = useState<boolean>(false);

  // Ref to review questions section for smooth scrolling
  const reviewSectionRef = useRef<HTMLDivElement>(null);

  // Performance classification:
  // Strong: >= 80%
  // Developing: 60% - 79%
  // Needs Practice: < 60%
  const overallCategory: PerformanceCategory = result.performanceCategory || (
    percentage >= 80 ? 'Strong' : percentage >= 60 ? 'Developing' : 'Needs Practice'
  );

  let categoryIcon = '🎯';
  let categoryBadgeClass = 'bg-rose-50 text-rose-800 border-rose-200';
  let categoryDescription = 'Keep going! Review key concepts, definitions, and examples in Chapter 1 to build solid scientific understanding.';

  if (overallCategory === 'Strong') {
    categoryIcon = '🌟';
    categoryBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    categoryDescription = 'Outstanding mastery of Chapter 1! You demonstrate excellent scientific curiosity, methodology, and conceptual clarity.';
  } else if (overallCategory === 'Developing') {
    categoryIcon = '📈';
    categoryBadgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
    categoryDescription = 'Good progress! Reviewing a few specific topics and definitions will help you score top marks in upcoming school assessments.';
  }

  // Group topics into categories
  const topicList: TopicResultMetrics[] = result.topicPerformance || [];
  const strongTopics = topicList.filter(t => t.performance_category === 'Strong' || t.percentage >= 80);
  const developingTopics = topicList.filter(t => t.performance_category === 'Developing' || (t.percentage >= 60 && t.percentage < 80));
  const needsPracticeTopics = topicList.filter(t => t.performance_category === 'Needs Practice' || t.percentage < 60);

  // Fetch AI Recommendation for this attempt
  useEffect(() => {
    let isMounted = true;
    const fetchRec = async () => {
      setIsLoadingRecommendation(true);
      const incorrectList = (result.userAnswers || [])
        .filter(ua => !ua.isCorrect || ua.score < ua.maxScore)
        .slice(0, 5)
        .map(ua => ({
          question: ua.question,
          topicTitle: ua.topic || 'Chapter 1',
          studentAnswer: ua.student_answer,
          correctAnswer: ua.correct_answer
        }));

      const payload = {
        topicScores: (result.topicPerformance || []).map(t => ({
          topicId: t.topicId,
          topicTitle: t.topicTitle,
          accuracy: t.accuracy || t.percentage,
          scoreDisplay: `${t.marks}/${t.totalMarks}`,
          attempts: t.attempts,
          classification: t.performance_category
        })),
        quizScores: result.quizType === 'practice' ? [{
          quizTitle: result.quizTitle,
          percentage: result.percentage,
          score: result.score,
          totalMarks: result.totalMarks,
          timestamp: result.timestamp
        }] : [],
        testScores: result.quizType === 'chapter_test' ? [{
          testTitle: result.quizTitle,
          percentage: result.percentage,
          score: result.score,
          totalMarks: result.totalMarks,
          timestamp: result.timestamp
        }] : [],
        completedTopics: strongTopics.map(t => t.topicTitle),
        incorrectQuestions: incorrectList,
        recentActivity: `Completed ${result.quizTitle} scoring ${result.score}/${result.totalMarks} (${result.percentage}%).`
      };

      const res = await fetchAIRecommendations(payload);
      if (isMounted && res.success && res.data) {
        setAiRecommendation(res.data);
      }
      if (isMounted) setIsLoadingRecommendation(false);
    };

    fetchRec();
    return () => { isMounted = false; };
  }, [result]);

  // Trigger celebration confetti for high scores
  useEffect(() => {
    if (percentage >= 70) {
      confetti({
        particleCount: percentage >= 85 ? 100 : 50,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [percentage]);

  const handleReEvaluateAnswer = async (ua: SubmittedAnswer) => {
    if (evaluatingQuestionId || !ua.student_answer || ua.student_answer === '(Unanswered)') return;

    setEvaluatingQuestionId(ua.question_id);
    const res = await evaluateSubjectiveAnswer({
      question: ua.question,
      student_answer: ua.student_answer,
      expected_answer: ua.correct_answer,
      expected_key_points: ua.expected_key_points,
      marking_criteria: ua.rubric,
      marks: ua.maxScore
    });
    setEvaluatingQuestionId(null);

    if (res.success && res.evaluation) {
      setReEvaluations(prev => ({
        ...prev,
        [ua.question_id]: res.evaluation!
      }));
    }
  };

  // Scroll to review questions and switch filter to incorrect answers
  const handleScrollToReviewIncorrect = () => {
    setFilterMode('incorrect_only');
    setSelectedTopicFilter('all');
    if (reviewSectionRef.current) {
      reviewSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filtered user answers for review
  const filteredAnswers = useMemo(() => {
    let list = result.userAnswers || [];

    if (selectedTopicFilter !== 'all') {
      list = list.filter(ua => ua.topicId === selectedTopicFilter || ua.topic === selectedTopicFilter);
    }

    if (filterMode === 'incorrect_only') {
      return list.filter(ua => !ua.isCorrect || ua.score < ua.maxScore || ua.student_answer === '(Unanswered)');
    } else if (filterMode === 'correct_only') {
      return list.filter(ua => ua.isCorrect && ua.score === ua.maxScore);
    } else if (filterMode === 'subjective_only') {
      return list.filter(ua => ua.type === 'subjective' || ua.type === 'short_answer');
    }

    return list;
  }, [result.userAnswers, filterMode, selectedTopicFilter]);

  const incorrectCount = result.incorrectAnswers;
  const correctCount = result.correctAnswers;
  const totalQuestions = result.totalQuestions;
  const attemptedCount = result.attemptedQuestions ?? (totalQuestions - (result.unattemptedQuestions ?? 0));
  const unattemptedCount = result.unattemptedQuestions ?? (totalQuestions - attemptedCount);
  const marksObtained = result.score;
  const totalMarks = result.totalMarks;

  return (
    <div id="quiz-results-screen" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300 pb-24 md:pb-12">
      
      {/* 1. OVERALL RESULT HERO CARD */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-50/50 via-emerald-50/40 to-transparent rounded-bl-full pointer-events-none" />

        <div className="relative z-10 space-y-6">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>{isChapterTest ? 'School Assessment Report' : 'Practice Quiz Summary'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 mt-2">
                {result.quizTitle}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-extrabold px-3 py-1.5 rounded-2xl border flex items-center gap-1.5 ${categoryBadgeClass}`}>
                <span>{categoryIcon}</span>
                <span>{overallCategory} Mastery</span>
              </span>
            </div>
          </div>

          {/* 4 Core Score Metrics Grid: Total Marks, Marks Obtained, Percentage, Accuracy */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Total Marks */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Marks
              </span>
              <strong className="text-2xl font-extrabold text-slate-900 mt-0.5 block">
                {totalMarks}
              </strong>
              <span className="text-[10px] text-slate-400 font-medium">
                {totalQuestions} Questions ({attemptedCount} Attempted)
              </span>
            </div>

            {/* Marks Obtained */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Marks Obtained
              </span>
              <strong className="text-2xl font-extrabold text-indigo-700 mt-0.5 block">
                {marksObtained}
              </strong>
              <span className="text-[10px] text-slate-400 font-medium">
                Out of {totalMarks} Total
              </span>
            </div>

            {/* Percentage */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Percentage
              </span>
              <strong className={`text-2xl font-extrabold mt-0.5 block ${
                percentage >= 80 ? 'text-emerald-700' : percentage >= 60 ? 'text-amber-700' : 'text-rose-700'
              }`}>
                {percentage}%
              </strong>
              <span className="text-[10px] text-slate-400 font-medium">
                {overallCategory} Category
              </span>
            </div>

            {/* Questions Correct & Incorrect */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Accuracy
              </span>
              <strong className="text-2xl font-extrabold text-slate-900 mt-0.5 block">
                {correctCount} <span className="text-xs font-normal text-slate-400">/ {totalQuestions}</span>
              </strong>
              <span className="text-[10px] text-slate-400 font-medium">
                {incorrectCount} Incorrect {unattemptedCount > 0 ? `• ${unattemptedCount} Skipped` : ''}
              </span>
            </div>

          </div>

          {/* Time and AI Assessment Feedback Note */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
            <Bot className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <strong className="text-indigo-950 font-bold">
                  Scientific Assessment Evaluation:
                </strong>
                {result.timeSpentSeconds > 0 && (
                  <span className="text-[11px] text-indigo-700 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Time: {formatTime(result.timeSpentSeconds)}
                  </span>
                )}
              </div>
              <p>{categoryDescription}</p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {incorrectCount > 0 && (
              <button
                id="review-incorrect-btn"
                onClick={handleScrollToReviewIncorrect}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Review Incorrect Answers ({incorrectCount})</span>
              </button>
            )}

            <button
              id="retake-quiz-hero-btn"
              onClick={onRetakeQuiz}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isChapterTest ? 'Retake Test' : 'Retake Quiz'}</span>
            </button>

            <button
              onClick={() => onNavigate('progress')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>View Full Progress</span>
            </button>
          </div>

        </div>
      </section>

      {/* 2. TOPIC-WISE PERFORMANCE BREAKDOWN */}
      {topicList.length > 0 && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold font-heading text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
                <span>Topic-Wise Performance Breakdown</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic scoring and accuracy across Chapter 1 sub-topics.
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Strong (&ge;80%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Developing (60-79%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Needs Practice (&lt;60%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topicList.map((tp) => {
              let barColor = 'bg-rose-500';
              let badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
              let statusLabel: PerformanceCategory = 'Needs Practice';

              if (tp.percentage >= 80) {
                barColor = 'bg-emerald-500';
                badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                statusLabel = 'Strong';
              } else if (tp.percentage >= 60) {
                barColor = 'bg-amber-500';
                badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                statusLabel = 'Developing';
              }

              const topicAttempts = tp.attempts ?? tp.total;
              const topicAccuracy = tp.accuracy ?? (tp.total > 0 ? Math.round((tp.correct / tp.total) * 100) : 0);

              return (
                <div 
                  key={tp.topicId}
                  id={`topic-performance-${tp.topicId}`}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                        {tp.topicId}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {tp.topicTitle}
                      </h4>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 ${badgeColor}`}>
                      {statusLabel} • {tp.percentage}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${tp.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* 4 Topic Metrics: Attempts, Correct, Marks, Accuracy */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60 text-center">
                    <div className="p-1.5 rounded-lg bg-white border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Attempts</span>
                      <span className="text-xs font-extrabold text-slate-800">{topicAttempts} / {tp.total}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Correct</span>
                      <span className="text-xs font-extrabold text-emerald-700">{tp.correct} / {tp.total}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Marks</span>
                      <span className="text-xs font-extrabold text-indigo-700">{tp.score ?? tp.marks} / {tp.totalMarks}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Accuracy</span>
                      <span className="text-xs font-extrabold text-slate-800">{topicAccuracy}%</span>
                    </div>
                  </div>

                  {/* Quick Action Button for Topic */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      onClick={() => onOpenLesson(tp.topicId)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Revise Topic Lesson &rarr;</span>
                    </button>
                    <button
                      onClick={() => onAskTutorWithPrompt(tp.topicTitle, `I want to improve my understanding of "${tp.topicTitle}". Can you explain the most important concepts?`)}
                      className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Bot className="w-3 h-3" />
                      <span>Ask Tutor</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. PERFORMANCE CLASSIFICATION CLUSTERS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Strong Topics Card */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
            <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-xs">🌟</span>
            <span>Strong Topics (&ge;80%) ({strongTopics.length})</span>
          </div>
          {strongTopics.length > 0 ? (
            <ul className="space-y-2">
              {strongTopics.map(t => (
                <li key={t.topicId} className="text-xs p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                  <span className="font-semibold text-emerald-950 truncate">{t.topicTitle}</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">{t.percentage}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">No topics in this tier yet. Review the lessons and attempt targeted quizzes.</p>
          )}
        </div>

        {/* Developing Topics Card */}
        <div className="bg-white rounded-3xl p-5 border border-amber-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
            <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-xs">📈</span>
            <span>Developing Topics (60-79%) ({developingTopics.length})</span>
          </div>
          {developingTopics.length > 0 ? (
            <ul className="space-y-2">
              {developingTopics.map(t => (
                <li key={t.topicId} className="text-xs p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
                  <span className="font-semibold text-amber-950 truncate">{t.topicTitle}</span>
                  <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">{t.percentage}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">No developing topics currently.</p>
          )}
        </div>

        {/* Needs Practice Topics Card */}
        <div className="bg-white rounded-3xl p-5 border border-rose-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
            <span className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center text-xs">🎯</span>
            <span>Needs Practice (&lt;60%) ({needsPracticeTopics.length})</span>
          </div>
          {needsPracticeTopics.length > 0 ? (
            <ul className="space-y-2">
              {needsPracticeTopics.map(t => (
                <li key={t.topicId} className="text-xs p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center justify-between">
                  <span className="font-semibold text-rose-950 truncate">{t.topicTitle}</span>
                  <button
                    onClick={() => onOpenLesson(t.topicId)}
                    className="text-[10px] font-bold text-rose-700 hover:text-rose-900 underline shrink-0 ml-2 cursor-pointer"
                  >
                    Revise Topic
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">Excellent! No topics require urgent revision.</p>
          )}
        </div>

      </section>

      {/* 4. AI PERSONALIZED RECOMMENDATIONS (Structured Gemini Guidance) */}
      {aiRecommendation && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                  AI RECOMMENDATION
                </span>
                <h3 className="text-base font-bold font-heading text-slate-900">
                  Targeted Learning Plan for Chapter 1
                </h3>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Personalized
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-slate-200/80 space-y-4">
            <p className="text-sm font-medium text-slate-800 leading-relaxed">
              {aiRecommendation.summary}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                <span className="font-bold text-emerald-800 uppercase text-[10px] block">Strong Area</span>
                <strong className="text-slate-900 text-xs mt-0.5 block">{aiRecommendation.strong_area}</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-2xs">
                <span className="font-bold text-amber-800 uppercase text-[10px] block">Area to Strengthen</span>
                <strong className="text-slate-900 text-xs mt-0.5 block">{aiRecommendation.weak_area}</strong>
              </div>
            </div>

            {aiRecommendation.reason && (
              <div className="text-xs text-slate-600 bg-white/80 p-3 rounded-xl border border-slate-200/70 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Reason: </strong>
                  <span>{aiRecommendation.reason}</span>
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-emerald-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-300 block">Recommended Action</span>
                <p className="text-xs font-medium text-emerald-50 mt-0.5">{aiRecommendation.recommended_action}</p>
              </div>
              <button
                onClick={() => {
                  const targetTopic = needsPracticeTopics[0]?.topicId || developingTopics[0]?.topicId || 'topic-1';
                  onOpenLesson(targetTopic);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 self-start sm:self-auto transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Go to Lesson</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 5. RECOMMENDED NEXT ACTIONS */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-extrabold font-heading text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <span>Recommended Next Actions</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">Personalized Next Steps</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {needsPracticeTopics.length > 0 ? (
            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <BookOpen className="w-4 h-4 text-rose-600" />
                <span>Primary Priority: Revise {needsPracticeTopics[0].topicTitle}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scored {needsPracticeTopics[0].percentage}% in this sub-topic. Review the NCERT explanations and key definitions to strengthen foundational concepts.
              </p>
              <button
                onClick={() => onOpenLesson(needsPracticeTopics[0].topicId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <span>Revise {needsPracticeTopics[0].topicId} Lesson</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : developingTopics.length > 0 ? (
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <Target className="w-4 h-4 text-amber-600" />
                <span>Targeted Practice: {developingTopics[0].topicTitle}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                You have a solid base in {developingTopics[0].topicTitle}. Retaking a quick topic quiz will help you reach full mastery.
              </p>
              <button
                onClick={() => onOpenLesson(developingTopics[0].topicId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <span>Open {developingTopics[0].topicId} Lesson</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <Trophy className="w-4 h-4 text-emerald-600" />
                <span>Outstanding Score!</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                You have demonstrated thorough mastery across all Chapter 1 concepts and the scientific inquiry process.
              </p>
              <button
                onClick={() => onNavigate('learn')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <span>Continue Curriculum</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Action 2: Ask AI Tutor or Retake */}
          <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>Scientific Clarification with AI Tutor</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Have doubts about any question or concept? Ask the NCERT AI Tutor to explain scientific reasoning step-by-step.
            </p>
            <button
              onClick={() => onAskTutorWithPrompt(
                needsPracticeTopics[0]?.topicTitle || 'Chapter 1: The Wonder of Science',
                `I just completed the ${result.quizTitle} with a score of ${percentage}%. Can you give me a quick 3-point summary of the most important concepts to remember?`
              )}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              <span>Ask AI Tutor for Summary</span>
              <Bot className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. QUESTION-WISE REVIEW SECTION */}
      <section 
        ref={reviewSectionRef}
        id="question-review-section" 
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-extrabold font-heading text-slate-900 flex items-center gap-2">
              <ListFilter className="w-5 h-5 text-indigo-600" />
              <span>Detailed Question Review ({filteredAnswers.length} of {result.userAnswers.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review correct answers, student responses, NCERT scientific explanations, and Gemini AI examiner evaluations.
            </p>
          </div>

          {/* Review Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl flex-wrap">
            <button
              id="filter-all-questions-btn"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'all' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({totalQuestions})
            </button>

            <button
              id="filter-incorrect-btn"
              onClick={() => setFilterMode('incorrect_only')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filterMode === 'incorrect_only' 
                  ? 'bg-amber-500 text-white shadow-2xs' 
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Incorrect / Review ({incorrectCount})</span>
            </button>

            <button
              id="filter-correct-btn"
              onClick={() => setFilterMode('correct_only')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filterMode === 'correct_only' 
                  ? 'bg-emerald-600 text-white shadow-2xs' 
                  : 'text-emerald-800 hover:text-emerald-950'
              }`}
            >
              <CheckCircle className="w-3 h-3" />
              <span>Correct ({correctCount})</span>
            </button>

            <button
              id="filter-subjective-btn"
              onClick={() => setFilterMode('subjective_only')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filterMode === 'subjective_only' 
                  ? 'bg-indigo-600 text-white shadow-2xs' 
                  : 'text-indigo-700 hover:text-indigo-900'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Subjective AI</span>
            </button>
          </div>
        </div>

        {/* Topic Filter Dropdown */}
        {topicList.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500">Filter by Topic:</span>
            <select
              value={selectedTopicFilter}
              onChange={(e) => setSelectedTopicFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Topics (Chapter 1)</option>
              {topicList.map(t => (
                <option key={t.topicId} value={t.topicId}>
                  {t.topicId}: {t.topicTitle}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Questions List */}
        {filteredAnswers.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-700">No questions match the selected filter.</p>
            <button
              onClick={() => { setFilterMode('all'); setSelectedTopicFilter('all'); }}
              className="text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Show all questions
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnswers.map((ua, idx) => {
              const activeEval = reEvaluations[ua.question_id] || ua.evaluation;
              const isEvaluatingThis = evaluatingQuestionId === ua.question_id;
              const isUnanswered = !ua.student_answer || ua.student_answer === '(Unanswered)';

              return (
                <div 
                  key={ua.question_id}
                  id={`review-question-${ua.question_id}`}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    ua.isCorrect 
                      ? 'border-emerald-200 bg-emerald-50/20' 
                      : ua.score > 0
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-rose-200 bg-rose-50/20'
                  }`}
                >
                  {/* Question Header & Points */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        ua.isCorrect 
                          ? 'bg-emerald-600 text-white' 
                          : ua.score > 0
                          ? 'bg-amber-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-500">
                            {ua.topic}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {ua.type.replace('_', ' ')}
                          </span>
                          
                          {/* Explicit Result Status Badge (Not color alone) */}
                          {ua.isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>Correct</span>
                            </span>
                          ) : isUnanswered ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-slate-300">
                              <AlertCircle className="w-3 h-3 text-slate-600" />
                              <span>Unattempted</span>
                            </span>
                          ) : ua.score > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-700" />
                              <span>Partially Correct</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                              <XCircle className="w-3 h-3 text-rose-700" />
                              <span>Incorrect</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                          {ua.question}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs font-extrabold px-2.5 py-1 rounded-xl border ${
                        ua.isCorrect 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : ua.score > 0
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {activeEval ? activeEval.score : ua.score} / {ua.maxScore} Mark{ua.maxScore > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* MCQ Options Display with Explicit Badges */}
                  {ua.type === 'mcq' && ua.options && (
                    <div className="grid sm:grid-cols-2 gap-2 pt-1" role="group" aria-label={`Options review for question ${idx + 1}`}>
                      {ua.options.map((opt, optIdx) => {
                        const isUserChoice = (ua.student_answer || '').trim().toLowerCase() === opt.trim().toLowerCase();
                        const isCorrectAnswer = (ua.correct_answer || '').trim().toLowerCase() === opt.trim().toLowerCase();

                        let optBadge = 'border-slate-200 bg-white text-slate-700';
                        if (isCorrectAnswer) {
                          optBadge = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-400';
                        } else if (isUserChoice && !isCorrectAnswer) {
                          optBadge = 'border-rose-400 bg-rose-50 text-rose-950 ring-1 ring-rose-300';
                        }

                        return (
                          <div key={optIdx} className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-1.5 ${optBadge}`}>
                            <div className="flex items-start justify-between gap-2">
                              <span className="leading-snug">{opt}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/40">
                              {isCorrectAnswer && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-md">
                                  <Check className="w-3 h-3 text-emerald-800" />
                                  <span>Correct Answer</span>
                                </span>
                              )}
                              {isUserChoice && !isCorrectAnswer && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-rose-200 text-rose-950 px-2 py-0.5 rounded-md">
                                  <X className="w-3 h-3 text-rose-800" />
                                  <span>Your Choice (Incorrect)</span>
                                </span>
                              )}
                              {isUserChoice && isCorrectAnswer && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-emerald-300 text-emerald-950 px-2 py-0.5 rounded-md">
                                  <span>Your Choice (Correct)</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fill-in-blanks / Short-answer / Subjective Basic Answer Summary */}
                  {(ua.type === 'fill_blank' || ua.type === 'short_answer' || ua.type === 'subjective') && (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-500 font-medium">Student Submitted Answer:</span>
                        <span className={`font-bold text-right ${ua.isCorrect ? 'text-emerald-700' : 'text-slate-800'}`}>
                          {ua.student_answer}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-slate-100">
                        <span className="text-slate-500 font-medium">NCERT Standard Answer:</span>
                        <span className="font-bold text-emerald-800 text-right">
                          {ua.correct_answer}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Rich AI Subjective Evaluation Report */}
                  {activeEval && (
                    <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-indigo-900 font-extrabold">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Gemini AI Subjective Examiner Evaluation</span>
                        </div>
                        <span className="font-extrabold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md">
                          AI Score: {activeEval.score} / {activeEval.max_score} Marks
                        </span>
                      </div>

                      {/* Strengths */}
                      {activeEval.strengths && activeEval.strengths.length > 0 && (
                        <div className="space-y-1">
                          <strong className="text-emerald-900 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Demonstrated Strengths:</span>
                          </strong>
                          <ul className="list-disc list-inside space-y-0.5 text-emerald-950 pl-1">
                            {activeEval.strengths.map((str, sIdx) => (
                              <li key={sIdx}>{str}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Missing Points */}
                      {activeEval.missing_points && activeEval.missing_points.length > 0 && (
                        <div className="space-y-1">
                          <strong className="text-amber-900 flex items-center gap-1 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Missing Key Concepts:</span>
                          </strong>
                          <ul className="list-disc list-inside space-y-0.5 text-amber-950 pl-1">
                            {activeEval.missing_points.map((mp, mIdx) => (
                              <li key={mIdx}>{mp}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Misconceptions */}
                      {activeEval.misconceptions && activeEval.misconceptions.length > 0 && (
                        <div className="space-y-1">
                          <strong className="text-rose-900 flex items-center gap-1 font-bold">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Scientific Clarifications:</span>
                          </strong>
                          <ul className="list-disc list-inside space-y-0.5 text-rose-950 pl-1">
                            {activeEval.misconceptions.map((misc, mcIdx) => (
                              <li key={mcIdx}>{misc}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Examiner Improvement Tip */}
                      {activeEval.improvement_tip && (
                        <div className="p-2.5 rounded-xl bg-white border border-indigo-100 flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div className="text-slate-800">
                            <strong className="block text-indigo-950 font-bold">Examiner Improvement Tip:</strong>
                            <p className="mt-0.5 leading-relaxed">{activeEval.improvement_tip}</p>
                          </div>
                        </div>
                      )}

                      {/* Model Suggested Answer */}
                      {activeEval.suggested_answer && (
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 space-y-0.5">
                          <strong className="text-slate-900 block font-bold">CBSE / NCERT Model Response:</strong>
                          <p className="italic text-slate-700">"{activeEval.suggested_answer}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Evaluation Action / Re-evaluate button */}
                  {(ua.type === 'subjective' || ua.type === 'short_answer') && !activeEval && !isUnanswered && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleReEvaluateAnswer(ua)}
                        disabled={isEvaluatingThis}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold text-xs hover:bg-indigo-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {isEvaluatingThis ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Evaluating with AI...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Evaluate Response with AI Examiner</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* NCERT Scientific Explanation */}
                  {ua.explanation && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 block mb-0.5 font-bold">NCERT Scientific Explanation:</strong>
                      {ua.explanation}
                    </div>
                  )}

                  {/* Ask AI Tutor about this question */}
                  <div className="flex items-center justify-end pt-1">
                    <button
                      onClick={() => onAskTutorWithPrompt(
                        ua.topic, 
                        `Can you explain the solution and key scientific principles for this Chapter 1 question: "${ua.question}" in a clear, friendly way for a Class 6 student?`
                      )}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Ask AI Tutor about this question &rarr;</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 7. ACTION FOOTER */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          id="retake-quiz-footer-btn"
          onClick={onRetakeQuiz}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{isChapterTest ? 'Retake Chapter Assessment' : 'Retake Practice Quiz'}</span>
        </button>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            id="view-progress-footer-btn"
            onClick={() => onNavigate('progress')}
            className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            View Progress Dashboard
          </button>
          <button
            id="continue-learning-footer-btn"
            onClick={() => onNavigate('learn')}
            className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-colors cursor-pointer"
          >
            Continue Learning
          </button>
        </div>
      </section>

    </div>
  );
};
