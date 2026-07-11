import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { AIProvider } from "./AIProvider";
import { logger } from "../../utils/logger";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export class DeepSeekProvider implements AIProvider {
  private apiKey: string | null = null;

  constructor() {
    this.loadApiKey();
  }

  private async loadApiKey() {
    try {
      this.apiKey = await SecureStore.getItemAsync("deepseek_api_key");
    } catch (error) {
      logger.error("Failed to load DeepSeek API key:", error);
    }
  }

  /**
   * Ensure the API key is loaded and set.
   * @throws If no API key is configured.
   */
  private async ensureApiKey(): Promise<void> {
    if (!this.apiKey) {
      await this.loadApiKey();
    }
    if (!this.apiKey) {
      throw new Error(
        "DeepSeek API key not configured. Please set it in Settings > AI Settings.",
      );
    }
  }

  /**
   * Generic method to call the DeepSeek chat completion API.
   */
  private async callDeepSeek(
    systemPrompt: string,
    userPrompt: string,
    options?: { maxTokens?: number; temperature?: number; stream?: boolean },
  ): Promise<string> {
    await this.ensureApiKey();

    try {
      const response = await axios.post(
        DEEPSEEK_API_URL,
        {
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: options?.maxTokens || 1000,
          temperature: options?.temperature || 0.5,
          stream: options?.stream || false,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 60000, // 60 seconds timeout
        },
      );

      if (
        response.data &&
        response.data.choices &&
        response.data.choices.length > 0
      ) {
        const content = response.data.choices[0].message.content;
        return content.trim();
      }
      throw new Error("Unexpected response format from DeepSeek API");
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;
        if (status === 401) {
          throw new Error(
            "Invalid API key. Please check your DeepSeek API key in Settings.",
          );
        } else if (status === 429) {
          throw new Error(
            "Rate limit exceeded. Please wait a moment and try again.",
          );
        } else if (status === 500) {
          throw new Error(
            "DeepSeek service is temporarily unavailable. Please try again later.",
          );
        }
        throw new Error(`DeepSeek API error: ${message}`);
      }
      throw error;
    }
  }

  // ==================== AIProvider Interface Implementation ====================

  async summarize(
    text: string,
    options?: { maxTokens?: number; temperature?: number },
  ): Promise<string> {
    const systemPrompt =
      "You are a helpful assistant that summarizes documents.";
    const userPrompt = `Summarize the following document concisely. Focus on the main points, key arguments, and conclusions. Use bullet points where appropriate.\n\nDocument:\n${text}`;
    return this.callDeepSeek(systemPrompt, userPrompt, options);
  }

  async translate(
    text: string,
    targetLanguage: string,
    options?: { temperature?: number },
  ): Promise<string> {
    const systemPrompt = `You are a professional translator fluent in ${targetLanguage}.`;
    const userPrompt = `Translate the following text to ${targetLanguage}. Preserve the original meaning and tone. Do not add any extra comments.\n\nText:\n${text}`;
    return this.callDeepSeek(systemPrompt, userPrompt, {
      maxTokens: 1000,
      temperature: options?.temperature || 0.3,
    });
  }

  async generateFlashcards(
    text: string,
    count: number = 10,
  ): Promise<Array<{ question: string; answer: string }>> {
    const systemPrompt =
      "You are a helpful assistant that generates educational flashcards.";
    const userPrompt = `Generate ${count} flashcards from the following document. Each flashcard should have a question and answer. Format the output as a JSON array of objects with "question" and "answer" fields. Do not include any other text.\n\nDocument:\n${text}`;
    const response = await this.callDeepSeek(systemPrompt, userPrompt, {
      maxTokens: 1500,
      temperature: 0.5,
    });
    try {
      // Attempt to parse JSON
      const parsed = JSON.parse(response);
      if (
        Array.isArray(parsed) &&
        parsed.every((item) => item.question && item.answer)
      ) {
        return parsed;
      }
      throw new Error("Invalid flashcard format");
    } catch (e) {
      // Try to extract JSON from the response
      const match = response.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (
            Array.isArray(parsed) &&
            parsed.every((item) => item.question && item.answer)
          ) {
            return parsed;
          }
        } catch (e2) {
          // fall through
        }
      }
      logger.error("Failed to parse flashcards response:", response);
      throw new Error(
        "Failed to parse flashcards from AI response. Please try again.",
      );
    }
  }

  async generateQuiz(
    text: string,
    count: number = 5,
  ): Promise<Array<{ question: string; options: string[]; correct: number }>> {
    const systemPrompt =
      "You are a helpful assistant that generates educational quizzes.";
    const userPrompt = `Generate a multiple-choice quiz with ${count} questions based on the following document. Each question must have 4 options (A, B, C, D) and one correct answer. Format the output as a JSON array of objects with fields: "question" (string), "options" (array of 4 strings), "correct" (index 0-3 indicating the correct option). Do not include any other text.\n\nDocument:\n${text}`;
    const response = await this.callDeepSeek(systemPrompt, userPrompt, {
      maxTokens: 2000,
      temperature: 0.5,
    });
    try {
      const parsed = JSON.parse(response);
      if (
        Array.isArray(parsed) &&
        parsed.every(
          (item) =>
            item.question &&
            Array.isArray(item.options) &&
            item.options.length === 4 &&
            typeof item.correct === "number",
        )
      ) {
        return parsed;
      }
      throw new Error("Invalid quiz format");
    } catch (e) {
      const match = response.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (
            Array.isArray(parsed) &&
            parsed.every(
              (item) =>
                item.question &&
                Array.isArray(item.options) &&
                item.options.length === 4 &&
                typeof item.correct === "number",
            )
          ) {
            return parsed;
          }
        } catch (e2) {
          // fall through
        }
      }
      logger.error("Failed to parse quiz response:", response);
      throw new Error(
        "Failed to parse quiz from AI response. Please try again.",
      );
    }
  }

  async chat(options: {
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    onToken?: (token: string) => void;
  }): Promise<{
    text: string;
    citations?: Array<{ page: number; text: string }>;
  }> {
    await this.ensureApiKey();

    const {
      messages,
      temperature = 0.3,
      maxTokens = 1000,
      stream = false,
      onToken,
    } = options;

    try {
      if (stream) {
        // Streaming implementation
        const response = await fetch(DEEPSEEK_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages,
            max_tokens: maxTokens,
            temperature,
            stream: true,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData?.error?.message || `API error: ${response.status}`,
          );
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let buffer = "";

        if (!reader) throw new Error("Streaming not supported");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  fullText += content;
                  if (onToken) onToken(content);
                }
              } catch (e) {
                // ignore parse errors
              }
            }
          }
        }

        // Process any remaining buffer
        if (buffer && buffer.startsWith("data: ")) {
          const data = buffer.slice(6).trim();
          if (data !== "[DONE]") {
            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                if (onToken) onToken(content);
              }
            } catch (e) {
              // ignore
            }
          }
        }

        return { text: fullText.trim() };
      } else {
        // Non-streaming (fallback)
        const response = await axios.post(
          DEEPSEEK_API_URL,
          {
            model: "deepseek-chat",
            messages,
            max_tokens: maxTokens,
            temperature,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.apiKey}`,
            },
            timeout: 60000,
          },
        );

        if (
          response.data &&
          response.data.choices &&
          response.data.choices.length > 0
        ) {
          const content = response.data.choices[0].message.content;
          return { text: content.trim() };
        }
        throw new Error("Unexpected response format");
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;
        if (status === 401) {
          throw new Error("Invalid API key. Please check your settings.");
        } else if (status === 429) {
          throw new Error(
            "Rate limit exceeded. Please wait a moment and try again.",
          );
        } else if (status === 500) {
          throw new Error(
            "DeepSeek service unavailable. Please try again later.",
          );
        }
        throw new Error(`DeepSeek API error: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Convenience method for RAG: answer a question with context.
   */
  async answerWithContext(
    query: string,
    context: string,
    conversationHistory?: Array<{
      role: "user" | "assistant";
      content: string;
    }>,
  ): Promise<{
    text: string;
    citations?: Array<{ page: number; text: string }>;
  }> {
    const systemPrompt = `You are a helpful assistant answering questions about a document. Use the provided context to answer the user's question. If the answer is not in the context, say "I couldn't find that information in this document." Cite the source page numbers when available.`;

    const messages: Array<{
      role: "user" | "assistant" | "system";
      content: string;
    }> = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${query}` },
    ];

    const result = await this.chat({
      messages,
      temperature: 0.3,
      maxTokens: 500,
    });

    // Extract citations from context (optional parsing)
    const citations: Array<{ page: number; text: string }> = [];
    // Simple heuristic: find "page" mentions
    const pageMatches = context.match(/\[Page (\d+)\]/gi);
    if (pageMatches) {
      const uniquePages = new Set(
        pageMatches.map((m) => parseInt(m.match(/\d+/)?.[0] || "0")),
      );
      for (const page of uniquePages) {
        if (page > 0) {
          citations.push({ page, text: "" });
        }
      }
    }

    return { text: result.text, citations };
  }
}
