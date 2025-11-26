import { GoogleGenAI } from "@google/genai";
import { UserRole } from "../types";

// Note: In a real deployment, ensure process.env.API_KEY is available.
const API_KEY = process.env.API_KEY || ''; 

class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: API_KEY });
    } else {
      console.warn("Gemini API Key is missing. AI features will be disabled.");
    }
  }

  async generateResponse(message: string, role: UserRole): Promise<string> {
    if (!this.ai) {
      return "I'm sorry, I cannot process your request because the API key is missing. Please configure the environment.";
    }

    const systemInstruction = role === UserRole.AGENT 
      ? "You are a highly capable Insurance Agency Assistant for Dream Agency. You assist agents with underwriting guidelines, policy summaries, drafting messages to clients, and financial calculations. Be professional, concise, and compliance-focused."
      : "You are a friendly and helpful Virtual Assistant for Dream Agency customers. You explain insurance policies in simple plain language, help with claims procedures, and suggest financial health improvements. Avoid jargon. Be empathetic.";

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config: {
          systemInstruction: systemInstruction,
        }
      });
      return response.text || "I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "I encountered an error while thinking. Please try again later.";
    }
  }
}

export const geminiService = new GeminiService();