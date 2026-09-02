import React, { useState } from 'react';
import { 
  BarChart2, 
  Target, 
  RotateCcw, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  TrendingUp, 
  Trophy, 
  Sparkles, 
  BrainCircuit, 
  Clock, 
  Loader2, 
  CheckCircle, 
  RefreshCw, 
  Lightbulb, 
  ArrowRight,
  Database,
  UploadCloud,
  Layers,
  Table
} from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { CHAPTER_1_DATA } from '../data/chapter1Data';
import { NavigationTab } from '../types';
import { calculateTopicStatistics } from '../services/progressEngine';
import { useAIRecommendation } from '../hooks/useAIRecommendation';
import { formatScore, formatDate } from '../utils';

interface ProgressPageProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenLesson: (topicId: string) => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ 
  onNavigate, 
  onOpenLesson 
}) => {
  const { 
    progress, 
    overallProgressPercentage, 
    completedTopicsCount, 
    averageQuizScorePercentage, 
    loadSampleData,
    resetProgress,
    supabaseStatus,
    isDbSyncing,
    syncWithDatabase,
    seedDatabase
  } = useProgress();

  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  const allTopics = CHAPTER_1_DATA.topics;
  const totalTopics = allTopics.length;

  const { 
    recommendation: aiRecommendation, 
    isLoading: isLoadingRecommendation, 
    isFallback: isRecommendationFallback,
    refreshRecommendation 
  } = useAIRecommendation(progress, allTopics);

  const handleSeed = async () => {
    const res = await seedDatabase();
    setSeedNotice(res.message);
    setTimeout(() => setSeedNotice(null), 5000);
  };

  // 1. Overall Metrics
  const learningCompletionPercentage = Math.round((completedTopicsCount / totalTopics) * 100);

  const quizAccuracyPercentage = progress.quizHistory.length > 0
    ? Math.round(progress.quizHistory.reduce((acc, q) => acc + q.percentage, 0) / progress.quizHistory.length)
    : averageQuizScorePercentage;

  const testsCompletedCount = progress.quizHistory.length;
  const overallScore = Math.round((learningCompletionPercentage * 0.4) + (quizAccuracyPercentage * 0.6));
  const chapter1Progress = overallProgressPercentage;

  // 2. Topic Performance & Classification via pure progress engine
  const topicStats = calculateTopicStatistics(allTopics, progress);

  const strongTopicsList = topicStats.filter(t => t.classification === 'strong');
  const developingTopicsList = topicStats.filter(t => t.classification === 'developing');
  const needsPracticeList = topicStats.filter(t => t.classification === 'needs_practice');

  const topStrong = strongTopicsList[0] || topicStats[0];
  const topNeedPractice = needsPracticeList[0] || developingTopicsList[0] || topicStats[topicStats.length - 1];

  return (
    <div id="progress-screen" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-in fade-in duration-200 pb-24 md:pb-12">
      
      {/* Top Header Banner */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Student Performance Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 mt-1">
              My Progress
            </h1>
            <p className="text-sm text-slate-600 max-w-xl leading-relaxed mt-1">
              Track your completed lessons, quiz accuracy, and chapter performance for CBSE Class 6 Science.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadSampleData}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Load Sample Data
            </button>
            <button
              onClick={resetProgress}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </section>

      {/* OVERALL METRICS SECTION */}
      <section id="overall-metrics-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            OVERALL
          </h2>
          <span className="text-xs text-slate-400 font-medium">Class 6 CBSE Science</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Overall Score */}
          <div id="stat-overall-score" className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Overall Score
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold font-heading text-slate-900">
                {overallScore}%
              </div>
              <span className="text-xs font-semibold text-emerald-700 mt-1 block">
                Composite Mastery
              </span>
            </div>
          </div>

          {/* 2. Learning Completion */}
          <div id="stat-learning-completion" className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Learning Completion
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold font-heading text-slate-900">
                {learningCompletionPercentage}%
              </div>
              <span className="text-xs font-semibold text-indigo-700 mt-1 block">
                {completedTopicsCount} of {totalTopics} Topics
              </span>
            </div>
          </div>

          {/* 3. Quiz Accuracy */}
          <div id="stat-quiz-accuracy" className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quiz Accuracy
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold font-heading text-slate-900">
                {quizAccuracyPercentage}%
              </div>
              <span className="text-xs font-semibold text-amber-700 mt-1 block">
                Average across tests
              </span>
            </div>
          </div>

          {/* 4. Tests Completed */}
          <div id="stat-tests-completed" className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tests Completed
              </span>
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold font-heading text-slate-900">
                {testsCompletedCount}
              </div>
              <span className="text-xs font-semibold text-teal-700 mt-1 block">
                Quizzes & Exams
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* CHAPTER PROGRESS CARD */}
      <section id="chapter-1-progress-card" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              {CHAPTER_1_DATA.board} Grade {CHAPTER_1_DATA.grade} • {CHAPTER_1_DATA.subject}
            </span>
            <h3 className="text-xl font-extrabold font-heading text-slate-900 mt-0.5">
              Chapter {CHAPTER_1_DATA.number}: {CHAPTER_1_DATA.title}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black font-heading text-emerald-800">
              {chapter1Progress}%
            </span>
            <button
              onClick={() => onNavigate('learn')}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Continue Learning
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>Overall Chapter Completion</span>
            <span>{completedTopicsCount} / {totalTopics} Topics Completed</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${chapter1Progress}%` }}
            />
          </div>
        </div>
      </section>

      {/* TOPIC PERFORMANCE TABLE & CARDS */}
      <section id="topic-performance-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Table className="w-4 h-4 text-emerald-600" />
              <span>Chapter 1 Topic Breakdown</span>
            </div>
            <h3 className="text-lg font-bold font-heading text-slate-900 mt-0.5">
              Topic Performance & Mastery Classification
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              🟢 Strong (≥80%)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              🟡 Developing (60-79%)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              🔴 Needs Practice (&lt;60%)
            </span>
          </div>
        </div>

        {/* Responsive Grid for all Topics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topicStats.map(({ topic, attempts, accuracy, scoreDisplay, classification, isCompleted }) => {
            let statusBadge = {
              label: 'Strong',
              badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
              icon: '🟢'
            };
            if (classification === 'developing') {
              statusBadge = {
                label: 'Developing',
                badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
                icon: '🟡'
              };
            } else if (classification === 'needs_practice') {
              statusBadge = {
                label: 'Needs Practice',
                badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
                icon: '🔴'
              };
            }

            return (
              <div
                key={topic.id}
                id={`progress-topic-${topic.id}`}
                className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all bg-slate-50/50 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-extrabold text-slate-500">
                      Topic {topic.order} ({topic.id})
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${statusBadge.badgeClass}`}>
                      <span>{statusBadge.icon}</span>
                      <span>{statusBadge.label}</span>
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {topic.title}
                  </h4>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-center">
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Score</span>
                      <strong className="text-xs font-bold text-slate-800">{scoreDisplay}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Attempts</span>
                      <strong className="text-xs font-bold text-slate-800">{attempts}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Accuracy</span>
                      <strong className={`text-xs font-bold ${
                        accuracy >= 80 ? 'text-emerald-700' : accuracy >= 60 ? 'text-amber-700' : 'text-rose-600'
                      }`}>
                        {accuracy}%
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {isCompleted ? '✓ Lesson Completed' : 'In Progress'}
                  </span>
                  <button
                    onClick={() => onOpenLesson(topic.id)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Lesson</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ACTIONABLE AI RECOMMENDATIONS */}
      <section id="ai-recommendations-section" className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-indigo-800/40 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  AI-Powered Learning Diagnosis
                </span>
                {isRecommendationFallback && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Rule-Engine
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold font-heading text-white mt-0.5">
                Personalized Learning Recommendations
              </h3>
            </div>
          </div>

          <button
            onClick={refreshRecommendation}
            disabled={isLoadingRecommendation}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
          >
            {isLoadingRecommendation ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{isLoadingRecommendation ? 'Analyzing...' : 'Refresh Diagnosis'}</span>
          </button>
        </div>

        {/* Diagnosis Body */}
        {isLoadingRecommendation ? (
          <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 space-y-2">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-200">
              Analyzing topic mastery, quiz accuracy, and subjective responses...
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Top Strengths and Weakness Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Strong Area Card */}
              <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>Key Strength</span>
                  </span>
                  <span>{topStrong ? `${topStrong.accuracy}% Accuracy` : 'Strong'}</span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  {topStrong ? topStrong.topic.title : 'Curiosity & Observations'}
                </h4>
                <p className="text-xs text-emerald-200/80 leading-relaxed font-medium">
                  {aiRecommendation?.topStrength || 'You have demonstrated excellent clarity in noticing details and understanding natural inquiry.'}
                </p>
              </div>

              {/* Focus Priority Area Card */}
              <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Priority Focus Area</span>
                  </span>
                  <span>{topNeedPractice ? `${topNeedPractice.accuracy}% Accuracy` : 'Focus'}</span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  {topNeedPractice ? topNeedPractice.topic.title : 'The Scientific Method'}
                </h4>
                <p className="text-xs text-amber-200/80 leading-relaxed font-medium">
                  {aiRecommendation?.primaryFocusArea || 'Focus on step-by-step hypothesis testing and reasoning through everyday scenarios.'}
                </p>
              </div>

            </div>

            {/* Actionable Next Steps from AI */}
            {aiRecommendation?.actionableNextSteps && aiRecommendation.actionableNextSteps.length > 0 && (
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-3">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Actionable Study Plan</span>
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {aiRecommendation.actionableNextSteps.map((step, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-indigo-400">Step 0{idx + 1}</span>
                      <p className="text-xs text-slate-200 leading-snug font-medium">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions Strip */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('tutor')}
                className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>Ask AI Tutor for Step-by-Step Practice</span>
              </button>
              <button
                onClick={() => onNavigate('practice')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>Retake Chapter Practice Quiz</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SUPABASE PERSISTENCE STATUS */}
      <section id="database-sync-section" className="bg-slate-50 rounded-3xl p-6 sm:p-7 border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              supabaseStatus.isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold font-heading text-slate-900">
                  Supabase Cloud Persistence
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  supabaseStatus.isConnected 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {supabaseStatus.isConnected ? 'Connected & Synced' : 'Offline Local Storage'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {supabaseStatus.isConnected 
                  ? 'Your progress and quiz results are synchronized securely with the Supabase database.'
                  : 'Operating in local offline mode. Progress is saved locally in your browser session.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSeed}
              disabled={isDbSyncing}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Seed Chapter 1 to DB</span>
            </button>
            <button
              onClick={syncWithDatabase}
              disabled={isDbSyncing}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isDbSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{isDbSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        {seedNotice && (
          <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-medium">
            {seedNotice}
          </div>
        )}
      </section>

    </div>
  );
};
