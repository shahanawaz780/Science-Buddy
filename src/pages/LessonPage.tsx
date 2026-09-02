import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Bot, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  Lightbulb, 
  Check, 
  X,
  AlertCircle,
  BookmarkCheck,
  Layers,
  HelpCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Volume2,
  Pause,
  Play,
  Square
} from 'lucide-react';
import { NavigationTab } from '../types';
import { useProgress } from '../context/ProgressContext';
import { CHAPTER_1_DATA, getQuestionsForTopic } from '../data/chapter1Data';
import { useLessonTTS } from '../hooks/useLessonTTS';
import { TTSPlayerBar } from '../components/tts/TTSPlayerBar';
import { SectionListenButton } from '../components/tts/SectionListenButton';

interface LessonPageProps {
  topicId: string;
  onNavigate: (tab: NavigationTab) => void;
  onSelectTopic: (topicId: string) => void;
  onAskTutorWithPrompt: (topicTitle: string, initialPrompt?: string) => void;
}

export const LessonPage: React.FC<LessonPageProps> = ({ 
  topicId, 
  onNavigate, 
  onSelectTopic,
  onAskTutorWithPrompt 
}) => {
  const { 
    progress, 
    markTopicCompleted, 
    recordTopicView, 
    recordQuickCheckPassed,
    setActiveTopicId 
  } = useProgress();

  const topic = CHAPTER_1_DATA.topics.find(t => t.id === topicId) || CHAPTER_1_DATA.topics[0];
  const currentIndex = CHAPTER_1_DATA.topics.findIndex(t => t.id === topic.id);
  const nextTopic = CHAPTER_1_DATA.topics[currentIndex + 1];
  const prevTopic = CHAPTER_1_DATA.topics[currentIndex - 1];

  // Initialize Lesson Text-to-Speech (TTS) engine
  const tts = useLessonTTS(topic);

  // Load 1-2 interactive knowledge check questions for this topic from question bank
  const allTopicQuestions = getQuestionsForTopic(topic.id);
  const knowledgeCheckQuestions = allTopicQuestions
    .filter(q => q.type === 'mcq' || q.type === 'fill_blank')
    .slice(0, 2);

  // Quick Check states
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({});
  const [fillInputValues, setFillInputValues] = useState<Record<string, string>>({});
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [showAllSteps, setShowAllSteps] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Sync and track topic view
  useEffect(() => {
    recordTopicView(topic.id);
    setActiveTopicId(topic.id);
    setIsCompleted(!!progress.topicProgress[topic.id]?.completed);
    setSelectedAnswers({});
    setSubmittedAnswers({});
    setFillInputValues({});
    setActiveStepIndex(0);
    setShowAllSteps(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [topic.id]);

  const handleSelectOption = (questionId: string, option: string) => {
    if (submittedAnswers[questionId]) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleSubmitAnswer = (questionId: string, correctAnswer: string) => {
    const userAns = selectedAnswers[questionId] || fillInputValues[questionId] || '';
    if (!userAns.trim()) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: userAns.trim()
    }));
    
    setSubmittedAnswers(prev => ({
      ...prev,
      [questionId]: true
    }));

    // Check if all knowledge check questions have been submitted
    const newlySubmitted = { ...submittedAnswers, [questionId]: true };
    const allDone = knowledgeCheckQuestions.every(q => newlySubmitted[q.id]);
    
    if (allDone) {
      recordQuickCheckPassed(topic.id);
      markTopicCompleted(topic.id);
      setIsCompleted(true);
    }
  };

  const handleRetryQuestion = (questionId: string) => {
    setSubmittedAnswers(prev => ({
      ...prev,
      [questionId]: false
    }));
    setSelectedAnswers(prev => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
    setFillInputValues(prev => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const handleCompleteTopicNow = () => {
    recordQuickCheckPassed(topic.id);
    markTopicCompleted(topic.id);
    setIsCompleted(true);
  };

  const lesson = topic.lesson;
  const currentTopicMastery = progress.topicProgress[topic.id]?.masteryPercentage || (isCompleted ? 100 : 0);

  return (
    <div id="lesson-screen" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-200 pb-24 md:pb-12">
      
      {/* Top Breadcrumb Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          id="back-to-topics-btn"
          onClick={() => onNavigate('learn')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-colors self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Topics</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main 🔊 Read Aloud Action Button */}
          <button
            id="read-aloud-header-btn"
            onClick={tts.isPlaying ? tts.pause : tts.isPaused ? tts.resume : tts.startReadingAloud}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
              tts.isPlaying
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/40 animate-pulse'
                : tts.isPaused
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 hover:border-emerald-300'
            }`}
          >
            {tts.isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Audio</span>
              </>
            ) : tts.isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Audio</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>🔊 Read Aloud</span>
              </>
            )}
          </button>

          <button
            id="ask-tutor-header-btn"
            onClick={() => onAskTutorWithPrompt(topic.title, `Can you explain "${topic.title}" simply with everyday examples for a Class 6 student?`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ask Science Buddy</span>
          </button>

          {isCompleted ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 100% Completed
            </span>
          ) : (
            <button
              onClick={handleCompleteTopicNow}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-white hover:bg-emerald-50 hover:text-emerald-800 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors"
            >
              <BookmarkCheck className="w-3.5 h-3.5" /> Mark Completed
            </button>
          )}
        </div>
      </div>

      {/* TTS Active Player Bar (Controls: Play, Pause, Resume, Stop, Continue Reading) */}
      <TTSPlayerBar tts={tts} />

      {/* 1. Topic Title & Overview Card */}
      <header 
        id="lesson-header-card" 
        className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-xs space-y-4 transition-all duration-300 ${
          tts.currentSectionId === 'overview'
            ? 'ring-4 ring-emerald-500/30 border-emerald-500 shadow-md bg-emerald-50/10'
            : 'border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-700">
            <span className="bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              Topic {topic.order} of {CHAPTER_1_DATA.totalTopics} ({topic.id})
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{topic.sourceSection}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{CHAPTER_1_DATA.board} Grade {CHAPTER_1_DATA.grade}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-1">
              ~{topic.estimatedMinutes} mins lesson
            </span>
            <SectionListenButton
              sectionId="overview"
              currentSectionId={tts.currentSectionId}
              isPlaying={tts.isPlaying}
              isPaused={tts.isPaused}
              onPlay={tts.playSection}
              onPause={tts.pause}
              onResume={tts.resume}
            />
          </div>
        </div>

        {/* 1. Topic Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-heading text-slate-900 leading-tight">
          {topic.title}
        </h1>

        {/* 2. Learning Objective Banner */}
        <div id="learning-objective-banner" className="bg-emerald-50/80 rounded-2xl p-4 sm:p-5 border border-emerald-200/80 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
              Learning Objective
            </span>
            <p className="text-xs sm:text-sm text-emerald-950 font-semibold leading-relaxed">
              {topic.learningObjective}
            </p>
          </div>
        </div>
      </header>

      {/* 3. Simple Explanation (In Simple Words) */}
      {lesson.simple_explanation && (
        <section 
          id="simple-explanation-section" 
          className={`rounded-3xl p-6 sm:p-7 border space-y-2 transition-all duration-300 ${
            tts.currentSectionId === 'simple_explanation'
              ? 'ring-4 ring-emerald-500/30 border-emerald-500 bg-amber-50 shadow-md'
              : 'bg-amber-50/70 border-amber-200/80'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>In Simple Words (Quick Summary)</span>
            </div>
            <SectionListenButton
              sectionId="simple_explanation"
              currentSectionId={tts.currentSectionId}
              isPlaying={tts.isPlaying}
              isPaused={tts.isPaused}
              onPlay={tts.playSection}
              onPause={tts.pause}
              onResume={tts.resume}
            />
          </div>
          <p className="text-sm sm:text-base text-amber-950 leading-relaxed font-medium">
            {lesson.simple_explanation}
          </p>
        </section>
      )}

      {/* 4. Concept Explanation */}
      <section 
        id="concept-explanation-section" 
        className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-xs space-y-4 transition-all duration-300 ${
          tts.currentSectionId === 'concept_explanation'
            ? 'ring-4 ring-emerald-500/30 border-emerald-500 shadow-md bg-emerald-50/10'
            : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Concept Explanation</span>
          </div>
          <SectionListenButton
            sectionId="concept_explanation"
            currentSectionId={tts.currentSectionId}
            isPlaying={tts.isPlaying}
            isPaused={tts.isPaused}
            onPlay={tts.playSection}
            onPause={tts.pause}
            onResume={tts.resume}
          />
        </div>

        <div className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal whitespace-pre-line">
          {lesson.concept_explanation}
        </div>
      </section>

      {/* Interactive Step-by-Step Component for the Scientific Method */}
      {lesson.steps && lesson.steps.length > 0 && (
        <section 
          id="scientific-method-stepper" 
          className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-xs space-y-6 transition-all duration-300 ${
            tts.currentSectionId === 'steps'
              ? 'ring-4 ring-emerald-500/30 border-emerald-500 shadow-md'
              : 'border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Interactive Stepper: The 5 Steps of the Scientific Method</span>
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-900 mt-1">
                Explore How Scientists Work Step-by-Step
              </h3>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <button
                onClick={() => setShowAllSteps(!showAllSteps)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
              >
                {showAllSteps ? 'Switch to Step-by-Step View' : 'View All 5 Steps Together'}
              </button>
              <SectionListenButton
                sectionId="steps"
                currentSectionId={tts.currentSectionId}
                isPlaying={tts.isPlaying}
                isPaused={tts.isPaused}
                onPlay={tts.playSection}
                onPause={tts.pause}
                onResume={tts.resume}
              />
            </div>
          </div>

          {/* Stepper Tabs */}
          <div 
            role="tablist" 
            aria-label="Scientific Method Steps"
            className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl"
          >
            {lesson.steps.map((st, idx) => {
              const isActive = activeStepIndex === idx;
              return (
                <button
                  key={st.step}
                  id={`step-tab-${st.step}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`step-panel-${st.step}`}
                  aria-label={`Step ${st.step}: ${st.name}`}
                  onClick={() => {
                    setActiveStepIndex(idx);
                    setShowAllSteps(false);
                  }}
                  className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white/80'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full text-[11px] font-extrabold flex items-center justify-center ${
                    isActive ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {st.step}
                  </span>
                  <span className="truncate">{st.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Step Viewer or All Steps */}
          {!showAllSteps ? (
            <div 
              id={`step-panel-${lesson.steps[activeStepIndex].step}`}
              role="tabpanel"
              aria-labelledby={`step-tab-${lesson.steps[activeStepIndex].step}`}
              className="bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-2xl p-6 border border-emerald-200/80 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-2xs">
                  Step {lesson.steps[activeStepIndex].step} of 5
                </span>
                <span className="text-xs font-semibold text-emerald-800">
                  Interactive Step Guide
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xl font-bold font-heading text-slate-900">
                  Step {lesson.steps[activeStepIndex].step}: {lesson.steps[activeStepIndex].name}
                </h4>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
                  {lesson.steps[activeStepIndex].explanation}
                </p>
              </div>

              {/* Stepper Navigation Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-emerald-200/60">
                <button
                  disabled={activeStepIndex === 0}
                  onClick={() => setActiveStepIndex(prev => Math.max(0, prev - 1))}
                  aria-label="Go to previous step"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Step</span>
                </button>

                <div className="text-xs text-slate-500 font-semibold" aria-live="polite">
                  Step {activeStepIndex + 1} of {lesson.steps.length}
                </div>

                <button
                  disabled={activeStepIndex === lesson.steps.length - 1}
                  onClick={() => setActiveStepIndex(prev => Math.min(lesson.steps!.length - 1, prev + 1))}
                  aria-label="Go to next step"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {lesson.steps.map((st) => (
                <div 
                  key={st.step}
                  className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    {st.step}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">
                      Step {st.step}: {st.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {st.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 5. Key Points */}
      {lesson.key_points && lesson.key_points.length > 0 && (
        <section 
          id="key-points-section" 
          className={`bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-4 transition-all duration-300 ${
            tts.currentSectionId === 'key_points'
              ? 'ring-4 ring-emerald-400/40 border-emerald-400'
              : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <BookmarkCheck className="w-4 h-4" />
              <span>Key Points (NCERT Summary)</span>
            </div>
            <SectionListenButton
              sectionId="key_points"
              currentSectionId={tts.currentSectionId}
              isPlaying={tts.isPlaying}
              isPaused={tts.isPaused}
              onPlay={tts.playSection}
              onPause={tts.pause}
              onResume={tts.resume}
              className="bg-slate-800 text-emerald-300 border-slate-700 hover:bg-slate-700"
            />
          </div>
          <ul className="space-y-2.5 text-sm text-slate-200">
            {lesson.key_points.map((point, kIdx) => (
              <li key={kIdx} className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 6. Important Terms */}
      {lesson.important_terms && lesson.important_terms.length > 0 && (
        <section 
          id="important-terms-section" 
          className={`space-y-3 p-1 rounded-3xl transition-all duration-300 ${
            tts.currentSectionId === 'important_terms'
              ? 'ring-4 ring-emerald-500/30 rounded-3xl bg-emerald-50/20 p-3'
              : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Important Terms to Remember</span>
            </div>
            <SectionListenButton
              sectionId="important_terms"
              currentSectionId={tts.currentSectionId}
              isPlaying={tts.isPlaying}
              isPaused={tts.isPaused}
              onPlay={tts.playSection}
              onPause={tts.pause}
              onResume={tts.resume}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {lesson.important_terms.map((termItem, tIdx) => (
              <div 
                key={tIdx}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold font-heading text-emerald-800">
                    {termItem.term}
                  </h4>
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Key Term
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {termItem.meaning}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Real-Life Examples (and/or Contextual Examples) */}
      {((lesson.real_life_examples && lesson.real_life_examples.length > 0) || (lesson.examples && lesson.examples.length > 0)) && (
        <section 
          id="real-life-examples-section" 
          className={`rounded-3xl p-6 sm:p-8 border space-y-4 transition-all duration-300 ${
            tts.currentSectionId === 'real_life_examples'
              ? 'ring-4 ring-emerald-500/30 border-emerald-500 bg-amber-50 shadow-md'
              : 'bg-amber-50/60 border-amber-200/80'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>Real-Life Examples</span>
            </div>
            <SectionListenButton
              sectionId="real_life_examples"
              currentSectionId={tts.currentSectionId}
              isPlaying={tts.isPlaying}
              isPaused={tts.isPaused}
              onPlay={tts.playSection}
              onPause={tts.pause}
              onResume={tts.resume}
            />
          </div>

          {lesson.real_life_examples && lesson.real_life_examples.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {lesson.real_life_examples.map((ex, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-amber-200 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs flex items-start gap-2.5">
                  <span className="text-base">💡</span>
                  <span className="leading-relaxed">{ex}</span>
                </div>
              ))}
            </div>
          )}

          {lesson.examples && lesson.examples.length > 0 && (
            <div className="grid sm:grid-cols-3 gap-3 pt-1">
              {lesson.examples.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-amber-200 space-y-2 flex flex-col justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 inline-block mb-1.5">
                      {item.context}
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {item.example}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Curriculum Themes Preview (if present, e.g. Topic 5) */}
      {lesson.themes && lesson.themes.length > 0 && (
        <section 
          id="curriculum-themes-section" 
          className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-xs space-y-4 transition-all duration-300 ${
            tts.currentSectionId === 'themes'
              ? 'ring-4 ring-emerald-500/30 border-emerald-500 shadow-md'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Themes Previewed in Grade 6 Science</span>
            </div>
            <SectionListenButton
              sectionId="themes"
              currentSectionId={tts.currentSectionId}
              isPlaying={tts.isPlaying}
              isPaused={tts.isPaused}
              onPlay={tts.playSection}
              onPause={tts.pause}
              onResume={tts.resume}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5">
            {lesson.themes.map((th, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{th.theme}</h4>
                </div>
                <p className="text-xs text-slate-600 pl-4 leading-relaxed font-medium">
                  {th.concepts}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. Knowledge Check / Quick Check */}
      <section id="knowledge-check-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Knowledge Check</span>
            </div>
            <h3 className="text-lg font-bold font-heading text-slate-900 mt-1">
              Check Your Understanding for Topic {topic.order}
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {knowledgeCheckQuestions.length} Questions
          </span>
        </div>

        {/* Knowledge Check Questions List */}
        <div className="space-y-6">
          {knowledgeCheckQuestions.map((q, qIdx) => {
            const userAns = selectedAnswers[q.id] || fillInputValues[q.id] || '';
            const isSubmitted = submittedAnswers[q.id];
            const isCorrect = isSubmitted && userAns.toLowerCase().trim() === q.answer.toLowerCase().trim();

            return (
              <div 
                key={q.id} 
                id={`knowledge-check-card-${q.id}`}
                className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4"
              >
                <div className="flex items-start gap-2.5 text-sm sm:text-base font-bold text-slate-900">
                  <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    {qIdx + 1}
                  </span>
                  <span className="leading-snug">{q.question}</span>
                </div>

                {/* Multiple Choice Options */}
                {q.type === 'mcq' && q.options && (
                  <div 
                    role="radiogroup" 
                    aria-label={`Options for Knowledge Check Question ${qIdx + 1}`}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1"
                  >
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[q.id] === opt;
                      let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/40';

                      if (isSubmitted) {
                        if (opt.toLowerCase() === q.answer.toLowerCase()) {
                          btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-400';
                        } else if (isSelected) {
                          btnStyle = 'bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-300';
                        } else {
                          btnStyle = 'bg-white/60 border-slate-200 text-slate-400 opacity-60';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold ring-2 ring-emerald-500/20';
                      }

                      return (
                        <button
                          key={optIdx}
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={opt}
                          disabled={isSubmitted}
                          onClick={() => handleSelectOption(q.id, opt)}
                          className={`text-left p-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-between focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${btnStyle}`}
                        >
                          <span className="leading-snug">{opt}</span>
                          {isSubmitted && opt.toLowerCase() === q.answer.toLowerCase() && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-md shrink-0 ml-2">
                              <Check className="w-3.5 h-3.5 text-emerald-800" />
                              <span>Correct</span>
                            </span>
                          )}
                          {isSubmitted && isSelected && opt.toLowerCase() !== q.answer.toLowerCase() && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-rose-200 text-rose-950 px-2 py-0.5 rounded-md shrink-0 ml-2">
                              <X className="w-3.5 h-3.5 text-rose-800" />
                              <span>Incorrect</span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Fill in the Blank Input */}
                {q.type === 'fill_blank' && (
                  <div className="space-y-2 pt-1">
                    <label htmlFor={`kb-fill-input-${q.id}`} className="sr-only">
                      Your answer for Knowledge Check Question {qIdx + 1}
                    </label>
                    <input
                      id={`kb-fill-input-${q.id}`}
                      type="text"
                      placeholder="Type your answer here..."
                      disabled={isSubmitted}
                      value={fillInputValues[q.id] || selectedAnswers[q.id] || ''}
                      onChange={(e) => setFillInputValues(prev => ({ ...prev, [q.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isSubmitted) {
                          handleSubmitAnswer(q.id, q.answer);
                        }
                      }}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                )}

                {/* Action Buttons for this question */}
                {!isSubmitted ? (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500">
                      {selectedAnswers[q.id] || fillInputValues[q.id] ? 'Ready to submit' : 'Select or type an answer'}
                    </span>
                    <button
                      disabled={!selectedAnswers[q.id] && !fillInputValues[q.id]}
                      onClick={() => handleSubmitAnswer(q.id, q.answer)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      Submit Answer
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {/* Correct / Try Again Banner with Explicit Status */}
                    <div 
                      role="status"
                      aria-live="polite"
                      className={`p-4 rounded-xl text-xs sm:text-sm leading-relaxed flex items-start justify-between gap-3 ${
                        isCorrect 
                          ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' 
                          : 'bg-rose-50 text-rose-950 border border-rose-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-extrabold flex items-center gap-1.5">
                          {isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-emerald-900">
                              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                              <span>Result: Correct!</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-900">
                              <AlertCircle className="w-4 h-4 text-rose-700" />
                              <span>Result: Incorrect — Review Answer</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700">
                          {q.explanation || `Correct answer: ${q.answer}`}
                        </p>
                      </div>

                      {!isCorrect && (
                        <button
                          onClick={() => handleRetryQuestion(q.id)}
                          aria-label={`Retry question ${qIdx + 1}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-900 text-xs font-bold hover:bg-rose-100 shrink-0 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retry</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>

        {/* Chapter Thinking Questions Reference */}
        {lesson.quick_check && lesson.quick_check.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Chapter Thinking Questions</span>
              </span>
              <span className="text-xs text-slate-400">Ask Science Buddy</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {lesson.quick_check.map((qText, qIdx) => (
                <button
                  key={qIdx}
                  onClick={() => onAskTutorWithPrompt(topic.title, `Can you guide me on how to answer this question from Chapter 1: "${qText}"?`)}
                  className="text-left p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 text-xs font-medium text-slate-700 hover:text-emerald-900 transition-all flex items-start gap-2 group"
                >
                  <span className="text-emerald-600 font-bold shrink-0">Q{qIdx + 1}.</span>
                  <span className="leading-snug group-hover:underline">{qText}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Completion Banner (when completed) */}
      {isCompleted && (
        <section id="topic-completion-banner" className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6 animate-in zoom-in-95 duration-300">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Topic Completed</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold font-heading text-white">
              Great Job! You have finished Topic {topic.order}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
              Your Chapter 1 progress has been updated to {progress.topicProgress[topic.id]?.masteryPercentage || 100}%. Ready to move to the next topic?
            </p>
          </div>

          {nextTopic ? (
            <button
              onClick={() => onSelectTopic(nextTopic.id)}
              className="px-6 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-sm shadow-md transition-all flex items-center gap-2 shrink-0"
            >
              <span>Next Topic: {nextTopic.title}</span>
              <ArrowRight className="w-4 h-4 text-emerald-700" />
            </button>
          ) : (
            <button
              onClick={() => onNavigate('practice')}
              className="px-6 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-sm shadow-md transition-all flex items-center gap-2 shrink-0"
            >
              <span>Take Chapter 1 Practice</span>
              <ArrowRight className="w-4 h-4 text-emerald-700" />
            </button>
          )}
        </section>
      )}

      {/* Primary Navigation Footer: Previous Topic / Back to Topics / Next Topic */}
      <nav id="lesson-navigation-footer" className="bg-slate-100 rounded-3xl p-5 sm:p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Previous Topic Button */}
        <button
          id="prev-topic-btn"
          disabled={!prevTopic}
          onClick={() => prevTopic && onSelectTopic(prevTopic.id)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{prevTopic ? `Previous: Topic ${prevTopic.order}` : 'Previous Topic'}</span>
        </button>

        {/* Back to Topics Button */}
        <button
          id="back-to-topics-bottom-btn"
          onClick={() => onNavigate('learn')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
        >
          <span>Back to Topic List</span>
        </button>

        {/* Next Topic Button */}
        {nextTopic ? (
          <button
            id="next-topic-btn"
            onClick={() => {
              markTopicCompleted(topic.id);
              onSelectTopic(nextTopic.id);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <span>Next Topic: Topic {nextTopic.order}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            id="finish-chapter-practice-btn"
            onClick={() => {
              markTopicCompleted(topic.id);
              onNavigate('practice');
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <span>Complete & Go to Practice</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

      </nav>

    </div>
  );
};
