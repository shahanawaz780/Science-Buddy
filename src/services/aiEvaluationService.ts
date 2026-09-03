import { SubjectiveEvaluationResult, ContentPackSubjectiveRubricItem } from '../types';

export interface EvaluateSubjectiveParams {
  question: string;
  student_answer: string;
  expected_answer?: string;
  expected_key_points?: string[];
  marking_criteria?: ContentPackSubjectiveRubricItem | any;
  marks: number;
  chapter_id?: string;
  chapter_number?: number;
}

export interface EvaluationResponse {
  success: boolean;
  evaluation?: SubjectiveEvaluationResult;
  error?: string;
  isFallback?: boolean;
}

/**
 * Calls server-side Gemini subjective answer evaluation endpoint.
 * Validates that 0 <= score <= max_score.
 * Preserves the student answer and returns a friendly error on failure.
 */
export async function evaluateSubjectiveAnswer(params: EvaluateSubjectiveParams): Promise<EvaluationResponse> {
  const maxScore = Number(params.marks) || 2;
  
  try {
    const res = await fetch('/api/gemini/evaluate-subjective', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: params.question,
        student_answer: params.student_answer,
        expected_answer: params.expected_answer || '',
        expected_key_points: params.expected_key_points || [],
        marking_criteria: params.marking_criteria || null,
        marks: maxScore,
        chapter_id: params.chapter_id,
        chapter_number: params.chapter_number
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errJson.error || 'Evaluation service temporarily unavailable. You can retry anytime.'
      };
    }

    const data = await res.json();

    // Validate score strictly: 0 <= score <= maxScore
    let score = typeof data.score === 'number' ? data.score : 0;
    if (isNaN(score)) score = 0;
    score = Math.min(maxScore, Math.max(0, score));

    const evaluation: SubjectiveEvaluationResult = {
      score,
      max_score: maxScore,
      strengths: Array.isArray(data.strengths) && data.strengths.length > 0
        ? data.strengths
        : ['Attempted question with scientific terminology.'],
      missing_points: Array.isArray(data.missing_points)
        ? data.missing_points
        : [],
      misconceptions: Array.isArray(data.misconceptions)
        ? data.misconceptions
        : [],
      improvement_tip: data.improvement_tip || 'Include step-by-step reasoning from Chapter 1 to achieve full marks.',
      suggested_answer: data.suggested_answer || params.expected_answer || 'Refer to NCERT Chapter 1 concepts.'
    };

    return {
      success: true,
      evaluation,
      isFallback: !!data.is_fallback
    };
  } catch (err: any) {
    console.error('Failed to call /api/gemini/evaluate-subjective:', err);
    return {
      success: false,
      error: 'Network or evaluation issue. Click "Retry Evaluation" to re-evaluate without losing your answer.'
    };
  }
}

/**
 * Batch evaluates multiple subjective/short-answer questions.
 */
export async function evaluateBatchSubjectiveAnswers(
  items: Array<{
    id: string;
    question: string;
    student_answer: string;
    expected_answer?: string;
    expected_key_points?: string[];
    marking_criteria?: any;
    marks: number;
    chapter_id?: string;
  }>,
  chapterId?: string
): Promise<Record<string, SubjectiveEvaluationResult>> {
  if (!items || items.length === 0) return {};

  try {
    const res = await fetch('/api/gemini/evaluate-batch-subjective', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chapter_id: chapterId,
        items: items.map(item => ({
          id: item.id,
          question: item.question,
          student_answer: item.student_answer,
          expected_answer: item.expected_answer,
          expected_key_points: item.expected_key_points,
          marking_criteria: item.marking_criteria,
          marks: item.marks,
          chapter_id: item.chapter_id || chapterId
        }))
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const map: Record<string, SubjectiveEvaluationResult> = {};
      if (Array.isArray(data.evaluations)) {
        data.evaluations.forEach((ev: any) => {
          const maxMarks = Number(ev.max_score) || 2;
          const score = Math.min(maxMarks, Math.max(0, typeof ev.score === 'number' ? ev.score : 0));
          map[ev.question_id] = {
            score,
            max_score: maxMarks,
            strengths: Array.isArray(ev.strengths) ? ev.strengths : ['Answer attempted.'],
            missing_points: Array.isArray(ev.missing_points) ? ev.missing_points : [],
            misconceptions: Array.isArray(ev.misconceptions) ? ev.misconceptions : [],
            improvement_tip: ev.improvement_tip || 'Review Chapter 1 key points.',
            suggested_answer: ev.suggested_answer || 'Refer to NCERT Curiosity Chapter 1.'
          };
        });
        return map;
      }
    }
  } catch (err) {
    console.warn('Batch evaluation error, falling back to individual calls:', err);
  }

  // Fallback sequential
  const map: Record<string, SubjectiveEvaluationResult> = {};
  for (const item of items) {
    const res = await evaluateSubjectiveAnswer({
      question: item.question,
      student_answer: item.student_answer,
      expected_answer: item.expected_answer,
      expected_key_points: item.expected_key_points,
      marking_criteria: item.marking_criteria,
      marks: item.marks
    });
    if (res.success && res.evaluation) {
      map[item.id] = res.evaluation;
    }
  }
  return map;
}
