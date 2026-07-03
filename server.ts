import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please add it via Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API endpoint to analyze custom video content (locked to Rick Beato Tetragrammaton)
app.post("/api/analyze", async (req, res) => {
  const videoUrl = "https://www.youtube.com/watch?v=OXG8F4lV96g";
  const { topic } = req.body;

  try {
    const ai = getGeminiClient();
    
    // Build a targeted prompt focusing on this locked video
    const prompt = `Analyze the YouTube video at "${videoUrl}" (Rick Beato on Tetragrammaton with Rick Rubin) focusing on the topic: "${topic || "musical elements, perfect pitch, taste, or active listening"}".
    Find key timestamps, summaries, and quotes. Break down the elements discussed and explain why they matter in the context of what sounds "good" or "bad" in music.
    Ensure the response is structured elegantly with clear markdown headers and bullet points.`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
    } catch (e: any) {
      console.warn("Falling back to gemini-3.1-pro for analysis:", e);
      response = await ai.models.generateContent({
        model: "gemini-3.1-pro",
        contents: prompt,
      });
    }

    res.json({
      success: true,
      text: response.text || "No analysis could be generated.",
    });

  } catch (error: any) {
    console.error("Error in /api/analyze:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred during analysis.",
    });
  }
});

// API endpoint to generate custom structured timestamps from a prompt
app.post("/api/generate-timestamps", async (req, res) => {
  const targetUrl = "https://www.youtube.com/watch?v=OXG8F4lV96g";
  const { promptGuideline } = req.body;
  const guideline = promptGuideline || "Find key segments covering pitch, taste, production, or musical elements.";

  try {
    const ai = getGeminiClient();
    const { Type } = await import("@google/genai");

    const prompt = `You are a musicology and audio engineering AI assistant analyzing the video at "${targetUrl}".
The user wants you to generate a new customized list of chapters/timestamps based on this exact guideline: "${guideline}".
Identify segments where these topics are discussed in detail.

For each chapter, populate these properties:
- id: a short unique url-safe string slug
- timeSeconds: integer representing the start of this segment in seconds (e.g. 1110)
- timeLabel: string format "MM:SS" or "HH:MM:SS" (e.g. "01:08:40")
- title: a concise title of the chapter (max 45 chars)
- category: must be exactly one of: "pitch", "taste", "production", "elements", "exposure"
- description: a 2-3 sentence overview of what is discussed in that segment
- quote: a memorable quote representing their key point (real or highly representative paraphrase)
- whyItMatters: a 1-2 sentence explanation of why this concept is crucial for ear training or taste development

Tailor the descriptions, quotes, and chosen times to focus heavily on the themes specified in the user's guideline: "${guideline}".`;

    const schema = {
      type: Type.ARRAY,
      description: "List of custom generated timestamps matching the user prompt.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          timeSeconds: { type: Type.INTEGER, description: "Start time of the segment in seconds." },
          timeLabel: { type: Type.STRING, description: "Formatted label, e.g., '01:08:40'." },
          title: { type: Type.STRING, description: "Title of the segment." },
          category: { 
            type: Type.STRING, 
            description: "Must be exactly one of: 'pitch', 'taste', 'production', 'elements', 'exposure'." 
          },
          description: { type: Type.STRING, description: "Detailed description of what they discuss." },
          quote: { type: Type.STRING, description: "Quote from the episode." },
          whyItMatters: { type: Type.STRING, description: "Why this matters." }
        },
        required: ["id", "timeSeconds", "timeLabel", "title", "category", "description", "whyItMatters"]
      }
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
      });
    } catch (e: any) {
      console.warn("Falling back to gemini-3.1-pro for timestamp generation:", e);
      response = await ai.models.generateContent({
        model: "gemini-3.1-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
      });
    }

    const text = response.text;
    if (!text) {
      throw new Error("No response content generated by Gemini.");
    }

    const timestamps = JSON.parse(text.trim());
    res.json({
      success: true,
      timestamps
    });

  } catch (error: any) {
    console.error("Error in /api/generate-timestamps:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred during timestamp generation."
    });
  }
});

// API endpoint to analyze and identify speaker names in the transcript
app.post("/api/analyze-speakers", async (req, res) => {
  const { transcriptSample } = req.body;
  const sampleText = transcriptSample || `
Speaker 1: ...
Speaker 1: ...
Speaker 2: ...
Speaker 1: ...
[Music]: ...
`;

  try {
    const ai = getGeminiClient();
    const { Type } = await import("@google/genai");

    const prompt = `You are an expert audio transcriptionist and music journalist.
Analyze the following interview transcript snippet:
"${sampleText}"

Your task is to identify the actual, real-world full names of "Speaker 1" and "Speaker 2".

Return a JSON object with this structure:
{
  "Speaker 1": "identified full name of Speaker 1",
  "Speaker 2": "identified full name of Speaker 2"
}`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        "Speaker 1": { type: Type.STRING, description: "Identified name of Speaker 1" },
        "Speaker 2": { type: Type.STRING, description: "Identified name of Speaker 2" }
      },
      required: ["Speaker 1", "Speaker 2"]
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
      });
    } catch (e: any) {
      console.warn("Falling back to gemini-3.1-pro for speaker identification:", e);
      response = await ai.models.generateContent({
        model: "gemini-3.1-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
      });
    }

    const text = response.text;
    if (!text) {
      throw new Error("No response content generated by Gemini.");
    }

    const speakerMapping = JSON.parse(text.trim());
    res.json({
      success: true,
      speakerMapping
    });

  } catch (error: any) {
    console.error("Error in /api/analyze-speakers:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred during speaker identification."
    });
  }
});

// Serve Vite-managed React app
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
