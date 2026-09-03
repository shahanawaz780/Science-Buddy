import curiosityCh1 from '../data/chapters/chapter_1_curiosity.json';
import diversityCh2 from '../data/chapters/chapter_2_diversity.json';
import mindfulEatingCh3 from '../data/chapters/chapter_3_mindful_eating.json';
import { 
  ChapterContentPack, 
  Chapter, 
  Topic, 
  QuizQuestion, 
  QuizConfig, 
  ContentPackSubjectiveRubricItem,
  ContentPackQuestion,
  ChapterStatus,
  LessonDiagram
} from '../types';

// Map of registered chapters with rich interactive content
export const CHAPTER_REGISTRY: Record<string, ChapterContentPack> = {
  'ch1': curiosityCh1 as unknown as ChapterContentPack,
  'chapter-1': curiosityCh1 as unknown as ChapterContentPack,
  'curiosity-ch1': curiosityCh1 as unknown as ChapterContentPack,

  'ch2': diversityCh2 as unknown as ChapterContentPack,
  'chapter-2': diversityCh2 as unknown as ChapterContentPack,
  'curiosity-ch2': diversityCh2 as unknown as ChapterContentPack,

  'ch3': mindfulEatingCh3 as unknown as ChapterContentPack,
  'chapter-3': mindfulEatingCh3 as unknown as ChapterContentPack,
  'curiosity-ch3': mindfulEatingCh3 as unknown as ChapterContentPack,
};

// Full CBSE Class 6 Curiosity Science Syllabus Catalog (with availability tracking)
interface ChapterCatalogMeta {
  chapter_id: string;
  chapter_number: number;
  chapter_title: string;
  description: string;
  display_order: number;
  status: ChapterStatus;
  isAvailable: boolean;
  content_availability: string;
  estimatedMinutes: number;
  topicsCount: number;
}

const CLASS_6_CHAPTERS_CATALOG: ChapterCatalogMeta[] = [
  {
    chapter_id: 'chapter-1',
    chapter_number: 1,
    chapter_title: 'The Wonderful World of Science',
    description: 'Explore the nature of science, the 5-step scientific method, everyday observations, and curriculum themes in Grade 6.',
    display_order: 1,
    status: 'available',
    isAvailable: true,
    content_availability: 'Full Interactive Content (Lessons, Quizzes & AI Tutor)',
    estimatedMinutes: 35,
    topicsCount: 6
  },
  {
    chapter_id: 'chapter-2',
    chapter_number: 2,
    chapter_title: 'Diversity in the Living World',
    description: 'Discover plant structures, root systems, leaf venation, animal movement, extreme habitat adaptations, and living characteristics.',
    display_order: 2,
    status: 'available',
    isAvailable: true,
    content_availability: 'Full Interactive Content (Lessons, Quizzes & AI Tutor)',
    estimatedMinutes: 40,
    topicsCount: 6
  },
  {
    chapter_id: 'chapter-3',
    chapter_number: 3,
    chapter_title: 'Mindful Eating: A Path to a Healthy Body',
    description: 'Master major food nutrients, laboratory starch and protein tests, balanced Indian diets, deficiency diseases, and mindful eating.',
    display_order: 3,
    status: 'available',
    isAvailable: true,
    content_availability: 'Full Interactive Content (Lessons, Quizzes & AI Tutor)',
    estimatedMinutes: 40,
    topicsCount: 6
  },
  {
    chapter_id: 'chapter-4',
    chapter_number: 4,
    chapter_title: 'Exploring Magnets',
    description: 'Understand magnetic and non-magnetic materials, magnetic poles, attraction, repulsion, and navigation compasses.',
    display_order: 4,
    status: 'coming_soon',
    isAvailable: false,
    content_availability: 'Curriculum Blueprint Available (Interactive pack releasing next)',
    estimatedMinutes: 30,
    topicsCount: 5
  },
  {
    chapter_id: 'chapter-5',
    chapter_number: 5,
    chapter_title: 'Measurement of Length and Motion',
    description: 'Learn standard SI units of measurement, measuring curved lines, and types of motion: rectilinear, circular, and periodic.',
    display_order: 5,
    status: 'coming_soon',
    isAvailable: false,
    content_availability: 'Curriculum Blueprint Available (Interactive pack releasing next)',
    estimatedMinutes: 30,
    topicsCount: 5
  },
  {
    chapter_id: 'chapter-6',
    chapter_number: 6,
    chapter_title: 'Materials Around Us',
    description: 'Investigate the grouping of objects, physical properties like lustre, hardness, solubility in water, transparency, and density.',
    display_order: 6,
    status: 'coming_soon',
    isAvailable: false,
    content_availability: 'Curriculum Blueprint Available (Interactive pack releasing next)',
    estimatedMinutes: 30,
    topicsCount: 5
  }
];

