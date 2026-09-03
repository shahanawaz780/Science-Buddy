import React from 'react';
import { 
  CheckSquare, 
  Play, 
  Trophy, 
  ArrowRight,
  Award
} from 'lucide-react';
import { QuizConfig } from '../types';
import { getExamBlueprints } from '../services/curriculumService';
import { useProgress } from '../context/ProgressContext';
import { Button, Card, Badge } from '../components/ui';

interface PracticePageProps {
  onStartQuiz: (config: QuizConfig) => void;
  onOpenLesson: (topicId: string) => void;
}

export const PracticePage: React.FC<PracticePageProps> = ({ 
  onStartQuiz, 
  onOpenLesson 
}) => {
  const { 
    progress, 
    averageQuizScorePercentage, 
    currentChapter, 
    allChapters, 
    activeChapterId, 
    setActiveChapterId 
  } = useProgress();

  const quizConfigs = getExamBlueprints(activeChapterId);

  return (
    <div id="practice-screen" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-in fade-in duration-200 pb-24 md:pb-12">
      
      {/* Chapter Selection Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {allChapters.map((ch) => {
          const isActive = ch.id === activeChapterId;

          return (
            <button
              key={ch.id}
              id={`practice-chapter-btn-${ch.number}`}
              onClick={() => setActiveChapterId(ch.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold border transition-all duration-150 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                isActive ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {ch.number}
              </span>
              <span className="truncate max-w-[180px] sm:max-w-[240px]">Ch {ch.number}: {ch.title}</span>
            </button>
          );
        })}
      </div>

      {/* Practice Header Banner */}
      <Card variant="default" padding="lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Badge variant="info" size="sm" icon={CheckSquare}>
              Class 6 CBSE Practice Arena
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
              Practice & Master Chapter {currentChapter.number}
            </h1>
            <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
              {currentChapter.title} — Choose between quick formative practice with immediate step-by-step guidance or the comprehensive chapter examination.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-4 shrink-0 min-w-[220px]">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-2xs">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Quiz Track Record
              </span>
              <span className="text-sm font-bold text-slate-800">
                {progress.quizHistory.length} Quizzes Completed ({averageQuizScorePercentage}% Avg)
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Two Modes: Practice Quiz & Chapter Test */}
      <section id="quiz-modes-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-heading text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <span>Select Quiz Mode for Chapter {currentChapter.number}</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Real CBSE & NCERT questions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizConfigs.map((config) => {
            const isPractice = config.type === 'practice';

            return (
              <Card
                key={config.id}
                id={`quiz-card-${config.id}`}
                variant={isPractice ? 'default' : 'accent'}
                padding="lg"
                className="flex flex-col justify-between hover:shadow-md transition-all duration-150"
              >
                <div className="space-y-4">
                  
                  {/* Mode Badge & Type */}
                  <div className="flex items-center justify-between">
                    <Badge variant={isPractice ? 'success' : 'info'} size="sm">
                      {isPractice ? 'Practice Mode (Instant Feedback)' : 'Comprehensive Chapter Test'}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-xl font-bold font-heading text-slate-900 leading-snug">
                      {config.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-medium">
                      {config.description}
                    </p>
                  </div>

                  {/* Display Items: Questions count, Difficulty, Estimated time */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Questions</span>
                      <strong className="text-slate-800 text-sm font-heading">{config.questionCount} Questions</strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Difficulty</span>
                      <strong className={`text-sm font-heading font-bold ${
                        config.difficulty === 'Easy' ? 'text-emerald-700' : 'text-indigo-700'
                      }`}>
                        {config.difficulty}
                      </strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Est. Time</span>
                      <strong className="text-slate-800 text-sm font-heading">{config.estimatedTime}</strong>
                    </div>
                  </div>

                </div>

                {/* Start Button */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    {isPractice ? 'Untimed study' : 'Timed simulation'}
                  </span>
                  <Button
                    id={`start-quiz-btn-${config.id}`}
                    variant="primary"
                    size="md"
                    onClick={() => onStartQuiz(config)}
                    icon={Play}
                    className={!isPractice ? '!bg-indigo-600 hover:!bg-indigo-700' : ''}
                  >
                    Start {isPractice ? 'Practice Quiz' : 'Chapter Test'}
                  </Button>
                </div>

              </Card>
            );
          })}
        </div>
      </section>

      {/* Topic-wise Quick Practice Option */}
      <section id="topic-wise-practice-section" className="bg-slate-100/80 rounded-3xl p-6 sm:p-7 border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-heading text-slate-900">
              Targeted Topic Practice for Chapter {currentChapter.number}
            </h3>
            <p className="text-xs text-slate-500">Want to revise a specific section? Open any topic to test your understanding.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentChapter.topics.map(t => (
            <div
              key={t.id}
              onClick={() => onOpenLesson(t.id)}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
            >
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-bold text-slate-400 block">Topic {t.order}</span>
                <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-800">
                  {t.title}
                </h4>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

