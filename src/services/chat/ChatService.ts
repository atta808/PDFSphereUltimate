import * as SQLite from 'expo-sqlite';
import { RetrievalService, RetrievedChunk } from './RetrievalService';
import { ChunkingService } from './ChunkingService';
import { AIProviderFactory } from '../ai/AIProviderFactory';
import { fileRepository } from '../../repository/FileRepository';

const db = SQLite.openDatabaseSync('pdfsphere.db');

export interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ page: number; text: string; chunkId?: number }>;
  modelVersion?: string;
  promptVersion?: string;
  retrievalVersion?: string;
  chunkIds?: number[];
  interrupted?: boolean;
  createdAt?: string;
}

export interface Conversation {
  id?: number;
  fileId: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  messageCount?: number;
  archived?: boolean;
  pinned?: boolean;
}

export class ChatService {
  private retrievalService = new RetrievalService();
  private chunkingService = new ChunkingService();
  private aiProvider = AIProviderFactory.create();

  /**
   * Create a new conversation.
   */
  async createConversation(fileId: string, title: string = 'New Chat'): Promise<number> {
    const result = await db.getAllAsync(`INSERT INTO conversations (file_id, title) VALUES (?, ?) RETURNING id`, fileId, title);
    if (result && result.length > 0) {
      return (result[0] as any).id;
    }
    throw new Error('Failed to create conversation');
  }

  /**
   * Get conversations for a document.
   */
  async getConversations(fileId: string): Promise<Conversation[]> {
    const result = await db.getAllAsync(`SELECT id, file_id, title, created_at, updated_at, message_count, archived, pinned
       FROM conversations
       WHERE file_id = ? AND archived = 0
       ORDER BY updated_at DESC`, fileId);
    if (result && result.length > 0) {
      return result.map((row: any) => ({
        id: row.id,
        fileId: row.file_id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        messageCount: row.message_count,
        archived: row.archived === 1,
        pinned: row.pinned === 1,
      }));
    }
    return [];
  }

  /**
   * Send a message in a conversation (RAG pipeline).
   */
  async sendMessage(
    conversationId: number,
    userMessage: string,
    options?: { topK?: number; temperature?: number }
  ): Promise<{ response: string; citations: Array<{ page: number; text: string }> }> {
    // 1. Get conversation to know fileId
    const convResult = await db.getAllAsync('SELECT file_id FROM conversations WHERE id = ?', conversationId);
    if (!convResult || !convResult[0] || convResult.length === 0) {
      throw new Error('Conversation not found');
    }
    const fileId = (convResult[0] as any).file_id;

    // 2. Ensure chunks exist
    const hasChunks = await this.chunkingService.hasChunks(fileId);
    if (!hasChunks) {
      // Extract text and chunk
      const doc = await fileRepository.getFileById(fileId);
      if (!doc) throw new Error('Document not found');
      // We need to get extracted text – assume we have a method to get it.
      // For now, we'll just extract from file using our text extraction service.
      // I'll use a placeholder; in real implementation, call TextExtractionService.
      const text = await this.getDocumentText(fileId); // we'll define this later
      if (!text) throw new Error('No text content available for this document.');
      await this.chunkingService.chunkDocument(fileId, text);
    }

    // 3. Retrieve relevant chunks
    const topK = options?.topK || 5;
    const retrievedChunks = await this.retrievalService.retrieve(fileId, userMessage, topK);

    // 4. Build prompt
    const systemPrompt = `You are a helpful assistant that answers questions based on the provided document context. Use the following chunks from the document to answer the user's question. If the answer is not in the context, say "I couldn't find that information in this document." Cite the source page numbers when available.`;
    let context = '';
    const citations: Array<{ page: number; text: string }> = [];
    retrievedChunks.forEach((chunk, idx) => {
      context += `[Chunk ${idx+1}]${chunk.content}\n`;
      if (chunk.pageNumbers && chunk.pageNumbers.length > 0) {
        citations.push({ page: chunk.pageNumbers[0], text: chunk.content.substring(0, 100) });
      }
    });

    const prompt = `${systemPrompt}\n\nContext:\n${context}\n\nQuestion: ${userMessage}\n\nAnswer:`;

    // 5. Call AI provider
    const response = await this.aiProvider.summarize(prompt, { temperature: options?.temperature || 0.3 });

    // 6. Save user message and assistant response
    await db.runAsync(`INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)`, conversationId, 'user', userMessage);
    const chunkIds = retrievedChunks.map(c => c.id);
    const citationsJson = JSON.stringify(citations);
    await db.runAsync(`INSERT INTO messages (conversation_id, role, content, citations, chunk_ids)
       VALUES (?, ?, ?, ?, ?)`, conversationId, 'assistant', response, citationsJson, JSON.stringify(chunkIds));

    // 7. Update conversation message count and timestamp
    await db.runAsync(`UPDATE conversations SET message_count = message_count + 2, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, conversationId);

    return { response, citations };
  }

  /**
   * Get message history for a conversation.
   */
  async getMessages(conversationId: number): Promise<Message[]> {
    const result = await db.getAllAsync(`SELECT id, role, content, citations, model_version, prompt_version, retrieval_version, chunk_ids, interrupted, created_at
       FROM messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC`, conversationId);
    if (result && result.length > 0) {
      return result.map((row: any) => ({
        id: row.id,
        role: row.role,
        content: row.content,
        citations: row.citations ? JSON.parse(row.citations) : undefined,
        modelVersion: row.model_version,
        promptVersion: row.prompt_version,
        retrievalVersion: row.retrieval_version,
        chunkIds: row.chunk_ids ? JSON.parse(row.chunk_ids) : undefined,
        interrupted: row.interrupted === 1,
        createdAt: row.created_at,
      }));
    }
    return [];
  }

  /**
   * Helper to get document text (placeholder – should use TextExtractionService).
   */
  private async getDocumentText(fileId: string): Promise<string> {
    // In real implementation, call TextExtractionService.getExtractedText(fileId)
    // For now, we'll fetch from repository if available.
    const file = await fileRepository.getFileById(fileId);
    if (file && (file as any).extractedText) {
      return (file as any).extractedText;
    }
    // If not, we need to extract. For simplicity, return empty.
    return '';
  }
  async deleteMessage(messageId: number): Promise<void> {
    try {
      await db.runAsync('DELETE FROM messages WHERE id = ?', messageId);
    } catch (e) {
      console.error('Failed to delete message:', e);
      throw new Error('Could not delete message');
    }
  }
}
