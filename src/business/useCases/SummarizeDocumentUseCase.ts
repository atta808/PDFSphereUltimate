import { AIProviderFactory } from '../../services/ai/AIProviderFactory';
import { fileRepository } from '../../repository/FileRepository';
import { TextExtractionService } from '../../services/text-extraction/TextExtractionService'; // assuming we have one

export class SummarizeDocumentUseCase {
  private aiProvider = AIProviderFactory.create();

  async execute(fileId: string, options?: { forceRefresh?: boolean }): Promise<{ summary: string; cached: boolean }> {
    // 1. Check cache
    if (!options?.forceRefresh) {
      const cached = await fileRepository.getSummary(fileId);
      if (cached) {
        return { summary: cached, cached: true };
      }
    }

    // 2. Extract document text (using existing extraction service)
    const textExtraction = new TextExtractionService(); // or get from DI
    const document = await textExtraction.getDocumentText(fileId);
    if (!document) {
      throw new Error('No text content found for this document.');
    }

    // 3. Call AI provider to summarize
    const summary = await this.aiProvider.summarize(document);

    // 4. Cache the result
    await fileRepository.saveSummary(fileId, summary);

    return { summary, cached: false };
  }
}