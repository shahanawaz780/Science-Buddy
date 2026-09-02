-- ==============================================================================
-- SCIENCE BUDDY DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- Class 6 CBSE Science • Chapter 1: The Wonderful World of Science
-- ==============================================================================

-- 1. Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    grade INTEGER DEFAULT 6,
    board TEXT DEFAULT 'CBSE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Chapters Table
CREATE TABLE IF NOT EXISTS public.chapters (
    id TEXT PRIMARY KEY,
    grade INTEGER DEFAULT 6,
    subject TEXT DEFAULT 'Science',
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Topics Table
CREATE TABLE IF NOT EXISTS public.topics (
    id TEXT PRIMARY KEY,
    chapter_id TEXT REFERENCES public.chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    learning_objective TEXT
);

-- 4. Student Progress Table
CREATE TABLE IF NOT EXISTS public.student_progress (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    chapter_id TEXT REFERENCES public.chapters(id) ON DELETE CASCADE,
    topic_id TEXT REFERENCES public.topics(id) ON DELETE CASCADE,
    completion_percent NUMERIC DEFAULT 0,
    accuracy NUMERIC DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_topic UNIQUE (student_id, chapter_id, topic_id)
);

-- 5. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    chapter_id TEXT REFERENCES public.chapters(id) ON DELETE CASCADE,
    quiz_type TEXT NOT NULL, -- 'practice' or 'chapter_test'
    total_marks NUMERIC NOT NULL,
    marks_obtained NUMERIC NOT NULL,
    percentage NUMERIC NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Student Answers Table
CREATE TABLE IF NOT EXISTS public.student_answers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    attempt_id TEXT REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    student_answer TEXT,
    score NUMERIC DEFAULT 0,
    ai_feedback JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_topics_chapter ON public.topics(chapter_id, sequence);
CREATE INDEX IF NOT EXISTS idx_progress_student ON public.student_progress(student_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON public.quiz_attempts(student_id, chapter_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_answers_attempt ON public.student_answers(attempt_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

-- 1. CHAPTERS & TOPICS (Curriculum Content — Public Read-Only, Admin/Service Write)
CREATE POLICY "chapters_select_policy" ON public.chapters FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "chapters_insert_admin" ON public.chapters FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "chapters_update_admin" ON public.chapters FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "chapters_delete_admin" ON public.chapters FOR DELETE TO service_role USING (true);

CREATE POLICY "topics_select_policy" ON public.topics FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "topics_insert_admin" ON public.topics FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "topics_update_admin" ON public.topics FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "topics_delete_admin" ON public.topics FOR DELETE TO service_role USING (true);

-- 2. STUDENTS (Student Profile Isolation — Own Record Only)
CREATE POLICY "students_select_own" ON public.students FOR SELECT TO authenticated USING (auth.uid()::text = id);
CREATE POLICY "students_insert_own" ON public.students FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = id);
CREATE POLICY "students_update_own" ON public.students FOR UPDATE TO authenticated USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id);
CREATE POLICY "students_delete_own" ON public.students FOR DELETE TO authenticated USING (auth.uid()::text = id);

-- 3. STUDENT_PROGRESS (Topic Progress Isolation — Own Records Only)
CREATE POLICY "student_progress_select_own" ON public.student_progress FOR SELECT TO authenticated USING (student_id = auth.uid()::text);
CREATE POLICY "student_progress_insert_own" ON public.student_progress FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid()::text);
CREATE POLICY "student_progress_update_own" ON public.student_progress FOR UPDATE TO authenticated USING (student_id = auth.uid()::text) WITH CHECK (student_id = auth.uid()::text);
CREATE POLICY "student_progress_delete_own" ON public.student_progress FOR DELETE TO authenticated USING (student_id = auth.uid()::text);

-- 4. QUIZ_ATTEMPTS (Quiz Results Isolation — Own Records Only)
CREATE POLICY "quiz_attempts_select_own" ON public.quiz_attempts FOR SELECT TO authenticated USING (student_id = auth.uid()::text);
CREATE POLICY "quiz_attempts_insert_own" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid()::text);
CREATE POLICY "quiz_attempts_update_own" ON public.quiz_attempts FOR UPDATE TO authenticated USING (student_id = auth.uid()::text) WITH CHECK (student_id = auth.uid()::text);
CREATE POLICY "quiz_attempts_delete_own" ON public.quiz_attempts FOR DELETE TO authenticated USING (student_id = auth.uid()::text);

-- 5. STUDENT_ANSWERS (Answer Isolation via Quiz Attempt Ownership)
CREATE POLICY "student_answers_select_own" ON public.student_answers FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = student_answers.attempt_id AND qa.student_id = auth.uid()::text)
);
CREATE POLICY "student_answers_insert_own" ON public.student_answers FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = student_answers.attempt_id AND qa.student_id = auth.uid()::text)
);
CREATE POLICY "student_answers_update_own" ON public.student_answers FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = student_answers.attempt_id AND qa.student_id = auth.uid()::text)
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = student_answers.attempt_id AND qa.student_id = auth.uid()::text)
);
CREATE POLICY "student_answers_delete_own" ON public.student_answers FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = student_answers.attempt_id AND qa.student_id = auth.uid()::text)
);
