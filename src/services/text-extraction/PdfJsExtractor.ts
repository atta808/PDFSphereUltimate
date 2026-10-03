import { File } from "expo-file-system";
import { logger } from "../../utils/logger";
import { fileRepository } from "../../repository/FileRepository";
import { WebViewBridge } from "./WebViewBridge";

/**
 * Interface for text extraction providers.
 * Implementations can use different backends (pdfjs-dist, native, etc.)
 */
export interface ITextExtractionProvider {
  /**
   * Extract text from a PDF file given its URI.
   * @param pdfUri Local file URI of the PDF.
   * @returns Extracted text as a string.
   */
  extractTextFromUri(pdfUri: string): Promise<string>;

  /**
   * Extract text from a PDF file by its file ID.
   * @param fileId ID of the file in the repository.
   * @returns Extracted text.
   */
  extractTextFromFileId(fileId: string): Promise<string>;

  /**
   * Check if a PDF contains selectable text.
   * @param pdfUri URI of the PDF.
   * @returns True if the PDF is digital (has selectable text).
   */
  isDigitalPdf(pdfUri: string): Promise<boolean>;
}

/**
 * Text extraction provider using pdfjs-dist via WebView.
 */
export class PdfJsExtractor implements ITextExtractionProvider {
  private webViewBridge: WebViewBridge | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the WebView bridge.
   * Must be called before any extraction.
   */
  initialize(): void {
    if (!this.isInitialized) {
      this.webViewBridge = new WebViewBridge();
      this.webViewBridge.initialize();
      this.isInitialized = true;
      logger.info("PdfJsExtractor initialized");
    }
  }

  /**
   * Ensure the WebView bridge is ready.
   * @throws If initialization fails or WebView times out.
   */
  private async ensureReady(): Promise<void> {
    if (!this.isInitialized) {
      this.initialize();
    }
    if (!this.webViewBridge) {
      throw new Error("WebView bridge not available");
    }
    await this.webViewBridge.waitForReady();
  }

  /**
   * Extract text from a PDF file URI.
   */
  async extractTextFromUri(pdfUri: string): Promise<string> {
    if (!pdfUri) {
      throw new Error("PDF URI is required");
    }

    await this.ensureReady();

    try {
      // Check if file exists
      const file = new File(pdfUri);
      if (!file.exists) {
        throw new Error(`PDF file not found: ${pdfUri}`);
      }

      // Read file as base64
      const base64 = await file.base64();

      // Send to WebView for extraction
      const result = await this.webViewBridge!.sendMessageAndWaitForResponse({
        type: "extractText",
        payload: base64,
      });

      if (result.type === "success") {
        return result.payload;
      } else {
        throw new Error(result.payload || "Extraction failed");
      }
    } catch (error) {
      logger.error("PdfJsExtractor extraction failed:", error);
      throw new Error(
        `Failed to extract text: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Extract text from a PDF by its file ID (fetches URI from repository).
   */
  async extractTextFromFileId(fileId: string): Promise<string> {
    const file = await fileRepository.getFileById(fileId);
    if (!file) {
      throw new Error(`File with ID ${fileId} not found`);
    }
    if (!file.uri) {
      throw new Error(`File ${fileId} has no local URI`);
    }
    return this.extractTextFromUri(file.uri);
  }

  /**
   * Determine if a PDF contains selectable text by attempting extraction.
   */
  async isDigitalPdf(pdfUri: string): Promise<boolean> {
    try {
      const text = await this.extractTextFromUri(pdfUri);
      return text.trim().length > 0;
    } catch (error) {
      // If extraction fails, assume it's a scanned PDF
      return false;
    }
  }

  /**
   * Extract text and optionally cache it in the repository.
   * @param fileId File ID.
   * @param forceRefresh If true, ignore cache.
   * @param updateSearchIndex If true, update search index after extraction.
   * @returns Extracted text.
   */
  async extractAndCache(
    fileId: string,
    forceRefresh: boolean = false,
    updateSearchIndex: boolean = true,
  ): Promise<string> {
    // Check cache
    if (!forceRefresh) {
      const cached = await fileRepository.getExtractedText(fileId);
      if (cached) {
        logger.debug(`Using cached extracted text for file ${fileId}`);
        return cached;
      }
    }

    // Extract fresh
    const text = await this.extractTextFromFileId(fileId);

    // Save to repository
    await fileRepository.saveExtractedText(fileId, text);

    // Update search index
    if (updateSearchIndex) {
      try {
        const { searchService } = await import("../search/SearchService");
        await searchService.updateFileIndex(fileId);
      } catch (e) {
        logger.warn("Failed to update search index after extraction:", e);
      }
    }

    return text;
  }

  /**
   * Dispose of the WebView bridge to free resources.
   */
  dispose(): void {
    if (this.webViewBridge) {
      this.webViewBridge.dispose();
      this.webViewBridge = null;
      this.isInitialized = false;
      logger.info("PdfJsExtractor disposed");
    }
  }
}

// Singleton instance for global use
export const pdfJsExtractor = new PdfJsExtractor();
