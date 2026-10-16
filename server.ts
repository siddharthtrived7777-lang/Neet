import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini client (server-side only)
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API route for Aura AI Coach chat
  app.post("/api/chat", async (req: any, res: any) => {
    try {
      const { message, history, context } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required." });
      }

      // Construct dynamic system instruction containing actual NEET student study telemetry
      const systemInstruction = `You are Aura, an elite cognitive NEET (National Eligibility cum Entrance Test) preparation coach and diagnostic engine. 
Your goal is to guide the student towards high marks in NEET Physics, Chemistry, and Biology (especially NCERT-based core concepts).
Analyze the user's study logbooks and test scores, identify cognitive gaps, and answer questions as an expert medical tutor.

Here is the student's current real-time preparation status:
- Total Study Hours logged: ${context.totalHrs.toFixed(1)} hours
- Subject distribution: 
  * Biology: ${context.b_hrs.toFixed(1)} hours
  * Chemistry: ${context.c_hrs.toFixed(1)} hours
  * Physics: ${context.p_hrs.toFixed(1)} hours
- Weak Chapters (Average MCQ practice accuracy < 78%):
  ${context.weakChaps && context.weakChaps.length > 0 
    ? context.weakChaps.map((c: any) => `* ${c.chapterName} (${c.subject}) - Accuracy: ${Math.round(c.averageAccuracy)}% over ${c.totalHours.toFixed(1)}h studied`).join('\n')
    : "None! All logged chapters have practice accuracy >= 78%"}
- Overdue Revision Tasks (to prevent forgetting curve decay):
  ${context.overdueRevs && context.overdueRevs.length > 0
    ? context.overdueRevs.slice(0, 5).map((r: any) => `* ${r.chapterName} (${r.subject}) - Stage ${r.stage} Review (Due date was ${r.dueDate})`).join('\n')
    : "None! Spaced repetition schedules are fully up to date."}

Instruction on tone and responses:
- Be highly supportive, analytical, and professional. 
- Use brief, highly structured markdown for recommendations (bullets, bold text, etc.).
- When referencing subject-specific guidelines:
  * For Biology: emphasize meticulous NCERT reading, memorization depth, and high markings.
  * For Physics: emphasize numerical formula application, formula charts, and active practice.
  * For Chemistry: distinguish physical (numerical problems), organic (reaction mechanisms), and inorganic (NCERT tables & exceptions).
- Keep responses action-oriented, precise, and concise. Do not talk about database operations or code internals.`;

      // Map chat history to Gemini role format
      const mappedHistory = (history || []).map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      // Generate response using gemini-3.8-flash
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          ...mappedHistory,
          {
            role: 'user',
            parts: [{ text: message }]
          }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ reply: response.text });
    } catch (err: any) {
      console.error("Gemini API error:", err);
      res.status(500).json({ error: err.message || "Failed to query Gemini AI" });
    }
  });

  // API route for AI-Powered Weekly Study Roadmap Generator
  app.post("/api/generate-roadmap", async (req: any, res: any) => {
    try {
      const { targetChapters, dailyHours = 6, intensity = "balanced", examDate, additionalNotes } = req.body;

      if (!targetChapters || !Array.isArray(targetChapters) || targetChapters.length === 0) {
        return res.status(400).json({ error: "At least one target chapter is required." });
      }

      const chapterSummaryText = targetChapters
        .map((c: any, i: number) => `${i + 1}. [${c.subject}] ${c.chapterName} - Current Confidence: ${c.currentConfidence || 'Low'} (Accuracy: ${c.averageAccuracy || 0}%, Hours logged: ${c.totalHours || 0}h, Note: ${c.reason || 'Needs reinforcement'})`)
        .join("\n");

      const prompt = `You are the lead academic director and cognitive strategist for NEET (National Eligibility cum Entrance Test) Medical Entrance.
A student has diagnosed their database and identified their lowest confidence chapters that urgently require remediation this week.

TARGET CHAPTERS WITH LOWEST CONFIDENCE:
${chapterSummaryText}

STUDENT CONSTRAINTS & PREFERENCES:
- Target daily study hours: ${dailyHours} hours/day (Total weekly study commitment: ${Number(dailyHours) * 7} hours)
- Prep Intensity: ${intensity}
- Target NEET Exam Date: ${examDate ? examDate : "Upcoming academic session"}
${additionalNotes ? `- Specific student focus request: "${additionalNotes}"` : ""}

TASK:
Generate a comprehensive, psychologically optimized 7-Day Weekly Study Roadmap (Day 1 through Day 7) specifically engineered to elevate the student's confidence in these weak chapters from 'Low'/'Medium' to 'High'.

PEDAGOGICAL REQUIREMENTS:
1. Interleaving: Never spend an entire day on only one subject. Distribute each day into 2-3 focused sessions:
   - Morning slot: High cognitive demand (Physics formulas/numericals or Physical Chemistry calculations).
   - Afternoon slot: Organic reaction mechanisms or Inorganic conceptual tables.
   - Evening/Night slot: Biology NCERT active recall, line-by-line reading & error notebook review.
2. High-Yield Focus: Cite exact NCERT topics, formulas, or reaction mechanisms for each session.
3. Realistic Targets: Provide exact MCQ practice counts and duration in minutes that match the ${dailyHours} hours/day constraint.
4. Measurable Exit Criteria: For each day, provide a 3-4 item checklist and a confidence-boosting tip.

OUTPUT FORMAT:
You MUST respond with ONLY a valid, parseable JSON object (no surrounding commentary, no markdown ticks before or after) with this exact schema:
{
  "title": "String - Compelling, inspiring roadmap title",
  "overview": "String - Concise analytical diagnosis explaining why these chapters were chosen and the weekly focus",
  "strategy": "String - Strategic explanation of the cognitive sequencing and spaced repetition plan",
  "targetChaptersSummary": [
    {
      "chapterName": "String",
      "subject": "Physics | Chemistry | Biology",
      "currentConfidence": "Low | Medium",
      "targetMilestone": "String - concrete benchmark (e.g. 'Attain >80% accuracy in 50 PYQs and master Lens Maker formula')"
    }
  ],
  "weeklySchedule": [
    {
      "dayNumber": 1,
      "dayLabel": "Day 1 (Monday)",
      "focusTheme": "String",
      "totalHours": ${dailyHours},
      "sessions": [
        {
          "id": "sess-1-1",
          "timeSlot": "Morning (07:00 - 10:00)",
          "subject": "Physics",
          "chapter": "String",
          "activityType": "Concept Drill | NCERT Line-by-Line | PYQ / MCQ Speed Test | Active Recall & Error Log",
          "taskDescription": "String - specific actionable tasks",
          "durationMinutes": 180,
          "highYieldTopics": ["Topic 1", "Topic 2"],
          "targetMcqs": 35
        }
      ],
      "dailyChecklist": ["Item 1", "Item 2", "Item 3"],
      "confidenceBoostTip": "String"
    }
  ],
  "milestones": [
    "String milestone 1",
    "String milestone 2",
    "String milestone 3",
    "String milestone 4"
  ],
  "subjectSplit": {
    "physicsHours": number,
    "chemistryHours": number,
    "biologyHours": number
  }
}`;

      let response: any;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
            temperature: 0.6,
          }
        });
      } catch (err: any) {
        console.warn("Primary model error, attempting fallback:", err?.message || err);
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
            temperature: 0.6,
          }
        });
      }

      let responseText = response.text || "{}";
      responseText = responseText.trim();
      // Remove any unintentional markdown wrappers if present
      if (responseText.startsWith("```json")) {
        responseText = responseText.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (responseText.startsWith("```")) {
        responseText = responseText.replace(/^```/, "").replace(/```$/, "").trim();
      }

      const roadmapData = JSON.parse(responseText);
      roadmapData.id = `roadmap-${Date.now()}`;
      roadmapData.createdAt = new Date().toISOString();
      roadmapData.dailyHoursTarget = dailyHours;
      roadmapData.generationMode = "ai";

      res.json({ roadmap: roadmapData });
    } catch (err: any) {
      console.error("Gemini Roadmap Generation API error:", err);
      res.status(500).json({ error: err.message || "Failed to generate roadmap with Gemini AI" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
