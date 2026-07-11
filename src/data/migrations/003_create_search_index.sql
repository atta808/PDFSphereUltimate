-- Create FTS5 virtual table for search
CREATE VIRTUAL TABLE IF NOT EXISTS files_fts USING fts5(
    file_id UNINDEXED,
    name,
    content,
    tokenize = 'unicode61'
);

-- Trigger to keep FTS index in sync with files table
CREATE TRIGGER IF NOT EXISTS files_ai AFTER INSERT ON files
BEGIN
    INSERT INTO files_fts(file_id, name, content)
    VALUES (new.id, new.name, '');
END;

CREATE TRIGGER IF NOT EXISTS files_ad AFTER DELETE ON files
BEGIN
    DELETE FROM files_fts WHERE file_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS files_au AFTER UPDATE ON files
BEGIN
    UPDATE files_fts
    SET name = new.name
    WHERE file_id = old.id;
END;