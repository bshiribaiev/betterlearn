ALTER TABLE quiz_sessions ADD COLUMN concept_id BIGINT REFERENCES quiz_concepts(id) ON DELETE CASCADE;