// Default current chapter ID
let currentChapterKey = 'chapter-1';

/**
 * Register a new chapter content pack dynamically.
 */
export function registerChapter(key: string, pack: ChapterContentPack): void {
  CHAPTER_REGISTRY[key] = pack;
  const numKey = `chapter-${pack.metadata.chapter_number}`;
  const chKey = `ch${pack.metadata.chapter_number}`;
  CHAPTER_REGISTRY[numKey] = pack;
  CHAPTER_REGISTRY[chKey] = pack;
}

/**
 * Set current active chapter key
 */
export function setCurrentChapterKey(key: string): void {
  if (CHAPTER_REGISTRY[key] || CHAPTER_REGISTRY[`chapter-${key}`] || CHAPTER_REGISTRY[`ch${key}`]) {
    currentChapterKey = normalizeChapterKey(key);
  }
}

/**
 * Get current active chapter key
 */
export function getCurrentChapterKey(): string {
  return currentChapterKey;
}

/**
 * Normalize chapter keys like '1', 'ch1', 'chapter-1' -> 'chapter-1' or 'ch1'
 */
export function normalizeChapterKey(keyOrId?: string): string {
  if (!keyOrId) return currentChapterKey;
  const cleaned = keyOrId.trim().toLowerCase();
  if (CHAPTER_REGISTRY[cleaned]) return cleaned;
  if (CHAPTER_REGISTRY[`chapter-${cleaned}`]) return `chapter-${cleaned}`;
  if (CHAPTER_REGISTRY[`ch${cleaned}`]) return `ch${cleaned}`;
  if (cleaned.startsWith('ch') && CHAPTER_REGISTRY[`chapter-${cleaned.replace('ch', '')}`]) {
    return `chapter-${cleaned.replace('ch', '')}`;
  }
  return 'chapter-1';
}

/**
 * Get raw Chapter Content Pack JSON
 */
export function getRawContentPack(chapterKey: string = currentChapterKey): ChapterContentPack {
  const normalized = normalizeChapterKey(chapterKey);
  return CHAPTER_REGISTRY[normalized] || curiosityCh1 as ChapterContentPack;
}

/**
 * Map icon name based on topic title & sequence
 */
function getIconForTopic(topicId: string, title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('welcome') || lower.includes('curiosity')) return 'Sparkles';
  if (lower.includes('puzzle') || lower.includes('jigsaw')) return 'Layers';
  if (lower.includes('method') || lower.includes('scientist') || lower.includes('test')) return 'TestTube';
  if (lower.includes('everyday') || lower.includes('thinking') || lower.includes('habit')) return 'Lightbulb';
  if (lower.includes('theme') || lower.includes('overview') || lower.includes('motion')) return 'Compass';
  if (lower.includes('collab') || lower.includes('harmony') || lower.includes('team')) return 'Users';
  if (lower.includes('plant') || lower.includes('leaf') || lower.includes('root')) return 'Layers';
  if (lower.includes('animal') || lower.includes('locomotion') || lower.includes('movement')) return 'Compass';
  if (lower.includes('habitat') || lower.includes('adaptation')) return 'Lightbulb';
  if (lower.includes('nutrient') || lower.includes('food') || lower.includes('eating')) return 'Sparkles';
  if (lower.includes('deficiency') || lower.includes('disease')) return 'TestTube';
  return 'BookOpen';
}

