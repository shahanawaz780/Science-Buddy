import React from 'react';
import { 
  BookOpen, 
  Bot, 
  CheckSquare, 
  ArrowRight, 
  Trophy, 
  Lightbulb, 
  Compass, 
  CheckCircle2, 
  Play, 
  Layers, 
  ChevronRight, 
  TrendingUp, 
  Sparkles, 
  Atom,
  Target,
  AlertCircle,
  Clock,
  RotateCcw,
  Check
} from 'lucide-react';
import { NavigationTab } from '../types';
import { useProgress } from '../context/ProgressContext';
import { SCIENCE_FACTS } from '../data/chapter1Data';
import { Button, Card, Badge } from '../components/ui';

interface HomePageProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenLesson: (topicId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenLesson }) => {
  const { 
    progress, 
    overallProgressPercentage, 
    overallCurriculumProgressPercentage,
    completedTopicsCount, 
    averageQuizScorePercentage, 
    latestQuizResult,
    weakTopics,
    recommendedActivity,
    activeTopicId,
    setActiveTopicId,
    currentChapter,
    allChapters,
    activeChapterId,
    setActiveChapterId,
    getChapterProgress
  } = useProgress();

  const currentTopic = currentChapter.topics.find(t => t.id === activeTopicId) || currentChapter.topics[0] || {
    id: 'T1',
    order: 1,
    title: 'Introduction to Chapter',
    learningObjective: 'Explore core scientific principles'
  };
  const factOfDay = SCIENCE_FACTS[0];
  const chapterProg = getChapterProgress(currentChapter.id);

  // Total topics across available chapters
  const allAvailableTopics = allChapters.filter(c => c.isAvailable).flatMap(c => c.topics);
  const totalCompletedTopics = allAvailableTopics.filter(t => progress.topicProgress[t.id]?.completed).length;

  const handleRecommendedAction = () => {
    if (recommendedActivity.chapterId) {
      setActiveChapterId(recommendedActivity.chapterId);
    }
    if (recommendedActivity.actionType === 'lesson' && recommendedActivity.topicId) {
      setActiveTopicId(recommendedActivity.topicId);
      onOpenLesson(recommendedActivity.topicId);
    } else if (recommendedActivity.actionType === 'practice') {
      onNavigate('practice');
    } else if (recommendedActivity.actionType === 'chapter') {
      onNavigate('learn');
    } else if (recommendedActivity.actionType === 'chapters') {
      onNavigate('chapters');
    } else {
      onNavigate('learn');
    }
  };

