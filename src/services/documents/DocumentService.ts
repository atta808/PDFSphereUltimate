import { FileModel } from "../../models/FileModel";
import { fileRepository } from "../../repository/FileRepository";

/**
 * Application service for document operations.
 * UI screens should prefer this boundary over calling the repository directly.
 */
export class DocumentService {
  async list(): Promise<FileModel[]> {
    return fileRepository.getAllFiles();
  }

  async recent(limit = 10): Promise<FileModel[]> {
    return fileRepository.getRecentFiles(limit);
  }

  async favorites(): Promise<FileModel[]> {
    return fileRepository.getFavoriteFiles();
  }

  async search(query: string): Promise<FileModel[]> {
    const normalized = query.trim();
    return normalized ? fileRepository.searchFiles(normalized) : this.list();
  }

  async rename(fileId: string, name: string): Promise<void> {
    const normalized = name.trim();
    if (!normalized) throw new Error("Document name cannot be empty.");
    await fileRepository.renameFile(fileId, normalized);
  }

  async moveToFolder(fileId: string, folderId: string | null): Promise<void> {
    await fileRepository.moveFileToFolder(fileId, folderId);
  }

  async toggleFavorite(fileId: string): Promise<void> {
    await fileRepository.toggleFavorite(fileId);
  }

  async remove(fileId: string): Promise<void> {
    await fileRepository.deleteFile(fileId);
  }
}

export const documentService = new DocumentService();