/**
 * Default scientific diagrams for Class 6 topics
 */
function getTopicDiagrams(topicId: string, topicTitle: string): LessonDiagram[] {
  const lowerTitle = topicTitle.toLowerCase();

  if (topicId === 'C2_T1' || lowerTitle.includes('plant') || lowerTitle.includes('parts')) {
    return [{
      id: 'c2-t1-plant-parts',
      title: 'Structure of a Typical Flowering Plant & Root Systems',
      caption: 'Figure 2.1: Key parts of a flowering plant divided into shoot system (stem, leaves, flower) and root system (taproot and lateral roots).',
      alt: 'Scientific botanical diagram displaying the shoot system above ground with stem, leaves, and flower, and the root system below ground with taproot and lateral roots.',
      svgKey: 'plant_parts',
      labels: [
        { name: 'Shoot System', description: 'Aboveground parts including stem, leaves, flowers, and fruit.' },
        { name: 'Root System', description: 'Underground system anchoring plant and absorbing water and minerals.' },
        { name: 'Primary Taproot', description: 'Central dominant root that grows deep into the soil.' },
        { name: 'Lateral Roots', description: 'Smaller horizontal root branches increasing surface absorption.' }
      ]
    }];
  }

  if (topicId === 'C2_T2' || lowerTitle.includes('venation') || lowerTitle.includes('leaf')) {
    return [{
      id: 'c2-t2-leaf-venation',
      title: 'Comparison of Leaf Venation Patterns: Reticulate vs Parallel',
      caption: 'Figure 2.2: Reticulate net-like venation (found in plants with taproots like Peepal) contrasted with parallel venation (found in plants with fibrous roots like Grass).',
      alt: 'Comparative botanical diagram showing reticulate net venation on a broad leaf with central midrib versus parallel straight-line venation on a grass blade.',
      svgKey: 'leaf_venation',
      labels: [
        { name: 'Reticulate Venation', description: 'Veins form a web-like network across the leaf blade (dicots).' },
        { name: 'Parallel Venation', description: 'Veins run straight and parallel from base to apex (monocots).' },
        { name: 'NCERT Correlation', description: 'Reticulate leaves always correspond to taproot systems; parallel leaves correspond to fibrous root systems.' }
      ]
    }];
  }

  if (topicId === 'C2_T4' || lowerTitle.includes('habitat') || lowerTitle.includes('adaptation')) {
    return [{
      id: 'c2-t4-habitat-adaptations',
      title: 'Extreme Habitat Adaptations: Desert vs Mountain Organisms',
      caption: 'Figure 2.4: Structural adaptations allowing the camel to thrive in hot deserts and the pine tree/yak to withstand cold mountain climates.',
      alt: 'Comparative diagram illustrating desert adaptations in camels (hump, padded feet, long lashes) alongside mountain adaptations (conical trees and insulating fur).',
      svgKey: 'habitat_adaptations',
      labels: [
        { name: 'Desert Camel', description: 'Fat-storing hump, long eyelashes, broad padded feet, concentrated urine.' },
        { name: 'Mountain Pine', description: 'Conical sloping shape and needle-like leaves allowing heavy snow to slide off.' },
        { name: 'Mountain Yak', description: 'Thick fur and wool trapping insulating air pockets against sub-zero chill.' }
      ]
    }];
  }

  if (topicId === 'C2_T5' || lowerTitle.includes('characteristic') || lowerTitle.includes('living')) {
    return [{
      id: 'c2-t5-living-characteristics',
      title: 'The Six Universal Signs of Life',
      caption: 'Figure 2.5: The six fundamental life processes shared by all living organisms: nutrition, respiration, growth, movement/response, reproduction, and excretion.',
      alt: 'Circular infographic diagram showing the six fundamental characteristics distinguishing living organisms from non-living matter.',
      svgKey: 'living_characteristics',
      labels: [
        { name: 'Nutrition & Respiration', description: 'Living beings intake food and release chemical energy.' },
        { name: 'Growth & Movement', description: 'Irreversible increase in size and active locomotion or orientation.' },
        { name: 'Stimuli Response', description: 'Quick reaction to changes in external environment.' },
        { name: 'Reproduction & Excretion', description: 'Producing offspring and removing metabolic waste.' }
      ]
    }];
  }

  if (topicId === 'T3' || topicId === 'C1_T3' || lowerTitle.includes('scientific method')) {
    return [{
      id: 'c1-t3-scientific-method',
      title: 'The 5-Step Scientific Method Cycle',
      caption: 'Figure 1.1: The systematic five steps scientists use to explore the natural world: Observation, Question, Hypothesis, Experiment, and Conclusion.',
      alt: 'Flowchart diagram illustrating the iterative five steps of the scientific method with feedback loop arrows.',
      svgKey: 'scientific_method',
      labels: [
        { name: 'Observation', description: 'Noticing phenomena using our senses.' },
        { name: 'Question', description: 'Formulating clear questions about the observations.' },
        { name: 'Hypothesis', description: 'Making an educated guess or proposed explanation.' },
        { name: 'Testing', description: 'Conducting experiments and collecting evidence.' },
        { name: 'Conclusion', description: 'Analyzing findings to accept or refine hypotheses.' }
      ]
    }];
  }

  return [];
}

