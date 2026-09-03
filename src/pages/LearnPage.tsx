import React from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  TestTube, 
  Lightbulb, 
  Compass, 
  Users, 
  Check,
  ChevronRight,
  Eye,
  Atom,
  Lock
} from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { Button, Card, Badge, ProgressBar } from '../components/ui';

interface LearnPageProps {
  onOpenLesson: (topicId: string) => void;
}

export const LearnPage: React.FC<LearnPageProps> = ({ onOpenLesson }) => {
  const { 
    progress, 
    currentChapter, 
    allChapters, 
    activeChapterId, 
    setActiveChapterId, 
    getChapterProgress 
  } = useProgress();

  const chapterProg = getChapterProgress(currentChapter.id);

  const getTopicIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return Sparkles;
      case 'Layers': return Layers;
      case 'TestTube': return TestTube;
      case 'Lightbulb': return Lightbulb;
      case 'Compass': return Compass;
      case 'Users': return Users;
      default: return BookOpen;
    }
  };

  return (
    <div id="learn-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-in fade-in duration-200 pb-24 md:pb-12">
      
      {/* Chapter Selection Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {allChapters.map((ch) => {
          const isActive = ch.id === activeChapterId;
          const prog = getChapterProgress(ch.id);

          return (
            <button
              key={ch.id}
              id={`chapter-tab-btn-${ch.number}`}
              onClick={() => setActiveChapterId(ch.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all duration-150 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20 ring-2 ring-emerald-500/30'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                isActive ? 'bg-white text-emerald-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {ch.number}
              </span>
              <span className="truncate max-w-[180px] sm:max-w-[240px]">{ch.title}</span>
              {prog.completionPercentage > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {prog.completionPercentage}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Header Banner */}
      <Card variant="default" padding="lg" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success" size="sm">
                {currentChapter.board} • Grade {currentChapter.grade} {currentChapter.subject}
              </Badge>
              <Badge variant="default" size="sm">
                Textbook: {currentChapter.textbook}
              </Badge>
              <Badge variant="info" size="sm">
                NCERT Aligned
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-heading text-slate-900 tracking-tight">
              Chapter {currentChapter.number}: {currentChapter.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
              {currentChapter.description}
            </p>
          </div>

          {/* Chapter Progress Gauge */}
          <div className="shrink-0 bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-4 min-w-[220px]">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-2xs">
              {chapterProg.completionPercentage}%
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Chapter Mastery
              </span>
              <span className="text-sm font-bold text-slate-800">
                {chapterProg.completedTopics} of {currentChapter.totalTopics} Completed
              </span>
            </div>
          </div>
        </div>

        {/* Linear progress indicator */}
        <ProgressBar value={chapterProg.completionPercentage} size="sm" variant="gradient" />
      </Card>

      {/* Learning Objectives from current chapter */}
      {currentChapter.learningObjectives && currentChapter.learningObjectives.length > 0 && (
        <section id="chapter-learning-objectives" className="bg-emerald-50/70 rounded-3xl p-6 border border-emerald-200/80">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Chapter Learning Objectives</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm text-emerald-950 font-medium">
            {currentChapter.learningObjectives.map((obj, i) => (
              <div key={i} className="flex items-start gap-2.5 bg-white/90 p-3 rounded-2xl border border-emerald-200/60 shadow-2xs">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </span>
                <span className="leading-snug text-slate-800">{obj}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Topics List */}
      <section id="topics-list-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-heading text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <span>Chapter Topics ({currentChapter.topics.length})</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Select any topic to begin learning</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentChapter.topics.map((topic) => {
            const topicProgress = progress.topicProgress[topic.id];
            const isCompleted = topicProgress?.completed;
            const mastery = topicProgress?.masteryPercentage || 0;
            const Icon = getTopicIcon(topic.iconName);
            const quickChecksCount = topic.lesson.quick_check ? topic.lesson.quick_check.length : 0;

            return (
              <Card
                key={topic.id}
                id={`topic-card-${topic.id}`}
                variant={isCompleted ? 'accent' : 'default'}
                padding="md"
                className="flex flex-col justify-between hover:shadow-md transition-all duration-150"
              >
                <div className="space-y-4">
                  
                  {/* Card Top: Order Pill, Category & Status */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-200">
                        Topic {topic.order} ({topic.id})
                      </span>
                      <span className="font-semibold text-slate-500 truncate max-w-[120px]">
                        {topic.sourceSection}
                      </span>
                    </div>

                    {isCompleted ? (
                      <Badge variant="success" size="sm" icon={CheckCircle2}>
                        Done
                      </Badge>
                    ) : mastery > 0 ? (
                      <Badge variant="warning" size="sm">
                        {mastery}%
                      </Badge>
                    ) : (
                      <Badge variant="default" size="sm">
                        Not Started
                      </Badge>
                    )}
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-heading text-slate-900 leading-snug">
                        {topic.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>~{topic.estimatedMinutes} mins read</span>
                      </div>
                    </div>
                  </div>

                  {/* Short Description */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Overview
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-2">
                      {topic.lesson.simple_explanation || topic.lesson.concept_explanation}
                    </p>
                  </div>

                  {/* Learning Objective */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>Objective</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {topic.learningObjective}
                    </p>
                  </div>

                  {/* Completion Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 text-[11px]">Completion</span>
                      <span className={isCompleted ? 'text-emerald-700 font-bold' : mastery > 0 ? 'text-amber-700 font-bold' : 'text-slate-400'}>
                        {isCompleted ? '100% Completed' : `${mastery}%`}
                      </span>
                    </div>
                    <ProgressBar 
                      value={isCompleted ? 100 : mastery} 
                      size="sm" 
                      variant={isCompleted ? 'emerald' : 'amber'} 
                    />
                  </div>

                </div>

                {/* Card Action Button */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-500">
                    {quickChecksCount} Quick Check{quickChecksCount !== 1 ? 's' : ''}
                  </div>
                  <Button
                    id={`start-learning-btn-${topic.id}`}
                    variant={isCompleted ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => onOpenLesson(topic.id)}
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    {isCompleted ? 'Review Topic' : mastery > 0 ? 'Continue Topic' : 'Start Topic'}
                  </Button>
                </div>

              </Card>
            );
          })}
        </div>
      </section>

    </div>
  );
};
