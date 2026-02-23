CREATE TABLE leetcode_reviews (
    id          BIGSERIAL PRIMARY KEY,
    problem_id  BIGINT NOT NULL REFERENCES leetcode_problems(id) ON DELETE CASCADE,
    quality     INT NOT NULL CHECK (quality BETWEEN 0 AND 5),
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lr_problem ON leetcode_reviews(problem_id);
