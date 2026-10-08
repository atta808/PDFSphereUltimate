import * as SQLite from "expo-sqlite";
import { FileModel } from "../models/FileModel";
import { FolderModel } from "../models/FolderModel";
import { logger } from "../utils/logger";

// Open database connection
const db = SQLite.openDatabaseSync("pdfsphere.db");

export class FileRepository {
  private readonly ready: Promise<void>;

  constructor() {
    this.ready = this.initialize();
  }

  private async initialize(): Promise<void> {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        uri TEXT,
        size INTEGER NOT NULL DEFAULT 0,
        pages INTEGER NOT NULL DEFAULT 0,
        lastModified TEXT NOT NULL,
        isFavorite INTEGER NOT NULL DEFAULT 0,
        folderId TEXT,
        tags TEXT,
        metadata_json TEXT
      );
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        parentId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parentId);
      CREATE TABLE IF NOT EXISTS extracted_text (
        file_id TEXT NOT NULL,
        content TEXT NOT NULL,
        version TEXT NOT NULL DEFAULT 'v1',
        updated_at TEXT NOT NULL,
        PRIMARY KEY (file_id, version)
      );
      CREATE TABLE IF NOT EXISTS ai_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id TEXT NOT NULL,
        feature_type TEXT NOT NULL,
        content TEXT NOT NULL,
        model_version TEXT,
        prompt_version TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS translations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id TEXT NOT NULL,
        target_language TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS flashcards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS quiz_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        page_numbers TEXT,
        extraction_version TEXT,
        UNIQUE(file_id, chunk_index)
      );
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT 'New Chat',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        message_count INTEGER NOT NULL DEFAULT 0,
        archived INTEGER NOT NULL DEFAULT 0,
        pinned INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        citations TEXT,
        model_version TEXT,
        prompt_version TEXT,
        retrieval_version TEXT,
        chunk_ids TEXT,
        interrupted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_files_last_modified ON files(lastModified DESC);
      CREATE INDEX IF NOT EXISTS idx_extracted_text_file ON extracted_text(file_id);
      CREATE INDEX IF NOT EXISTS idx_ai_metadata_file ON ai_metadata(file_id, feature_type);
      CREATE INDEX IF NOT EXISTS idx_translations_file ON translations(file_id, target_language);
      CREATE INDEX IF NOT EXISTS idx_chunks_file ON chunks(file_id, chunk_index);
      CREATE INDEX IF NOT EXISTS idx_conversations_file ON conversations(file_id, updated_at);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
    `);
  }

  // ==================== Core File Operations ====================

  /**
   * Get all files from the database.
   */
  async getAllFiles(): Promise<FileModel[]> {
    await this.ready;
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
    await this.ready;
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
    await this.ready;
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
    await this.ready;
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
    await this.ready;
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
    await this.ready;
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
    await this.ready;
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

  // ==================== V2 Document Workspace ====================

  /**
   * Get documents marked as favorites.
   */
  async getFavoriteFiles(): Promise<FileModel[]> {
    await this.ready;
    try {
      const result = await db.getAllAsync(
        `SELECT id, name, uri, size, pages, lastModified, isFavorite, folderId, tags, metadata_json
         FROM files
         WHERE isFavorite = 1
         ORDER BY lastModified DESC`,
      );
      return result.map((row) => this.mapRowToFileModel(row));
    } catch (error) {
      logger.error("Failed to get favorite files", error);
      throw error;
    }
  }

  /**
   * Rename a document without replacing any other document fields.
   */
  async renameFile(id: string, name: string): Promise<void> {
    await this.ready;
    try {
      await db.runAsync("UPDATE files SET name = ? WHERE id = ?", [name, id]);
    } catch (error) {
      logger.error(`Failed to rename file ${id}`, error);
      throw error;
    }
  }

  /**
   * Move a document to a folder. null means the workspace root.
   */
  async moveFileToFolder(id: string, folderId: string | null): Promise<void> {
    await this.ready;
    try {
      await db.runAsync("UPDATE files SET folderId = ? WHERE id = ?", [folderId, id]);
    } catch (error) {
      logger.error(`Failed to move file ${id}`, error);
      throw error;
    }
  }

  /**
   * List folders at a given level.
   */
  async getFolders(parentId: string | null = null): Promise<FolderModel[]> {
    await this.ready;
    try {
      const result = await db.getAllAsync(
        `SELECT id, name, parentId, createdAt, updatedAt
         FROM folders
         WHERE parentId IS ?
         ORDER BY name COLLATE NOCASE ASC`,
        [parentId],
      );
      return result.map((row) => this.mapRowToFolderModel(row));
    } catch (error) {
      logger.error("Failed to get folders", error);
      throw error;
    }
  }

  /**
   * Create a persistent folder.
   */
  async createFolder(name: string, parentId: string | null = null): Promise<FolderModel> {
    await this.ready;
    const now = new Date().toISOString();
    const id = `folder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      await db.runAsync(
        `INSERT INTO folders (id, name, parentId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?)`,
        [id, name, parentId, now, now],
      );
      return { id, name, parentId, createdAt: new Date(now), updatedAt: new Date(now) };
    } catch (error) {
      logger.error("Failed to create folder", error);
      throw error;
    }
  }

  /**
   * Rename a folder.
   */
  async renameFolder(id: string, name: string): Promise<void> {
    await this.ready;
    try {
      await db.runAsync(
        "UPDATE folders SET name = ?, updatedAt = ? WHERE id = ?",
        [name, new Date().toISOString(), id],
      );
    } catch (error) {
      logger.error(`Failed to rename folder ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete a folder without deleting documents. Child folders are promoted to the root.
   */
  async deleteFolder(id: string): Promise<void> {
    await this.ready;
    try {
      await db.runAsync("UPDATE files SET folderId = NULL WHERE folderId = ?", [id]);
      await db.runAsync("UPDATE folders SET parentId = NULL, updatedAt = ? WHERE parentId = ?", [new Date().toISOString(), id]);
      await db.runAsync("DELETE FROM folders WHERE id = ?", [id]);
    } catch (error) {
      logger.error(`Failed to delete folder ${id}`, error);
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
    await this.ready;
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
    await this.ready;
    try {
      const result = await db.getAllAsync(
        "SELECT content FROM extracted_text WHERE file_id = ? ORDER BY updated_at DESC LIMIT 1",
        [fileId],
      );
      if (result.length === 0) return null;
      return (result[0] as any).content;
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
    await this.ready;
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
    await this.ready;
    try {
      const result = await db.getAllAsync(
        `SELECT content FROM ai_metadata
         WHERE file_id = ? AND feature_type = 'summary'
         ORDER BY created_at DESC LIMIT 1`,
        [fileId],
      );
      if (result.length === 0) return null;
      return (result[0] as any).content;
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
    await this.ready;
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
    await this.ready;
    try {
      const result = await db.getAllAsync(
        "SELECT content FROM translations WHERE file_id = ? AND target_language = ? ORDER BY created_at DESC LIMIT 1",
        [fileId, targetLanguage],
      );
      if (result.length === 0) return null;
      return (result[0] as any).content;
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
    await this.ready;
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
    await this.ready;
    try {
      const result = await db.getAllAsync(
        "SELECT content FROM flashcards WHERE file_id = ? ORDER BY created_at DESC LIMIT 1",
        [fileId],
      );
      if (result.length === 0) return null;
      return (result[0] as any).content;
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
    await this.ready;
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
    await this.ready;
    try {
      const result = await db.getAllAsync(
        "SELECT content FROM quiz_cache WHERE file_id = ? ORDER BY created_at DESC LIMIT 1",
        [fileId],
      );
      if (result.length === 0) return null;
      return (result[0] as any).content;
    } catch (error) {
      logger.error(`Failed to get quiz for ${fileId}`, error);
      throw error;
    }
  }

  // ==================== Private Helpers ====================

  /**
   * Map a database row to a FileModel object.
   */
  private mapRowToFolderModel(row: any): FolderModel {
    return {
      id: row.id,
      name: row.name,
      parentId: row.parentId || null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

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
