import * as FileSystem from "expo-file-system";
import { logger } from "../../utils/logger";
import { fileRepository } from "../../repository/FileRepository";
import { WebViewBridge } from "./WebViewBridge";

/**
 * Service for extracting text from digital PDFs (PDFs with selectable text).
 * Uses pdfjs-dist via a hidden WebView to parse and extract text content.
 */
export class DigitalTextExtractor {
  private webViewBridge: WebViewBridge | null = null;

  /**
   * Initialize the WebView bridge.
   * Must be called before any extraction, preferably during app startup.
   */
  initialize(): void {
    if (!this.webViewBridge) {
      this.webViewBridge = new WebViewBridge();
      this.webViewBridge.initialize();
      logger.info("DigitalTextExtractor initialized");
    }
  }

  /**
   * Ensure the WebView bridge is ready.
   */
  private async ensureReady(): Promise<void> {
    if (!this.webViewBridge) {
      this.initialize();
    }
    // Wait for the WebView to be ready
    await this.webViewBridge?.waitForReady();
  }

  /**
   * Extract text from a PDF file given its URI.
   * @param pdfUri Local file URI of the PDF.
   * @returns Extracted text as a string.
   */
  async extractTextFromUri(pdfUri: string): Promise<string> {
    if (!pdfUri) {
      throw new Error("PDF URI is required");
    }

    await this.ensureReady();

    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(pdfUri);
      if (!fileInfo.exists) {
        throw new Error(`PDF file not found: ${pdfUri}`);
      }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(pdfUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

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
      logger.error("Text extraction failed:", error);
      throw new Error(
        `Failed to extract text: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Extract text from a PDF file by its file ID (retrieves URI from repository).
   * @param fileId ID of the file in the repository.
   * @returns Extracted text.
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
   * Extract text and cache it in the repository.
   * @param fileId ID of the file.
   * @param forceRefresh If true, re-extract even if cached.
   * @returns The extracted text.
   */
  async extractAndCache(
    fileId: string,
    forceRefresh: boolean = false,
  ): Promise<string> {
    // Check cache first
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

    // Also update search index
    try {
      const file = await fileRepository.getFileById(fileId);
      if (file) {
        const { searchService } = await import("../search/SearchService");
        await searchService.updateFileIndex(fileId);
      }
    } catch (e) {
      logger.warn("Failed to update search index after extraction:", e);
    }

    return text;
  }

  /**
   * Extract text from multiple PDF files.
   * @param fileIds Array of file IDs.
   * @param progressCallback Optional progress callback.
   * @returns Map of fileId to extracted text.
   */
  async extractBatch(
    fileIds: string[],
    progressCallback?: (current: number, total: number, fileId: string) => void,
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const total = fileIds.length;

    for (let i = 0; i < total; i++) {
      const fileId = fileIds[i];
      try {
        const text = await this.extractAndCache(fileId);
        results.set(fileId, text);
      } catch (error) {
        logger.error(`Failed to extract text from file ${fileId}:`, error);
        // Store error as empty string or rethrow? We'll store empty string but log.
        results.set(fileId, "");
      }
      if (progressCallback) {
        progressCallback(i + 1, total, fileId);
      }
    }

    return results;
  }

  /**
   * Check if a PDF is digital (contains selectable text) by attempting extraction.
   * A successful extraction with non‑empty text indicates a digital PDF.
   * @param pdfUri URI of the PDF.
   * @returns True if the PDF contains selectable text.
   */
  async isDigitalPdf(pdfUri: string): Promise<boolean> {
    try {
      const text = await this.extractTextFromUri(pdfUri);
      return text.trim().length > 0;
    } catch (error) {
      // If extraction fails, assume scanned PDF
      return false;
    }
  }
}

// Singleton instance
export const digitalTextExtractor = new DigitalTextExtractor();
