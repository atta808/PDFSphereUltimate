import { AIProviderFactory } from '../../services/ai/AIProviderFactory';
import { fileRepository } from '../../repository/FileRepository';
import { TextExtractionService } from '../../services/text-extraction/TextExtractionService';

export class TranslateDocumentUseCase {
  private aiProvider = AIProviderFactory.create();

  async execute(fileId: string, targetLanguage: string, forceRefresh: boolean = false): Promise<string> {
    // Check cache
    if (!forceRefresh) {
      const cached = await fileRepository.getTranslation(fileId, targetLanguage);
      if (cached) {
        return cached;
      }
    }

    // Extract text
    const textExtraction = new TextExtractionService();
    const document = await textExtraction.getDocumentText(fileId);
    if (!document) {
      throw new Error('No text content found for this document.');
    }

    // Translate
    const translation = await this.aiProvider.translate(document, targetLanguage);

    // Cache
    await fileRepository.saveTranslation(fileId, targetLanguage, translation);

    return translation;
  }
}