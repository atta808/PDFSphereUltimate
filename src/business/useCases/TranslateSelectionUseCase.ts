import { AIProviderFactory } from "../../services/ai/AIProviderFactory";
import { logger } from "../../utils/logger";

export interface TranslateSelectionInput {
  selectedText: string;
  targetLanguage: string;
  sourceLanguage?: string; // Optional: auto-detect if not provided
}

export interface TranslateSelectionOutput {
  originalText: string;
  translatedText: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

/**
 * Use case for translating a selected portion of text.
 * Unlike TranslateDocumentUseCase, this does NOT cache the result
 * (translations of selections are typically one-off and not reused).
 */
export class TranslateSelectionUseCase {
  private aiProvider = AIProviderFactory.create();

  /**
   * Execute the translation of a text selection.
   */
  async execute(
    input: TranslateSelectionInput,
  ): Promise<TranslateSelectionOutput> {
    const { selectedText, targetLanguage, sourceLanguage } = input;

    try {
      // 1. Validate input
      if (!selectedText || selectedText.trim().length === 0) {
        throw new Error("No text selected for translation");
      }

      if (!targetLanguage || targetLanguage.trim().length === 0) {
        throw new Error("Target language is required");
      }

      if (selectedText.length > 10000) {
        throw new Error(
          "Selected text is too long for translation (max 10,000 characters).",
        );
      }

      // 2. Translate using AI
      const translatedText = await this.aiProvider.translate(
        selectedText,
        targetLanguage,
      );

      // 3. Return result
      return {
        originalText: selectedText,
        translatedText,
        targetLanguage,
        sourceLanguage,
      };
    } catch (error) {
      logger.error("TranslateSelectionUseCase error:", error);
      throw new Error(
        `Failed to translate selection: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Translate multiple text selections (batch).
   * @param selections Array of text selections with target languages.
   */
  async executeBatch(
    selections: Array<{
      selectedText: string;
      targetLanguage: string;
      sourceLanguage?: string;
    }>,
  ): Promise<TranslateSelectionOutput[]> {
    const results: TranslateSelectionOutput[] = [];
    for (const selection of selections) {
      try {
        const result = await this.execute(selection);
        results.push(result);
      } catch (error) {
        logger.error("Batch translation failed for selection:", error);
        // Re-throw with context
        throw new Error(
          `Batch translation failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    return results;
  }

  /**
   * Detect language of the selected text (if supported by the AI provider).
   * Note: This is a convenience method and may not be supported by all providers.
   */
  async detectLanguage(text: string): Promise<string | null> {
    try {
      // This uses the translation method with a detection prompt
      // Not all providers support language detection directly
      const result = await this.aiProvider.translate(text, "english", {
        temperature: 0,
      });
      // Simple heuristic: if the translation is the same as the original, it's English
      // This is a fallback; a real implementation would use a dedicated language detection API
      return result === text ? "en" : null;
    } catch (error) {
      logger.warn("Language detection failed:", error);
      return null;
    }
  }
}
