-- ==============================================================================
-- SCIENCE BUDDY — SUPABASE SECURITY AUDIT & RLS HARDENING MIGRATION
-- Migration: 001_security_audit_rls_hardening.sql
-- Purpose: Enforce strict Row Level Security (RLS), isolate student data,
--          restrict curriculum edits to admin/service role, and optimize indexes.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Ensure RLS is Enabled on All 6 Core Tables
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_answers ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. Drop Legacy Insecure Permissive Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow student read write" ON public.students;
DROP POLICY IF EXISTS "Allow progress read write" ON public.student_progress;
DROP POLICY IF EXISTS "Allow quiz attempts read write" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Allow student answers read write" ON public.student_answers;
DROP POLICY IF EXISTS "Allow public write access to chapters" ON public.chapters;
DROP POLICY IF EXISTS "Allow public write access to topics" ON public.topics;
DROP POLICY IF EXISTS "Allow public read access to chapters" ON public.chapters;
DROP POLICY IF EXISTS "Allow public read access to topics" ON public.topics;

-- ------------------------------------------------------------------------------
-- 3. CHAPTERS & TOPICS (Curriculum Content — Public Read-Only, Admin Write)
-- ------------------------------------------------------------------------------

-- Public / Authenticated read access for chapters
CREATE POLICY "chapters_select_policy"
ON public.chapters
FOR SELECT
TO authenticated, anon
USING (true);

-- Restrict chapters write (INSERT, UPDATE, DELETE) to service_role / admins only
CREATE POLICY "chapters_insert_admin"
ON public.chapters
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "chapters_update_admin"
ON public.chapters
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "chapters_delete_admin"
ON public.chapters
FOR DELETE
TO service_role
USING (true);

-- Public / Authenticated read access for topics
CREATE POLICY "topics_select_policy"
ON public.topics
FOR SELECT
TO authenticated, anon
USING (true);

-- Restrict topics write (INSERT, UPDATE, DELETE) to service_role / admins only
CREATE POLICY "topics_insert_admin"
ON public.topics
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "topics_update_admin"
ON public.topics
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "topics_delete_admin"
ON public.topics
FOR DELETE
TO service_role
USING (true);

-- ------------------------------------------------------------------------------
-- 4. STUDENTS (Student Profile Isolation)
-- ------------------------------------------------------------------------------

-- Students can only select their own profile
CREATE POLICY "students_select_own"
ON public.students
FOR SELECT
TO authenticated
USING (auth.uid()::text = id);

-- Students can insert their own profile on registration
CREATE POLICY "students_insert_own"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id);

-- Students can update only their own profile
CREATE POLICY "students_update_own"
ON public.students
FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- Students can delete only their own profile
CREATE POLICY "students_delete_own"
ON public.students
FOR DELETE
TO authenticated
USING (auth.uid()::text = id);

-- ------------------------------------------------------------------------------
-- 5. STUDENT_PROGRESS (Progress Isolation)
-- ------------------------------------------------------------------------------

-- Students can view only their own topic progress
CREATE POLICY "student_progress_select_own"
ON public.student_progress
FOR SELECT
TO authenticated
USING (student_id = auth.uid()::text);

-- Students can insert only their own progress records
CREATE POLICY "student_progress_insert_own"
ON public.student_progress
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid()::text);

-- Students can update only their own progress records
CREATE POLICY "student_progress_update_own"
ON public.student_progress
FOR UPDATE
TO authenticated
USING (student_id = auth.uid()::text)
WITH CHECK (student_id = auth.uid()::text);

-- Students can delete only their own progress records
CREATE POLICY "student_progress_delete_own"
ON public.student_progress
FOR DELETE
TO authenticated
USING (student_id = auth.uid()::text);

-- ------------------------------------------------------------------------------
-- 6. QUIZ_ATTEMPTS (Test Results Isolation)
-- ------------------------------------------------------------------------------

-- Students can view only their own quiz attempts
CREATE POLICY "quiz_attempts_select_own"
ON public.quiz_attempts
FOR SELECT
TO authenticated
USING (student_id = auth.uid()::text);

-- Students can record new quiz attempts for themselves
CREATE POLICY "quiz_attempts_insert_own"
ON public.quiz_attempts
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid()::text);

-- Students can update only their own quiz attempts
CREATE POLICY "quiz_attempts_update_own"
ON public.quiz_attempts
FOR UPDATE
TO authenticated
USING (student_id = auth.uid()::text)
WITH CHECK (student_id = auth.uid()::text);

-- Students can delete only their own quiz attempts
CREATE POLICY "quiz_attempts_delete_own"
ON public.quiz_attempts
FOR DELETE
TO authenticated
USING (student_id = auth.uid()::text);

-- ------------------------------------------------------------------------------
-- 7. STUDENT_ANSWERS (Answer Isolation via Quiz Attempt Ownership)
-- ------------------------------------------------------------------------------

-- Students can view answers belonging only to their own quiz attempts
CREATE POLICY "student_answers_select_own"
ON public.student_answers
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quiz_attempts qa
        WHERE qa.id = student_answers.attempt_id
          AND qa.student_id = auth.uid()::text
    )
);

-- Students can insert answers for their own quiz attempts
CREATE POLICY "student_answers_insert_own"
ON public.student_answers
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.quiz_attempts qa
        WHERE qa.id = student_answers.attempt_id
          AND qa.student_id = auth.uid()::text
    )
);

-- Students can update only answers for their own quiz attempts
CREATE POLICY "student_answers_update_own"
ON public.student_answers
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quiz_attempts qa
        WHERE qa.id = student_answers.attempt_id
          AND qa.student_id = auth.uid()::text
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.quiz_attempts qa
        WHERE qa.id = student_answers.attempt_id
          AND qa.student_id = auth.uid()::text
    )
);

-- Students can delete only answers for their own quiz attempts
CREATE POLICY "student_answers_delete_own"
ON public.student_answers
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.quiz_attempts qa
        WHERE qa.id = student_answers.attempt_id
          AND qa.student_id = auth.uid()::text
    )
);

-- ------------------------------------------------------------------------------
-- 8. Performance Indexes & Foreign Key Verification (Non-Destructive)
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_topics_chapter 
    ON public.topics(chapter_id, sequence);

CREATE INDEX IF NOT EXISTS idx_progress_student 
    ON public.student_progress(student_id, chapter_id);

CREATE INDEX IF NOT EXISTS idx_progress_student_topic 
    ON public.student_progress(student_id, topic_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student 
    ON public.quiz_attempts(student_id, chapter_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_answers_attempt 
    ON public.student_answers(attempt_id);

CREATE INDEX IF NOT EXISTS idx_student_answers_question 
    ON public.student_answers(attempt_id, question_id);
