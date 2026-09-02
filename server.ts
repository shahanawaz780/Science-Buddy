import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// -------------------------------------------------------------
// Supabase Client Initialization (Lazy & Safe)
// -------------------------------------------------------------
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseUrl = rawUrl ? rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "") : "";
  const supabaseKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      });
    } catch (err) {
      console.warn("Failed to initialize Supabase client:", err);
      supabaseClient = null;
    }
  }

  return supabaseClient;
}

// Helper to load Chapter 1 Content Pack JSON safely
function getChapter1Json() {
  try {
    const jsonPath = path.join(process.cwd(), "src", "data", "chapters", "chapter_1_curiosity.json");
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Could not read chapter_1_curiosity.json from disk:", e);
  }
  return null;
}

// Initialize Google GenAI client lazily if key exists
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Helper to delay for retrying transient 503 / 429 errors
const waitMs = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to generate content with fallback models and retry on 503/429
async function generateTutorResponse(
  ai: any,
  prompt: string,
  systemInstruction: string
): Promise<string> {
  const candidateModels = [
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errCode = err?.status || err?.code || err?.statusCode || (err?.error && err.error.code);
        const errMsg = err?.message || JSON.stringify(err);
        console.warn(`Model ${model} attempt ${attempt + 1} failed with error (${errCode}): ${errMsg}.`);

        // If it's a 503 or 429, wait a bit before retrying
        if (errCode === 503 || errCode === 429 || errMsg.includes('503') || errMsg.includes('429')) {
          await waitMs(600 * (attempt + 1));
          continue;
        } else {
          // If model is 404/not available, break to next candidate model immediately
          break;
        }
      }
    }
  }

  throw lastError || new Error("All candidate models failed to respond");
}

// System instruction and approved knowledge base for Class 6 CBSE Science Chapter 1 AI Tutor
const CHAPTER_1_CURRICULUM = `
APPROVED KNOWLEDGE BASE - CBSE CLASS 6 SCIENCE • CHAPTER 1: "THE WONDERFUL WORLD OF SCIENCE"
Textbook: Curiosity (NCERT Grade 6)

1. WELCOME TO THE WORLD OF SCIENCE:
- Science is not merely a collection of facts to memorize. It is a systematic way of thinking, observing, experimenting and understanding the physical and natural world around us.
- Science starts when we notice something, become curious about it, ask questions and try to understand what is happening.
- Curiosity: The desire to ask questions and explore, specifically asking Why?, How? and What if?
- Human beings are naturally curious about their surroundings. Science can be found in everyday surroundings and in the natural world.

2. SCIENCE AS AN UNENDING JIGSAW PUZZLE:
- Science can be imagined as a giant, infinite jigsaw puzzle of the universe.
- Every scientific inquiry or discovery adds another piece to our understanding.
- Each new piece of knowledge can unlock further questions and new areas of study. There is no final limit to what can be discovered.
- Simple everyday observations can lead to important scientific breakthroughs.

3. HOW DO SCIENTISTS WORK? (THE SCIENTIFIC METHOD):
- Scientists do not rely on guesswork alone. They use a structured five-step approach:
  Step 1. Observation: Notice something interesting, unusual or puzzling in the environment.
  Step 2. Questioning: Formulate a clear question about why or how something is happening.
  Step 3. Hypothesizing: Propose a logical, educated guess or testable explanation for the observed phenomenon (Hypothesis).
  Step 4. Testing & Experimentation: Conduct experiments, tests or systematically gather evidence to test the hypothesis.
  Step 5. Analysis & Conclusion: Evaluate the results and decide whether the evidence supports the hypothesis or whether the guess needs modification.

4. EVERYDAY EXAMPLES OF SCIENTIFIC THINKING:
- Scientific thinking is not limited to laboratories.
- Kitchen: Investigating why milk boils over or why pressure cooker valves release steam at specific intervals.
- Bicycle Troubleshooting: Finding why a tire is losing air pressure by immersing the tube in water and locating escaping bubbles.
- Plant Growth: Observing why potted plants turn towards window sunlight (Phototropism).

5. OVERVIEW OF THEMES IN GRADE 6 SCIENCE:
- Living World & Nature: Seed germination, plant and animal diversity, adaptations, and transformation cycles such as caterpillars to butterflies.
- Food & Nutrition: Mindful eating, essential nutrients, components of a balanced diet, and maintaining bodily health.
- Materials & States: Classification of daily materials, separation of mixtures, and physical properties such as thermal measurement and solubility.
- Physical World: Properties of magnets, measurement of length and physical distances, types of motion, and physical phenomena.
- Beyond Earth: Astronomy fundamentals, the solar system, celestial bodies, and Earth's place in the cosmos.

6. COLLABORATION IN SCIENCE:
- Science is rarely done in isolation. It is a shared human effort.
- When you cannot solve a scientific puzzle alone, you can discuss your observations with classmates, teachers and family members and listen to different ideas.
- Alternative hypotheses provide different ways of thinking and make learning science engaging, thorough and enjoyable.
`;

const SYSTEM_INSTRUCTION = `You are "Science Buddy", an AI Science Tutor for Class 6 CBSE students.

STUDENT PROFILE:
Age: approximately 11–12
Grade: 6
Board: CBSE
Subject: Science
Current chapter: The Wonderful World of Science (Textbook: Curiosity)

APPROVED CHAPTER 1 KNOWLEDGE BASE:
${CHAPTER_1_CURRICULUM}

KNOWLEDGE RULE:
- Use the approved Chapter 1 content supplied above as the primary knowledge source.
- Do not invent textbook content.
- Do not introduce unrelated concepts.
- If the answer cannot be confidently supported by the supplied Chapter 1 content, tell the student that the information is not available in this chapter.

TEACHING STYLE:
- Use simple language.
- Explain difficult concepts step by step.
- Use everyday examples where appropriate.
- Encourage curiosity.
- Ask short follow-up questions.
- When a student is solving a question, give a hint before directly giving the answer.
- When the student makes a mistake:
  1. Explain what is incorrect.
  2. Explain the correct idea.
  3. Give a simple example.
  4. Ask a quick check question.

SUPPORTED MODES:
- EXPLAIN: Explain the concept simply.
- EXAMPLE: Give a simple real-life example.
- HINT: Give a clue without revealing the complete answer.
- QUIZ: Ask one question at a time.
- CHECK ANSWER: Evaluate the student's response against the approved content.
- RETEACH: Explain the concept using a different and simpler approach.

RESPONSE FORMAT:
Whenever explaining or teaching, format your response clearly using these sections:

💡 Simple explanation
[Clear, step-by-step simple explanation for 11–12 year old]

🔍 Example
[Everyday relatable real-life example from kitchen, home, bicycle, plants, or nature]

⭐ Remember
[Core takeaway or key concept to keep in mind]

🎯 Quick check
[One short, engaging check question to test understanding]

Keep responses concise and age appropriate.
Never encourage cheating in an examination.`;

