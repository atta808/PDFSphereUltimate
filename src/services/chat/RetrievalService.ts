import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('pdfsphere.db');

export interface RetrievedChunk {
  id: number;
  content: string;
  pageNumbers?: number[];
  score: number;
}

export class RetrievalService {
  /**
   * Retrieve top-K chunks relevant to a query.
   * @param fileId Document ID.
   * @param query User's question.
   * @param topK Number of chunks to retrieve.
   * @returns Array of chunks with relevance scores.
   */
  async retrieve(fileId: string, query: string, topK: number = 5): Promise<RetrievedChunk[]> {
    if (!query.trim()) return [];

    // We need to create a virtual FTS5 table for chunks if not exists.
    // For simplicity, we assume the chunks table is indexed via FTS.
    // We'll use a separate FTS table for chunks.
    // To avoid complexity, we'll use LIKE for now, but for production we should use FTS.
    // Given time, we'll implement a simple keyword search using SQLite LIKE with multiple words.
    // Better: create a FTS5 virtual table over chunks.
    // But for this implementation, we'll do a simple search.
    const searchTerms = query.trim().split(/\s+/).filter(term => term.length > 2);
    if (searchTerms.length === 0) return [];

    // Build a WHERE clause: content LIKE '%term%' for each term
    const conditions = searchTerms.map(() => 'content LIKE ?').join(' AND ');
    const params = searchTerms.map(term => `%${term}%`);

    const sql = `
      SELECT id, content, page_numbers,
             (${searchTerms.map(() => 'LENGTH(content) - LENGTH(REPLACE(content, ?, ""))').join(' + ')}) as score
      FROM chunks
      WHERE file_id = ? AND (${conditions})
      ORDER BY score DESC
      LIMIT ?
    `;
    const allParams = [...params, fileId, ...params, topK];
    const result = await db.getAllAsync(sql, ...allParams);
    if (result && result.length > 0) {
      return result.map((row: any) => ({
        id: row.id,
        content: row.content,
        pageNumbers: row.page_numbers ? JSON.parse(row.page_numbers) : undefined,
        score: row.score || 0,
      }));
    }
    return [];
  }
}