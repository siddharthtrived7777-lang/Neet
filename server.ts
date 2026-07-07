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

      // Generate response using gemini-3.5-flash
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
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