// Fallback smart responses tailored strictly for Class 6 CBSE Curiosity Chapter 1
function generateRuleBasedReply(lastMessage: string, promptType?: string, studentContext?: any): string {
  const lastMsg = (lastMessage || "").toLowerCase().trim();

  // Check if related to Chapter 1
  const isChapter1Related = /science|curious|curiosity|jigsaw|puzzle|method|observation|observe|question|hypothesis|hypothesiz|experiment|test|analys|conclus|bicycle|tube|bubble|leak|milk|cooker|pressure|steam|phototropism|plant|sunlight|theme|living world|seed|germination|food|nutrition|material|state|mixture|physical world|magnet|motion|beyond earth|solar system|astronomy|collaborat|classmate|teacher|family|why|how|what|practice|hint|quiz|reteach|explain/i.test(lastMsg);
  const isGeneralGreeting = /^(hi|hello|hey|namaste|good morning|good afternoon|start|help)/i.test(lastMsg);

  if (!isChapter1Related && !isGeneralGreeting && !promptType) {
    return `This information is not available in this chapter.\n\nIn **Chapter 1: The Wonderful World of Science**, we focus on:\n* 💡 What is Science & Curiosity (Asking Why?, How?, What if?)\n* 🧩 Science as an Unending Jigsaw Puzzle\n* 🔬 The 5-Step Scientific Method\n* 🚲 Everyday Examples of Scientific Thinking\n* 🌌 Overview of Grade 6 Science Themes\n* 🤝 Collaboration in Science\n\nWhat would you like to explore from Chapter 1?`;
  }

  // PRACTICE MODE (Practice activity on Scientific Method / Chapter 1)
  if (promptType === "PRACTICE" || lastMsg.includes("practice")) {
    return `💡 **Simple explanation**
Let's practice applying the 5 steps of the Scientific Method to a fun everyday scenario!

🔍 **Example Practice Challenge: The Whistling Pressure Cooker**
Imagine you notice the pressure cooker whistles after 5 minutes on a high flame, but takes 10 minutes on a low flame.
* **Step 1 (Observation):** Cooker whistles faster on high heat.
* **Step 2 (Question):** Does higher heat create steam pressure faster?
* **Step 3 (Hypothesis):** Yes, because higher heat boils water into steam more rapidly.
* **Step 4 (Testing):** Time the whistle with different flame settings and measure steam output.
* **Step 5 (Conclusion):** Higher thermal energy speeds up phase change and builds pressure faster.

⭐ **Remember**
Making a guess is **Hypothesizing** (Step 3). Doing the timed trial to see if your guess is correct is **Testing / Experimenting** (Step 4)!

🎯 **Quick check**
If you suspect your bicycle tube is leaking air from the valve, is checking it with soapy water called a **Hypothesis** or a **Test**?`;
  }

  // EXPLAIN / Default explanation
  if (promptType === "EXPLAIN" || lastMsg.includes("explain")) {
    if (lastMsg.includes("method") || lastMsg.includes("step") || lastMsg.includes("scientist") || lastMsg.includes("hypothesis") || lastMsg.includes("test")) {
      return `💡 **Simple explanation**
Scientists use a structured 5-step method to solve puzzles instead of guessing blindly:
1. **Observation:** Noticing something interesting (e.g. your bicycle tire is flat).
2. **Questioning:** Asking *Why?* or *How?* (e.g. Why did it lose air pressure?).
3. **Hypothesizing:** Making an educated, testable guess (e.g. "Maybe a thorn punctured the tube").
4. **Testing & Experimenting:** Conducting a test to check your guess (e.g. immersing the tube in a bucket of water to watch for bubbles).
5. **Analysis & Conclusion:** Looking at the bubbles (evidence) and deciding if your guess was right.

🔍 **Example**
Notice the clear difference between **Hypothesizing** and **Testing**:
* *Hypothesizing:* Thinking "I guess bubbles will rise from the valve." (Your testable idea)
* *Testing:* Actually putting the tube underwater to look for bubbles! (Your action/experiment)

⭐ **Remember**
A hypothesis is an educated guess you *can test*. Testing is the actual experiment you do to gather evidence!

🎯 **Quick check**
Which step comes first: making a testable guess (Hypothesis) or conducting the experiment (Testing)?`;
    }
    if (lastMsg.includes("puzzle") || lastMsg.includes("jigsaw")) {
      return `💡 **Simple explanation**
Science is like a giant, unending jigsaw puzzle. Every time we discover how or why something happens, we snap a new piece in place, and that piece connects to even more exciting questions!

🔍 **Example**
Finding out why milk boils over leads to questions about heat, steam bubbles, and how pressure cookers work.

⭐ **Remember**
There is no final limit to what can be discovered. Simple daily observations can lead to great scientific breakthroughs.

🎯 **Quick check**
Does discovering a new science fact end inquiry or lead to more questions?`;
    }
    return `💡 **Simple explanation**
Science is not just memorizing facts from a book! It is a systematic way of thinking, observing, experimenting, and understanding the world around us.

🔍 **Example**
Wondering why a bicycle tyre loses air, or why leaves turn green in the sun, is where science begins.

⭐ **Remember**
Curiosity—asking *Why?*, *How?*, and *What if?*—is the first requirement for learning science.

🎯 **Quick check**
What are the three magic questions curious scientists always ask?`;
  }

  // EXAMPLE MODE
  if (promptType === "EXAMPLE" || lastMsg.includes("example") || promptType === "Give example") {
    return `💡 **Simple explanation**
Scientific thinking happens everywhere in our daily life, not just in big laboratories!

🔍 **Example**
When your bicycle tire goes flat, a mechanic immerses the rubber tube in a bucket of water. Watching where tiny air bubbles rise tells you the exact spot of the puncture!

⭐ **Remember**
Observing bubbles and deducing where air escapes is using evidence to test an idea.

🎯 **Quick check**
Can you think of another everyday observation at home where you noticed science in action?`;
  }

  // HINT MODE
  if (promptType === "HINT" || lastMsg.includes("hint") || promptType === "Give hint") {
    return `💡 **Hint for you:**

Think about what a detective or scientist does when investigating:
1. First, you notice something (Observation).
2. Next, you form a question.
3. Then, you make a testable guess (Hypothesis).
4. Afterwards, you carry out an activity or experiment to verify (Testing).
5. Finally, you draw your conclusion!

⭐ **Remember**
If you are wondering whether an action is a *Hypothesis* or a *Test*: asking "Is this an idea in my mind to check?" = Hypothesis; "Is this an experiment I am actively performing?" = Test!

🎯 **Quick check**
What word means "an educated, testable guess in science"?`;
  }

  // QUIZ MODE
  if (promptType === "QUIZ" || lastMsg.includes("quiz") || promptType === "Quiz") {
    return `🎯 **Quick Science Quiz!**

**Question:** Ankit notices that his bicycle tire is completely flat. He thinks to himself, *"A sharp thorn on the road might have pierced the tube."* Which step of the Scientific Method is this thought?

A) Observation
B) Questioning
C) Hypothesizing
D) Testing & Experimenting

Reply with your option letter! 🔬`;
  }

  // CHECK ANSWER MODE
  if (promptType === "CHECK ANSWER" || lastMsg.includes("check my answer") || promptType === "Check answer") {
    return `💡 **Checking your answer against Chapter 1:**

If you answered **C) Hypothesizing**, excellent! Thinking of a possible, testable explanation (*"A thorn pierced the tube"*) is formulating a **Hypothesis**. If Ankit actually dips the tube in water to check for bubbles, that would be **Testing & Experimenting**!

🔍 **Example**
* Observation: The tire is flat.
* Hypothesis: A thorn punctured it.
* Test: Dunking in water bucket to find escaping air bubbles.

⭐ **Remember**
A hypothesis is a logical guess before doing the experiment!

🎯 **Quick check**
What is the final step where you look at your test results and make a decision?`;
  }

  // RETEACH MODE / TEACH ME AGAIN
  if (promptType === "RETEACH" || lastMsg.includes("reteach") || lastMsg.includes("teach me again") || promptType === "Re-teach" || promptType === "Teach Me Again") {
    return `💡 **Simple explanation (Let's teach this with a fresh kitchen story!)**
Imagine you are making tea with your grandmother. You notice the milk starts rising up in the pot when heated (Observation). You wonder, *"Why doesn't water rise as fast as milk?"* (Question). You guess that the creamy layer on top traps steam bubbles inside (Hypothesis). You test this by stirring the top layer to see if steam escapes gently (Testing).

🔍 **Example**
* Notice ➔ Ask ➔ Guess (Hypothesis) ➔ Test (Experiment) ➔ Conclude.
* Notice how guessing and testing work as a team: You cannot test without a guess, and a guess is just an idea until you test it!

⭐ **Remember**
Science is all about exploring curiosity through evidence. Every question helps us understand our wonderful world!

🎯 **Quick check**
Why do scientists repeat experiments or discuss them with friends and teachers?`;
  }

  // Default response with required structure
  return `💡 **Simple explanation**
Science is an ongoing adventure of observing, questioning, and understanding everything around us.

🔍 **Example**
Observing plant shoots growing towards the window sunlight (phototropism) is a real-life demonstration of living organisms responding to their environment.

⭐ **Remember**
Curiosity and collaboration with friends and teachers make scientific discovery enjoyable and thorough.

🎯 **Quick check**
Which of the 5 steps in the Scientific Method involves gathering evidence through experiments?`;
}

