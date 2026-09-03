import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Lightbulb, 
  HelpCircle, 
  CheckCircle2, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  User, 
  BookOpen, 
  ChevronDown,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  MessageSquareQuote,
  Flame,
  GraduationCap,
  Target,
  BrainCircuit,
  Wand2
} from 'lucide-react';
import { ChatMessage, StudentTutorContext } from '../types';
import { useProgress } from '../context/ProgressContext';
import { buildPerformancePayload } from '../services/recommendationService';

interface TutorPageProps {
  initialTopicTitle?: string;
  initialPrompt?: string;
}

// Maps chapter topics to friendly skill names across Chapter 1 and Chapter 2
function getSkillNameForTopic(topicId: string, topicTitle: string): string {
  const lower = (topicTitle + ' ' + topicId).toLowerCase();
  // Chapter 1
  if (lower.includes('how do scientists work') || lower.includes('method') || topicId === 'topic-3') {
    return 'Scientific Method';
  }
  if (lower.includes('jigsaw') || lower.includes('puzzle') || topicId === 'topic-2') {
    return 'Scientific Exploration';
  }
  if (lower.includes('everyday') || lower.includes('kitchen') || topicId === 'topic-4') {
    return 'Everyday Scientific Thinking';
  }
  if (lower.includes('welcome') || lower.includes('curiosity') || topicId === 'topic-1') {
    return 'Curiosity & Observation';
  }
  if (lower.includes('theme') || topicId === 'topic-5') {
    return 'Grade 6 Science Themes';
  }
  if (lower.includes('collaborat') || topicId === 'topic-6') {
    return 'Scientific Collaboration';
  }
  // Chapter 2
  if (lower.includes('root') || lower.includes('venation') || topicId === 'C2_T2') {
    return 'Plant Structures: Roots & Venation';
  }
  if (lower.includes('seed') || lower.includes('germination') || topicId === 'C2_T3') {
    return 'Seed Structure & Germination';
  }
  if (lower.includes('adaptation') || lower.includes('habitat') || topicId === 'C2_T5') {
    return 'Habitats & Survival Adaptations';
  }
  if (lower.includes('plant') || lower.includes('herb') || lower.includes('shrub') || topicId === 'C2_T1') {
    return 'Plant Diversity & Structure';
  }
  if (lower.includes('animal') || topicId === 'C2_T4') {
    return 'Animal Diversity & Classification';
  }
  if (lower.includes('living') || lower.includes('character') || topicId === 'C2_T6') {
    return 'Characteristics of Living Beings';
  }
  return 'Scientific Inquiry & Concepts';
}

