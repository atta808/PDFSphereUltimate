import * as SQLite from 'expo-sqlite';
import { FileModel } from '../../models/FileModel';
import { fileRepository } from '../../repository/FileRepository';
import { logger } from '../../utils/logger';

const db = SQLite.openDatabaseSync('pdfsphere.db');

export interface SearchResult {
  fileId: string;
  score: number;
}

export class SearchService {
  /**
   * Ensure the FTS5 virtual table exists.
   * Called during app initialization.
   */
  async ensureSearchIndex(): Promise<void> {
    try {
      // Check if the FTS5 table exists
      const result = await db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='files_fts'"
      );
      if (result.length === 0) {
        // Create the FTS5 virtual table
        await db.execAsync(`
          CREATE VIRTUAL TABLE IF NOT EXISTS files_fts USING fts5(
            file_id UNINDEXED,
            name,
            content,
            tokenize = 'unicode61'
          )
        `);
        logger.info('FTS5 search table created');
        // Index all existing files
        await this.rebuildIndex();
      }
    } catch (error) {
      logger.error('Failed to ensure search index:', error);
      throw error;
    }
  }

  /**
   * Index a file for full-text search.
   * @param fileId ID of the file.
   * @param name File name.
   * @param content Extracted text (optional).
   */
  async indexFile(fileId: string, name: string, content: string = ''): Promise<void> {
    try {
      // Remove existing entry
      await db.runAsync('DELETE FROM files_fts WHERE file_id = ?', fileId);
      // Insert new entry
      await db.runAsync(
        'INSERT INTO files_fts(file_id, name, content) VALUES (?, ?, ?)',
        [fileId, name, content]
      );
      logger.debug(`Indexed file: ${fileId}`);
    } catch (error) {
      logger.error(`Failed to index file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a file from the search index.
   * @param fileId ID of the file.
   */
  async removeFromIndex(fileId: string): Promise<void> {
    try {
      await db.getAllAsync('DELETE FROM files_fts WHERE file_id = ?', fileId);
      logger.debug(`Removed file from index: ${fileId}`);
    } catch (error) {
      logger.error(`Failed to remove file ${fileId} from index:`, error);
      throw error;
    }
  }

  /**
   * Search for files matching a query.
   * @param query Search string.
   * @param topK Maximum number of results (default 20).
   * @returns Array of file IDs with relevance scores.
   */
  async search(query: string, topK: number = 20): Promise<SearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    // Sanitize query for FTS5: allow prefix search with *
    // Remove special characters except spaces
    const sanitized = query.trim().replace(/[^a-zA-Z0-9\s]/g, ' ');
    // Create a tokenized query: add * for prefix matching on each word
    const searchTerm = sanitized.split(/\s+/).map(term => term + '*').join(' ');

    try {
      const results = await db.getAllAsync(
        `SELECT file_id, rank as score
         FROM files_fts
         WHERE files_fts MATCH ?
         ORDER BY rank
         LIMIT ?`,
        [searchTerm, topK]
      );
      return results.map((row: any) => ({
        fileId: row.file_id,
        score: row.score || 0,
      }));
    } catch (error) {
      logger.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Search and return full file objects.
   * @param query Search query.
   * @param topK Maximum number of results.
   * @returns Array of FileModel objects matching the query.
   */
  async searchFiles(query: string, topK: number = 20): Promise<FileModel[]> {
    if (!query.trim()) {
      return [];
    }

    const results = await this.search(query, topK);
    if (results.length === 0) {
      return [];
    }

    // Fetch full file objects for each result
    const files: FileModel[] = [];
    for (const { fileId } of results) {
      const file = await fileRepository.getFileById(fileId);
      if (file) {
        files.push(file);
      }
    }
    return files;
  }

  /**
   * Rebuild the entire search index from all files.
   * Use this after bulk operations or initial setup.
   */
  async rebuildIndex(): Promise<void> {
    try {
      // Clear existing index
      await db.runAsync('DELETE FROM files_fts');
      // Get all files and index them
      const files = await fileRepository.getAllFiles();
      for (const file of files) {
        // Check if we have extracted text for this file
        let extractedText = '';
        try {
          const text = await fileRepository.getExtractedText(file.id);
          if (text) extractedText = text;
        } catch (e) {
          // ignore
        }
        await this.indexFile(file.id, file.name, extractedText);
      }
      logger.info(`Rebuilt search index: ${files.length} files indexed`);
    } catch (error) {
      logger.error('Failed to rebuild search index:', error);
      throw error;
    }
  }

  /**
   * Update the search index for a file after its content or name changes.
   * @param fileId ID of the file.
   */
  async updateFileIndex(fileId: string): Promise<void> {
    const file = await fileRepository.getFileById(fileId);
    if (!file) {
      await this.removeFromIndex(fileId);
      return;
    }
    let extractedText = '';
    try {
      const text = await fileRepository.getExtractedText(fileId);
      if (text) extractedText = text;
    } catch (e) {
      // ignore
    }
    await this.indexFile(fileId, file.name, extractedText);
  }

  /**
   * Perform a simple keyword search using LIKE (fallback if FTS is not available).
   * This is less efficient but works without FTS.
   * @param query Search query.
   * @returns Array of FileModel objects.
   */
  async searchFilesLike(query: string): Promise<FileModel[]> {
    if (!query.trim()) {
      return [];
    }
    const files = await fileRepository.getAllFiles();
    const lowerQuery = query.toLowerCase().trim();
    return files.filter(file =>
      file.name.toLowerCase().includes(lowerQuery) ||
      file.metadata?.author?.toLowerCase().includes(lowerQuery) ||
      file.metadata?.title?.toLowerCase().includes(lowerQuery)
    );
  }
}

// Singleton instance
export const searchService = new SearchService();