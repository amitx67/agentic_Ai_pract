
import express from "express";
import dotenv from "dotenv";
import { ChatGoogle } from "@langchain/google";

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 5000;

// Check API key
if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is missing from .env");
}

// Initialize Gemini
const llm = new ChatGoogle({
  model: "gemini-3.6-flash",
  apiKey: process.env.GOOGLE_API_KEY,
});

app.post("/api/v1/chat", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        error: "Please provide a valid prompt.",
      });
    }

    const result = await llm.invoke(prompt);

    return res.status(200).json({
      response: result.content,
    });
  } catch (error) {
    console.error("Google API Error:", error);

    return res.status(500).json({
      error: "Failed to generate a response.",
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
