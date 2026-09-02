# Science Buddy — NCERT Class 6 Science Learning Platform

Science Buddy is an interactive, full-stack science learning companion built for NCERT Class 6 (*Curiosity: The Wonderful World of Science*). It combines structured curriculum content, step-by-step scientific method walkthroughs, interactive knowledge checks, real-time Text-to-Speech (TTS), Google Gemini AI tutoring and evaluation, and Supabase cloud synchronization.

---

## 🌟 Key Features

- **Structured Curriculum & Lessons**: Complete Chapter 1 syllabus (*The Wonderful World of Science*) with concept breakdowns, vocabulary definitions, step-by-step scientific method diagrams, and real-world science examples.
- **Audio Read Aloud (TTS)**: Built-in Web Speech API engine with customizable voice, playback rate, pitch controls, and section-by-section listening.
- **AI Science Tutor**: Context-aware Socratic conversational partner powered by Google Gemini (with resilient offline rule-based fallbacks).
- **Interactive Practice & Quizzes**: Instant-feedback practice checks with streaks, hints, and explanations.
- **Timed Comprehensive Chapter Tests**: Multi-format evaluations (MCQs, True/False, Fill-in-the-Blanks, and Short Answers).
- **AI-Assisted Subjective Evaluation**: Evaluates open-ended student answers with rubrics, key points analysis, and constructive feedback.
- **Progress Tracking & Analytics**: Mastery indicators, accuracy analytics, strengths & focus areas, and printable completion certificates.
- **Dual Storage Architecture**: Automatic offline `localStorage` fallback with seamless Supabase PostgreSQL cloud sync when configured.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React Icons
- **Backend Server**: Express.js (Node.js runtime) with Vite middleware
- **AI Engine**: Google Gemini API (`@google/genai`)
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Audio Synthesis**: Web Speech API (`SpeechSynthesis`)
- **Build Tools**: Vite 6, esbuild, TypeScript compiler (`tsc`)

---

## 📋 Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- *(Optional)* **Google Gemini API Key**: For AI Tutor and subjective grading
- *(Optional)* **Supabase Project**: For persistent cloud progress storage

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` or `.env.local` to configure environment secrets:

```bash
cp .env.example .env
```

### Variable Classification

| Variable | Scope | Classification | Description |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server | **SERVER-ONLY** | Authenticates server API requests to Google Gemini for AI tutoring and test evaluations. Never exposed to the browser. |
| `APP_URL` | Server | **SERVER-ONLY** | Base URL for the hosting container or local development instance (e.g. `http://localhost:3000`). |
| `SUPABASE_URL` | Server | **SERVER-ONLY** | Supabase Project URL for backend proxy queries. |
| `SUPABASE_ANON_KEY` | Server | **SERVER-ONLY** | Supabase Anonymous public API key for server proxy. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | **SERVER-ONLY** | Supabase admin secret key with superuser privileges (used strictly in backend services). |
| `VITE_SUPABASE_URL` | Client | **CLIENT-SAFE** | Public Supabase project URL for direct client queries with Row Level Security. |
| `VITE_SUPABASE_ANON_KEY` | Client | **CLIENT-SAFE** | Public anonymous API key scoped by Row Level Security policies. |

> **Security Note**: Server-only secrets are never imported or referenced in client-side React components, HTML templates, or public bundles.

---

## 🚀 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The application dev server will bind to `http://localhost:3000` with hot server reloading and Vite SPA middleware.

3. **Code Quality & Type Checking**:
   ```bash
   npm run lint
   ```

---

## 🗄️ Supabase Database & Security

### 1. Database Schema
Science Buddy uses 6 core relational tables:
1. `students` — Student profiles and metadata
2. `chapters` — NCERT curriculum chapters
3. `topics` — Chapter topic outlines and sequences
4. `student_progress` — Per-topic student progress and accuracy records
5. `quiz_attempts` — Chapter test scorecards and timestamps
6. `student_answers` — Question-level responses and rubric scores

### 2. Initial Setup & Migrations
To set up the database in your Supabase SQL Editor:
1. Run the base schema from `src/data/supabaseSchema.sql`.
2. Apply the RLS security migration from `src/data/migrations/001_security_audit_rls_hardening.sql`.

### 3. Row Level Security (RLS) Policy
- **Student Privacy**: Students can access, query, and modify **only their own** progress and test results (`auth.uid()::text = student_id`).
- **Curriculum Protection**: `chapters` and `topics` are read-only for students/anonymous users. Write actions are restricted strictly to `service_role` (admin context).

---

## 🤖 Google Gemini AI Configuration

The backend Express proxy interacts with Google Gemini using `@google/genai`:
- **AI Tutor Chat (`/api/gemini/tutor`)**: Provides age-appropriate, encouraging scientific explanations for 6th graders.
- **Subjective Answer Evaluation (`/api/gemini/evaluate-answer`)**: Scores short answers using structured rubrics and generates constructive feedback.
- **Smart Recommendations (`/api/gemini/recommendations`)**: Analyzes weak concepts and suggests targeted revision topics.
- **Resilient Fallback**: If the API key is absent or a rate limit occurs, built-in deterministic heuristic engines automatically take over without disrupting the student's study session.

---

## 🔊 Text-to-Speech (TTS) System

- Implemented in `src/services/ttsService.ts` and `src/hooks/useLessonTTS.ts`.
- Uses native browser `window.speechSynthesis`.
- Features sentence-boundary chunking to prevent browser speech buffer cut-offs on long paragraphs.
- Includes auto-cleanup on component unmount to prevent audio overlap.

---

## 🏗️ Production Build & Deployment

1. **Compile Production Bundle**:
   ```bash
   npm run build
   ```
   This command:
   - Builds optimized static client assets with Vite into `dist/`.
   - Bundles the backend Express server into a standalone CommonJS file `dist/server.cjs` via `esbuild`.

2. **Start Production Server**:
   ```bash
   npm run start
   ```
   Runs the compiled server at `node dist/server.cjs` on port 3000.

3. **Container / Cloud Deployment**:
   - In Cloud Run or Docker, ensure `NODE_ENV=production` and `PORT=3000` are configured.
   - Inject `GEMINI_API_KEY` through container environment secrets.

---

## 📄 License

MIT License — free for educational and personal use.