/**
 * Map raw JSON topic to Topic interface
 */
function mapTopic(rawTopic: any, index: number, chapterId: string): Topic {
  const defaultDiagrams = getTopicDiagrams(rawTopic.topic_id, rawTopic.title);
  const rawLesson = rawTopic.lesson || {};
  const diagrams = (rawLesson.diagrams && rawLesson.diagrams.length > 0)
    ? rawLesson.diagrams
    : defaultDiagrams;

  const lesson = {
    ...rawLesson,
    diagrams,
    diagram: diagrams[0] || rawLesson.diagram
  };

  return {
    id: rawTopic.topic_id,
    chapterId,
    order: index + 1,
    title: rawTopic.title,
    sourceSection: rawTopic.source_section,
    learningObjective: rawTopic.learning_objective,
    lesson,
    estimatedMinutes: 6,
    iconName: getIconForTopic(rawTopic.topic_id, rawTopic.title),
    category: rawTopic.source_section
  };
}

/**
 * Get unified Chapter object for a given key or ID
 */
export function getChapter(chapterKey: string = currentChapterKey): Chapter {
  const raw = getRawContentPack(chapterKey);
  const chapterId = `chapter-${raw.metadata.chapter_number}`;
  const topics = raw.topics.map((t, idx) => mapTopic(t, idx, chapterId));
  const catalogMeta = CLASS_6_CHAPTERS_CATALOG.find(c => c.chapter_number === raw.metadata.chapter_number);

  return {
    id: chapterId,
    chapter_id: chapterId,
    number: raw.metadata.chapter_number,
    chapter_number: raw.metadata.chapter_number,
    title: raw.metadata.chapter_title,
    chapter_title: raw.metadata.chapter_title,
    subject: raw.metadata.subject,
    grade: raw.metadata.grade,
    board: raw.metadata.board,
    textbook: raw.metadata.textbook,
    description: catalogMeta?.description || `NCERT Textbook "${raw.metadata.textbook}" • Chapter ${raw.metadata.chapter_number}: ${raw.metadata.chapter_title}. Master core scientific concepts and curriculum themes.`,
    display_order: raw.metadata.chapter_number,
    displayOrder: raw.metadata.chapter_number,
    status: 'available',
    isAvailable: true,
    content_availability: 'Full Interactive Content (Lessons, Quizzes & AI Tutor)',
    hasContent: true,
    sourceFile: raw.metadata.source_file,
    sourceBasis: raw.metadata.source_basis,
    learningObjectives: raw.learning_objectives,
    totalTopics: topics.length,
    topics
  };
}

/**
 * Get all chapters (combining full registered packs and the CBSE syllabus catalog)
 */
