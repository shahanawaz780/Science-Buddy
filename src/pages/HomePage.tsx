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
  TrendingUp
} from 'lucide-react';
import { NavigationTab } from '../types';
import { useProgress } from '../context/ProgressContext';
import { CHAPTER_1_DATA, SCIENCE_FACTS } from '../data/chapter1Data';
import { Button, Card, Badge } from '../components/ui';

interface HomePageProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenLesson: (topicId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenLesson }) => {
  const { 
    progress, 
    overallProgressPercentage, 
    completedTopicsCount, 
    averageQuizScorePercentage, 
    activeTopicId 
  } = useProgress();

  const currentTopic = CHAPTER_1_DATA.topics.find(t => t.id === activeTopicId) || CHAPTER_1_DATA.topics[0];
  const factOfDay = SCIENCE_FACTS[0];

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
              <span>{CHAPTER_1_DATA.board} • Grade {CHAPTER_1_DATA.grade} {CHAPTER_1_DATA.subject}</span>
              <span className="text-emerald-400">•</span>
              <span className="text-white font-bold">Chapter {CHAPTER_1_DATA.number}</span>
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
              Explore <strong className="text-white">Chapter {CHAPTER_1_DATA.number}: {CHAPTER_1_DATA.title}</strong> from NCERT {CHAPTER_1_DATA.textbook}. Master scientific thinking, practice quizzes, and get friendly explanations.
            </p>

            {/* Quick Resume Topic Card */}
            <div className="pt-1">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 max-w-lg flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Current Topic • Topic {currentTopic.order}</span>
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
                  <span>Learning Journey</span>
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  {overallProgressPercentage}% Complete
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
                  <span>Chapter {CHAPTER_1_DATA.number} Mastery</span>
                  <span className="font-bold text-emerald-400">{completedTopicsCount} of {CHAPTER_1_DATA.totalTopics} Topics Completed</span>
                </div>
                <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${overallProgressPercentage}%` }}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Primary Metrics Strip (Learning Progress, Quiz Score, Topics Completed) */}
      <section id="progress-summary-stats" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Metric 1: Learning Progress */}
        <Card variant="default" padding="sm" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-100 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Learning Progress
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold font-heading text-slate-900">
                {overallProgressPercentage}%
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                Chapter {CHAPTER_1_DATA.number}
              </span>
            </div>
          </div>
        </Card>

        {/* Metric 2: Quiz Score */}
        <Card variant="default" padding="sm" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold border border-amber-100 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Average Quiz Score
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold font-heading text-slate-900">
                {averageQuizScorePercentage}%
              </span>
              <span className="text-xs font-semibold text-amber-600">
                Accuracy
              </span>
            </div>
          </div>
        </Card>

        {/* Metric 3: Topics Completed */}
        <Card variant="default" padding="sm" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold border border-indigo-100 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Topics Completed
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold font-heading text-slate-900">
                {completedTopicsCount} / {CHAPTER_1_DATA.totalTopics}
              </span>
              <span className="text-xs font-semibold text-indigo-600">
                Completed
              </span>
            </div>
          </div>
        </Card>

      </section>

      {/* Three Primary Actions */}
      <section id="primary-action-cards" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-heading text-slate-900">
            Learning Modules
          </h2>
          <span className="text-xs text-slate-500 font-medium">Choose your study mode</span>
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
                  Study Chapter {CHAPTER_1_DATA.number} topics with bite-sized concepts, scientific investigations, and visual diagrams.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>{CHAPTER_1_DATA.totalTopics} NCERT Topics</span>
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
                  Get friendly step-by-step guidance, hints, and examples grounded strictly in the Class 6 CBSE curriculum.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-teal-100 flex items-center justify-between text-xs font-bold text-teal-800">
              <span>Personalized Help</span>
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
                  Attempt the 10-question Practice Quiz with immediate hints, or the 20-question Chapter Test with full AI evaluation.
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

      {/* Chapter Topics Preview & Quick Jump */}
      <section id="chapter-topics-preview" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              {CHAPTER_1_DATA.board} Grade {CHAPTER_1_DATA.grade} Science Syllabus
            </div>
            <h3 className="text-xl font-bold font-heading text-slate-900 mt-0.5">
              Chapter {CHAPTER_1_DATA.number}: {CHAPTER_1_DATA.title}
            </h3>
          </div>
          <button
            onClick={() => onNavigate('learn')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>View All {CHAPTER_1_DATA.totalTopics} Topics</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHAPTER_1_DATA.topics.map((topic) => {
            const isCompleted = progress.topicProgress[topic.id]?.completed;
            const isCurrent = activeTopicId === topic.id;

            return (
              <div
                key={topic.id}
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
                    <span className="font-bold text-slate-500">Topic {topic.order} ({topic.id})</span>
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
