CREATE TABLE vocabulary_reviews (
    id          BIGSERIAL PRIMARY KEY,
    word_id     BIGINT NOT NULL REFERENCES vocabulary_words(id) ON DELETE CASCADE,
    quality     INT NOT NULL CHECK (quality BETWEEN 0 AND 5),
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vr_word ON vocabulary_reviews(word_id);
