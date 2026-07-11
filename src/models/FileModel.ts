/**
 * File model representing a PDF document in the system.
 */
export interface FileModel {
  id: string;
  name: string;
  uri?: string; // Local file system URI
  size: number; // Size in bytes
  pages: number;
  lastModified: Date;
  isFavorite: boolean;
  folderId?: string | null;
  tags?: string[];
  metadata?: {
    author?: string;
    title?: string;
    subject?: string;
    keywords?: string;
    createdAt?: Date;
  };
}