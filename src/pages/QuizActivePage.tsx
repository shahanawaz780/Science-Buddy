import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Flag, 
  Loader2, 
  Edit3, 
  ListOrdered,
  FileText,
  Eye,
  AlertCircle,
  Check,
  X,
  RefreshCw,
  Lightbulb,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { 
  QuizConfig, 
  QuizQuestion, 
  QuizAttemptResult, 
  SubjectiveEvaluationResult
} from '../types';
import { getExamQuestions, getQuestionsForTopic, getQuestionsForChapter, getChapter } from '../services/curriculumService';
import { useProgress } from '../context/ProgressContext';
import { evaluateSubjectiveAnswer, evaluateBatchSubjectiveAnswers } from '../services/aiEvaluationService';
import { calculateQuizResults } from '../services/resultsEngine';
import { QUIZ_SETTINGS } from '../config';
import { formatTime } from '../utils';

interface QuizActivePageProps {
  config: QuizConfig;
  onFinishQuiz: (result: QuizAttemptResult) => void;
  onExit: () => void;
  onAskTutorWithPrompt: (topicTitle: string, prompt?: string) => void;
}

export const QuizActivePage: React.FC<QuizActivePageProps> = ({
  config,
  onFinishQuiz,
  onExit,
  onAskTutorWithPrompt: _onAskTutorWithPrompt
}) => {
  const { recordQuizResult, activeChapterId } = useProgress();
  const isChapterTest = config.type === 'chapter_test' || config.id === 'TEST_01' || config.id === 'CH2_CHAPTER_TEST';

  // Load questions
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Student answers map: questionId -> answer text
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  
  // Practice mode instant feedback toggle (ONLY used in practice mode)
  const [practiceConfirmed, setPracticeConfirmed] = useState<Record<string, boolean>>({});

  // Live subjective evaluations for practice mode
  const [practiceSubjectiveEvals, setPracticeSubjectiveEvals] = useState<Record<string, SubjectiveEvaluationResult>>({});
  const [evaluatingMap, setEvaluatingMap] = useState<Record<string, boolean>>({});
  const [evalErrorMap, setEvalErrorMap] = useState<Record<string, string>>({});

  // View state: 'taking' (question screen) or 'review' (review before submission screen)
  const [activeView, setActiveView] = useState<'taking' | 'review'>('taking');

  // Time remaining (20 mins for Chapter Test, 8 mins for Practice Quiz)
  const initialSeconds = isChapterTest ? QUIZ_SETTINGS.chapterTestSeconds : QUIZ_SETTINGS.practiceQuizSeconds;
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(initialSeconds);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatusText, setSubmissionStatusText] = useState('Evaluating answers with Gemini AI Examiner...');

  useEffect(() => {
    const targetChapterId = config.chapterId || activeChapterId;
    let selected: QuizQuestion[] = [];
    if (config.id) {
      selected = getExamQuestions(config.id, targetChapterId);
    }
    
    if (selected.length === 0) {
      if (config.topicFilter) {
        selected = getQuestionsForTopic(config.topicFilter, targetChapterId);
      } else {
        selected = getQuestionsForChapter(targetChapterId);
      }
      
      if (config.questionCount && selected.length > config.questionCount) {
        selected = selected.slice(0, config.questionCount);
      }
    }

    // Deduplicate questions by ID
    const uniqueMap = new Map<string, QuizQuestion>();
    selected.forEach(q => {
      if (!uniqueMap.has(q.id)) {
        uniqueMap.set(q.id, q);
      }
    });

    setQuestions(Array.from(uniqueMap.values()));
    setCurrentIndex(0);
    setStudentAnswers({});
    setMarkedForReview({});
    setPracticeConfirmed({});
    setPracticeSubjectiveEvals({});
    setEvaluatingMap({});
    setEvalErrorMap({});
    setActiveView('taking');
  }, [config, activeChapterId]);

  const executeSubmission = async () => {
    setIsSubmitting(true);
    setSubmissionStatusText('Evaluating answers with Gemini AI Examiner...');

    const targetChapterId = config.chapterId || activeChapterId;
    const targetChapter = getChapter(targetChapterId);

    // Identify all subjective & short answer questions that were answered
    const subjectiveItems = questions
      .filter(q => (q.type === 'subjective' || q.type === 'short_answer') && (studentAnswers[q.id] || '').trim().length > 0)
      .map(q => ({
        id: q.id,
        question: q.question,
        student_answer: studentAnswers[q.id],
        expected_answer: q.answer,
        expected_key_points: q.expected_key_points,
        marking_criteria: q.rubric,
        marks: q.marks || (q.type === 'subjective' ? QUIZ_SETTINGS.defaultSubjectiveMarks : QUIZ_SETTINGS.defaultShortAnswerMarks),
        chapter_id: targetChapterId
      }));

    let allSubjectiveEvals: Record<string, SubjectiveEvaluationResult> = { ...practiceSubjectiveEvals };

    // Batch evaluate any unevaluated subjective items
    const unevaluated = subjectiveItems.filter(item => !allSubjectiveEvals[item.id]);
    if (unevaluated.length > 0) {
      setSubmissionStatusText(`Evaluating ${unevaluated.length} subjective response${unevaluated.length > 1 ? 's' : ''} with Gemini AI...`);
      try {
        const batchResults = await evaluateBatchSubjectiveAnswers(unevaluated, targetChapterId);
        allSubjectiveEvals = { ...allSubjectiveEvals, ...batchResults };
      } catch (err) {
        console.warn('Batch AI evaluation failed, falling back to rule-based evaluation:', err);
      }
    }

    // Deterministic Results Calculation Engine (Gemini evaluated subjective answers; application calculates all final marks and stats)
    const timeSpent = initialSeconds - Math.max(0, timeRemainingSeconds);
    const resultPayload = calculateQuizResults({
      questions,
      studentAnswers,
      subjectiveEvaluations: allSubjectiveEvals,
      quizTitle: config.title || (isChapterTest ? `Chapter ${targetChapter.number} Assessment Test` : `Chapter ${targetChapter.number} Practice Quiz`),
      quizType: isChapterTest ? 'chapter_test' : 'practice',
      timeSpentSeconds: timeSpent,
      chapterId: targetChapter.id,
      chapterNumber: targetChapter.number,
      chapterTitle: targetChapter.title
    });

    recordQuizResult(resultPayload);
    setIsSubmitting(false);
    setShowSubmitModal(false);
    onFinishQuiz(resultPayload);
  };

  // Timer countdown
  useEffect(() => {
    if (timeRemainingSeconds <= 0) {
      executeSubmission();
      return;
    }
    const timer = setInterval(() => {
      setTimeRemainingSeconds(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemainingSeconds]);

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto p-8 text-center bg-white rounded-3xl border border-slate-200 mt-12 shadow-xs">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
        <p className="text-sm font-bold text-slate-700 font-heading">
          Preparing {config.title}...
        </p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isPractice = !isChapterTest;
  const currentAnswer = studentAnswers[currentQ.id] || '';
  const isConfirmedInPractice = isPractice && practiceConfirmed[currentQ.id];
  const isCurrentMarkedForReview = markedForReview[currentQ.id];
  const isCurrentlyEvaluating = !!evaluatingMap[currentQ.id];
  const currentEvalResult = practiceSubjectiveEvals[currentQ.id];
  const currentEvalError = evalErrorMap[currentQ.id];

  const handleSelectMcq = (optionText: string) => {
    if (isConfirmedInPractice) return;
    setStudentAnswers(prev => ({ ...prev, [currentQ.id]: optionText }));

    if (isPractice) {
      setPracticeConfirmed(prev => ({ ...prev, [currentQ.id]: true }));
    }
  };

  const handleTextAnswerChange = (val: string) => {
    setStudentAnswers(prev => ({ ...prev, [currentQ.id]: val }));
    if (evalErrorMap[currentQ.id]) {
      setEvalErrorMap(prev => ({ ...prev, [currentQ.id]: '' }));
    }
  };

  const handleConfirmPracticeAnswer = () => {
    if (!currentAnswer.trim()) return;
    setPracticeConfirmed(prev => ({ ...prev, [currentQ.id]: true }));
  };

  // Live AI Subjective Evaluation in Practice Mode
  const handleEvaluateSubjectiveInPractice = async () => {
    if (!currentAnswer.trim()) return;

    setEvaluatingMap(prev => ({ ...prev, [currentQ.id]: true }));
    setEvalErrorMap(prev => ({ ...prev, [currentQ.id]: '' }));
    setPracticeConfirmed(prev => ({ ...prev, [currentQ.id]: true }));

    const targetChapterId = config.chapterId || activeChapterId;
    const res = await evaluateSubjectiveAnswer({
      question: currentQ.question,
      student_answer: currentAnswer,
      expected_answer: currentQ.answer,
      expected_key_points: currentQ.expected_key_points,
      marking_criteria: currentQ.rubric,
      marks: currentQ.marks || (currentQ.type === 'subjective' ? 3 : 2),
      chapter_id: targetChapterId
    });

    setEvaluatingMap(prev => ({ ...prev, [currentQ.id]: false }));

    if (res.success && res.evaluation) {
      setPracticeSubjectiveEvals(prev => ({
        ...prev,
        [currentQ.id]: res.evaluation!
      }));
    } else {
      setEvalErrorMap(prev => ({
        ...prev,
        [currentQ.id]: res.error || 'Evaluation service temporarily unavailable. Click retry to try again.'
      }));
    }
  };

  const toggleMarkForReview = (qId: string) => {
    setMarkedForReview(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const answeredCount = Object.keys(studentAnswers).filter(k => (studentAnswers[k] || '').trim().length > 0).length;
  const remainingCount = questions.length - answeredCount;
  const markedCount = Object.keys(markedForReview).filter(k => markedForReview[k]).length;

  const jumpToQuestion = (idx: number) => {
    setCurrentIndex(idx);
    setActiveView('taking');
  };

  // -------------------------------------------------------------
  // PRE-SUBMISSION REVIEW SCREEN (When activeView === 'review')
  // -------------------------------------------------------------
  if (activeView === 'review') {
    return (
      <div id="quiz-review-screen" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-in fade-in duration-200 pb-24 md:pb-12">
        
        {/* Header & Back to Test */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-bold border border-indigo-200">
              <Eye className="w-3.5 h-3.5" />
              <span>Assessment Pre-Submission Review</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 mt-1">
              Review Before Final Submission
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Check all answered, unanswered, and flagged questions before submitting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="back-to-questions-btn"
              onClick={() => setActiveView('taking')}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Questions</span>
            </button>

            <button
              id="confirm-final-submit-btn"
              onClick={() => setShowSubmitModal(true)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Assessment</span>
            </button>
          </div>
        </div>

        {/* 3 Review Status Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-200">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Answered
              </span>
              <strong className="text-xl font-extrabold text-slate-900">
                {answeredCount} <span className="text-sm font-normal text-slate-400">/ {questions.length}</span>
              </strong>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg border border-rose-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Not Answered
              </span>
              <strong className="text-xl font-extrabold text-slate-900">
                {remainingCount} <span className="text-sm font-normal text-slate-400">remaining</span>
              </strong>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg border border-amber-200">
              <Flag className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Marked for Review
              </span>
              <strong className="text-xl font-extrabold text-slate-900">
                {markedCount} <span className="text-sm font-normal text-slate-400">flagged</span>
              </strong>
            </div>
          </div>
        </div>

        {/* Detailed Question Review Matrix */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
            <span>Question Status Table</span>
            <span className="text-xs text-slate-400 font-normal">(Click any question to edit answer)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {questions.map((q, idx) => {
              const ans = studentAnswers[q.id];
              const hasAns = ans && ans.trim().length > 0;
              const isMarked = markedForReview[q.id];

              return (
                <div
                  key={q.id}
                  id={`review-item-${idx + 1}`}
                  onClick={() => jumpToQuestion(idx)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md flex items-start justify-between gap-3 ${
                    isMarked 
                      ? 'border-amber-300 bg-amber-50/50' 
                      : hasAns 
                      ? 'border-emerald-200 bg-emerald-50/30' 
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                      isMarked 
                        ? 'bg-amber-500 text-white' 
                        : hasAns 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {q.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {q.topicTitle}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 line-clamp-1 mt-1">
                        {q.question}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 italic">
                        {hasAns ? `Answer: "${ans}"` : '⚠️ No answer entered yet'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {isMarked && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                        <Flag className="w-3 h-3 fill-current" />
                        <span>Marked</span>
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      hasAns ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {hasAns ? 'Answered' : 'Empty'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            onClick={() => setActiveView('taking')}
            className="px-6 py-3 rounded-2xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
          >
            ← Return to Question {currentIndex + 1}
          </button>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Submit Test Now</span>
          </button>
        </div>

        {/* Final Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold font-heading text-slate-900">
                  Ready to Submit Assessment?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You have answered <strong className="text-indigo-600">{answeredCount}</strong> of <strong>{questions.length}</strong> questions. 
                  {remainingCount > 0 && (
                    <span className="text-rose-600 block mt-1 font-semibold">
                      ⚠️ You still have {remainingCount} unanswered question{remainingCount > 1 ? 's' : ''}.
                    </span>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  Continue Test
                </button>
                <button
                  onClick={executeSubmission}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Grading...</span>
                    </>
                  ) : (
                    <span>Yes, Submit</span>
                  )}
                </button>
              </div>

              {isSubmitting && (
                <div className="pt-2 text-center text-xs text-indigo-700 font-semibold animate-pulse">
                  {submissionStatusText}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  // -------------------------------------------------------------
  // PRIMARY QUESTION SCREEN (activeView === 'taking')
  // -------------------------------------------------------------
  return (
    <div id="quiz-taking-screen" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-in fade-in duration-200 pb-24 md:pb-12">
      
      {/* Assessment Header Toolbar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        
        {/* Top Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                isChapterTest 
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {isChapterTest ? 'Formal Assessment' : 'Practice Engine'}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Chapter 1 • Curiosity
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 mt-1">
              {config.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer Badge */}
            <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-xs font-bold ${
              timeRemainingSeconds < 180 
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(timeRemainingSeconds)}</span>
            </div>

            {/* Exit Button */}
            <button
              id="exit-quiz-btn"
              onClick={() => setShowExitConfirm(true)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-xs transition-colors cursor-pointer"
              title="Exit Assessment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* 4 Required Metric Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Question Number</span>
            <strong className="text-slate-800 font-bold">{currentIndex + 1} of {questions.length}</strong>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Progress</span>
            <strong className="text-indigo-700 font-bold">{answeredCount} Answered</strong>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Marks</span>
            <strong className="text-slate-800 font-bold">{currentQ.marks || (currentQ.type === 'subjective' ? 3 : currentQ.type === 'short_answer' ? 2 : 1)} Mark{(currentQ.marks || 1) > 1 ? 's' : ''}</strong>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining</span>
            <strong className="text-amber-700 font-bold">{remainingCount} Left</strong>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              isChapterTest ? 'bg-indigo-600' : 'bg-emerald-500'
            }`}
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        
        {/* Topic Badge & Mark for Review Toggle */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Section: {currentQ.topicTitle} ({currentQ.topicId})
          </span>
          
          <button
            id="mark-for-review-btn"
            onClick={() => toggleMarkForReview(currentQ.id)}
            className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              isCurrentMarkedForReview
                ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Mark this question for review before final submission"
          >
            <Flag className={`w-3.5 h-3.5 ${isCurrentMarkedForReview ? 'fill-current text-amber-700' : 'text-slate-400'}`} />
            <span>{isCurrentMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
          </button>
        </div>

        {/* Question Type Tag */}
        <div className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
          {currentQ.type === 'mcq' && <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />}
          {currentQ.type === 'fill_blank' && <Edit3 className="w-3.5 h-3.5 text-amber-600" />}
          {currentQ.type === 'short_answer' && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
          {currentQ.type === 'subjective' && <FileText className="w-3.5 h-3.5 text-purple-600" />}
          <span>
            {currentQ.type === 'mcq' ? 'Multiple Choice Question (MCQ)' :
             currentQ.type === 'fill_blank' ? 'Fill in the Blank' :
             currentQ.type === 'short_answer' ? 'Short Answer (2 Marks)' :
             'Subjective Explanation (3 Marks)'}
          </span>
        </div>

        {/* Question Text */}
        <h3 className="text-lg sm:text-xl font-bold font-heading text-slate-900 leading-snug">
          {currentQ.question}
        </h3>

        {/* 1. MCQ Options Render */}
        {currentQ.type === 'mcq' && currentQ.options && (
          <div 
            role="radiogroup" 
            aria-label={`Multiple choice options for question ${currentIndex + 1}`}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2"
          >
            {currentQ.options.map((optionText, optIdx) => {
              const isSelected = currentAnswer === optionText;
              const isOptionCorrect = optionText.toLowerCase() === currentQ.answer.toLowerCase();
              const letters = ['A', 'B', 'C', 'D'];

              let styleClass = 'border-slate-200 bg-slate-50/50 hover:bg-indigo-50/40 hover:border-indigo-300 text-slate-800';

              if (isConfirmedInPractice) {
                if (isOptionCorrect) {
                  styleClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/30';
                } else if (isSelected) {
                  styleClass = 'border-rose-400 bg-rose-50 text-rose-950 ring-2 ring-rose-500/30';
                } else {
                  styleClass = 'border-slate-200 bg-white/60 text-slate-500 opacity-70';
                }
              } else if (isSelected) {
                styleClass = isChapterTest 
                  ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold ring-2 ring-indigo-500/30' 
                  : 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/30';
              }

              return (
                <button
                  key={optIdx}
                  id={`option-btn-${optIdx}`}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`Option ${letters[optIdx]}: ${optionText}${
                    isConfirmedInPractice
                      ? isOptionCorrect
                        ? ' (Correct Answer)'
                        : isSelected
                        ? ' (Your Selection - Incorrect)'
                        : ''
                      : isSelected
                      ? ' (Selected)'
                      : ''
                  }`}
                  onClick={() => handleSelectMcq(optionText)}
                  className={`p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all flex flex-col justify-between gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 cursor-pointer ${styleClass}`}
                >
                  <div className="flex items-start gap-3 w-full">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                      isSelected 
                        ? (isChapterTest ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white') 
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}>
                      {letters[optIdx]}
                    </span>
                    <span className="mt-0.5 leading-snug flex-1">{optionText}</span>
                  </div>

                  {/* Explicit Text Badges (Not color alone) */}
                  {isConfirmedInPractice && (
                    <div className="pt-1.5 border-t border-slate-200/60 flex items-center gap-2">
                      {isOptionCorrect && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                          <span>Correct Answer</span>
                        </span>
                      )}
                      {isSelected && !isOptionCorrect && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase bg-rose-200 text-rose-950 px-2 py-0.5 rounded-md">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-800" />
                          <span>Your Choice (Incorrect)</span>
                        </span>
                      )}
                      {isSelected && isOptionCorrect && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase bg-emerald-300 text-emerald-950 px-2 py-0.5 rounded-md">
                          <span>Your Choice (Correct)</span>
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 2. Fill in the Blank Input Render */}
        {currentQ.type === 'fill_blank' && (
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <label 
                htmlFor="fill-blank-answer-input"
                className="text-xs font-bold text-slate-800 block"
              >
                Type the missing scientific term / keyword:
              </label>
              <input
                id="fill-blank-answer-input"
                type="text"
                value={currentAnswer}
                onChange={(e) => handleTextAnswerChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isPractice && !isConfirmedInPractice && currentAnswer.trim()) {
                    handleConfirmPracticeAnswer();
                  }
                }}
                placeholder="Type your answer here..."
                aria-label="Your answer for the fill in the blank question"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 text-sm bg-slate-50/50"
              />
            </div>

            {isPractice && !isConfirmedInPractice && (
              <button
                id="check-fill-blank-btn"
                onClick={handleConfirmPracticeAnswer}
                disabled={!currentAnswer.trim()}
                aria-label="Check fill in the blank answer"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 cursor-pointer"
              >
                Check Answer
              </button>
            )}
          </div>
        )}

        {/* 3. Short Answer & Subjective Input Render with AI Evaluator */}
        {(currentQ.type === 'short_answer' || currentQ.type === 'subjective') && (
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <label 
                htmlFor="subjective-answer-input"
                className="flex items-center justify-between text-xs text-slate-800 font-bold"
              >
                <span>Write your scientific answer:</span>
                <span className="text-[11px] font-normal text-slate-500">
                  {currentQ.type === 'subjective' ? 'Provide a thorough explanation (3 marks)' : 'Concise scientific explanation (2 marks)'}
                </span>
              </label>
              <textarea
                id="subjective-answer-input"
                rows={currentQ.type === 'subjective' ? 4 : 3}
                value={currentAnswer}
                onChange={(e) => handleTextAnswerChange(e.target.value)}
                placeholder={currentQ.type === 'subjective' ? 'Explain the scientific concept in detail...' : 'Type your answer here...'}
                aria-label={currentQ.type === 'subjective' ? 'Subjective explanation input' : 'Short answer input'}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 text-sm bg-slate-50/50 leading-relaxed"
              />
            </div>

            {/* In Practice Mode: AI Evaluation Trigger Button */}
            {isPractice && (
              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <button
                  id="evaluate-ai-practice-btn"
                  onClick={handleEvaluateSubjectiveInPractice}
                  disabled={!currentAnswer.trim() || isCurrentlyEvaluating}
                  aria-label={currentEvalResult ? 'Re-evaluate answer with AI Examiner' : 'Evaluate answer with AI Tutor'}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-40 transition-colors shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 cursor-pointer"
                >
                  {isCurrentlyEvaluating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Evaluating with AI Examiner...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{currentEvalResult ? 'Re-evaluate with AI' : 'Evaluate with AI Tutor'}</span>
                    </>
                  )}
                </button>

                {!currentEvalResult && !isCurrentlyEvaluating && (
                  <button
                    id="quick-check-static-btn"
                    onClick={handleConfirmPracticeAnswer}
                    disabled={!currentAnswer.trim()}
                    aria-label="Quick check answer key without AI evaluation"
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold disabled:opacity-40 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
                  >
                    Quick Check (Static Key)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Practice Mode AI Subjective Evaluation Result Display */}
        {!isChapterTest && currentEvalResult && (
          <div className="pt-4 border-t border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-extrabold border border-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Subjective Evaluation (CBSE Class 6)</span>
              </div>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-xl border ${
                currentEvalResult.score >= (currentEvalResult.max_score * 0.7)
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : currentEvalResult.score >= (currentEvalResult.max_score * 0.4)
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                Score: {currentEvalResult.score} / {currentEvalResult.max_score} Marks
              </span>
            </div>

            {/* Strengths */}
            {currentEvalResult.strengths && currentEvalResult.strengths.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-1">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Strengths & Concepts Covered:</span>
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-emerald-950 pl-1">
                  {currentEvalResult.strengths.map((str, sIdx) => (
                    <li key={sIdx}>{str}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Points */}
            {currentEvalResult.missing_points && currentEvalResult.missing_points.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-1">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Missing Points / Areas for Improvement:</span>
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-amber-950 pl-1">
                  {currentEvalResult.missing_points.map((mp, mIdx) => (
                    <li key={mIdx}>{mp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Misconceptions if any */}
            {currentEvalResult.misconceptions && currentEvalResult.misconceptions.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs space-y-1">
                <span className="font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Scientific Clarifications:</span>
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-rose-950 pl-1">
                  {currentEvalResult.misconceptions.map((misc, mcIdx) => (
                    <li key={mcIdx}>{misc}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvement Tip */}
            {currentEvalResult.improvement_tip && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-indigo-900">Examiner Tip:</strong>
                  <p>{currentEvalResult.improvement_tip}</p>
                </div>
              </div>
            )}

            {/* Model Suggested Answer */}
            {currentEvalResult.suggested_answer && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1">
                <strong className="text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                  <span>Model Suggested Answer (NCERT Chapter 1):</span>
                </strong>
                <p className="leading-relaxed text-slate-700 italic">
                  "{currentEvalResult.suggested_answer}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Practice Mode AI Evaluation Error Alert with Retry */}
        {!isChapterTest && currentEvalError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Evaluation Note: Your answer is safely saved.</span>
              </span>
              <button
                onClick={handleEvaluateSubjectiveInPractice}
                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry AI Evaluation</span>
              </button>
            </div>
            <p className="text-slate-700">{currentEvalError}</p>
          </div>
        )}

        {/* Practice Mode: Static Explanation for MCQ / Fill in the blank */}
        {!isChapterTest && isConfirmedInPractice && !currentEvalResult && (currentQ.type === 'mcq' || currentQ.type === 'fill_blank') && (
          <div className="pt-4 border-t border-slate-100 space-y-3 animate-in fade-in" aria-live="polite">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Explanation & Answer Key</span>
            </div>

            {currentQ.type === 'mcq' && (
              <div className={`p-4 rounded-2xl text-xs leading-relaxed border space-y-2 ${
                currentAnswer.trim().toLowerCase() === currentQ.answer.trim().toLowerCase()
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                <div className="flex items-center gap-2">
                  {currentAnswer.trim().toLowerCase() === currentQ.answer.trim().toLowerCase() ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-200 text-emerald-950 font-extrabold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                      <span>Result: Correct</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-200 text-rose-950 font-extrabold text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-800" />
                      <span>Result: Incorrect</span>
                    </span>
                  )}
                  <span className="font-bold text-slate-900">
                    Correct Answer: {currentQ.answer}
                  </span>
                </div>
                <p className="text-slate-800 leading-relaxed font-medium">{currentQ.explanation}</p>
              </div>
            )}

            {currentQ.type === 'fill_blank' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs leading-relaxed text-emerald-950 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-200 text-emerald-950 font-extrabold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                    <span>Answer Key</span>
                  </span>
                  <strong className="text-emerald-950">Standard Answer: {currentQ.answer}</strong>
                </div>
                <p className="text-slate-800 leading-relaxed font-medium">{currentQ.explanation}</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Question Palette Matrix & Navigation Toolbar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Assessment Palette ({questions.length} Questions)
          </span>
          <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Current
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Answered
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Marked
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300" /> Unanswered
            </span>
          </div>
        </div>

        <div 
          role="navigation" 
          aria-label="Question selector palette"
          className="flex flex-wrap gap-2"
        >
          {questions.map((q, idx) => {
            const hasAns = (studentAnswers[q.id] || '').trim().length > 0;
            const isMarked = markedForReview[q.id];
            const isCurr = idx === currentIndex;

            let btnClass = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
            let statusLabel = 'Unanswered';

            if (isCurr) {
              btnClass = 'ring-2 ring-indigo-600 bg-indigo-600 text-white font-bold';
              statusLabel = 'Current Question';
            } else if (isMarked) {
              btnClass = 'bg-amber-100 border-amber-300 text-amber-900 font-bold';
              statusLabel = hasAns ? 'Answered and Marked for Review' : 'Marked for Review';
            } else if (hasAns) {
              btnClass = 'bg-emerald-100 border-emerald-300 text-emerald-900 font-semibold';
              statusLabel = 'Answered';
            }

            return (
              <button
                key={q.id}
                id={`palette-btn-${idx + 1}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Question ${idx + 1}: ${statusLabel}`}
                aria-current={isCurr ? 'step' : undefined}
                className={`w-9 h-9 rounded-xl border text-xs flex items-center justify-center transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500 cursor-pointer ${btnClass}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Navigation Toolbar: Previous, Next, Review, Submit Test */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          
          {/* Previous Button */}
          <button
            id="prev-question-btn"
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs disabled:opacity-40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {/* Action Group: Next, Review, Submit Test */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            
            {/* Next Button */}
            {currentIndex < questions.length - 1 && (
              <button
                id="next-question-btn"
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Review Button */}
            <button
              id="review-questions-btn"
              onClick={() => setActiveView('review')}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-indigo-300 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Review ({markedCount} marked)</span>
            </button>

            {/* Submit Button */}
            <button
              id="submit-test-btn"
              onClick={() => setShowSubmitModal(true)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit {isChapterTest ? 'Test' : 'Quiz'}</span>
            </button>

          </div>

        </div>

      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900">
                Exit Assessment?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Your current test progress will not be saved if you exit now.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Keep Testing
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Yes, Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold font-heading text-slate-900">
                Are you sure you want to submit?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You have answered <strong className="text-indigo-600">{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
                {remainingCount > 0 && (
                  <span className="text-amber-700 block mt-1 font-semibold">
                    ⚠️ You still have {remainingCount} unanswered question{remainingCount > 1 ? 's' : ''}.
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Keep Reviewing
              </button>
              <button
                onClick={executeSubmission}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Yes, Submit Now</span>
                )}
              </button>
            </div>

            {isSubmitting && (
              <div className="pt-2 text-center text-xs text-indigo-700 font-semibold animate-pulse">
                {submissionStatusText}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