export const TutorPage: React.FC<TutorPageProps> = ({ 
  initialTopicTitle, 
  initialPrompt 
}) => {
  const { progress, activeTopicId, setActiveTopicId, currentChapter, allChapters, activeChapterId, setActiveChapterId } = useProgress();
  const [selectedTopicId, setSelectedTopicId] = useState<string>(activeTopicId || 'all');
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedQuery, setLastFailedQuery] = useState<{ text: string; promptType?: string } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Retrieve the student's relevant learning progress for current chapter
  const studentLearningProfile = useMemo(() => {
    const payload = buildPerformancePayload(progress, currentChapter.topics);

    // Identify weak topics (Needs Practice or lowest accuracy)
    const weakTopicsList = payload.topicScores
      .filter(t => t.classification === 'Needs Practice' || t.accuracy < 75 || t.attempts === 0)
      .sort((a, b) => a.accuracy - b.accuracy);

    // Primary weak topic
    const primaryWeak = weakTopicsList.length > 0 
      ? weakTopicsList[0] 
      : payload.topicScores.reduce((lowest, curr) => curr.accuracy < lowest.accuracy ? curr : lowest, payload.topicScores[0]);

    const primaryWeakSkill = primaryWeak 
      ? getSkillNameForTopic(primaryWeak.topicId, primaryWeak.topicTitle)
      : 'Scientific Inquiry';

    // Calculate quiz summary without exposing hidden formulas
    const quizzesCount = progress.quizHistory.length;
    const avgScore = quizzesCount > 0 
      ? Math.round(progress.quizHistory.reduce((acc, q) => acc + q.percentage, 0) / quizzesCount)
      : 0;

    const latestQuiz = quizzesCount > 0 ? progress.quizHistory[quizzesCount - 1] : null;

    const context: StudentTutorContext = {
      chapterId: currentChapter.id,
      chapterNumber: currentChapter.number,
      chapterTitle: currentChapter.title,
      weakTopics: weakTopicsList.map(w => ({
        topicId: w.topicId,
        topicTitle: w.topicTitle,
        accuracy: w.accuracy,
        attempts: w.attempts,
        classification: w.classification
      })),
      strongTopics: payload.topicScores.filter(t => t.accuracy >= 80 && t.attempts > 0).map(t => t.topicTitle),
      unattemptedTopics: payload.topicScores.filter(t => t.attempts === 0).map(t => t.topicTitle),
      primaryWeakSkill,
      primaryWeakTopicTitle: primaryWeak ? primaryWeak.topicTitle : currentChapter.topics[0]?.title || 'Science Concepts',
      recentIncorrectAnswers: payload.incorrectQuestions.slice(0, 5),
      completedLessons: payload.completedTopics,
      quizPerformanceSummary: {
        quizzesAttempted: quizzesCount,
        averageScore: avgScore,
        latestQuizTitle: latestQuiz?.quizTitle,
        latestScore: latestQuiz ? `${latestQuiz.score}/${latestQuiz.totalMarks}` : undefined
      }
    };

    return {
      payload,
      context,
      primaryWeak,
      primaryWeakSkill,
      hasWeakTopic: weakTopicsList.length > 0 || payload.incorrectQuestions.length > 0 || (primaryWeak && primaryWeak.accuracy < 80)
    };
  }, [progress, currentChapter]);

  // 2. The 5 student choice actions specified in requirements:
  // Explain, Practice, Quiz Me, Give Hint, Teach Me Again
  const TUTOR_CHOICE_ACTIONS = [
    { 
      label: 'Explain', 
      icon: '💡', 
      prompt: 'Please explain this concept step by step for a Class 6 student.', 
      type: 'EXPLAIN',
      desc: 'Step-by-step breakdown'
    },
    { 
      label: 'Practice', 
      icon: '📝', 
      prompt: 'Give me a practice exercise or everyday scenario on this topic so I can apply what I learned!', 
      type: 'PRACTICE',
      desc: 'Real-world challenge'
    },
    { 
      label: 'Quiz Me', 
      icon: '🎯', 
      prompt: 'Quiz me with 1 question at a time on this topic!', 
      type: 'QUIZ',
      desc: 'Quick 1-question check'
    },
    { 
      label: 'Give Hint', 
      icon: '🔍', 
      prompt: 'Give me a clue or hint so I can think like a scientist without giving the direct answer!', 
      type: 'HINT',
      desc: 'Help without spoilers'
    },
    { 
      label: 'Teach Me Again', 
      icon: '🔄', 
      prompt: 'Teach me this concept again using a simpler everyday example and a fresh analogy!', 
      type: 'RETEACH',
      desc: 'Simpler fresh analogy'
    }
  ];

  // Initial welcome message tailored to the student's progress
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const { primaryWeakSkill, primaryWeak, hasWeakTopic } = studentLearningProfile;
    
    let welcomeText = `**Hi ${progress.studentName}! 👋 I am your Science Buddy AI Tutor.**\n\n`;

    if (hasWeakTopic && primaryWeak) {
      welcomeText += `🎯 **Let's improve your ${primaryWeakSkill} skills!**\n\nI reviewed your recent Chapter ${currentChapter.number} practice and noticed that strengthening **${primaryWeak.topicTitle}** will give you a big confidence boost. We'll make sure concepts feel clear, logical, and second nature!\n\nChoose an action below to get started:`;
    } else {
      welcomeText += `🎯 **Let's explore Chapter ${currentChapter.number}: ${currentChapter.title}!**\n\nYou've made great progress on your lessons. Would you like to practice, take a quick quiz, or explore a tricky science puzzle?\n\nChoose an action below to get started:`;
    }

    return [
      {
        id: 'welcome-msg',
        role: 'model',
        content: welcomeText,
        timestamp: new Date()
      }
    ];
  });

  // Update welcome greeting whenever chapter changes
  useEffect(() => {
    const { primaryWeakSkill, primaryWeak, hasWeakTopic } = studentLearningProfile;
    let welcomeText = `**Hi ${progress.studentName}! 👋 I am your Science Buddy AI Tutor.**\n\n`;

    if (hasWeakTopic && primaryWeak) {
      welcomeText += `🎯 **Let's improve your ${primaryWeakSkill} skills!**\n\nI reviewed your recent Chapter ${currentChapter.number}: *${currentChapter.title}* practice and noticed that strengthening **${primaryWeak.topicTitle}** will give you a big confidence boost. We'll make sure concepts feel clear, logical, and second nature!\n\nChoose an action below to get started:`;
    } else {
      welcomeText += `🎯 **Let's explore Chapter ${currentChapter.number}: ${currentChapter.title}!**\n\nYou've made great progress on your lessons. Would you like to practice, take a quick quiz, or explore a tricky science puzzle?\n\nChoose an action below to get started:`;
    }

    setMessages([
      {
        id: `welcome-${currentChapter.id}`,
        role: 'model',
        content: welcomeText,
        timestamp: new Date()
      }
    ]);
    setSelectedTopicId('all');
  }, [currentChapter.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, errorMessage]);

  // Handle initial pre-filled prompt if navigated from a lesson or recommendation
  useEffect(() => {
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendMessage = async (textToSend?: string, promptType?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    setErrorMessage(null);
    setLastFailedQuery(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
      promptType
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    // Get current topic context
    const currentTopicObj = currentChapter.topics.find(t => t.id === selectedTopicId);
    const topicContext = currentTopicObj 
      ? `Topic ${currentTopicObj.order} (${currentTopicObj.id}): ${currentTopicObj.title} - ${currentTopicObj.learningObjective}` 
      : `All Topics in Chapter ${currentChapter.number}: ${currentChapter.title} (Focus: ${studentLearningProfile.primaryWeakSkill})`;

    try {
      const response = await fetch('/api/gemini/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content
          })),
          topicContext,
          chapterContext: `Chapter ${currentChapter.number}: ${currentChapter.title} (${currentChapter.board} Grade ${currentChapter.grade})`,
          chapterId: currentChapter.id,
          chapterNumber: currentChapter.number,
          chapterTitle: currentChapter.title,
          currentTopic: currentTopicObj,
          promptType: promptType || (query.length < 35 ? query : undefined),
          studentContext: studentLearningProfile.context
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = await response.json();
      const replyContent = data.reply || `Let's explore that in Class 6 Science! What part of Chapter ${currentChapter.number} would you like to investigate?`;

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: replyContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error('Tutor chat request failed:', error);
      setErrorMessage('Unable to connect to the Science Buddy AI Tutor service. Please check your connection or tap retry.');
      setLastFailedQuery({ text: query, promptType });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedQuery) {
      handleSendMessage(lastFailedQuery.text, lastFailedQuery.promptType);
    }
  };

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Strip markdown formatting for cleaner audio speech
    const cleanText = text.replace(/[*_#`~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.92; // comfortable listening speed for 11-12 yo
    utterance.pitch = 1.05; // warm friendly pitch

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setErrorMessage(null);
    setLastFailedQuery(null);
    setMessages([
      {
        id: 'welcome-reset',
        role: 'model',
        content: `**Chat reset! 🔄** Ready to explore **Class 6 CBSE Science • Chapter ${currentChapter.number}: ${currentChapter.title}**!\n\n🎯 **Let's improve your ${studentLearningProfile.primaryWeakSkill} skills!** Pick an action below or ask any question.`,
        timestamp: new Date()
      }
    ]);
  };

  // Helper to render formatted markdown with special callout boxes for Chapter structured format
  const renderMessageContent = (content: string, isAI: boolean) => {
    const isOutOfScope = content.includes("outside our current learning context") || 
      content.includes("This information is not available in this chapter") || 
      content.includes("I don't have enough information from this chapter to answer that confidently");

    // Standard markdown line renderer
    const renderLines = (text: string, customTextClass?: string) => {
      return text.split('\n').map((line, lIdx) => {
        if (!line.trim()) return <div key={lIdx} className="h-1.5" />;
        
        const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
        const cleanLine = isBullet ? line.trim().substring(2) : line;
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

        return (
          <div key={lIdx} className={isBullet ? 'flex items-start gap-2 pl-2' : ''}>
            {isBullet && <span className={isAI ? 'text-indigo-600 font-bold' : 'text-white'}>•</span>}
            <span className={customTextClass}>
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong 
                      key={pIdx} 
                      className={isAI ? 'font-bold text-slate-900' : 'font-bold text-white'}
                    >
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return <span key={pIdx}>{part}</span>;
              })}
            </span>
          </div>
        );
      });
    };

    if (isOutOfScope) {
      return (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 mb-1">Chapter {currentChapter.number} Learning Boundary</p>
              <p>This question is outside our current learning context of Chapter {currentChapter.number}: {currentChapter.title}.</p>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Let's stay focused on <strong>Class 6 CBSE Chapter {currentChapter.number}: {currentChapter.title}</strong>! Try one of these approved topics:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {currentChapter.number === 2 ? (
              <>
                <button
                  onClick={() => handleSendMessage('Explain the difference between Taproots and Fibrous roots with leaf venation examples.', 'EXPLAIN')}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                >
                  🍃 Roots & Leaf Venation
                </button>
                <button
                  onClick={() => handleSendMessage('What are the three conditions strictly needed for seed germination?', 'EXPLAIN')}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                >
                  🌱 Seed Germination
                </button>
                <button
                  onClick={() => handleSendMessage('How is a camel adapted to the desert and a fish to water?', 'EXPLAIN')}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                >
                  🐾 Animal Adaptations
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleSendMessage('Explain the 5 steps of the Scientific Method with an everyday example.', 'EXPLAIN')}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
                >
                  🔬 Scientific Method Steps
                </button>
                <button
                  onClick={() => handleSendMessage('Explain the difference between Hypothesizing and Testing with a simple example.', 'EXPLAIN')}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
                >
                  💡 Hypothesizing vs Testing
                </button>
                <button
                  onClick={() => handleSendMessage('How is science like an unending jigsaw puzzle?', 'EXPLAIN')}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
                >
                  🧩 Jigsaw Puzzle Analogy
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {renderLines(content)}
      </div>
    );
  };

  return (
    <div id="ai-tutor-screen" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 animate-in fade-in duration-200 pb-28 md:pb-12">
      
      {/* Top Header & Topic Context Bar */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-heading text-slate-900">
                Personalized AI Science Tutor
              </h1>
              <span className="text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Class 6 CBSE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalized to your learning progress in Chapter {currentChapter.number}: {currentChapter.title}
            </p>
          </div>
        </div>

        {/* Chapter & Topic Context Selector & Reset */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            id="tutor-chapter-select"
            value={activeChapterId}
            onChange={(e) => {
              setActiveChapterId(e.target.value);
              setSelectedTopicId('all');
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-300 cursor-pointer"
          >
            {allChapters.map(ch => (
              <option key={ch.id} value={ch.id}>
                Chapter {ch.number}: {ch.title}
              </option>
            ))}
          </select>

          <select
            id="tutor-topic-select"
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-300 cursor-pointer"
          >
            <option value="all">Entire Chapter {currentChapter.number} (All {currentChapter.totalTopics} Topics)</option>
            {currentChapter.topics.map(t => (
              <option key={t.id} value={t.id}>
                Topic {t.order}: {t.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleClearChat}
            title="Clear and reset chat"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Personalized Improvement Banner */}
      <section id="personalized-tutor-banner" className="bg-linear-to-r from-indigo-50 via-emerald-50/60 to-purple-50 p-4 rounded-3xl border border-indigo-100/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Target className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                  Personalized Goal
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Adaptive Tutor Mode
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                Let's improve your {studentLearningProfile.primaryWeakSkill} skills.
              </h2>
            </div>
          </div>
          
          <button
            onClick={() => handleSendMessage(`Explain the key concepts of ${studentLearningProfile.primaryWeakTopicTitle || 'Scientific Method'} step by step with everyday examples.`, 'EXPLAIN')}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-xs transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Start Practice</span>
          </button>
        </div>
      </section>

      {/* Student Choice Actions: Explain, Practice, Quiz Me, Give Hint, Teach Me Again */}
      <section id="student-choice-actions" className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-600 font-bold px-1">
          <span className="flex items-center gap-1.5">
            <BrainCircuit className="w-4 h-4 text-indigo-600" />
            <span>Choose How You Want to Learn:</span>
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Tap any action to begin</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {TUTOR_CHOICE_ACTIONS.map((action, idx) => (
            <button
              key={idx}
              id={`choice-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => handleSendMessage(action.prompt, action.type)}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 text-center shadow-2xs transition-all hover:scale-102 active:scale-98 disabled:opacity-50 group"
            >
              <span className="text-xl mb-1 group-hover:scale-110 transition-transform">{action.icon}</span>
              <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                {action.label}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                {action.desc}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Chat Messages Container */}
      <section 
        id="chat-messages-container" 
        role="log"
        aria-live="polite"
        aria-label="Conversation with Science Buddy AI Tutor"
        className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs min-h-[420px] max-h-[560px] overflow-y-auto space-y-4"
      >
        {messages.map((msg) => {
          const isAI = msg.role === 'model';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
            >
              {isAI && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs" aria-hidden="true">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 space-y-2 text-sm leading-relaxed ${
                isAI 
                  ? 'bg-slate-50 border border-slate-200/90 text-slate-800' 
                  : 'bg-indigo-600 text-white shadow-xs font-medium'
              }`}>
                {/* Prompt badge if sent via chip */}
                {msg.promptType && (
                  <div className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md mb-1 ${
                    isAI ? 'bg-indigo-100 text-indigo-800' : 'bg-white/20 text-indigo-100'
                  }`}>
                    {msg.promptType}
                  </div>
                )}

                {/* Formatted Message Content */}
                {renderMessageContent(msg.content, isAI)}

                {/* Bottom actions for AI message (Audio & Copy) */}
                {isAI && (
                  <div className="pt-2.5 mt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-[10px] font-semibold text-slate-500">Science Buddy • CBSE Class 6</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSpeak(msg.content)}
                        aria-label={isSpeaking ? "Stop read aloud" : "Listen to this tutor response"}
                        className="p-1.5 hover:text-indigo-700 hover:bg-slate-200/60 transition-colors rounded-lg flex items-center gap-1 text-[11px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                        title={isSpeaking ? "Stop read aloud" : "Read aloud"}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-rose-500 text-[10px]">Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Listen</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        aria-label="Copy this response text"
                        className="p-1.5 hover:text-indigo-700 hover:bg-slate-200/60 transition-colors rounded-lg flex items-center gap-1 text-[11px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 text-[10px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!isAI && (
                <div className="w-8 h-8 rounded-xl bg-indigo-800 text-white flex items-center justify-center shrink-0 mt-1 font-bold text-xs" aria-label={`Student ${progress.studentName}`}>
                  {progress.studentName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3" role="status" aria-label="AI tutor is thinking">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse" aria-hidden="true">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-indigo-200 rounded-2xl p-4 text-xs font-semibold text-slate-700 flex items-center gap-3 shadow-xs">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>Science Buddy is reviewing your progress and crafting your explanation...</span>
            </div>
          </div>
        )}

        {/* Error State Banner with Retry */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Unable to reach AI Tutor</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            {lastFailedQuery && (
              <button
                onClick={handleRetry}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Question</span>
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </section>

      {/* Input Box */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="bg-white rounded-2xl p-2 border border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 shadow-xs flex items-center gap-2"
      >
        <label htmlFor="tutor-chat-input" className="sr-only">
          Ask Science Buddy AI Tutor a question about Chapter 1
        </label>
        <input
          id="tutor-chat-input"
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask anything about Chapter 1 (e.g. Why do scientists repeat experiments?)..."
          className="flex-1 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-medium"
        />
        <button
          id="send-message-btn"
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          aria-label="Send question to AI Tutor"
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1.5 shadow-xs shadow-indigo-600/20 transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
};
