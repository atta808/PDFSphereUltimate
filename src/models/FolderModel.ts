/**
 * Folder model for the V2 document workspace.
 */
export interface FolderModel {
  id: string;
  name: string;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
