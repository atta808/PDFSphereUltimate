import { AIProviderFactory } from '../ai/AIProviderFactory';
import { fileRepository } from '../../repository/FileRepository';
import { TextExtractionService } from '../text-extraction/TextExtractionService';

export class TranslationService {
  private aiProvider = AIProviderFactory.create();
  private textExtractionService = new TextExtractionService(); // adjust as needed

  /**
   * Translate full document text.
   * @param fileId Document ID.
   * @param targetLanguage Target language code (e.g., 'ur', 'es', 'fr').
   * @param options Optional sourceLanguage, forceRefresh.
   * @returns Translated text.
   */
  async translateDocument(fileId: string, targetLanguage: string, options?: { sourceLanguage?: string; forceRefresh?: boolean }): Promise<string> {
    // Check cache
    if (!options?.forceRefresh) {
      const cached = await fileRepository.getTranslation(fileId, targetLanguage);
      if (cached) return cached;
    }

    // Extract text
    const text = await this.textExtractionService.getDocumentText(fileId);
    if (!text) throw new Error('No text content found for this document.');

    // Translate
    const translated = await this.aiProvider.translate(text, targetLanguage, { sourceLanguage: options?.sourceLanguage });

    // Cache
    await fileRepository.saveTranslation(fileId, targetLanguage, translated);

    return translated;
  }

  /**
   * Translate a selected portion of text.
   * @param text The text snippet.
   * @param targetLanguage Target language code.
   * @param options Optional sourceLanguage.
   * @returns Translated text.
   */
  async translateText(text: string, targetLanguage: string, options?: { sourceLanguage?: string }): Promise<string> {
    return await this.aiProvider.translate(text, targetLanguage, { sourceLanguage: options?.sourceLanguage });
  }
}