  return (
    <div id="home-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-in fade-in duration-200 pb-24 md:pb-12">
      
      {/* Hero Welcome Section */}
      <section id="hero-welcome-card" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white p-6 sm:p-8 lg:p-10 shadow-lg border border-emerald-700/40">
        {/* Subtle decorative glows */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            
            {/* Class & Subject Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentChapter.board} • Grade {currentChapter.grade} {currentChapter.subject}</span>
              <span className="text-emerald-400">•</span>
              <span className="text-white font-bold">Chapter {currentChapter.number}</span>
            </div>

            {/* Greeting */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-white tracking-tight">
                Hi, {progress.studentName}
              </h1>
              <p className="text-lg sm:text-xl font-medium text-emerald-100 font-heading">
                Welcome to your CBSE Science Learning Hub
              </p>
            </div>

            <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed">
              Currently studying <strong className="text-white">Chapter {currentChapter.number}: {currentChapter.title}</strong>. Step through interactive explanations, take practice assessments, and get AI tutor guidance.
            </p>

            {/* Quick Resume Topic Card */}
            <div className="pt-1">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 max-w-lg flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Topic {currentTopic.order} • {currentTopic.id}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white truncate mt-0.5">
                    {currentTopic.title}
                  </h4>
                  <p className="text-xs text-slate-300 truncate">
                    {currentTopic.learningObjective}
                  </p>
                </div>
                <Button
                  id="resume-learning-btn"
                  variant="primary"
                  size="sm"
                  onClick={() => onOpenLesson(currentTopic.id)}
                  icon={Play}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border-none shrink-0"
                >
                  Resume
                </Button>
              </div>
            </div>

          </div>

          {/* Quick Learning Journey Overview Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Current Chapter Progress</span>
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  {chapterProg.completionPercentage}% Complete
                </span>
              </div>

              {/* Step Process Flow */}
              <div className="grid grid-cols-5 gap-1.5 text-center text-[11px]">
                {[
                  { step: '1', label: 'Learn' },
                  { step: '2', label: 'Practice' },
                  { step: '3', label: 'Test' },
                  { step: '4', label: 'Review' },
                  { step: '5', label: 'Improve' },
                ].map((s) => (
                  <div key={s.step} className="bg-slate-700/50 rounded-xl p-2 border border-slate-600/50 flex flex-col items-center">
                    <span className="text-xs font-mono font-bold text-emerald-400">0{s.step}</span>
                    <span className="font-semibold text-slate-200 mt-0.5">{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>Chapter {currentChapter.number} Mastery</span>
                  <span className="font-bold text-emerald-400">{chapterProg.completedTopicsCount} of {currentChapter.totalTopics} Topics Completed</span>
                </div>
                <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${chapterProg.completionPercentage}%` }}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Overall Learning & Student Performance Analytics (Overall Progress, Recent Assessment, Weak Topics, Recommended Activity) */}
      <section id="overall-learning-analytics" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg sm:text-xl font-bold font-heading text-slate-900">
              Overall Learning Performance
            </h2>
          </div>
          <span className="text-xs text-slate-700 font-medium">Synchronized with Supabase</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Overall Learning Progress */}
          <div id="metric-overall-progress" className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Overall Progress</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-heading text-slate-900">
                  {overallCurriculumProgressPercentage}%
                </span>
                <span className="text-xs font-semibold text-emerald-700">Curriculum Total</span>
              </div>
              <p className="text-xs text-slate-700 mt-1">
                {totalCompletedTopics} of {allAvailableTopics.length} total topics completed
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${overallCurriculumProgressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Recent Assessment Result */}
          <div id="metric-recent-assessment" className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recent Assessment</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>

              {latestQuizResult ? (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-heading text-slate-900">
                      {latestQuizResult.percentage}%
                    </span>
                    <Badge 
                      variant={latestQuizResult.percentage >= 80 ? 'success' : latestQuizResult.percentage >= 60 ? 'warning' : 'danger'}
                      size="sm"
                    >
                      {latestQuizResult.performanceCategory}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                    {latestQuizResult.quizTitle || `Chapter ${latestQuizResult.chapterNumber} Assessment`}
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Score: {latestQuizResult.score} / {latestQuizResult.totalMarks} marks
                  </p>
                </div>
              ) : (
                <div className="mt-3 space-y-1">
                  <span className="text-sm font-bold text-slate-700 block">No assessments yet</span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Attempt a chapter practice quiz to evaluate your science skills.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => onNavigate('practice')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center justify-between w-full cursor-pointer"
              >
                <span>{latestQuizResult ? 'Review & Practice' : 'Start Practice Quiz'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Weak Topics */}
          <div id="metric-weak-topics" className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Weak Topics</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                  weakTopics.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {weakTopics.length > 0 ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                </div>
              </div>

              {weakTopics.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {weakTopics.slice(0, 2).map(wt => (
                    <div key={wt.id} className="p-2 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="truncate pr-1">{wt.title}</span>
                        <span className="text-amber-700 shrink-0">{wt.score}%</span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Ch. {wt.chapterNumber} • {wt.reason}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>No weak areas detected</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    Excellent work! You are maintaining strong understanding across all attempted topics.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              {weakTopics.length > 0 ? (
                <button
                  onClick={() => onOpenLesson(weakTopics[0].id)}
                  className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center justify-between w-full cursor-pointer"
                >
                  <span>Revise {weakTopics[0].title.slice(0, 18)}...</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('learn')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center justify-between w-full cursor-pointer"
                >
                  <span>Explore New Topics</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Card 4: Recommended Next Learning Activity */}
          <div id="metric-recommended-activity" className="bg-gradient-to-br from-teal-50/70 to-emerald-50/70 rounded-2xl p-5 border border-emerald-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Recommended Next</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Target className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900 line-clamp-2">
                  {recommendedActivity.title}
                </h4>
                <p className="text-xs text-emerald-800 font-medium line-clamp-1">
                  {recommendedActivity.subtitle}
                </p>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {recommendedActivity.description}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-200/60">
              <Button
                id="btn-recommended-action"
                variant="primary"
                size="sm"
                onClick={handleRecommendedAction}
                icon={ArrowRight}
                className="w-full justify-center bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                {recommendedActivity.actionLabel}
              </Button>
            </div>
          </div>

        </div>
      </section>

      {/* "My Learning / Chapters" Section (Core Multi-Chapter Hub) */}
      <section id="my-learning-chapters-section" className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200/90 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Atom className="w-5 h-5 text-emerald-700" />
              <h2 className="text-xl font-bold font-heading text-slate-900">
                My Learning — Chapters
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Select any published chapter to study topics, take assessments, or continue your progress.
            </p>
          </div>

          <button
            onClick={() => onNavigate('chapters')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>View Curriculum Syllabus</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Chapters Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allChapters.map((ch) => {
            const isActive = ch.id === activeChapterId;
            const prog = getChapterProgress(ch.id);
            const hasStarted = prog.completedTopicsCount > 0 || prog.completionPercentage > 0;
            const isAvailable = ch.isAvailable;

            return (
              <div
                key={ch.id}
                id={`chapter-card-${ch.id}`}
                className={`rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between ${
                  isActive
                    ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : isAvailable 
                      ? 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
                      : 'bg-slate-100/70 border-slate-200 opacity-80'
                }`}
              >
                <div className="space-y-3">
                  {/* Chapter Number Badge & Status */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 font-mono">
                      Chapter {ch.number}
                    </span>

                    {isActive && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Current
                      </span>
                    )}

                    {!isAvailable && (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>

                  {/* Chapter Title & Description */}
                  <div>
                    <h3 className="text-base font-bold font-heading text-slate-900 leading-snug">
                      {ch.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {ch.description}
                    </p>
                  </div>

                  {/* Chapter Metrics (Progress % & Topics Completed) */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">Progress</span>
                      <span className="font-extrabold text-emerald-700">{prog.completionPercentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                        style={{ width: `${prog.completionPercentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
                      <span>Topics Completed:</span>
                      <span className="font-bold text-slate-800">
                        {prog.completedTopicsCount} / {ch.totalTopics}
                      </span>
                    </div>
                  </div>

                  {/* Assessment Status */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Assessment:</span>
                    {prog.assessmentStatus === 'completed' ? (
                      <Badge variant="success" size="sm" icon={CheckCircle2}>
                        Score: {prog.latestAssessmentScore}%
                      </Badge>
                    ) : prog.assessmentStatus === 'needs_practice' ? (
                      <Badge variant="warning" size="sm" icon={AlertCircle}>
                        Score: {prog.latestAssessmentScore}%
                      </Badge>
                    ) : (
                      <span className="text-slate-500 font-medium text-[11px]">
                        Not Attempted
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <Button
                    id={`btn-chapter-learn-${ch.id}`}
                    variant={isActive ? 'primary' : 'outline'}
                    size="sm"
                    disabled={!isAvailable}
                    onClick={() => {
                      setActiveChapterId(ch.id);
                      onNavigate('learn');
                    }}
                    icon={hasStarted ? Play : ArrowRight}
                    className={`w-full justify-center font-bold ${
                      isActive 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {hasStarted ? 'Continue Learning' : 'Start Learning'}
                  </Button>

                  {isAvailable && (
                    <button
                      title={`Open Practice Test for Chapter ${ch.number}`}
                      onClick={() => {
                        setActiveChapterId(ch.id);
                        onNavigate('practice');
                      }}
                      className="p-2 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-600 hover:text-emerald-700 transition-colors shrink-0 cursor-pointer"
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Three Primary Actions: Start Learning, Ask AI Tutor, Practice & Exams */}
      <section id="primary-action-cards" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-heading text-slate-900">
            Learning Modules
          </h2>
          <span className="text-xs text-slate-600 font-medium">Choose your study mode</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Action 1: Start Learning */}
          <div 
            id="action-card-learn"
            onClick={() => onNavigate('learn')}
            className="group relative bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-150 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Start Learning
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Study Chapter {currentChapter.number} topics with bite-sized concepts, scientific investigations, and visual diagrams.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>{currentChapter.totalTopics} NCERT Topics</span>
              <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Open Lessons <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Action 2: Ask AI Tutor */}
          <div 
            id="action-card-tutor"
            onClick={() => onNavigate('tutor')}
            className="group relative bg-gradient-to-b from-white to-teal-50/30 rounded-2xl p-6 border border-teal-200/90 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all duration-150 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold font-heading text-slate-900 group-hover:text-teal-800 transition-colors">
                    Ask AI Tutor
                  </h3>
                  <Badge variant="info" size="sm">AI</Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Context-aware tutor aware of your active chapter, topic, and learning weak areas.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-teal-100 flex items-center justify-between text-xs font-bold text-teal-800">
              <span>Chapter {currentChapter.number} Grounded</span>
              <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Ask Questions <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Action 3: Practice & Exams */}
          <div 
            id="action-card-practice"
            onClick={() => onNavigate('practice')}
            className="group relative bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all duration-150 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900 group-hover:text-indigo-700 transition-colors">
                  Practice & Tests
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Attempt formative Practice Quizzes with immediate hints, or the formal Chapter Test with full AI evaluation.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700">
              <span>Quiz & Chapter Exam</span>
              <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Start Test <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Chapter Topics Preview & Quick Jump for Selected Chapter */}
      <section id="chapter-topics-preview" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              {currentChapter.board} Grade {currentChapter.grade} Science Syllabus
            </div>
            <h3 className="text-xl font-bold font-heading text-slate-900 mt-0.5">
              Chapter {currentChapter.number}: {currentChapter.title}
            </h3>
          </div>
          <button
            onClick={() => onNavigate('learn')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>View All {currentChapter.totalTopics} Topics</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentChapter.topics.map((topic) => {
            const isCompleted = progress.topicProgress[topic.id]?.completed;
            const isCurrent = activeTopicId === topic.id;

            return (
              <div
                key={topic.id}
                id={`topic-preview-${topic.id}`}
                onClick={() => onOpenLesson(topic.id)}
                className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                  isCurrent 
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-xs' 
                    : isCompleted 
                      ? 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300' 
                      : 'border-slate-200 bg-white hover:border-emerald-300 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-600">Topic {topic.order} ({topic.id})</span>
                    {isCompleted ? (
                      <Badge variant="success" size="sm" icon={CheckCircle2}>
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="default" size="sm">
                        ~{topic.estimatedMinutes} mins
                      </Badge>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {topic.title}
                  </h4>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-emerald-700">
                  <span>{isCompleted ? 'Review Topic' : 'Start Lesson'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Science Fact of the Day Box */}
      <section id="science-fact-card" className="bg-amber-50/70 rounded-2xl p-5 sm:p-6 border border-amber-200/80 flex items-start gap-4 shadow-2xs">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
            <span>Science Insight of the Day</span>
            <span className="text-amber-400">•</span>
            <span className="text-slate-600 font-semibold">{factOfDay.topic}</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {factOfDay.fact}
          </p>
        </div>
      </section>

    </div>
  );
};
