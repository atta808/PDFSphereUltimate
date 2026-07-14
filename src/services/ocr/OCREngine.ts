import { extractTextFromImage } from 'expo-text-extractor';
import * as FileSystem from 'expo-file-system';

export type OCRResult = {
  text: string;
  language: string;
  confidence?: number;
};

export class OCREngine {
  /**
   * Extract text from an image URI.
   * @param imageUri Local file URI of the image.
   * @param languageHint Optional language hint (e.g., 'en', 'ur', 'ar').
   * @returns Extracted text.
   */
  async extractText(imageUri: string, languageHint?: string): Promise<OCRResult> {
    try {
      // Ensure the file exists
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error(`Image file not found: ${imageUri}`);
      }

      // Perform OCR
      const result = await extractTextFromImage(imageUri);

      // The result is an array of blocks with text and bounding boxes.
      // We combine them into a single string.
      const fullText = result.join(' ').trim();

      return {
        text: fullText,
        language: languageHint || 'en',
        confidence: 0.8, // Placeholder; actual confidence not provided by expo-text-extractor
      };
    } catch (error) {
      console.error('OCR extraction error:', error);
      throw new Error(`OCR failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract text from multiple images and combine results.
   * @param imageUris Array of local image URIs.
   * @param languageHint Optional language hint.
   * @returns Combined text.
   */
  async extractTextFromMultipleImages(imageUris: string[], languageHint?: string): Promise<OCRResult> {
    const results: string[] = [];
    for (const uri of imageUris) {
      try {
        const result = await this.extractText(uri, languageHint);
        results.push(result.text);
      } catch (err) {
        console.warn(`Skipping image ${uri}:`, err);
      }
    }
    return {
      text: results.join('\n\n'),
      language: languageHint || 'en',
      confidence: 0.8,
    };
  }
}