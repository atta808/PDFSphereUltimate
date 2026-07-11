CREATE TABLE IF NOT EXISTS flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id TEXT NOT NULL,
    content TEXT NOT NULL, -- JSON array of {question, answer}
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_id)
);