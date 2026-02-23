CREATE TABLE quiz_sessions (
    id BIGSERIAL PRIMARY KEY,
    topic_id BIGINT NOT NULL REFERENCES quiz_topics(id) ON DELETE CASCADE,
    total_questions INT NOT NULL,
    correct_answers INT NOT NULL,
    quality INT NOT NULL CHECK (quality BETWEEN 0 AND 5),
    questions_json JSONB NOT NULL,
    taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qs_topic ON quiz_sessions(topic_id);
