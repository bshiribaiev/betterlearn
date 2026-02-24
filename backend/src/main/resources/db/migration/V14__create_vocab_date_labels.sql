CREATE TABLE vocab_date_labels (
    id BIGSERIAL PRIMARY KEY,
    topic_id BIGINT NOT NULL REFERENCES quiz_topics(id) ON DELETE CASCADE,
    added_date DATE NOT NULL,
    label VARCHAR(100) NOT NULL,
    UNIQUE(topic_id, added_date)
);
