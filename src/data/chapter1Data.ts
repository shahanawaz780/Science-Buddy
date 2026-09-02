import curiosityCh1 from './chapters/chapter_1_curiosity.json';
import { 
  getChapter, 
  getQuestionsForChapter, 
  getExamBlueprints,
  getTopicById,
  getQuestionsForTopic,
  getExamQuestions,
  evaluateAnswer,
  getSubjectiveRubricForQuestion
} from '../services/curriculumService';
import { Chapter, QuizConfig, QuizQuestion } from '../types';

// Reusable Chapter 1 Data derived dynamically from the Content Pack JSON
export const CHAPTER_1_DATA: Chapter = getChapter('ch1');

// Quiz Configs mapped directly from Content Pack JSON exam_blueprints
export const QUIZ_CONFIGS: QuizConfig[] = getExamBlueprints('ch1');

// Full Question Bank (all 30 questions Q01-Q30) mapped directly from Content Pack JSON
export const QUESTION_BANK: QuizQuestion[] = getQuestionsForChapter('ch1');

// Quick facts relevant to the chapter
export const SCIENCE_FACTS = [
  {
    fact: "Science is like an infinite jigsaw puzzle of the universe—every single observation or discovery adds a new piece, opening up even more questions!",
    topic: "The Wonderful World of Science"
  },
  {
    fact: "The five steps of the Scientific Method are: Observation ➔ Questioning ➔ Hypothesizing ➔ Testing & Experimentation ➔ Analysis & Conclusion.",
    topic: "The Scientific Method"
  },
  {
    fact: "Scientific thinking happens every day: immersing a punctured bicycle tube in water to find escaping air bubbles is a classic physics test!",
    topic: "Everyday Scientific Thinking"
  },
  {
    fact: "Phototropism is when potted plants naturally turn their stems and leaves towards window sunlight.",
    topic: "Living World & Nature"
  }
];

// Helper accessors
export { 
  getChapter,
  getQuestionsForChapter,
  getTopicById, 
  getQuestionsForTopic, 
  getExamQuestions, 
  evaluateAnswer, 
  getSubjectiveRubricForQuestion 
};
export default curiosityCh1;
