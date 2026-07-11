import * as SQLite from "expo-sqlite";
import { FileModel } from "../models/FileModel";
import { logger } from "../utils/logger";

// Open database connection
const db = SQLite.openDatabaseSync("pdfsphere.db");

export class FileRepository {
  // ==================== Core File Operations ====================

  /**
   * Get all files from the database.
   */
  async getAllFiles(): Promise<FileModel[]> {
    try {
      const result = await db.getAllAsync(`
        SELECT id, name, uri, size, pages, lastModified, isFavorite, folderId, tags, metadata_json
        FROM files
        ORDER BY lastModified DESC
      `);
      return result.map((row) => this.mapRowToFileModel(row));
    } catch (error) {
      logger.error("Failed to get all files", error);
      throw error;
    }
  }

  /**
   * Get a single file by ID.
   */
  async getFileById(id: string): Promise<FileModel | undefined> {
    try {
      const result = await db.getAllAsync(
        "SELECT id, name, uri, size, pages, lastModified, isFavorite, folderId, tags, metadata_json FROM files WHERE id = ?",
        [id],
      );
      if (result.length === 0) return undefined;
      return this.mapRowToFileModel(result[0]);
    } catch (error) {
      logger.error(`Failed to get file by id ${id}`, error);
      throw error;
    }
  }

