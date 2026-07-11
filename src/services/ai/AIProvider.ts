/**
 * Abstract interface for AI providers.
 * All AI providers (DeepSeek, Gemini, OpenAI, Claude, etc.) must implement this interface.
 */
export interface AIProvider {
  /**
   * Generate a summary of the given text.
   * @param text The text to summarize.
   * @param options Optional parameters (maxTokens, temperature).
   * @returns A summary string.
   */
  summarize(
    text: string,
    options?: { maxTokens?: number; temperature?: number },
  ): Promise<string>;

  /**
   * Translate the given text to the target language.
   * @param text The text to translate.
   * @param targetLanguage The target language code (e.g., 'en', 'ur', 'ar').
   * @param options Optional parameters.
   * @returns The translated text.
   */
  translate(
    text: string,
    targetLanguage: string,
    options?: { temperature?: number },
  ): Promise<string>;

  /**
   * Generate flashcards from the given text.
   * @param text The document text.
   * @param count Number of flashcards to generate.
   * @returns An array of { question, answer } objects.
   */
  generateFlashcards(
    text: string,
    count?: number,
  ): Promise<Array<{ question: string; answer: string }>>;

  /**
   * Generate a multiple-choice quiz from the given text.
   * @param text The document text.
   * @param count Number of questions to generate.
   * @returns An array of { question, options, correct } objects.
   */
  generateQuiz(
    text: string,
    count?: number,
  ): Promise<Array<{ question: string; options: string[]; correct: number }>>;

  /**
   * Chat with the AI using a conversation context.
   * @param options Chat options including messages, context, and streaming.
   * @returns The assistant's response.
   */
  chat(options: {
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    onToken?: (token: string) => void;
  }): Promise<{
    text: string;
    citations?: Array<{ page: number; text: string }>;
  }>;

  /**
   * Generate a response based on a RAG pipeline: retrieve relevant chunks and answer.
   * This is a convenience method that combines retrieval and chat.
   * @param query The user's question.
   * @param context The retrieved context chunks.
   * @param conversationHistory Previous messages.
   * @returns The answer with citations.
   */
  answerWithContext?(
    query: string,
    context: string,
    conversationHistory?: Array<{
      role: "user" | "assistant";
      content: string;
    }>,
  ): Promise<{
    text: string;
    citations?: Array<{ page: number; text: string }>;
  }>;
}

/**
 * Supported AI provider types.
 */
export const AIProviderType = {
  DEEPSEEK: "deepseek",
  GEMINI: "gemini",
  OPENAI: "openai",
  CLAUDE: "claude",
} as const;

export type AIProviderType =
  (typeof AIProviderType)[keyof typeof AIProviderType];

/**
 * Factory function type for creating AI provider instances.
 */
export type AIProviderFactory = (
  type: AIProviderType,
  config?: { apiKey?: string; baseURL?: string },
) => AIProvider;
