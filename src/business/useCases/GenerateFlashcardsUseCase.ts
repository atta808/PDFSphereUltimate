import { AIProviderFactory } from '../../services/ai/AIProviderFactory';
import { fileRepository } from '../../repository/FileRepository';
import { TextExtractionService } from '../../services/text-extraction/TextExtractionService';

export class GenerateFlashcardsUseCase {
  private aiProvider = AIProviderFactory.create();

  async execute(fileId: string, count?: number): Promise<Array<{ question: string; answer: string }>> {
    // Check cache
    const cached = await fileRepository.getFlashcards(fileId);
    if (cached) {
      return JSON.parse(cached);
    }

    // Extract text
    const textExtraction = new TextExtractionService();
    const document = await textExtraction.getDocumentText(fileId);
    if (!document) {
      throw new Error('No text content found for this document.');
    }

    // Generate
    const flashcards = await this.aiProvider.generateFlashcards(document, count);

    // Cache
    await fileRepository.saveFlashcards(fileId, JSON.stringify(flashcards));

    return flashcards;
  }
}