import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  constructor(private readonly config: ConfigService) {}

  async chat(role: string, message: string) {
    const apiKey = this.config.get<string>('ai.apiKey');
    if (!apiKey) {
      return { reply: "AI key missing; please configure AI_API_KEY in backend .env" };
    }
    // Placeholder: integrate Google Gemini SDK with role-aware system prompt
    return { reply: `Echo (${role}): ${message}` };
  }
}
