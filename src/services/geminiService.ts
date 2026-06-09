import { api } from "../api/client";
import { UserRole } from "../types";

class GeminiService {
  async generateResponse(message: string, role: UserRole): Promise<string> {
    try {
      const response = await api.aiAssistant(message);
      return response.reply || "I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error("Personal Assistant Agent backend error:", error);
      return role === UserRole.AGENT
        ? "I could not reach the personal assistant agent. Check that the backend is running and that your AI key is configured."
        : "I could not reach the personal assistant agent right now. Please try again later.";
    }
  }
}

export const geminiService = new GeminiService();
