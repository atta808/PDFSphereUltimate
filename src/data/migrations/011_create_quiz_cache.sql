-- ============================================================
-- Migration: 011_create_quiz_cache
-- Description: Create quiz_cache table for storing AI-generated quizzes
-- Date: 2026-07-07
-- ============================================================

-- Create the quiz_cache table
CREATE TABLE IF NOT EXISTS quiz_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id TEXT NOT NULL,
    content TEXT NOT NULL,          -- JSON array of { question, options, correct }
    question_count INTEGER DEFAULT 0,
    model_version TEXT,              -- AI model used to generate the quiz
    prompt_version TEXT DEFAULT 'v1.0',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);

-- Create index for fast lookup by file_id
CREATE INDEX IF NOT EXISTS idx_quiz_cache_file_id ON quiz_cache(file_id);

-- Create index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_quiz_cache_created_at ON quiz_cache(created_at DESC);

-- Trigger to automatically update updated_at on row changes
CREATE TRIGGER IF NOT EXISTS update_quiz_cache_updated_at
    AFTER UPDATE ON quiz_cache
    FOR EACH ROW
    BEGIN
        UPDATE quiz_cache SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;