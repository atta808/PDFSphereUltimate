import { AIProviderFactory } from '../../services/ai/AIProviderFactory';
import { fileRepository } from '../../repository/FileRepository';
import { logger } from '../../utils/logger';

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

export interface GenerateQuizInput {
  fileId: string;
  count?: number;
  forceRefresh?: boolean;
}

export interface GenerateQuizOutput {
  questions: QuizQuestion[];
  cached: boolean;
  fileId: string;
  questionCount: number;
}

/**
 * Use case for generating a multiple-choice quiz from a document.
 * Orchestrates text extraction, AI quiz generation, and caching.
 */
export class GenerateQuizUseCase {
  private aiProvider = AIProviderFactory.create();

  /**
   * Execute the quiz generation use case.
   */
  async execute(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
    const { fileId, count = 5, forceRefresh = false } = input;

    try {
      // 1. Validate the file exists
      const file = await fileRepository.getFileById(fileId);
      if (!file) {
        throw new Error(`File with ID ${fileId} not found`);
      }

      // 2. Check cache (unless force refresh)
      if (!forceRefresh) {
        const cached = await fileRepository.getQuiz(fileId);
        if (cached) {
          const questions: QuizQuestion[] = JSON.parse(cached);
          if (questions.length > 0) {
            logger.debug(`Using cached quiz for file ${fileId}`);
            return {
              questions,
              cached: true,
              fileId,
              questionCount: questions.length,
            };
          }
        }
      }

      // 3. Get extracted text
      let extractedText = await fileRepository.getExtractedText(fileId);
      if (!extractedText) {
        // Try to extract text using the digital text extractor
        try {
          const { digitalTextExtractor } = await import('../../services/text-extraction/DigitalTextExtractor');
          extractedText = await digitalTextExtractor.extractAndCache(fileId);
        } catch (extractError) {
          logger.error('Failed to extract text for quiz generation:', extractError);
          throw new Error('No text content available for this document. Please ensure the document has been processed.');
        }
      }

      if (!extractedText || extractedText.trim().length < 100) {
        throw new Error('Document text is too short to generate a meaningful quiz. Please use a longer document.');
      }

      // 4. Generate quiz using AI
      const questions = await this.aiProvider.generateQuiz(extractedText, count);

      if (!questions || questions.length === 0) {
        throw new Error('AI failed to generate quiz questions. Please try again.');
      }

      // 5. Cache the result
      await fileRepository.saveQuiz(fileId, JSON.stringify(questions));
      logger.debug(`Generated and cached ${questions.length} quiz questions for file ${fileId}`);

      return {
        questions,
        cached: false,
        fileId,
        questionCount: questions.length,
      };
    } catch (error) {
      logger.error('GenerateQuizUseCase error:', error);
      throw new Error(
        `Failed to generate quiz: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get cached quiz if available, without regenerating.
   */
  async getCachedQuiz(fileId: string): Promise<GenerateQuizOutput | null> {
    try {
      const cached = await fileRepository.getQuiz(fileId);
      if (cached) {
        const questions: QuizQuestion[] = JSON.parse(cached);
        if (questions.length > 0) {
          return {
            questions,
            cached: true,
            fileId,
            questionCount: questions.length,
          };
        }
      }
      return null;
    } catch (error) {
      logger.error('Failed to get cached quiz:', error);
      return null;
    }
  }

  /**
   * Generate quiz from raw text without caching.
   * Useful for preview or testing.
   */
  async generateFromText(text: string, count: number = 5): Promise<QuizQuestion[]> {
    if (!text || text.trim().length < 100) {
      throw new Error('Text is too short to generate a meaningful quiz.');
    }
    return this.aiProvider.generateQuiz(text, count);
  }
}