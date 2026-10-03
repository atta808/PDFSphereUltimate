import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('pdfsphere.db');

export interface Chunk {
  id?: number;
  fileId: string;
  chunkIndex: number;
  content: string;
  pageNumbers?: number[];
  extractionVersion?: string;
}

export class ChunkingService {
  /**
   * Chunk text into overlapping segments.
   * @param text Full document text.
   * @param chunkSize Approximate number of characters per chunk (1000 chars ≈ 250 tokens).
   * @param overlap Number of characters to overlap.
   * @returns Array of chunk contents.
   */
  private splitText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    if (!text) return chunks;
    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + chunkSize, text.length);
      // Try to break at a sentence boundary (., !, ?) or space
      if (end < text.length) {
        const breakChars = ['.', '!', '?', '\n'];
        let found = false;
        for (const ch of breakChars) {
          const pos = text.lastIndexOf(ch, end);
          if (pos > start + chunkSize * 0.5) {
            end = pos + 1;
            found = true;
            break;
          }
        }
        if (!found) {
          const spacePos = text.lastIndexOf(' ', end);
          if (spacePos > start + chunkSize * 0.5) {
            end = spacePos;
          }
        }
      }
      const chunk = text.substring(start, end).trim();
      if (chunk) chunks.push(chunk);
      start = Math.max(start + 1, end - overlap);
      if (start >= text.length) break;
    }
    return chunks;
  }

  /**
   * Chunk and store chunks for a document.
   * @param fileId Document ID.
   * @param text Full document text.
   * @param extractionVersion Version of extraction.
   */
  async chunkDocument(fileId: string, text: string, extractionVersion: string = 'v1'): Promise<void> {
    // Remove existing chunks
    await db.runAsync('DELETE FROM chunks WHERE file_id = ?', fileId);

    const chunkTexts = this.splitText(text);
    for (let i = 0; i < chunkTexts.length; i++) {
      await db.runAsync(
        `INSERT INTO chunks (file_id, chunk_index, content, extraction_version)
         VALUES (?, ?, ?, ?)`,
        [fileId, i, chunkTexts[i], extractionVersion]
      );
    }
  }

  /**
   * Get chunks for a document.
   * @param fileId Document ID.
   * @returns Array of chunks with content and index.
   */
  async getChunks(fileId: string): Promise<Chunk[]> {
    const result = await db.getAllAsync(
      'SELECT id, chunk_index, content, page_numbers, extraction_version FROM chunks WHERE file_id = ? ORDER BY chunk_index',
      [fileId]
    );
    if (result && result.length > 0) {
      return result.map((row: any) => ({
        id: row.id,
        fileId: fileId,
        chunkIndex: row.chunk_index,
        content: row.content,
        pageNumbers: row.page_numbers ? JSON.parse(row.page_numbers) : undefined,
        extractionVersion: row.extraction_version,
      }));
    }
    return [];
  }

  /**
   * Check if chunks exist for a document.
   */
  async hasChunks(fileId: string): Promise<boolean> {
    const result = await db.getAllAsync('SELECT COUNT(*) as count FROM chunks WHERE file_id = ?', fileId);
    if (result && result.length > 0) {
      return (result[0] as any).count > 0;
    }
    return false;
  }
}