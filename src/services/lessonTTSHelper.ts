import { Topic } from '../types';
import { LessonSectionItem } from './ttsService';

/**
 * Extracts structured readable sections from approved Topic / Lesson data.
 * Does NOT modify any lesson content.
 */
export function getLessonSectionsForTTS(topic: Topic): LessonSectionItem[] {
  const sections: LessonSectionItem[] = [];
  const lesson = topic.lesson;

  // 1. Topic Title & Learning Objective (Overview)
  sections.push({
    id: 'overview',
    title: 'Topic Overview & Objective',
    text: `Topic ${topic.order}: ${topic.title}. Learning objective: ${topic.learningObjective}`
  });

  // 2. In Simple Words (Quick Summary)
  if (lesson.simple_explanation) {
    sections.push({
      id: 'simple_explanation',
      title: 'In Simple Words',
      text: `In simple words: ${lesson.simple_explanation}`
    });
  }

  // 3. Concept Explanation
  if (lesson.concept_explanation) {
    sections.push({
      id: 'concept_explanation',
      title: 'Concept Explanation',
      text: `Concept explanation: ${lesson.concept_explanation}`
    });
  }

  // 4. Interactive Steps (Scientific Method 5 steps)
  if (lesson.steps && lesson.steps.length > 0) {
    const stepsText = lesson.steps
      .map(s => `Step ${s.step}: ${s.name}. ${s.explanation}`)
      .join(' ');
    sections.push({
      id: 'steps',
      title: '5 Steps of the Scientific Method',
      text: `The five steps of the scientific method: ${stepsText}`
    });
  }

  // 5. Key Points (NCERT Summary)
  if (lesson.key_points && lesson.key_points.length > 0) {
    const keyPointsText = lesson.key_points
      .map((p, idx) => `Point ${idx + 1}: ${p}`)
      .join('. ');
    sections.push({
      id: 'key_points',
      title: 'Key Points',
      text: `Key points from NCERT summary: ${keyPointsText}`
    });
  }

  // 6. Important Terms
  if (lesson.important_terms && lesson.important_terms.length > 0) {
    const termsText = lesson.important_terms
      .map(t => `${t.term}: ${t.meaning}`)
      .join('. ');
    sections.push({
      id: 'important_terms',
      title: 'Important Terms',
      text: `Important terms to remember: ${termsText}`
    });
  }

  // 7. Real-Life Examples
  const realLifeList = lesson.real_life_examples || [];
  const contextList = lesson.examples || [];
  if (realLifeList.length > 0 || contextList.length > 0) {
    let examplesText = 'Real-life examples: ';
    if (realLifeList.length > 0) {
      examplesText += realLifeList.join('. ') + '. ';
    }
    if (contextList.length > 0) {
      examplesText += contextList.map(e => `In the context of ${e.context}: ${e.example}`).join('. ');
    }
    sections.push({
      id: 'real_life_examples',
      title: 'Real-Life Examples',
      text: examplesText
    });
  }

  // 8. Curriculum Themes (if present, e.g. Topic 5)
  if (lesson.themes && lesson.themes.length > 0) {
    const themesText = lesson.themes
      .map(th => `Theme ${th.theme}: Concepts include ${th.concepts}`)
      .join('. ');
    sections.push({
      id: 'themes',
      title: 'Grade 6 Science Themes',
      text: `Themes explored in Grade 6 science: ${themesText}`
    });
  }

  // 9. Visual Diagrams (Alt text & Captions)
  if (lesson.diagrams && lesson.diagrams.length > 0) {
    lesson.diagrams.forEach((diag, dIdx) => {
      sections.push({
        id: `diagram-${diag.id || dIdx}`,
        title: `Diagram: ${diag.title}`,
        text: `Scientific diagram: ${diag.title}. Caption: ${diag.caption}. Visual description: ${diag.alt}`
      });
    });
  } else if (lesson.diagram) {
    sections.push({
      id: `diagram-${lesson.diagram.id || 0}`,
      title: `Diagram: ${lesson.diagram.title}`,
      text: `Scientific diagram: ${lesson.diagram.title}. Caption: ${lesson.diagram.caption}. Visual description: ${lesson.diagram.alt}`
    });
  }

  return sections;
}