// API endpoint for AI Tutor Chat
app.post("/api/gemini/tutor", async (req, res) => {
  try {
    const { messages, topicContext, promptType, studentContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const lastUserMessage = messages[messages.length - 1].content || "";

    const ai = getAIClient();

    // Contextual prefix if topic is selected
    let contextualSystem = SYSTEM_INSTRUCTION;
    if (topicContext) {
      contextualSystem += `\n\nActive Chapter 1 Topic Context: ${topicContext}`;
    }
    if (promptType) {
      contextualSystem += `\nThe student clicked the quick prompt action: "${promptType}". Tailor your response strictly to this request style (EXPLAIN, PRACTICE, QUIZ, HINT, RETEACH, CHECK ANSWER).`;
    }

    // Add student personalized context if available
    if (studentContext) {
      let studentContextText = `\n\n--- STUDENT LEARNING CONTEXT (STRICTLY CONFIDENTIAL FOR ADAPTIVE TEACHING) ---`;
      if (studentContext.primaryWeakSkill || studentContext.primaryWeakTopicTitle) {
        studentContextText += `\nTarget Focus Skill: ${studentContext.primaryWeakSkill || 'Scientific Method'} (Topic: ${studentContext.primaryWeakTopicTitle || 'How Do Scientists Work?'})`;
      }
      if (studentContext.recentIncorrectAnswers && studentContext.recentIncorrectAnswers.length > 0) {
        studentContextText += `\nRecent Question Misconceptions:`;
        studentContext.recentIncorrectAnswers.forEach((q: any, i: number) => {
          studentContextText += `\n  ${i + 1}. Question: "${q.question}" | Student wrote: "${q.studentAnswer || '(unanswered)'}" | Correct concept: "${q.correctAnswer}"`;
        });
      }
      if (studentContext.completedLessons && studentContext.completedLessons.length > 0) {
        studentContextText += `\nCompleted Lessons: ${studentContext.completedLessons.join(', ')}`;
      }

      studentContextText += `\n\nADAPTATION INSTRUCTIONS:
1. Adapt your explanation to directly resolve any confusion or misconception indicated above.
2. If the student has had confusion between Hypothesizing (making an educated testable guess) and Testing/Experimentation (conducting the experiment to gather evidence), clearly emphasize and contrast their difference using a simple everyday example (e.g. noticing bicycle tube puncture or kitchen boiling).
3. PRIVACY & SAFETY GUARDRAILS:
   - NEVER reveal internal analytics, database IDs, accuracy percentages, or raw test scores to the child.
   - NEVER mention hidden scoring logic, algorithms, or grading formulas.
   - Maintain a cheerful, encouraging, Class 6 age-appropriate tone.
   - Strictly stay bounded by NCERT Chapter 1 "The Wonderful World of Science".`;

      contextualSystem += studentContextText;
    }

    if (ai) {
      try {
        // Build conversation contents
        const historyContext = messages
          .slice(0, -1)
          .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
          .join("\n");

        const fullPrompt = historyContext
          ? `${historyContext}\nStudent: ${lastUserMessage}\nTutor:`
          : lastUserMessage;

        const replyText = await generateTutorResponse(
          ai,
          fullPrompt,
          contextualSystem
        );

        return res.json({
          reply:
            replyText ||
            "I am here to help you learn Science! What would you like to explore next in Chapter 1: The Wonderful World of Science?",
        });
      } catch (geminiError: any) {
        console.warn("Gemini API error (e.g. 503 high demand or model unavailable):", geminiError?.message || geminiError);
        // Seamlessly serve grounded CBSE Class 6 response so user is never interrupted by 503/500 errors
        const fallbackReply = generateRuleBasedReply(lastUserMessage, promptType, studentContext);
        return res.json({ reply: fallbackReply });
      }
    } else {
      const fallbackReply = generateRuleBasedReply(lastUserMessage, promptType, studentContext);
      return res.json({ reply: fallbackReply });
    }
  } catch (error: any) {
    console.error("Error in /api/gemini/tutor:", error);
    const lastUserMessage = (req.body?.messages && Array.isArray(req.body.messages)) 
      ? req.body.messages[req.body.messages.length - 1]?.content 
      : "";
    const promptType = req.body?.promptType;
    const studentContext = req.body?.studentContext;
    const fallbackReply = generateRuleBasedReply(lastUserMessage, promptType, studentContext);
    return res.json({ reply: fallbackReply });
  }
});

// Subjective evaluation helper with Gemini
async function evaluateSubjectiveWithGemini(
  ai: any,
  question: string,
  studentAnswer: string,
  expectedAnswer: string = "",
  expectedKeyPoints: string[] = [],
  markingCriteria: any = null,
  maxMarks: number = 2
) {
  const candidateModels = [
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];

  // Format criteria text from markingCriteria if present
  let criteriaText = "";
  if (Array.isArray(markingCriteria)) {
    criteriaText = markingCriteria.map((c: any) => `- Marks ${c.marks}: ${c.description}`).join("\n");
  } else if (markingCriteria && typeof markingCriteria === 'object' && Array.isArray(markingCriteria.criteria)) {
    criteriaText = markingCriteria.criteria.map((c: any) => `- Marks ${c.marks}: ${c.description}`).join("\n");
  } else if (markingCriteria && typeof markingCriteria === 'string') {
    criteriaText = markingCriteria;
  }

  const systemInstruction = `You are a certified CBSE Class 6 Science Examiner evaluating a student's answer for Chapter 1: "The Wonderful World of Science" (NCERT Textbook: Curiosity).

APPROVED CHAPTER 1 CURRICULUM KNOWLEDGE BASE:
${CHAPTER_1_CURRICULUM}

EVALUATION CRITERIA & RULES:
1. Evaluate the student's answer based on:
   - Scientific correctness according to NCERT Grade 6 Chapter 1
   - Coverage of expected key points
   - Understanding of the core scientific concept
   - Relevance to the question
   - Completeness of the explanation
2. DO NOT heavily penalize:
   - Minor spelling mistakes
   - Minor grammar mistakes
   - Different but scientifically correct wording (if the student's answer is scientifically correct but worded differently from the sample answer, award appropriate marks).
3. IMPORTANT REQUIREMENTS:
   - The AI must evaluate against the supplied Chapter 1 content.
   - It must NOT introduce concepts outside the approved content.
   - Do NOT allow changing the maximum marks. max_score MUST equal ${maxMarks}.
   - The score must satisfy: 0 <= score <= ${maxMarks}. (Can be a half or whole number, e.g. 0, 0.5, 1, 1.5, 2, 2.5, 3).

STRICT OUTPUT JSON FORMAT ONLY (no markdown fences, pure JSON):
{
  "score": <number between 0 and ${maxMarks}>,
  "max_score": ${maxMarks},
  "strengths": ["<specific scientific concept or key point the student explained correctly>"],
  "missing_points": ["<concept or key point from Chapter 1 that was omitted or needs elaboration>"],
  "misconceptions": ["<any factual error or scientific misconception in student's answer, or empty array if none>"],
  "improvement_tip": "<one encouraging, actionable sentence to help the student score full marks in CBSE exams>",
  "suggested_answer": "<an exemplary, age-appropriate model answer based on NCERT Chapter 1>"
}`;

  const prompt = `QUESTION:
${question}

EXPECTED ANSWER (SAMPLE):
${expectedAnswer || "Not provided"}

EXPECTED KEY POINTS:
${expectedKeyPoints && expectedKeyPoints.length > 0 ? expectedKeyPoints.map((kp, i) => `${i + 1}. ${kp}`).join("\n") : "Relevant NCERT Chapter 1 concepts"}

MARKING CRITERIA / RUBRIC:
${criteriaText || "Award full marks for all key concepts covered; partial marks for incomplete explanations."}

MAXIMUM MARKS:
${maxMarks}

STUDENT'S SUBMITTED ANSWER:
${studentAnswer ? studentAnswer.trim() : "(No answer submitted)"}`;

  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        if (response && response.text) {
          const cleaned = response.text.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
          const parsed = JSON.parse(cleaned);

          let rawScore = typeof parsed.score === 'number' ? parsed.score : 0;
          if (isNaN(rawScore)) rawScore = 0;
          // Validate score strictly: 0 <= score <= maxMarks
          const score = Math.min(maxMarks, Math.max(0, Math.round(rawScore * 2) / 2));

          const strengths = Array.isArray(parsed.strengths) && parsed.strengths.length > 0
            ? parsed.strengths.filter((s: any) => typeof s === 'string' && s.trim())
            : [(studentAnswer && studentAnswer.trim().length > 3) ? "Attempted explanation of the concept." : "Question attempted."];

          const missingPoints = Array.isArray(parsed.missing_points)
            ? parsed.missing_points.filter((m: any) => typeof m === 'string' && m.trim())
            : [];

          const misconceptions = Array.isArray(parsed.misconceptions)
            ? parsed.misconceptions.filter((m: any) => typeof m === 'string' && m.trim() && m.toLowerCase() !== 'none' && m.toLowerCase() !== 'n/a')
            : [];

          const improvementTip = typeof parsed.improvement_tip === 'string' && parsed.improvement_tip.trim()
            ? parsed.improvement_tip.trim()
            : "Include specific scientific terms and step-by-step reasoning to secure full marks in CBSE exams.";

          const suggestedAnswer = typeof parsed.suggested_answer === 'string' && parsed.suggested_answer.trim()
            ? parsed.suggested_answer.trim()
            : (expectedAnswer || "Refer to NCERT Curiosity Chapter 1 for the comprehensive concept explanation.");

          return {
            score,
            max_score: maxMarks,
            strengths,
            missing_points: missingPoints,
            misconceptions,
            improvement_tip: improvementTip,
            suggested_answer: suggestedAnswer
          };
        }
      } catch (err: any) {
        lastError = err;
        const errCode = err?.status || err?.code || err?.statusCode || (err?.error && err.error.code);
        const errMsg = err?.message || JSON.stringify(err);
        console.warn(`Evaluation with model ${model} attempt ${attempt + 1} failed (${errCode}): ${errMsg}.`);

        if (errCode === 503 || errCode === 429 || errMsg.includes('503') || errMsg.includes('429')) {
          await waitMs(600 * (attempt + 1));
          continue;
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("All candidate evaluation models failed");
}

// Fallback rule-based subjective evaluator
function evaluateSubjectiveRuleBased(
  question: string,
  studentAnswer: string,
  expectedAnswer: string = "",
  expectedKeyPoints: string[] = [],
  markingCriteria: any = null,
  maxMarks: number = 2
) {
  const ans = (studentAnswer || "").trim().toLowerCase();
  
  if (!ans || ans.length < 3) {
    return {
      score: 0,
      max_score: maxMarks,
      strengths: ["Question attempted."],
      missing_points: expectedKeyPoints && expectedKeyPoints.length > 0 ? expectedKeyPoints : ["Provide a complete scientific explanation."],
      misconceptions: [],
      improvement_tip: "Write a complete explanation mentioning key steps, terms, or real-life examples from Chapter 1.",
      suggested_answer: expectedAnswer || "Refer to Chapter 1: The Wonderful World of Science."
    };
  }

  const keyPoints = (expectedKeyPoints && expectedKeyPoints.length > 0) 
    ? expectedKeyPoints 
    : (expectedAnswer ? [expectedAnswer] : []);

  let matchedCount = 0;
  const matchedPoints: string[] = [];
  const missedPoints: string[] = [];

  for (const kp of keyPoints) {
    const words = kp.toLowerCase().split(/[\s,()\/;]+/).filter(w => w.length > 3 && !['with', 'that', 'this', 'from', 'also', 'into', 'when', 'which', 'about'].includes(w));
    const isMatched = words.some(w => ans.includes(w)) || ans.includes(kp.toLowerCase());

    if (isMatched) {
      matchedCount++;
      matchedPoints.push(kp);
    } else {
      missedPoints.push(kp);
    }
  }

  let score = 0;
  if (keyPoints.length > 0) {
    const ratio = matchedCount / keyPoints.length;
    score = Math.round((ratio * maxMarks) * 2) / 2;
  } else {
    score = ans.length > 30 ? maxMarks : Math.round(maxMarks / 2);
  }

  if (ans.length > 15 && score === 0) {
    score = Math.min(1, Math.round(maxMarks * 0.5 * 2) / 2);
  }

  score = Math.min(maxMarks, Math.max(0, score));

  return {
    score,
    max_score: maxMarks,
    strengths: matchedPoints.length > 0 
      ? matchedPoints.map(p => `Correctly covered key concept: "${p}"`)
      : ["Good effort to explain in your own words."],
    missing_points: missedPoints.length > 0
      ? missedPoints.map(p => `Could mention: "${p}"`)
      : [],
    misconceptions: [],
    improvement_tip: score >= maxMarks * 0.8
      ? "Great clarity! Continue using clear scientific steps in all your answers."
      : "Remember to include specific steps and scientific vocabulary from Chapter 1.",
    suggested_answer: expectedAnswer || (expectedKeyPoints && expectedKeyPoints.length > 0 ? expectedKeyPoints.join(". ") : "Review Chapter 1 concepts.")
  };
}

// API endpoint for Subjective Question Evaluation
app.post("/api/gemini/evaluate-subjective", async (req, res) => {
  try {
    const { 
      question, 
      student_answer, 
      studentAnswer,
      expected_answer,
      expectedAnswer,
      answer,
      expected_key_points,
      expectedKeyPoints,
      marking_criteria,
      rubric,
      marks,
      maxMarks,
      max_score
    } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question text is required." });
    }

    const actualStudentAnswer = (student_answer !== undefined ? student_answer : studentAnswer) || "";
    const actualExpectedAnswer = expected_answer || expectedAnswer || answer || "";
    const actualKeyPoints = expected_key_points || expectedKeyPoints || [];
    const actualCriteria = marking_criteria || rubric || null;
    const actualMaxMarks = Number(marks || max_score || maxMarks) || 2;

    const ai = getAIClient();

    if (ai) {
      try {
        const evalResult = await evaluateSubjectiveWithGemini(
          ai,
          question,
          actualStudentAnswer,
          actualExpectedAnswer,
          actualKeyPoints,
          actualCriteria,
          actualMaxMarks
        );
        return res.json(evalResult);
      } catch (geminiError: any) {
        console.warn("Gemini evaluation error (e.g. 503 or transient):", geminiError?.message || geminiError);
        // If client specifically wanted live AI or if error, serve fallback rule-based evaluation that meets schema
        const fallback = evaluateSubjectiveRuleBased(
          question,
          actualStudentAnswer,
          actualExpectedAnswer,
          actualKeyPoints,
          actualCriteria,
          actualMaxMarks
        );
        return res.json({ ...fallback, is_fallback: true });
      }
    } else {
      const fallback = evaluateSubjectiveRuleBased(
        question,
        actualStudentAnswer,
        actualExpectedAnswer,
        actualKeyPoints,
        actualCriteria,
        actualMaxMarks
      );
      return res.json({ ...fallback, is_fallback: true });
    }
  } catch (error: any) {
    console.error("Error in /api/gemini/evaluate-subjective:", error);
    return res.status(500).json({ 
      error: "Failed to evaluate answer. Please try again.", 
      details: error?.message || "Internal error" 
    });
  }
});

// API endpoint for batch subjective evaluations (e.g. for Chapter Test submission)
app.post("/api/gemini/evaluate-batch-subjective", async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required for batch evaluation." });
    }

    const ai = getAIClient();

    const evaluationPromises = items.map(async (item: any) => {
      const q = item.question || "";
      const sAns = item.student_answer || item.studentAnswer || "";
      const eAns = item.expected_answer || item.expectedAnswer || item.answer || "";
      const keyPoints = item.expected_key_points || item.expectedKeyPoints || [];
      const criteria = item.marking_criteria || item.rubric || null;
      const maxMarks = Number(item.marks || item.max_score || item.maxMarks) || 2;

      if (ai) {
        try {
          const result = await evaluateSubjectiveWithGemini(
            ai,
            q,
            sAns,
            eAns,
            keyPoints,
            criteria,
            maxMarks
          );
          return { question_id: item.question_id || item.id, ...result };
        } catch (err: any) {
          console.warn(`Batch item eval error for question ${item.question_id || item.id}:`, err?.message);
          const fallback = evaluateSubjectiveRuleBased(q, sAns, eAns, keyPoints, criteria, maxMarks);
          return { question_id: item.question_id || item.id, ...fallback, is_fallback: true };
        }
      } else {
        const fallback = evaluateSubjectiveRuleBased(q, sAns, eAns, keyPoints, criteria, maxMarks);
        return { question_id: item.question_id || item.id, ...fallback, is_fallback: true };
      }
    });

    const results = await Promise.all(evaluationPromises);
    return res.json({ evaluations: results });
  } catch (error: any) {
    console.error("Error in /api/gemini/evaluate-batch-subjective:", error);
    return res.status(500).json({ error: "Batch evaluation failed." });
  }
});

