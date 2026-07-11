CREATE TABLE IF NOT EXISTS ai_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id TEXT NOT NULL,
    feature_type TEXT NOT NULL, -- 'summary', 'chat', 'translation', etc.
    content TEXT,
    model_version TEXT,
    prompt_version TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id)
);

CREATE INDEX idx_ai_metadata_file_feature ON ai_metadata(file_id, feature_type);