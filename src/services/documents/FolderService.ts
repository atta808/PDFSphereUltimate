import { FolderModel } from "../../models/FolderModel";
import { fileRepository } from "../../repository/FileRepository";

/**
 * Application service for folder operations.
 */
export class FolderService {
  async list(parentId: string | null = null): Promise<FolderModel[]> {
    return fileRepository.getFolders(parentId);
  }

  async create(name: string, parentId: string | null = null): Promise<FolderModel> {
    const normalized = name.trim();
    if (!normalized) throw new Error("Folder name cannot be empty.");
    return fileRepository.createFolder(normalized, parentId);
  }

  async rename(folderId: string, name: string): Promise<void> {
    const normalized = name.trim();
    if (!normalized) throw new Error("Folder name cannot be empty.");
    await fileRepository.renameFolder(folderId, normalized);
  }

  async remove(folderId: string): Promise<void> {
    await fileRepository.deleteFolder(folderId);
  }
}

export const folderService = new FolderService();
