CREATE TABLE vocabulary_words (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    word            VARCHAR(200) NOT NULL,
    definition      TEXT NOT NULL,
    easiness_factor DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    repetition      INT NOT NULL DEFAULT 0,
    interval_days   INT NOT NULL DEFAULT 0,
    next_review     DATE NOT NULL DEFAULT CURRENT_DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'new',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, word)
);

CREATE INDEX idx_vw_user_next ON vocabulary_words(user_id, next_review);
CREATE INDEX idx_vw_user_status ON vocabulary_words(user_id, status);
