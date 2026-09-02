import curiosityCh1 from '../data/chapters/chapter_1_curiosity.json';
import { 
  ChapterContentPack, 
  Chapter, 
  Topic, 
  QuizQuestion, 
  QuizConfig, 
  ContentPackSubjectiveRubricItem,
  ContentPackQuestion
} from '../types';

// Map of registered chapters for multi-chapter extensibility
const CHAPTER_REGISTRY: Record<string, ChapterContentPack> = {
  'ch1': curiosityCh1 as ChapterContentPack,
  'chapter-1': curiosityCh1 as ChapterContentPack,
  'curiosity-ch1': curiosityCh1 as ChapterContentPack,
};

// Default current chapter ID
let currentChapterKey = 'ch1';

/**
 * Register a new chapter content pack dynamically.
 * Enables adding Chapter 2, Chapter 3, etc. simply by passing the content pack JSON.
 */
export function registerChapter(key: string, pack: ChapterContentPack): void {
  CHAPTER_REGISTRY[key] = pack;
}

/**
 * Set current active chapter key
 */
export function setCurrentChapterKey(key: string): void {
  if (CHAPTER_REGISTRY[key]) {
    currentChapterKey = key;
  }
}

/**
 * Get raw Chapter Content Pack JSON
 */
export function getRawContentPack(chapterKey: string = currentChapterKey): ChapterContentPack {
  return CHAPTER_REGISTRY[chapterKey] || curiosityCh1 as ChapterContentPack;
}

/**
 * Map icon name based on topic title & sequence
 */
function getIconForTopic(topicId: string, title: string): string {
  if (topicId === 'T1' || title.toLowerCase().includes('welcome')) return 'Sparkles';
  if (topicId === 'T2' || title.toLowerCase().includes('puzzle')) return 'Layers';
  if (topicId === 'T3' || title.toLowerCase().includes('method')) return 'TestTube';
  if (topicId === 'T4' || title.toLowerCase().includes('everyday')) return 'Lightbulb';
  if (topicId === 'T5' || title.toLowerCase().includes('theme')) return 'Compass';
  if (topicId === 'T6' || title.toLowerCase().includes('collab')) return 'Users';
  return 'BookOpen';
}

/**
 * Map raw JSON topic to Topic interface
 */
function mapTopic(rawTopic: any, index: number): Topic {
  return {
    id: rawTopic.topic_id,
    order: index + 1,
    title: rawTopic.title,
    sourceSection: rawTopic.source_section,
    learningObjective: rawTopic.learning_objective,
    lesson: rawTopic.lesson,
    estimatedMinutes: 6,
    iconName: getIconForTopic(rawTopic.topic_id, rawTopic.title),
    category: rawTopic.source_section
  };
}

/**
 * Get unified Chapter object
 */
export function getChapter(chapterKey: string = currentChapterKey): Chapter {
  const raw = getRawContentPack(chapterKey);
  const topics = raw.topics.map((t, idx) => mapTopic(t, idx));

  return {
    id: `chapter-${raw.metadata.chapter_number}`,
    number: raw.metadata.chapter_number,
    title: raw.metadata.chapter_title,
    subject: raw.metadata.subject,
    grade: raw.metadata.grade,
    board: raw.metadata.board,
    textbook: raw.metadata.textbook,
    description: `NCERT Textbook "${raw.metadata.textbook}" • Chapter ${raw.metadata.chapter_number}: ${raw.metadata.chapter_title}. Master core scientific concepts, the scientific method, and curriculum themes.`,
    sourceFile: raw.metadata.source_file,
    sourceBasis: raw.metadata.source_basis,
    learningObjectives: raw.learning_objectives,
    totalTopics: topics.length,
    topics
  };
}

/**
 * Get all available chapters
 */
