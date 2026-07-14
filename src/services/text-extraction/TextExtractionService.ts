import { digitalTextExtractor } from "./DigitalTextExtractor";
export class TextExtractionService {
  async getExtractedText(fileId: string): Promise<string> {
    return await digitalTextExtractor.extractAndCache(fileId);
  }
  async getDocumentText(fileId: string): Promise<string> {
    return await digitalTextExtractor.extractAndCache(fileId);
  }
}