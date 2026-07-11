CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT CHECK(role IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    citations TEXT, -- JSON array of {page: number, text: string, chunk_id: number}
    model_version TEXT,
    prompt_version TEXT,
    retrieval_version TEXT,
    chunk_ids TEXT, -- JSON array of chunk IDs used
    interrupted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);