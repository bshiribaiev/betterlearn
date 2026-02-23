CREATE TABLE quiz_concepts (
    id              BIGSERIAL PRIMARY KEY,
    topic_id        BIGINT NOT NULL REFERENCES quiz_topics(id) ON DELETE CASCADE,
    name            VARCHAR(300) NOT NULL,
    easiness_factor DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    repetition      INT NOT NULL DEFAULT 0,
    interval_days   INT NOT NULL DEFAULT 0,
    next_review     DATE NOT NULL DEFAULT CURRENT_DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'new',
    total_reviews   INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(topic_id, name)
);

CREATE INDEX idx_qc_topic ON quiz_concepts(topic_id);