export function getAllChapters(): Chapter[] {
  const uniquePacks = Array.from(new Set(Object.values(CHAPTER_REGISTRY)));
  return uniquePacks.map(pack => {
    const topics = pack.topics.map((t, idx) => mapTopic(t, idx));
    return {
      id: `chapter-${pack.metadata.chapter_number}`,
      number: pack.metadata.chapter_number,
      title: pack.metadata.chapter_title,
      subject: pack.metadata.subject,
      grade: pack.metadata.grade,
      board: pack.metadata.board,
      textbook: pack.metadata.textbook,
      description: `NCERT Textbook "${pack.metadata.textbook}" • Chapter ${pack.metadata.chapter_number}: ${pack.metadata.chapter_title}.`,
      sourceFile: pack.metadata.source_file,
      sourceBasis: pack.metadata.source_basis,
      learningObjectives: pack.learning_objectives,
      totalTopics: topics.length,
      topics
    };
  });
}

/**
 * Get topics for chapter
 */
export function getTopicsForChapter(chapterKey: string = currentChapterKey): Topic[] {
  return getChapter(chapterKey).topics;
}

/**
 * Get topic by ID
 */
export function getTopicById(topicId: string, chapterKey: string = currentChapterKey): Topic | undefined {
  const topics = getTopicsForChapter(chapterKey);
  return topics.find(t => t.id === topicId || t.id.toLowerCase() === topicId.toLowerCase());
}

/**
 * Map raw question to unified QuizQuestion
 */
function mapQuestion(q: ContentPackQuestion, chapterKey: string): QuizQuestion {
  const raw = getRawContentPack(chapterKey);
  const topic = raw.topics.find(t => t.topic_id === q.topic_id);
  const rubric = raw.subjective_marking_rubric[q.id];

  return {
    id: q.id,
    topicId: q.topic_id,
    topicTitle: topic ? topic.title : `Topic ${q.topic_id}`,
    type: q.type,
    difficulty: q.difficulty,
    question: q.question,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation || (q.expected_key_points ? `Expected key points: ${q.expected_key_points.join(', ')}` : `Correct answer: ${q.answer}`),
    expected_key_points: q.expected_key_points,
    marks: q.marks,
    rubric
  };
}

/**
 * Get all questions for chapter
 */
export function getQuestionsForChapter(chapterKey: string = currentChapterKey): QuizQuestion[] {
  const raw = getRawContentPack(chapterKey);
  return raw.questions.map(q => mapQuestion(q, chapterKey));
}

/**
 * Get question by ID
 */
export function getQuestionById(questionId: string, chapterKey: string = currentChapterKey): QuizQuestion | undefined {
  const questions = getQuestionsForChapter(chapterKey);
  return questions.find(q => q.id === questionId);
}

/**
 * Get questions for a specific topic
 */
export function getQuestionsForTopic(topicId: string, chapterKey: string = currentChapterKey): QuizQuestion[] {
  const questions = getQuestionsForChapter(chapterKey);
  return questions.filter(q => q.topicId === topicId);
}

/**
 * Get exam blueprints as QuizConfigs
 */
export function getExamBlueprints(chapterKey: string = currentChapterKey): QuizConfig[] {
  const raw = getRawContentPack(chapterKey);
  return raw.exam_blueprints.map(bp => {
    const isPractice = bp.exam_id.includes('PRACTICE') || bp.feedback_mode.toLowerCase().includes('immediate');
    return {
      id: bp.exam_id,
      title: bp.title,
      type: isPractice ? 'practice' : 'chapter_test',
      description: isPractice 
        ? `Interactive 10-question practice test with instant explanations. Total Marks: ${bp.total_marks}.` 
        : `Comprehensive 20-question Chapter Assessment with standard CBSE marking. Total Marks: ${bp.total_marks}.`,
      questionCount: bp.questions,
      difficulty: isPractice ? 'Easy' : 'Mixed',
      estimatedTime: isPractice ? '8 mins' : '20 mins',
      feedbackMode: isPractice ? 'Immediate' : 'After submission',
      suggestedSelection: bp.suggested_selection
    };
  });
}

/**
 * Get questions for a specific exam blueprint
 */