  /**
   * Insert or update a file.
   */
  async saveFile(file: FileModel): Promise<void> {
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO files (id, name, uri, size, pages, lastModified, isFavorite, folderId, tags, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          file.id,
          file.name,
          file.uri || null,
          file.size,
          file.pages || 0,
          file.lastModified.toISOString(),
          file.isFavorite ? 1 : 0,
          file.folderId || null,
          file.tags ? JSON.stringify(file.tags) : null,
          file.metadata ? JSON.stringify(file.metadata) : null,
        ],
      );
    } catch (error) {
      logger.error("Failed to save file", error);
      throw error;
    }
  }

  /**
   * Delete a file by ID.
   */
  async deleteFile(id: string): Promise<void> {
    try {
      // Also delete associated extracted text, AI caches, etc.
      await db.runAsync("DELETE FROM files WHERE id = ?", [id]);
      await db.runAsync("DELETE FROM extracted_text WHERE file_id = ?", [id]);
      await db.runAsync("DELETE FROM ai_metadata WHERE file_id = ?", [id]);
      await db.runAsync("DELETE FROM chunks WHERE file_id = ?", [id]);
      await db.runAsync("DELETE FROM conversations WHERE file_id = ?", [id]);
    } catch (error) {
      logger.error(`Failed to delete file ${id}`, error);
      throw error;
    }
  }

  /**
   * Toggle favorite status.
   */
  async toggleFavorite(id: string): Promise<void> {
    try {
      await db.runAsync(
        "UPDATE files SET isFavorite = CASE WHEN isFavorite = 1 THEN 0 ELSE 1 END WHERE id = ?",
        [id],
      );
    } catch (error) {
      logger.error(`Failed to toggle favorite for ${id}`, error);
      throw error;
    }
  }

  /**
   * Search files by name (partial match) or metadata.
   */
  async searchFiles(query: string): Promise<FileModel[]> {
    try {
      const result = await db.getAllAsync(
        `SELECT id, name, uri, size, pages, lastModified, isFavorite, folderId, tags, metadata_json
         FROM files
         WHERE name LIKE ? OR metadata_json LIKE ?
         ORDER BY lastModified DESC`,
        [`%${query}%`, `%${query}%`],
      );
      return result.map((row) => this.mapRowToFileModel(row));
    } catch (error) {
      logger.error("Search files failed", error);
      throw error;
    }
  }

  /**
   * Get recent files (limit).
   */
  async getRecentFiles(limit: number = 5): Promise<FileModel[]> {
    try {
      const result = await db.getAllAsync(
        `SELECT id, name, uri, size, pages, lastModified, isFavorite, folderId, tags, metadata_json
         FROM files
         ORDER BY lastModified DESC
         LIMIT ?`,
        [limit],
      );
      return result.map((row) => this.mapRowToFileModel(row));
    } catch (error) {
      logger.error("Failed to get recent files", error);
      throw error;
    }
  }

  // ==================== Extracted Text ====================

  /**
   * Save extracted text for a file.
   */
  async saveExtractedText(
    fileId: string,
    text: string,
    version: string = "v1",
  ): Promise<void> {
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO extracted_text (file_id, content, version, updated_at)
         VALUES (?, ?, ?, ?)`,
        [fileId, text, version, new Date().toISOString()],
      );
    } catch (error) {
      logger.error(`Failed to save extracted text for ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Get extracted text for a file.
   */
  async getExtractedText(fileId: string): Promise<string | null> {
    try {
      const result = await db.getAllAsync(
        "SELECT content FROM extracted_text WHERE file_id = ? ORDER BY updated_at DESC LIMIT 1",
        [fileId],
      );
      if (result.length === 0) return null;
      return result[0].content;
    } catch (error) {
      logger.error(`Failed to get extracted text for ${fileId}`, error);
      throw error;
    }
  }

  // ==================== AI Cache: Summary ====================

  /**
   * Save a summary for a file.
   */
  async saveSummary(
    fileId: string,
    summary: string,
    modelVersion: string = "deepseek-chat",
    promptVersion: string = "v1.0",
  ): Promise<void> {
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO ai_metadata (file_id, feature_type, content, model_version, prompt_version, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          fileId,
          "summary",
          summary,
          modelVersion,
          promptVersion,
          new Date().toISOString(),
        ],
      );
    } catch (error) {
      logger.error(`Failed to save summary for ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Get cached summary for a file.
   */
  async getSummary(fileId: string): Promise<string | null> {
    try {
      const result = await db.getAllAsync(
        `SELECT content FROM ai_metadata
         WHERE file_id = ? AND feature_type = 'summary'
         ORDER BY created_at DESC LIMIT 1`,
        [fileId],
      );
      if (result.length === 0) return null;
      return result[0].content;
    } catch (error) {
      logger.error(`Failed to get summary for ${fileId}`, error);
      throw error;
    }
  }

  // ==================== AI Cache: Translation ====================

  /**
   * Save a translation for a file.
   */
  async saveTranslation(
    fileId: string,
    targetLanguage: string,
    content: string,
  ): Promise<void> {
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO translations (file_id, target_language, content, created_at)
         VALUES (?, ?, ?, ?)`,
        [fileId, targetLanguage, content, new Date().toISOString()],
      );
    } catch (error) {
      logger.error(`Failed to save translation for ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Get cached translation for a file and language.
   */
  async getTranslation(
    fileId: string,
    targetLanguage: string,
  ): Promise<string | null> {
    try {
      const result = await db.getAllAsync(
        "SELECT content FROM translations WHERE file_id = ? AND target_language = ? ORDER BY created_at DESC LIMIT 1",
        [fileId, targetLanguage],
      );
      if (result.length === 0) return null;
      return result[0].content;
    } catch (error) {
      logger.error(`Failed to get translation for ${fileId}`, error);
      throw error;
    }
  }

  // ==================== AI Cache: Flashcards ====================

  /**
   * Save flashcards for a file.
   */
  async saveFlashcards(fileId: string, content: string): Promise<void> {
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO flashcards (file_id, content, created_at)
         VALUES (?, ?, ?)`,
        [fileId, content, new Date().toISOString()],
      );
    } catch (error) {
      logger.error(`Failed to save flashcards for ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Get cached flashcards for a file.
   */
  async getFlashcards(fileId: string): Promise<string | null> {
    try {
      const result = await db.getAllAsync(
        "SELECT content FROM flashcards WHERE file_id = ? ORDER BY created_at DESC LIMIT 1",
        [fileId],
      );
      if (result.length === 0) return null;
      return result[0].content;
    } catch (error) {
      logger.error(`Failed to get flashcards for ${fileId}`, error);
      throw error;
    }
  }

  // ==================== AI Cache: Quiz ====================

  /**
   * Save quiz for a file.
   */
  async saveQuiz(fileId: string, content: string): Promise<void> {
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO quiz_cache (file_id, content, created_at)
         VALUES (?, ?, ?)`,
        [fileId, content, new Date().toISOString()],
      );
    } catch (error) {
      logger.error(`Failed to save quiz for ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Get cached quiz for a file.
   */
  async getQuiz(fileId: string): Promise<string | null> {
    try {
      const result = await db.getAllAsync(
        "SELECT content FROM quiz_cache WHERE file_id = ? ORDER BY created_at DESC LIMIT 1",
        [fileId],
      );
      if (result.length === 0) return null;
      return result[0].content;
    } catch (error) {
      logger.error(`Failed to get quiz for ${fileId}`, error);
      throw error;
    }
  }

  // ==================== Private Helpers ====================

  /**
   * Map a database row to a FileModel object.
   */
  private mapRowToFileModel(row: any): FileModel {
    return {
      id: row.id,
      name: row.name,
      uri: row.uri || undefined,
      size: row.size,
      pages: row.pages || 0,
      lastModified: new Date(row.lastModified),
      isFavorite: row.isFavorite === 1,
      folderId: row.folderId || undefined,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      metadata: row.metadata_json ? JSON.parse(row.metadata_json) : undefined,
    };
  }
}

// Singleton instance
export const fileRepository = new FileRepository();
