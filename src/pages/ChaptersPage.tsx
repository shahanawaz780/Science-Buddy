import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Layers, 
  Award, 
  BarChart2, 
  Lock, 
  Compass, 
  Search,
  CheckSquare,
  Bot
} from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { Chapter, NavigationTab } from '../types';
import { Button, Badge, Card, Modal } from '../components/ui';

interface ChaptersPageProps {
  onNavigate: (tab: NavigationTab) => void;
  onSelectChapter?: (chapterId: string) => void;
}

export const ChaptersPage: React.FC<ChaptersPageProps> = ({ onNavigate, onSelectChapter }) => {
  const { 
    allChapters, 
    activeChapterId, 
    setActiveChapterId, 
    getChapterProgress,
    overallCurriculumProgressPercentage,
    completedTopicsCount
  } = useProgress();

  const [filter, setFilter] = useState<'all' | 'available' | 'in_progress'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewChapter, setPreviewChapter] = useState<Chapter | null>(null);

  const handleSelectChapter = (chapter: Chapter) => {
    if (!chapter.isAvailable) {
      setPreviewChapter(chapter);
      return;
    }
    setActiveChapterId(chapter.id);
    if (onSelectChapter) {
      onSelectChapter(chapter.id);
    }
    onNavigate('learn');
  };

  const handleStartPractice = (chapter: Chapter, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!chapter.isAvailable) return;
    setActiveChapterId(chapter.id);
    onNavigate('practice');
  };

  const handleAskTutor = (chapter: Chapter, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!chapter.isAvailable) return;
    setActiveChapterId(chapter.id);
    onNavigate('tutor');
  };

  // Filtered chapters
  const filteredChapters = allChapters.filter(ch => {
    const progress = getChapterProgress(ch.id);
    if (filter === 'available' && !ch.isAvailable) return false;
    if (filter === 'in_progress' && progress.status !== 'in_progress' && progress.status !== 'completed') return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ch.title.toLowerCase().includes(q);
      const matchDesc = ch.description.toLowerCase().includes(q);
      const matchNum = `chapter ${ch.number}`.includes(q);
      return matchTitle || matchDesc || matchNum;
    }
    return true;
  });

  const availableCount = allChapters.filter(c => c.isAvailable).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              CBSE Class 6 Science Curriculum • NCERT Curiosity
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Explore All Science Chapters
            </h1>
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
              Step through the full Class 6 Science syllabus with bite-sized interactive lessons, practical experiments, instant quizzes, and AI Tutor support.
            </p>
          </div>

          {/* Quick Curriculum Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 shrink-0">
            <div className="text-center p-2">
              <div className="text-2xl font-bold text-white">{allChapters.length}</div>
              <div className="text-xs text-blue-200">Total Chapters</div>
            </div>
            <div className="text-center p-2 border-l border-white/10">
              <div className="text-2xl font-bold text-emerald-300">{availableCount}</div>
              <div className="text-xs text-blue-200">Interactive Packs</div>
            </div>
            <div className="text-center p-2 col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-white/10">
              <div className="text-2xl font-bold text-amber-300">{overallCurriculumProgressPercentage}%</div>
              <div className="text-xs text-blue-200">Total Mastery</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            id="tab-all-chapters"
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Chapters ({allChapters.length})
          </button>
          <button
            id="tab-available-chapters"
            onClick={() => setFilter('available')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              filter === 'available'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Interactive Ready ({availableCount})
          </button>
          <button
            id="tab-inprogress-chapters"
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              filter === 'in_progress'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            My Active Chapters
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-chapters-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search chapters or topics..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400 shadow-2xs"
          />
        </div>
      </div>

      {/* Chapters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChapters.map((chapter) => {
          const progress = getChapterProgress(chapter.id);
          const isSelected = activeChapterId === chapter.id;
          const isCompleted = progress.status === 'completed';
          const isInProgress = progress.status === 'in_progress';
          const isAvailable = chapter.isAvailable;

          return (
            <div
              key={chapter.id}
              id={`chapter-card-${chapter.number}`}
              onClick={() => handleSelectChapter(chapter)}
              className={`group relative flex flex-col justify-between bg-white rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer ${
                isSelected 
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' 
                  : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              {/* Card Header Top Accent */}
              <div 
                className={`h-2.5 w-full ${
                  isCompleted 
                    ? 'bg-emerald-500' 
                    : isInProgress 
                    ? 'bg-blue-600' 
                    : isAvailable 
                    ? 'bg-indigo-500' 
                    : 'bg-slate-300'
                }`} 
              />

              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  {/* Badge Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">
                      Chapter {chapter.number}
                    </span>

                    {/* Status Badge */}
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    ) : isInProgress ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        <Clock className="w-3.5 h-3.5" />
                        In Progress
                      </span>
                    ) : isAvailable ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        <Lock className="w-3.5 h-3.5" />
                        Coming Soon
                      </span>
                    )}
                  </div>

                  {/* Chapter Title */}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {chapter.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-600 text-xs sm:text-sm mt-2 line-clamp-3 leading-relaxed">
                    {chapter.description}
                  </p>
                </div>

                {/* Metrics & Progress Bar */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  {/* Topic Count & Time */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Layers className="w-4 h-4 text-slate-400" />
                      {chapter.totalTopics} Micro-Topics
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-4 h-4 text-slate-400" />
                      ~{chapter.number === 1 ? '35' : chapter.number === 2 ? '40' : chapter.number === 3 ? '40' : '30'} mins
                    </span>
                  </div>

                  {/* Progress Indicator */}
                  {isAvailable ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-700">Mastery Progress</span>
                        <span className={progress.completionPercentage > 0 ? 'text-blue-600' : 'text-slate-500'}>
                          {progress.completionPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${progress.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Curriculum blueprint finalized for CBSE Class 6.</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col gap-2">
                    {isAvailable ? (
                      <>
                        <Button
                          id={`btn-open-chapter-${chapter.number}`}
                          variant={isSelected || isInProgress ? 'primary' : 'outline'}
                          className="w-full justify-between group-hover:shadow-2xs text-xs sm:text-sm font-semibold"
                          onClick={() => handleSelectChapter(chapter)}
                        >
                          <span>
                            {isCompleted ? 'Review Chapter' : isInProgress ? 'Continue Learning' : 'Start Learning'}
                          </span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Button>

                        {/* Secondary Quick Action Bar */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            id={`btn-quiz-chapter-${chapter.number}`}
                            onClick={(e) => handleStartPractice(chapter, e)}
                            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-medium transition-colors"
                          >
                            <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                            Quiz & Exam
                          </button>
                          <button
                            id={`btn-tutor-chapter-${chapter.number}`}
                            onClick={(e) => handleAskTutor(chapter, e)}
                            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 text-xs font-medium transition-colors"
                          >
                            <Bot className="w-3.5 h-3.5 text-purple-500" />
                            Ask AI Tutor
                          </button>
                        </div>
                      </>
                    ) : (
                      <Button
                        id={`btn-preview-chapter-${chapter.number}`}
                        variant="secondary"
                        className="w-full text-xs font-medium"
                        onClick={() => setPreviewChapter(chapter)}
                      >
                        Preview Curriculum
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coming Soon Chapter Modal */}
      {previewChapter && (
        <Modal
          isOpen={!!previewChapter}
          onClose={() => setPreviewChapter(null)}
          title={`Chapter ${previewChapter.number}: ${previewChapter.title}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs sm:text-sm text-blue-900 leading-relaxed">
              <span className="font-bold">CBSE Class 6 Science Curiosity:</span> {previewChapter.description}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Planned Learning Objectives:
              </h4>
              <ul className="space-y-2">
                {previewChapter.learningObjectives.map((obj, i) => (
                  <li key={i} className="text-xs sm:text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">•</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button variant="primary" onClick={() => setPreviewChapter(null)}>
                Got it
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