export function getAllChapters(): Chapter[] {
  return CLASS_6_CHAPTERS_CATALOG.map(meta => {
    const rawKey = `chapter-${meta.chapter_number}`;
    const registeredPack = CHAPTER_REGISTRY[rawKey];

    if (registeredPack) {
      const topics = registeredPack.topics.map((t, idx) => mapTopic(t, idx, meta.chapter_id));
      return {
        id: meta.chapter_id,
        chapter_id: meta.chapter_id,
        number: meta.chapter_number,
        chapter_number: meta.chapter_number,
        title: meta.chapter_title,
        chapter_title: meta.chapter_title,
        subject: registeredPack.metadata.subject || 'Science',
        grade: registeredPack.metadata.grade || 6,
        board: registeredPack.metadata.board || 'CBSE',
        textbook: registeredPack.metadata.textbook || 'Curiosity',
        description: meta.description,
        display_order: meta.display_order,
        displayOrder: meta.display_order,
        status: meta.status,
        isAvailable: meta.isAvailable,
        content_availability: meta.content_availability,
        hasContent: true,
        sourceFile: registeredPack.metadata.source_file,
        sourceBasis: registeredPack.metadata.source_basis,
        learningObjectives: registeredPack.learning_objectives,
        totalTopics: topics.length,
        topics
      };
    }

    // Coming soon placeholder chapter
    return {
      id: meta.chapter_id,
      chapter_id: meta.chapter_id,
      number: meta.chapter_number,
      chapter_number: meta.chapter_number,
      title: meta.chapter_title,
      chapter_title: meta.chapter_title,
      subject: 'Science',
      grade: 6,
      board: 'CBSE',
      textbook: 'Curiosity',
      description: meta.description,
      display_order: meta.display_order,
      displayOrder: meta.display_order,
      status: meta.status,
      isAvailable: meta.isAvailable,
      content_availability: meta.content_availability,
      hasContent: false,
      learningObjectives: [
        `Understand key concepts of ${meta.chapter_title} as per NCERT Class 6 guidelines.`,
        'Engage with interactive observations and scientific experiments.',
        'Prepare for CBSE Class 6 summative examinations.'
      ],
      totalTopics: meta.topicsCount,
      topics: []
    };
  });
}

/**
 * Get topics for a specific chapter
 */
export function getTopicsForChapter(chapterKey: string = currentChapterKey): Topic[] {
  return getChapter(chapterKey).topics;
}

/**
 * Get topic by ID (searches in current/specified chapter first, then across all chapters)
 */
export function getTopicById(topicId: string, chapterKey?: string): Topic | undefined {
  if (chapterKey) {
    const chapterTopics = getTopicsForChapter(chapterKey);
    const found = chapterTopics.find(t => t.id === topicId || t.id.toLowerCase() === topicId.toLowerCase());
    if (found) return found;
  }

  // If not found in specified chapter or no chapter specified, search all chapters
  const allChs = getAllChapters();
  for (const ch of allChs) {
    const found = ch.topics.find(t => t.id === topicId || t.id.toLowerCase() === topicId.toLowerCase());
    if (found) return found;
  }

  // Fallback to topic 1 of Chapter 1
  return getTopicsForChapter('chapter-1')[0];
}

/**
 * Map raw question to unified QuizQuestion
 */
