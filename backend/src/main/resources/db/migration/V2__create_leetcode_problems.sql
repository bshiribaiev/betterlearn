CREATE TABLE leetcode_problems (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    url             VARCHAR(500) NOT NULL,
    title           VARCHAR(300) NOT NULL,
    notes           TEXT,
    first_attempted DATE NOT NULL DEFAULT CURRENT_DATE,
    easiness_factor DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    repetition      INT NOT NULL DEFAULT 0,
    interval_days   INT NOT NULL DEFAULT 0,
    next_review     DATE NOT NULL DEFAULT CURRENT_DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'new',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, url)
);

CREATE INDEX idx_lc_user_next_review ON leetcode_problems(user_id, next_review);
CREATE INDEX idx_lc_user_status ON leetcode_problems(user_id, status);
