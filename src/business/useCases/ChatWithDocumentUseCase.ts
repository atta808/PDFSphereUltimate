import { ChatService, Message } from "../../services/chat/ChatService";
import { fileRepository } from "../../repository/FileRepository";
import { logger } from "../../utils/logger";

export interface ChatWithDocumentInput {
  fileId: string;
  conversationId?: number;
  userMessage: string;
  topK?: number;
  temperature?: number;
}

export interface ChatWithDocumentOutput {
  conversationId: number;
  response: string;
  citations: Array<{ page: number; text: string }>;
  messages: Message[];
}

/**
 * Use case for chatting with a document using RAG (Retrieval-Augmented Generation).
 * Orchestrates the entire chat pipeline: retrieval, context building, AI call, and persistence.
 */
export class ChatWithDocumentUseCase {
  private chatService: ChatService;

  constructor(chatService?: ChatService) {
    this.chatService = chatService || new ChatService();
  }

  /**
   * Execute the chat with document use case.
   */
  async execute(input: ChatWithDocumentInput): Promise<ChatWithDocumentOutput> {
    const {
      fileId,
      conversationId,
      userMessage,
      topK = 5,
      temperature = 0.3,
    } = input;

    try {
      // 1. Validate the file exists
      const file = await fileRepository.getFileById(fileId);
      if (!file) {
        throw new Error(`File with ID ${fileId} not found`);
      }

      // 2. Get or create conversation
      let convId = conversationId;
      if (!convId) {
        // Create a new conversation
        const title = `Chat about ${file.name}`;
        convId = await this.chatService.createConversation(fileId, title);
      }

      // 3. Send the message through the chat service (handles RAG internally)
      const result = await this.chatService.sendMessage(convId, userMessage, {
        topK,
        temperature,
      });

      // 4. Get updated message history
      const messages = await this.chatService.getMessages(convId);

      return {
        conversationId: convId,
        response: result.response,
        citations: result.citations || [],
        messages,
      };
    } catch (error) {
      logger.error("ChatWithDocumentUseCase error:", error);
      throw new Error(
        `Failed to chat with document: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Execute chat with streaming support.
   * Returns a streaming response that can be consumed incrementally.
   */
  async executeStreaming(
    input: ChatWithDocumentInput,
    onToken: (token: string) => void,
    onComplete: (result: ChatWithDocumentOutput) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const {
      fileId,
      conversationId,
      userMessage,
      topK = 5,
      temperature = 0.3,
    } = input;

    try {
      // 1. Validate the file exists
      const file = await fileRepository.getFileById(fileId);
      if (!file) {
        throw new Error(`File with ID ${fileId} not found`);
      }

      // 2. Get or create conversation
      let convId = conversationId;
      if (!convId) {
        const title = `Chat about ${file.name}`;
        convId = await this.chatService.createConversation(fileId, title);
      }

      // 3. Use the chat service with streaming
      // The chat service doesn't support streaming directly, so we'll collect the response
      // and simulate streaming for now. In a real implementation, you'd extend ChatService.
      const result = await this.chatService.sendMessage(convId, userMessage, {
        topK,
        temperature,
      });

      // Simulate streaming by sending tokens one by one
      const words = result.response.split(" ");
      for (let i = 0; i < words.length; i++) {
        onToken((i === 0 ? "" : " ") + words[i]);
        // Small delay to simulate real streaming
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      // Get updated message history
      const messages = await this.chatService.getMessages(convId);

      onComplete({
        conversationId: convId,
        response: result.response,
        citations: result.citations || [],
        messages,
      });
    } catch (error) {
      logger.error("ChatWithDocumentUseCase streaming error:", error);
      onError(
        new Error(
          `Failed to chat with document: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  }

  /**
   * Regenerate the last assistant response in a conversation.
   */
  async regenerateLastResponse(
    conversationId: number,
  ): Promise<ChatWithDocumentOutput> {
    try {
      // Get messages
      const messages = await this.chatService.getMessages(conversationId);
      if (messages.length < 2) {
        throw new Error("No messages to regenerate");
      }

      // Find the last user message
      let lastUserMessage: string | null = null;
      let lastUserIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          lastUserMessage = messages[i].content;
          lastUserIndex = i;
          break;
        }
      }

      if (!lastUserMessage) {
        throw new Error("No user message found to regenerate");
      }

      // Get conversation details
      const conversations = await this.chatService.getConversations(
        (await this.chatService.getConversations(""))[0]?.fileId || "",
      );
      // We need the fileId - this is a limitation; we should store fileId on the conversation.
      // For now, we'll use a fallback approach.
      // In a real implementation, you'd have a method to get conversation details.
      const fileId = await this.getFileIdFromConversation(conversationId);
      if (!fileId) {
        throw new Error("Could not determine file ID for conversation");
      }

      // Delete the last assistant message (and any subsequent messages)
      for (let i = messages.length - 1; i > lastUserIndex; i--) {
        await this.chatService.deleteMessage(messages[i].id!);
      }

      // Resend the user message
      const result = await this.chatService.sendMessage(
        conversationId,
        lastUserMessage,
      );

      // Get updated messages
      const updatedMessages =
        await this.chatService.getMessages(conversationId);

      return {
        conversationId,
        response: result.response,
        citations: result.citations || [],
        messages: updatedMessages,
      };
    } catch (error) {
      logger.error("Regenerate last response error:", error);
      throw new Error(
        `Failed to regenerate response: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Helper method to get file ID from conversation.
   * This is a workaround; in a real implementation, you'd store fileId on the conversation.
   */
  private async getFileIdFromConversation(
    conversationId: number,
  ): Promise<string | null> {
    try {
      // This is a direct query to get the file_id from the conversations table.
      // We'll use the database directly.
      const { default: SQLite } = await import("expo-sqlite");
      const db = SQLite.openDatabaseSync("pdfsphere.db");
      const result = await db.getAllAsync(
        "SELECT file_id FROM conversations WHERE id = ?",
        [conversationId],
      );
      if (result && result.length > 0) {
        return result[0].file_id;
      }
      return null;
    } catch (error) {
      logger.error("Failed to get file ID from conversation:", error);
      return null;
    }
  }
}