function mapQuestion(q: ContentPackQuestion, chapterKey: string): QuizQuestion {
  const raw = getRawContentPack(chapterKey);
  const topic = raw.topics.find(t => t.topic_id === q.topic_id);
  const rubric = raw.subjective_marking_rubric ? raw.subjective_marking_rubric[q.id] : undefined;

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
export function getQuestionById(questionId: string, chapterKey?: string): QuizQuestion | undefined {
  if (chapterKey) {
    const questions = getQuestionsForChapter(chapterKey);
    const found = questions.find(q => q.id === questionId);
    if (found) return found;
  }

  // Search across all chapters
  const allPacks = Array.from(new Set(Object.values(CHAPTER_REGISTRY)));
  for (const pack of allPacks) {
    const questions = pack.questions.map(q => mapQuestion(q, `chapter-${pack.metadata.chapter_number}`));
    const found = questions.find(q => q.id === questionId);
    if (found) return found;
  }

  return undefined;
}

/**
 * Get questions for a specific topic
 */
export function getQuestionsForTopic(topicId: string, chapterKey?: string): QuizQuestion[] {
  // If chapterKey is specified, search in that chapter
  if (chapterKey) {
    const questions = getQuestionsForChapter(chapterKey);
    return questions.filter(q => q.topicId === topicId || q.topicId.toLowerCase() === topicId.toLowerCase());
  }

  // Otherwise search in all chapters
  const allPacks = Array.from(new Set(Object.values(CHAPTER_REGISTRY)));
  for (const pack of allPacks) {
    const chKey = `chapter-${pack.metadata.chapter_number}`;
    const questions = getQuestionsForChapter(chKey);
    const matching = questions.filter(q => q.topicId === topicId || q.topicId.toLowerCase() === topicId.toLowerCase());
    if (matching.length > 0) return matching;
  }

  return getQuestionsForChapter('chapter-1').filter(q => q.topicId === topicId);
}

/**
 * Get exam blueprints as QuizConfigs for a chapter
 */
export function getExamBlueprints(chapterKey: string = currentChapterKey): QuizConfig[] {
  const raw = getRawContentPack(chapterKey);
  const chapterNumber = raw.metadata.chapter_number;

  return raw.exam_blueprints.map(bp => {
    const isPractice = bp.exam_id.includes('PRACTICE') || bp.feedback_mode.toLowerCase().includes('immediate');
    return {
      id: bp.exam_id,
      title: bp.title,
      type: isPractice ? 'practice' : 'chapter_test',
      description: isPractice 
        ? `Interactive ${bp.questions}-question practice test with instant explanations for Chapter ${chapterNumber}. Total Marks: ${bp.total_marks}.` 
        : `Comprehensive ${bp.questions}-question Chapter ${chapterNumber} Assessment with CBSE standard marking. Total Marks: ${bp.total_marks}.`,
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
export function getSubjectiveRubricForQuestion(questionId: string, chapterKey?: string): ContentPackSubjectiveRubricItem | undefined {
  if (chapterKey) {
    const raw = getRawContentPack(chapterKey);
    if (raw.subjective_marking_rubric && raw.subjective_marking_rubric[questionId]) {
      return raw.subjective_marking_rubric[questionId];
    }
  }

  // Search across all packs
  const allPacks = Array.from(new Set(Object.values(CHAPTER_REGISTRY)));
  for (const pack of allPacks) {
    if (pack.subjective_marking_rubric && pack.subjective_marking_rubric[questionId]) {
      return pack.subjective_marking_rubric[questionId];
    }
  }

  // If question has expected_key_points, construct structured criteria
  const q = getQuestionById(questionId, chapterKey);
  if (q && q.expected_key_points && q.expected_key_points.length > 0) {
    const markPerPoint = Math.max(0.5, Math.round((q.marks / q.expected_key_points.length) * 10) / 10);
    return {
      marks: q.marks,
      criteria: q.expected_key_points.map((pt) => ({
        marks: markPerPoint,
        description: `Mention and explain ${pt}`
      }))
    };
  }

  return undefined;
}

/**
 * Quick evaluator for student answers using content pack answer_key and expected key points
 */
export function evaluateAnswer(
  questionId: string, 
  studentAnswer: string, 
  chapterKey?: string
): { isCorrect: boolean; score: number; maxMarks: number; feedback: string } {
  const question = getQuestionById(questionId, chapterKey);

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
  return raw.ai_tutor_system_prompt || 'You are Science Buddy, a friendly AI science tutor for Class 6 CBSE.';
}

/**
 * Get Subjective Evaluation Prompt from content pack
 */
export function getSubjectiveEvaluationPrompt(chapterKey: string = currentChapterKey): string {
  const raw = getRawContentPack(chapterKey);
  return raw.subjective_evaluation_prompt || 'Evaluate Class 6 student answers accurately according to CBSE guidelines.';
}