export function getExamQuestions(examId: string, chapterKey: string = currentChapterKey): QuizQuestion[] {
  const raw = getRawContentPack(chapterKey);
  const blueprint = raw.exam_blueprints.find(b => b.exam_id === examId);
  const allQuestions = getQuestionsForChapter(chapterKey);

  if (blueprint && blueprint.suggested_selection && blueprint.suggested_selection.length > 0) {
    // Return the exact questions requested in suggested_selection
    const selected = blueprint.suggested_selection
      .map(id => allQuestions.find(q => q.id === id))
      .filter((q): q is QuizQuestion => q !== undefined);
    
    if (selected.length > 0) {
      return selected;
    }
  }

  // Fallback if examId not found
  return allQuestions.slice(0, 10);
}

/**
 * Get Subjective Rubric for question
 */
export function getSubjectiveRubricForQuestion(questionId: string, chapterKey: string = currentChapterKey): ContentPackSubjectiveRubricItem | undefined {
  const raw = getRawContentPack(chapterKey);
  return raw.subjective_marking_rubric[questionId];
}

/**
 * Quick evaluator for student answers using content pack answer_key and expected key points
 */
export function evaluateAnswer(
  questionId: string, 
  studentAnswer: string, 
  chapterKey: string = currentChapterKey
): { isCorrect: boolean; score: number; maxMarks: number; feedback: string } {
  const raw = getRawContentPack(chapterKey);
  const question = raw.questions.find(q => q.id === questionId);

  if (!question) {
    return { isCorrect: false, score: 0, maxMarks: 1, feedback: 'Question not found' };
  }

  const maxMarks = question.marks || 1;
  const userAns = (studentAnswer || '').trim().toLowerCase();
  const correctAns = (question.answer || '').trim().toLowerCase();

  // 1. MCQ
  if (question.type === 'mcq') {
    const isCorrect = userAns === correctAns || (question.options && question.options.some(opt => opt.toLowerCase() === userAns && opt.toLowerCase() === correctAns));
    return {
      isCorrect,
      score: isCorrect ? maxMarks : 0,
      maxMarks,
      feedback: isCorrect ? 'Correct! ' + (question.explanation || '') : `Incorrect. The correct answer is: ${question.answer}. ${question.explanation || ''}`
    };
  }

  // 2. Fill in the blank
  if (question.type === 'fill_blank') {
    const isCorrect = userAns === correctAns || userAns.includes(correctAns);
    return {
      isCorrect,
      score: isCorrect ? maxMarks : 0,
      maxMarks,
      feedback: isCorrect ? 'Spot on!' : `The correct word is "${question.answer}".`
    };
  }

  // 3. Short answer / Subjective - evaluate based on expected key points
  if (question.expected_key_points && question.expected_key_points.length > 0) {
    const matchedCount = question.expected_key_points.filter(kp => {
      const words = kp.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      return words.some(w => userAns.includes(w));
    }).length;

    const ratio = matchedCount / question.expected_key_points.length;
    let earned = Math.round(ratio * maxMarks);
    if (userAns.length > 10 && earned === 0) earned = 1; // encouragement for attempt
    earned = Math.min(maxMarks, Math.max(0, earned));

    const isCorrect = earned >= Math.ceil(maxMarks / 2);
    return {
      isCorrect,
      score: earned,
      maxMarks,
      feedback: `Earned ${earned}/${maxMarks} marks based on NCERT key concepts.`
    };
  }

  // Fallback exact match check
  const isMatch = userAns === correctAns;
  return {
    isCorrect: isMatch,
    score: isMatch ? maxMarks : 0,
    maxMarks,
    feedback: isMatch ? 'Correct!' : `Sample Answer: ${question.answer}`
  };
}

/**
 * Get AI Tutor System Prompt from content pack
 */
export function getAiTutorSystemPrompt(chapterKey: string = currentChapterKey): string {
  const raw = getRawContentPack(chapterKey);
  return raw.ai_tutor_system_prompt;
}

/**
 * Get Subjective Evaluation Prompt from content pack
 */
export function getSubjectiveEvaluationPrompt(chapterKey: string = currentChapterKey): string {
  const raw = getRawContentPack(chapterKey);
  return raw.subjective_evaluation_prompt;
}