// =============================================================
// AI Learning Recommendations Generator (Personalized to Chapter 1 Performance)
// =============================================================

async function generateAIRecommendationsWithGemini(
  ai: any,
  performanceData: {
    topicScores?: Array<{ topicTitle?: string; topicId?: string; accuracy?: number; scoreDisplay?: string; attempts?: number }>;
    quizScores?: Array<{ quizTitle?: string; percentage?: number; score?: number; totalMarks?: number }>;
    testScores?: Array<{ testTitle?: string; percentage?: number; score?: number; totalMarks?: number }>;
    completedTopics?: string[];
    incorrectQuestions?: Array<{ question?: string; topicTitle?: string; studentAnswer?: string; correctAnswer?: string }>;
    recentActivity?: string;
  }
) {
  const candidateModels = [
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];

  const systemInstruction = `You are "Science Buddy AI Learning Mentor", a CBSE Class 6 Science expert specializing in Chapter 1: "The Wonderful World of Science" (NCERT Textbook: Curiosity).

APPROVED CHAPTER 1 CURRICULUM:
${CHAPTER_1_CURRICULUM}

YOUR TASK:
Analyze the student's actual performance data for Chapter 1 and provide a personalized learning recommendation.

RULES & CONSTRAINTS:
1. Grounded strictly in actual performance data:
   - Identify the student's genuine strongest area based on their highest accuracy or score.
   - Identify the student's genuine weakest area based on lowest accuracy, missed questions, or low scores.
   - Recommend a specific Chapter 1 topic/lesson to study or review next.
   - Recommend a targeted, actionable practice activity (e.g. reviewing specific 5 steps of the scientific method, practicing everyday examples, or attempting a practice quiz).
   - Give a clear, encouraging diagnostic reason citing their specific performance patterns.
2. STRICT KNOWLEDGE CONSTRAINT:
   - ONLY recommend topics and concepts from Chapter 1 ("The Wonderful World of Science"). Do NOT mention topics or chapters outside Chapter 1.
   - Valid Chapter 1 Topics:
     * Welcome to the World of Science (Curiosity, Observation)
     * Science as an Unending Jigsaw Puzzle
     * How Do Scientists Work? (The 5 Steps of the Scientific Method: Observation, Questioning, Hypothesizing, Testing, Analysis)
     * Everyday Examples of Scientific Thinking (Kitchen, Bicycle, Plants)
     * Overview of Themes in Grade 6 Science (Living World, Food, Materials, Physical World, Beyond Earth)
     * Collaboration in Science (Teamwork, Discussing hypotheses)
3. TONE & LENGTH:
   - Friendly, encouraging, and age-appropriate for an 11-12 year old student.
   - Keep each text field short, concise, and focused.
4. DO NOT invent performance data or hallucinate questions the student never attempted.

STRICT JSON OUTPUT FORMAT ONLY (Pure JSON, no extra markdown):
{
  "summary": "<Short, encouraging 1-2 sentence overall performance summary>",
  "strong_area": "<Name of the strongest topic or concept>",
  "weak_area": "<Name of the topic or concept needing most improvement>",
  "recommended_topic": "<Specific Chapter 1 topic title>",
  "recommended_action": "<Specific actionable study or practice activity>",
  "reason": "<Diagnostic reason based on their actual answers or scores>"
}`;

  // Sanitize and structure the performance input for the prompt without personal info
  const formattedTopicScores = (performanceData.topicScores || []).map(t => 
    `- ${t.topicTitle || t.topicId || "Topic"}: ${t.accuracy !== undefined ? t.accuracy + "% accuracy" : (t.scoreDisplay || "attempted")} (${t.attempts || 0} attempts)`
  ).join("\n") || "No detailed topic scores yet.";

  const formattedQuizScores = (performanceData.quizScores || []).map(q => 
    `- ${q.quizTitle || "Quiz"}: ${q.score !== undefined ? `${q.score}/${q.totalMarks || q.score}` : ""}${q.percentage !== undefined ? ` (${q.percentage}%)` : ""}`
  ).join("\n") || "No quiz attempts recorded yet.";

  const formattedTestScores = (performanceData.testScores || []).map(t => 
    `- ${t.testTitle || "Chapter Test"}: ${t.score !== undefined ? `${t.score}/${t.totalMarks || t.score}` : ""}${t.percentage !== undefined ? ` (${t.percentage}%)` : ""}`
  ).join("\n") || "No test attempts recorded yet.";

  const formattedCompletedTopics = (performanceData.completedTopics || []).length > 0
    ? (performanceData.completedTopics || []).map(c => `- ${c}`).join("\n")
    : "None completed yet.";

  const formattedIncorrectQuestions = (performanceData.incorrectQuestions || []).slice(0, 8).map(q => 
    `- Topic: ${q.topicTitle || "General"} | Question: "${q.question || ""}" | Missed Answer: "${q.studentAnswer || "(unanswered)"}" | Correct Concept: "${q.correctAnswer || ""}"`
  ).join("\n") || "No recent incorrect questions.";

  const prompt = `STUDENT CHAPTER 1 PERFORMANCE DATA:

TOPIC SCORES:
${formattedTopicScores}

QUIZ SCORES:
${formattedQuizScores}

TEST SCORES:
${formattedTestScores}

COMPLETED TOPICS:
${formattedCompletedTopics}

INCORRECT QUESTIONS & CONCEPT GAPS:
${formattedIncorrectQuestions}

RECENT ACTIVITY:
${performanceData.recentActivity || "Reviewed Chapter 1 topics and attempted assessments."}

Please generate the personalized AI recommendation JSON based strictly on this actual performance data.`;

  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        });

        if (response && response.text) {
          const cleaned = response.text.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
          const parsed = JSON.parse(cleaned);

          return {
            summary: typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : "You are making steady progress in Chapter 1.",
            strong_area: typeof parsed.strong_area === 'string' && parsed.strong_area.trim() ? parsed.strong_area.trim() : "Welcome to the World of Science",
            weak_area: typeof parsed.weak_area === 'string' && parsed.weak_area.trim() ? parsed.weak_area.trim() : "How Do Scientists Work?",
            recommended_topic: typeof parsed.recommended_topic === 'string' && parsed.recommended_topic.trim() ? parsed.recommended_topic.trim() : "How Do Scientists Work?",
            recommended_action: typeof parsed.recommended_action === 'string' && parsed.recommended_action.trim() ? parsed.recommended_action.trim() : "Review the five steps and attempt the practice quiz.",
            reason: typeof parsed.reason === 'string' && parsed.reason.trim() ? parsed.reason.trim() : "Based on your latest assessment, focusing on this topic will help you master all Chapter 1 concepts."
          };
        }
      } catch (err: any) {
        lastError = err;
        const errCode = err?.status || err?.code || err?.statusCode || (err?.error && err.error.code);
        const errMsg = err?.message || JSON.stringify(err);
        console.warn(`Recommendation generation with model ${model} attempt ${attempt + 1} failed (${errCode}): ${errMsg}.`);

        if (errCode === 503 || errCode === 429 || errMsg.includes('503') || errMsg.includes('429')) {
          await waitMs(600 * (attempt + 1));
          continue;
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("All candidate recommendation models failed");
}

function generateRuleBasedRecommendations(performanceData: any) {
  const topics = Array.isArray(performanceData.topicScores) ? performanceData.topicScores : [];
  const incorrect = Array.isArray(performanceData.incorrectQuestions) ? performanceData.incorrectQuestions : [];

  // Sort topics by accuracy ascending
  const sortedByAccuracy = [...topics].sort((a, b) => (a.accuracy ?? 50) - (b.accuracy ?? 50));
  
  const weakest = sortedByAccuracy[0] || { topicTitle: "How Do Scientists Work?", accuracy: 50 };
  const strongest = sortedByAccuracy[sortedByAccuracy.length - 1] || { topicTitle: "Welcome to the World of Science", accuracy: 90 };

  const hasIncorrect = incorrect.length > 0;
  const incorrectTopic = hasIncorrect ? (incorrect[0].topicTitle || weakest.topicTitle) : weakest.topicTitle;

  const avgAcc = topics.length > 0
    ? Math.round(topics.reduce((acc: number, t: any) => acc + (t.accuracy || 0), 0) / topics.length)
    : 75;

  return {
    summary: `You are doing well overall with an average accuracy of ${avgAcc}% in Chapter 1.`,
    strong_area: strongest.topicTitle || "Collaboration in Science",
    weak_area: weakest.topicTitle || "How Do Scientists Work?",
    recommended_topic: weakest.topicTitle || "How Do Scientists Work?",
    recommended_action: `Review key concepts in "${weakest.topicTitle || 'How Do Scientists Work?'}" and attempt the practice quiz.`,
    reason: hasIncorrect 
      ? `Your recent answers show difficulty with concepts in ${incorrectTopic}. Reviewing this topic will boost your confidence and test scores.`
      : `Your performance in ${weakest.topicTitle} is currently at ${weakest.accuracy || 50}%, which has the highest opportunity for rapid score improvement.`
  };
}

// API endpoint for Personalized AI Learning Recommendations
app.post("/api/gemini/recommendations", async (req, res) => {
  try {
    const { 
      topicScores, 
      quizScores, 
      testScores, 
      completedTopics, 
      incorrectQuestions, 
      recentActivity 
    } = req.body || {};

    const performancePayload = {
      topicScores: Array.isArray(topicScores) ? topicScores : [],
      quizScores: Array.isArray(quizScores) ? quizScores : [],
      testScores: Array.isArray(testScores) ? testScores : [],
      completedTopics: Array.isArray(completedTopics) ? completedTopics : [],
      incorrectQuestions: Array.isArray(incorrectQuestions) ? incorrectQuestions : [],
      recentActivity: typeof recentActivity === 'string' ? recentActivity : ""
    };

    const ai = getAIClient();

    if (ai) {
      try {
        const recommendations = await generateAIRecommendationsWithGemini(ai, performancePayload);
        return res.json(recommendations);
      } catch (geminiError: any) {
        console.warn("Gemini recommendations fallback triggered:", geminiError?.message || geminiError);
        const fallback = generateRuleBasedRecommendations(performancePayload);
        return res.json({ ...fallback, is_fallback: true });
      }
    } else {
      const fallback = generateRuleBasedRecommendations(performancePayload);
      return res.json({ ...fallback, is_fallback: true });
    }
  } catch (error: any) {
    console.error("Error in /api/gemini/recommendations:", error);
    const fallback = generateRuleBasedRecommendations(req.body || {});
    return res.json({ ...fallback, is_fallback: true });
  }
});

// =============================================================
// Supabase Database Integration Endpoints
// Tables: students, chapters, topics, student_progress, quiz_attempts, student_answers
// =============================================================

// Status endpoint to check database connectivity
app.get("/api/supabase/status", async (req, res) => {
  const client = getSupabaseClient();
  if (!client) {
    return res.json({
      configured: false,
      connected: false,
      message: "Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are not set. The app is running smoothly in local browser storage mode.",
      stats: { students: 0, chapters: 0, topics: 0, progressCount: 0, attemptsCount: 0 }
    });
  }

  try {
    // Attempt lightweight queries on tables
    const [studentsRes, chaptersRes, topicsRes, progressRes, attemptsRes] = await Promise.allSettled([
      client.from("students").select("id", { count: "exact", head: true }),
      client.from("chapters").select("id", { count: "exact", head: true }),
      client.from("topics").select("id", { count: "exact", head: true }),
      client.from("student_progress").select("id", { count: "exact", head: true }),
      client.from("quiz_attempts").select("id", { count: "exact", head: true }),
    ]);

    const isConnected = chaptersRes.status === "fulfilled" && !chaptersRes.value.error;
    const errorMessage = chaptersRes.status === "rejected" 
      ? chaptersRes.reason?.message 
      : (chaptersRes.status === "fulfilled" && chaptersRes.value.error ? chaptersRes.value.error.message : null);

    const getCount = (r: PromiseSettledResult<any>) => (r.status === "fulfilled" && !r.value.error) ? (r.value.count || 0) : 0;

    return res.json({
      configured: true,
      connected: isConnected,
      message: isConnected ? "Supabase database connected successfully." : (errorMessage || "Database table connection pending."),
      stats: {
        students: getCount(studentsRes),
        chapters: getCount(chaptersRes),
        topics: getCount(topicsRes),
        progressCount: getCount(progressRes),
        attemptsCount: getCount(attemptsRes),
      }
    });
  } catch (err: any) {
    return res.json({
      configured: true,
      connected: false,
      message: err?.message || "Failed to reach Supabase database. Falling back to local offline mode.",
      stats: { students: 0, chapters: 0, topics: 0, progressCount: 0, attemptsCount: 0 }
    });
  }
});

// Helper to normalize chapter IDs ('ch1', '1', 'curiosity-ch1' -> 'chapter-1')
function normalizeChapterId(chId?: string): string {
  if (!chId) return "chapter-1";
  const str = String(chId).trim().toLowerCase();
  if (str === "1" || str === "ch1" || str === "ch-1" || str === "curiosity-ch1") {
    return "chapter-1";
  }
  return chId;
}

// Find existing chapter in Supabase or upsert Chapter 1 safely
async function getOrEnsureChapterId(
  client: SupabaseClient, 
  requestedChapterId: string = "chapter-1"
): Promise<string> {
  const chapter1 = getChapter1Json();
  const normalizedRequested = normalizeChapterId(requestedChapterId);

  try {
    // 1. Query existing chapters to detect the exact ID stored in the database
    const { data: existingChapters, error: selectErr } = await client
      .from("chapters")
      .select("id, chapter_number, title")
      .limit(10);

    if (!selectErr && existingChapters && existingChapters.length > 0) {
      // Direct exact match
      const exactMatch = existingChapters.find(c => c.id === requestedChapterId || c.id === normalizedRequested);
      if (exactMatch) {
        return exactMatch.id;
      }
      // Match by chapter number 1
      const ch1Match = existingChapters.find(c => Number(c.chapter_number) === 1);
      if (ch1Match) {
        return ch1Match.id;
      }
      // If there's only 1 chapter in table, use it
      if (existingChapters.length === 1) {
        return existingChapters[0].id;
      }
    }
  } catch (e: any) {
    console.warn("Could not query existing chapters:", e?.message);
  }

  // 2. If chapter does not exist, insert normalized ID ('chapter-1')
  const targetId = normalizedRequested;
  try {
    const insertPayload = {
      id: targetId,
      grade: chapter1?.metadata?.grade || 6,
      subject: chapter1?.metadata?.subject || "Science",
      chapter_number: chapter1?.metadata?.chapter_number || 1,
      title: chapter1?.metadata?.chapter_title || "The Wonderful World of Science",
      created_at: new Date().toISOString()
    };

    const { error: insertErr } = await client
      .from("chapters")
      .upsert(insertPayload, { onConflict: "id" });

    if (insertErr) {
      console.warn("Supabase upsert chapter notice:", insertErr.message);
    }
  } catch (e: any) {
    console.warn("Supabase ensure chapter error:", e?.message);
  }

  return targetId;
}

// Ensure foreign key dependencies (student, chapter, topics) exist in Supabase
async function ensureSchemaEntities(
  client: SupabaseClient,
  studentId: string = "student-1",
  studentName: string = "Student",
  chapterId: string = "chapter-1",
  topicId?: string
): Promise<{ effectiveChapterId: string; effectiveTopicId?: string }> {
  const chapter1 = getChapter1Json();
  
  // 1. Resolve and ensure chapter in database
  const effectiveChapterId = await getOrEnsureChapterId(client, chapterId);

  // 2. Ensure student exists in public.students
  try {
    const { error: studentErr } = await client.from("students").upsert({
      id: studentId,
      name: studentName || "Student",
      grade: chapter1?.metadata?.grade || 6,
      board: chapter1?.metadata?.board || "CBSE",
      created_at: new Date().toISOString()
    }, { onConflict: "id" });
    if (studentErr) {
      console.warn("Supabase student upsert notice:", studentErr.message);
    }
  } catch (e: any) {
    console.warn("Supabase ensure student error:", e?.message);
  }

  // 3. Ensure topics exist in public.topics
  try {
    if (chapter1 && Array.isArray(chapter1.topics)) {
      const topicsToUpsert = chapter1.topics.map((t: any, idx: number) => ({
        id: t.topic_id,
        chapter_id: effectiveChapterId,
        title: t.title,
        sequence: idx + 1,
        learning_objective: t.learning_objective || ""
      }));
      const { error: topicsErr } = await client.from("topics").upsert(topicsToUpsert, { onConflict: "id" });
      if (topicsErr) {
        console.warn("Supabase topics upsert notice:", topicsErr.message);
      }
    }
  } catch (e: any) {
    console.warn("Supabase ensure topics error:", e?.message);
  }

  return { effectiveChapterId, effectiveTopicId: topicId };
}

// Seed/Import Chapter 1 Curriculum data into Supabase
app.post("/api/supabase/seed", async (req, res) => {
  const client = getSupabaseClient();
  const chapter1 = getChapter1Json();

  if (!chapter1) {
    return res.status(500).json({ error: "Chapter 1 content pack JSON could not be loaded for seeding." });
  }

  if (!client) {
    return res.status(503).json({
      error: "Supabase client is not configured with SUPABASE_URL / SUPABASE_ANON_KEY.",
      fallback: true
    });
  }

  try {
    const defaultStudentId = req.body?.student_id || "student-1";
    const studentName = req.body?.student_name || "Student";
    const requestedChapterId = `chapter-${chapter1.metadata.chapter_number}`; // 'chapter-1'

    const { effectiveChapterId } = await ensureSchemaEntities(client, defaultStudentId, studentName, requestedChapterId);

    // Initialize starter student_progress records if not existing
    const starterProgress = chapter1.topics.map((t: any, idx: number) => ({
      student_id: defaultStudentId,
      chapter_id: effectiveChapterId,
      topic_id: t.topic_id,
      completion_percent: idx < 3 ? 100 : (idx === 3 ? 55 : 0),
      accuracy: idx < 3 ? 85 : (idx === 3 ? 60 : 0),
      attempts: idx < 3 ? 2 : (idx === 3 ? 1 : 0),
      updated_at: new Date().toISOString()
    }));

    const { error: progErr } = await client.from("student_progress").upsert(starterProgress, { 
      onConflict: "student_id,chapter_id,topic_id" 
    });
    if (progErr) console.warn("Supabase seed progress warning:", progErr.message);

    return res.json({
      success: true,
      message: "Chapter 1 content and student records successfully seeded to Supabase!",
      chapter: {
        id: effectiveChapterId,
        title: chapter1.metadata.chapter_title,
        total_topics: chapter1.topics?.length || 6
      }
    });
  } catch (err: any) {
    console.error("Error in /api/supabase/seed:", err);
    return res.status(500).json({ error: err?.message || "Failed to seed Supabase database." });
  }
});

// Get Database Curriculum (Chapters & Topics)
app.get("/api/supabase/curriculum", async (req, res) => {
  const client = getSupabaseClient();
  const chapter1 = getChapter1Json();

  if (!client) {
    return res.json({ source: "local_json", chapters: [chapter1] });
  }

  try {
    const { data: dbChapters, error: chErr } = await client
      .from("chapters")
      .select("*, topics(*)")
      .order("chapter_number", { ascending: true });

    if (chErr || !dbChapters || dbChapters.length === 0) {
      return res.json({ source: "local_json", chapters: [chapter1] });
    }

    return res.json({ source: "supabase", chapters: dbChapters });
  } catch (err: any) {
    return res.json({ source: "local_json", chapters: [chapter1], error: err?.message });
  }
});

// Get Student Data (Progress, Quiz Attempts & Answers)
app.get("/api/supabase/student-data", async (req, res) => {
  const client = getSupabaseClient();
  const studentId = (req.query.student_id as string) || "student-1";

  if (!client) {
    return res.status(503).json({ error: "Supabase not configured, using local storage." });
  }

  try {
    const [studentRes, progressRes, attemptsRes] = await Promise.all([
      client.from("students").select("*").eq("id", studentId).maybeSingle(),
      client.from("student_progress").select("*").eq("student_id", studentId),
      client.from("quiz_attempts").select("*, student_answers(*)").eq("student_id", studentId).order("completed_at", { ascending: false })
    ]);

    return res.json({
      student: studentRes.data,
      progress: progressRes.data || [],
      quiz_attempts: attemptsRes.data || []
    });
  } catch (err: any) {
    console.error("Error in /api/supabase/student-data:", err);
    return res.status(500).json({ error: err?.message || "Failed to fetch student data." });
  }
});

// Update or Upsert Student Progress for a Topic
app.post("/api/supabase/student-progress", async (req, res) => {
  const client = getSupabaseClient();
  let { 
    student_id = "student-1", 
    student_name = "Student",
    chapter_id = "chapter-1", 
    topic_id, 
    completion_percent = 100, 
    accuracy = 100, 
    attempts = 1 
  } = req.body;

  if (!student_id || !topic_id) {
    return res.status(400).json({ error: "student_id and topic_id are required." });
  }

  if (!client) {
    return res.json({ success: true, local_fallback: true });
  }

  try {
    // 1. Ensure foreign key dependencies (student, chapter, and topics) exist in Supabase
    const { effectiveChapterId } = await ensureSchemaEntities(client, student_id, student_name, chapter_id, topic_id);

    // 2. Check existing progress for attempts counter
    const { data: existing } = await client
      .from("student_progress")
      .select("*")
      .eq("student_id", student_id)
      .eq("chapter_id", effectiveChapterId)
      .eq("topic_id", topic_id)
      .maybeSingle();

    const newAttempts = existing ? (existing.attempts || 0) + 1 : (attempts || 1);
    const newCompletion = Math.max(existing?.completion_percent || 0, completion_percent);
    const newAccuracy = accuracy !== undefined ? accuracy : (existing?.accuracy || 100);

    const { data, error } = await client.from("student_progress").upsert({
      student_id,
      chapter_id: effectiveChapterId,
      topic_id,
      completion_percent: newCompletion,
      accuracy: newAccuracy,
      attempts: newAttempts,
      updated_at: new Date().toISOString()
    }, { onConflict: "student_id,chapter_id,topic_id" }).select().maybeSingle();

    if (error) {
      console.warn("Supabase student_progress upsert warning:", error.message);
      return res.json({ success: false, error: error.message });
    }

    return res.json({ success: true, progress: data });
  } catch (err: any) {
    console.error("Error in /api/supabase/student-progress:", err);
    return res.json({ success: false, error: err?.message || "Failed to update student progress." });
  }
});

// Record Quiz Attempt and Student Answers
app.post("/api/supabase/quiz-attempt", async (req, res) => {
  const client = getSupabaseClient();
  let {
    student_id = "student-1",
    student_name = "Student",
    chapter_id = "chapter-1",
    quiz_type = "practice",
    total_marks,
    marks_obtained,
    percentage,
    answers = []
  } = req.body;

  if (total_marks === undefined || marks_obtained === undefined) {
    return res.status(400).json({ error: "total_marks and marks_obtained are required." });
  }

  if (!client) {
    return res.json({ success: true, local_fallback: true });
  }

  try {
    // Ensure student, chapter, and topics exist first
    const { effectiveChapterId } = await ensureSchemaEntities(client, student_id, student_name, chapter_id);

    // 1. Insert Quiz Attempt
    const { data: attemptRow, error: attemptErr } = await client
      .from("quiz_attempts")
      .insert({
        student_id,
        chapter_id: effectiveChapterId,
        quiz_type,
        total_marks,
        marks_obtained,
        percentage: percentage !== undefined ? percentage : Math.round((marks_obtained / total_marks) * 100),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (attemptErr || !attemptRow) {
      console.error("Failed to insert quiz attempt in Supabase:", attemptErr);
      return res.json({ success: false, error: attemptErr?.message || "Failed to insert quiz attempt." });
    }

    const attemptId = attemptRow.id;

    // 2. Insert Student Answers if provided
    if (Array.isArray(answers) && answers.length > 0) {
      const studentAnswersRows = answers.map((ans: any) => ({
        attempt_id: attemptId,
        question_id: ans.question_id || ans.questionId || ans.id,
        student_answer: typeof ans.student_answer === "string" ? ans.student_answer : (ans.studentAnswer || ans.userAnswer || ""),
        score: ans.score !== undefined ? ans.score : (ans.marksAwarded || (ans.isCorrect ? 1 : 0)),
        ai_feedback: ans.ai_feedback || ans.aiFeedback || ans.evaluation || null,
        created_at: new Date().toISOString()
      }));

      const { error: answersErr } = await client
        .from("student_answers")
        .insert(studentAnswersRows);

      if (answersErr) {
        console.warn("Failed to insert individual student answers in Supabase:", answersErr.message);
      }
    }

    return res.json({
      success: true,
      attempt_id: attemptId,
      attempt: attemptRow,
      answers_saved: answers.length
    });
  } catch (err: any) {
    console.error("Error in /api/supabase/quiz-attempt:", err);
    return res.json({ success: false, error: err?.message || "Failed to save quiz attempt." });
  }
});

// Standard Cloud Run health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// API health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Global graceful error handling middleware (never exposes stack traces)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err?.message || err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(err?.status || 500).json({
    status: "error",
    message: err?.message || "An unexpected server error occurred."
  });
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Science Buddy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
